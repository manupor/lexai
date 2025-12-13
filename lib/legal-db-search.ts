/**
 * LEGAL DATABASE SEARCH
 * 
 * Busca artículos directamente en la base de datos PostgreSQL
 * Esto es más confiable que los archivos JSON parseados
 */

import { prisma } from '@/lib/prisma'

export interface LegalArticleResult {
  number: string
  title: string
  content: string
  lawName: string
  lawNumber: string
}

/**
 * Buscar un artículo específico por número en un código legal
 */
export async function searchArticleInDB(
  codeId: string,
  articleNumber: string
): Promise<LegalArticleResult | null> {
  try {
    const article = await prisma.article.findFirst({
      where: {
        legalCode: {
          code: codeId
        },
        number: articleNumber
      },
      include: {
        legalCode: true
      }
    })

    if (!article) {
      return null
    }

    return {
      number: article.number,
      title: article.title || `Artículo ${article.number}`,
      content: article.content,
      lawName: article.legalCode.title,
      lawNumber: article.legalCode.code
    }
  } catch (error) {
    console.error(`Error buscando artículo ${articleNumber} en ${codeId}:`, error)
    return null
  }
}

/**
 * Buscar artículos por palabra clave en un código legal
 */
export async function searchByKeywordInDB(
  codeId: string,
  keyword: string,
  maxResults: number = 5
): Promise<LegalArticleResult[]> {
  try {
    const articles = await prisma.article.findMany({
      where: {
        legalCode: {
          code: codeId
        },
        content: {
          contains: keyword,
          mode: 'insensitive'
        }
      },
      include: {
        legalCode: true
      },
      take: maxResults
    })

    return articles.map((article): LegalArticleResult => ({
      number: article.number,
      title: article.title || `Artículo ${article.number}`,
      content: article.content,
      lawName: article.legalCode.title,
      lawNumber: article.legalCode.code
    }))
  } catch (error) {
    console.error(`Error buscando keyword "${keyword}" en ${codeId}:`, error)
    return []
  }
}

/**
 * Formatear artículo para mostrar en el chat
 */
export function formatArticleForChatDB(article: LegalArticleResult): string {
  return `**${article.lawName}**

**Artículo ${article.number}:**
> ${article.content}

---`
}
