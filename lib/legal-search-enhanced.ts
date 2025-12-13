/**
 * Enhanced Legal Search - Hybrid approach combining exact, keyword, and semantic search
 */

import { prisma } from './prisma'
import { generateEmbedding, searchSimilarArticles } from './embeddings'

export interface SearchResult {
  source: 'exact' | 'keyword' | 'semantic'
  confidence: number
  article: {
    number: string
    content: string
    title?: string
    legalCode: string
  }
}

/**
 * Hybrid search combining multiple strategies
 */
export async function hybridLegalSearch(
  query: string,
  legalCode: string,
  options: {
    includeExact?: boolean
    includeKeyword?: boolean
    includeSemantic?: boolean
    maxResults?: number
  } = {}
): Promise<SearchResult[]> {
  const {
    includeExact = true,
    includeKeyword = true,
    includeSemantic = false, // Disabled until embeddings are set up
    maxResults = 5,
  } = options

  const results: SearchResult[] = []

  // 1. Exact article number match
  if (includeExact) {
    const articleMatch = query.match(/art[íi]cul?[oi]?\s+(\d+)/i)
    if (articleMatch) {
      const articleNumber = articleMatch[1]
      const article = await prisma.article.findFirst({
        where: {
          legalCode: { code: legalCode },
          number: articleNumber,
        },
        include: { legalCode: true },
      })

      if (article) {
        results.push({
          source: 'exact',
          confidence: 1.0,
          article: {
            number: article.number,
            content: article.content,
            title: article.title || undefined,
            legalCode: article.legalCode.code,
          },
        })
      }
    }
  }

  // 2. Keyword search
  if (includeKeyword && results.length < maxResults) {
    const keywords = extractKeywords(query)
    const keywordResults = await prisma.article.findMany({
      where: {
        legalCode: { code: legalCode },
        OR: keywords.map((keyword) => ({
          content: { contains: keyword, mode: 'insensitive' as const },
        })),
      },
      include: { legalCode: true },
      take: maxResults - results.length,
    })

    for (const article of keywordResults) {
      // Avoid duplicates
      if (!results.some((r) => r.article.number === article.number)) {
        results.push({
          source: 'keyword',
          confidence: 0.7,
          article: {
            number: article.number,
            content: article.content,
            title: article.title || undefined,
            legalCode: article.legalCode.code,
          },
        })
      }
    }
  }

  // 3. Semantic search (future implementation)
  if (includeSemantic && results.length < maxResults) {
    const semanticResults = await searchSimilarArticles(
      query,
      legalCode,
      maxResults - results.length
    )

    for (const result of semanticResults) {
      if (!results.some((r) => r.article.number === result.article.number)) {
        results.push({
          source: 'semantic',
          confidence: result.similarity,
          article: result.article,
        })
      }
    }
  }

  return results.slice(0, maxResults)
}

/**
 * Extract meaningful keywords from query
 */
function extractKeywords(query: string): string[] {
  // Remove common words and extract meaningful terms
  const stopWords = new Set([
    'el',
    'la',
    'los',
    'las',
    'un',
    'una',
    'de',
    'del',
    'que',
    'en',
    'y',
    'a',
    'por',
    'para',
    'con',
    'sobre',
    'dice',
    'qué',
    'cuál',
    'cómo',
    'artículo',
    'articulo',
    'código',
    'codigo',
  ])

  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word))
    .slice(0, 5) // Limit to 5 keywords
}

/**
 * Format article for chat display
 */
export function formatArticleForChat(
  result: SearchResult,
  codeName: string
): string {
  const codeNames: Record<string, string> = {
    'codigo-civil': 'Código Civil de Costa Rica (Ley N° 63)',
    'codigo-comercio': 'Código de Comercio de Costa Rica (Ley N° 3284)',
    'codigo-trabajo': 'Código de Trabajo de Costa Rica (Ley N° 2)',
  }

  const codeTitle = codeNames[codeName] || 'Código Legal de Costa Rica'
  const confidenceEmoji = result.confidence >= 0.9 ? '✅' : result.confidence >= 0.7 ? '📌' : '💡'

  return `${confidenceEmoji} **${codeTitle}**

**Artículo ${result.article.number}:**${result.article.title ? `\n*${result.article.title}*` : ''}
> ${result.article.content}

*Fuente: ${result.source === 'exact' ? 'Búsqueda exacta' : result.source === 'keyword' ? 'Búsqueda por palabras clave' : 'Búsqueda semántica'}*
---`
}
