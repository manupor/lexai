/**
 * LEGAL SEARCH LAYER
 * 
 * ⚠️ CRITICAL: This module implements DETERMINISTIC legal article search
 * 
 * SEARCH PRECEDENCE (in order):
 * 1. EXACT ARTICLE NUMBER MATCH - Always highest priority
 * 2. Semantic search (future: embeddings) - Only if exact match fails
 * 3. NOT FOUND - Explicit failure, never fabricate
 * 
 * WHY THIS MATTERS:
 * - Legal citations must be exact
 * - Courts require specific article numbers
 * - Fabricating articles is legally dangerous
 * - Determinism is mandatory for legal AI
 * 
 * DESIGN PRINCIPLES:
 * - Exact match ALWAYS beats semantic similarity
 * - Never guess or infer article numbers
 * - Fail explicitly rather than return wrong article
 * - Preserve exact legal text (no paraphrasing)
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Legal code identifiers
 */
export type LegalCode = 'codigo-civil' | 'codigo-comercio' | 'codigo-trabajo' | 'codigo-penal' | 'codigo-procesal-penal'

/**
 * Article structure from JSON
 */
export interface LegalArticle {
  law: string
  article: number
  title: string
  text: string
}

/**
 * Legal code JSON structure
 */
interface LegalCodeJSON {
  name: string
  law_number: string
  total_articles: number
  articles: LegalArticle[]
  extracted_at: string
  parser_version: string
}

/**
 * Search result
 */
export interface SearchResult {
  found: boolean
  article?: LegalArticle
  searchMethod?: 'exact' | 'semantic' | 'not_found'
  message?: string
}

/**
 * In-memory cache of legal codes
 * Loaded once on first access for performance
 */
const legalCodeCache: Map<LegalCode, LegalCodeJSON> = new Map()

/**
 * Load legal code JSON from disk
 * 
 * @param code - Legal code identifier
 * @returns Parsed JSON or null if not found
 */
function loadLegalCode(code: LegalCode): LegalCodeJSON | null {
  // Check cache first
  if (legalCodeCache.has(code)) {
    return legalCodeCache.get(code)!
  }

  // Load from disk
  const filePath = join(process.cwd(), 'data', 'processed', `${code}.json`)

  if (!existsSync(filePath)) {
    console.warn(`⚠️  Legal code not found: ${code}`)
    return null
  }

  try {
    const fileContent = readFileSync(filePath, 'utf-8')
    const legalCode: LegalCodeJSON = JSON.parse(fileContent)

    // Cache for future use
    legalCodeCache.set(code, legalCode)

    return legalCode
  } catch (error) {
    console.error(`❌ Error loading legal code ${code}:`, error)
    return null
  }
}

/**
 * EXACT ARTICLE SEARCH
 * 
 * This is the PRIMARY search method.
 * Returns article if exact number match exists.
 * 
 * @param law - Legal code identifier
 * @param articleNumber - Exact article number
 * @returns Article if found, null otherwise
 */
function findExactArticle(law: LegalCode, articleNumber: number): LegalArticle | null {
  const legalCode = loadLegalCode(law)

  if (!legalCode) {
    return null
  }

  // O(n) search - could be optimized with Map if needed
  // For now, simplicity and correctness over micro-optimization
  const article = legalCode.articles.find(a => a.article === articleNumber)

  return article || null
}

/**
 * SEMANTIC SEARCH (Placeholder)
 * 
 * Future implementation will use:
 * - Vector embeddings (OpenAI, Cohere, etc.)
 * - Similarity search
 * - Ranked results
 * 
 * For now, returns null (not implemented).
 * 
 * @param law - Legal code identifier
 * @param query - Search query
 * @returns Articles if found, empty array otherwise
 */
function findSemanticArticles(law: LegalCode, query: string): LegalArticle[] {
  // TODO: Implement semantic search with embeddings
  // 1. Generate embedding for query
  // 2. Search vector database
  // 3. Return top N results
  // 4. Filter by relevance threshold

  console.log(`ℹ️  Semantic search not yet implemented for: "${query}"`)
  return []
}

/**
 * MAIN SEARCH FUNCTION
 * 
 * Search for a legal article with strict precedence:
 * 1. Try exact article number match
 * 2. If not found, try semantic search (future)
 * 3. If still not found, return explicit NOT FOUND
 * 
 * @param law - Legal code identifier
 * @param articleNumber - Article number to find
 * @returns Search result with found status and article
 */
export function findLegalArticle(
  law: LegalCode,
  articleNumber: number
): SearchResult {
  // STEP 1: Try exact match (PRIMARY)
  const exactArticle = findExactArticle(law, articleNumber)

  if (exactArticle) {
    return {
      found: true,
      article: exactArticle,
      searchMethod: 'exact',
      message: `Found exact match: Article ${articleNumber}`,
    }
  }

  // STEP 2: Semantic search (FUTURE - not implemented)
  // This would only be used if exact match fails
  // For now, skip to NOT FOUND

  // STEP 3: Explicit NOT FOUND
  return {
    found: false,
    searchMethod: 'not_found',
    message: `Article ${articleNumber} not found in ${law}`,
  }
}

/**
 * SEARCH BY QUERY (Future)
 * 
 * Search for articles by natural language query.
 * Uses semantic search only (no exact matching).
 * 
 * @param law - Legal code identifier
 * @param query - Natural language query
 * @param limit - Maximum number of results
 * @returns Array of matching articles
 */
export function searchLegalArticles(
  law: LegalCode,
  query: string,
  limit: number = 5
): LegalArticle[] {
  // For now, return empty array
  // Future: Implement semantic search
  const results = findSemanticArticles(law, query)
  return results.slice(0, limit)
}

/**
 * GET ALL ARTICLES (for indexing/testing)
 * 
 * Returns all articles from a legal code.
 * Useful for:
 * - Building vector embeddings
 * - Testing
 * - Analytics
 * 
 * @param law - Legal code identifier
 * @returns All articles or empty array if not found
 */
export function getAllArticles(law: LegalCode): LegalArticle[] {
  const legalCode = loadLegalCode(law)
  return legalCode?.articles || []
}

/**
 * GET LEGAL CODE METADATA
 * 
 * Returns metadata about a legal code.
 * 
 * @param law - Legal code identifier
 * @returns Metadata or null if not found
 */
export function getLegalCodeInfo(law: LegalCode): {
  name: string
  law_number: string
  total_articles: number
  extracted_at: string
} | null {
  const legalCode = loadLegalCode(law)

  if (!legalCode) {
    return null
  }

  return {
    name: legalCode.name,
    law_number: legalCode.law_number,
    total_articles: legalCode.total_articles,
    extracted_at: legalCode.extracted_at,
  }
}

/**
 * VALIDATE ARTICLE EXISTS
 * 
 * Quick check if an article exists without loading full content.
 * 
 * @param law - Legal code identifier
 * @param articleNumber - Article number
 * @returns True if article exists, false otherwise
 */
export function articleExists(law: LegalCode, articleNumber: number): boolean {
  const result = findLegalArticle(law, articleNumber)
  return result.found
}

/**
 * SEARCH MULTIPLE CODES
 * 
 * Search for an article across multiple legal codes.
 * Returns first exact match found.
 * 
 * @param articleNumber - Article number to find
 * @param codes - Legal codes to search (default: all)
 * @returns Search result with found status and article
 */
export function findArticleInAnyCod(
  articleNumber: number,
  codes: LegalCode[] = ['codigo-civil', 'codigo-comercio', 'codigo-trabajo', 'codigo-penal', 'codigo-procesal-penal']
): SearchResult & { law?: LegalCode } {
  for (const code of codes) {
    const result = findLegalArticle(code, articleNumber)

    if (result.found) {
      return {
        ...result,
        law: code,
        message: `Found in ${code}: Article ${articleNumber}`,
      }
    }
  }

  return {
    found: false,
    searchMethod: 'not_found',
    message: `Article ${articleNumber} not found in any legal code`,
  }
}

/**
 * CLEAR CACHE
 * 
 * Clear the in-memory cache of legal codes.
 * Useful for:
 * - Testing
 * - Reloading updated codes
 * - Memory management
 */
export function clearCache(): void {
  legalCodeCache.clear()
}
