/**
 * LEGAL CODE LOADER - PRODUCTION ARCHITECTURE
 * 
 * WHY THIS DESIGN:
 * - NO runtime PDF parsing (eliminates 10-30s latency)
 * - NO pdfjs-dist or pdf-parse in API routes (eliminates worker errors)
 * - Loads pre-processed text files ONCE at startup
 * - Fast in-memory search (< 100ms)
 * - Deterministic article matching
 * 
 * USAGE:
 *   import { searchLegalArticle } from '@/lib/legal-loader'
 *   const article = await searchLegalArticle('codigo-civil', '46')
 */

import * as fs from 'fs'
import * as path from 'path'

interface LegalArticle {
  number: string
  title: string
  content: string
}

interface LegalCode {
  name: string
  law_number: string
  articles: Map<string, LegalArticle>  // number -> article
  loaded: boolean
}

// In-memory cache of legal codes
const legalCodes: Map<string, LegalCode> = new Map()

/**
 * Load a legal code from processed JSON file
 * This runs ONCE per code, then cached in memory
 */
export async function loadLegalCode(codeName: string): Promise<LegalCode | null> {
  // Return from cache if already loaded
  if (legalCodes.has(codeName)) {
    return legalCodes.get(codeName)!
  }
  
  try {
    const jsonPath = path.join(process.cwd(), 'data', 'processed', `${codeName}.json`)
    
    if (!fs.existsSync(jsonPath)) {
      console.warn(`⚠️  Legal code not found: ${codeName}`)
      return null
    }
    
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    
    // Convert articles array to Map for O(1) lookup
    const articlesMap = new Map<string, LegalArticle>()
    data.articles.forEach((article: LegalArticle) => {
      articlesMap.set(article.number, article)
    })
    
    const legalCode: LegalCode = {
      name: data.name,
      law_number: data.law_number,
      articles: articlesMap,
      loaded: true
    }
    
    legalCodes.set(codeName, legalCode)
    console.log(`✅ Loaded ${legalCode.name}: ${articlesMap.size} articles`)
    
    return legalCode
    
  } catch (error) {
    console.error(`❌ Error loading ${codeName}:`, error)
    return null
  }
}

/**
 * Search for a specific article by number
 * Returns the exact article if found
 */
export async function searchLegalArticle(
  codeName: string,
  articleNumber: string
): Promise<LegalArticle | null> {
  const code = await loadLegalCode(codeName)
  
  if (!code) {
    return null
  }
  
  return code.articles.get(articleNumber) || null
}

/**
 * Search for articles by keyword
 * Returns articles that contain the keyword in their content
 */
export async function searchLegalByKeyword(
  codeName: string,
  keyword: string,
  maxResults: number = 5
): Promise<LegalArticle[]> {
  const code = await loadLegalCode(codeName)
  
  if (!code) {
    return []
  }
  
  const results: LegalArticle[] = []
  const keywordLower = keyword.toLowerCase()
  
  for (const article of code.articles.values()) {
    if (article.content.toLowerCase().includes(keywordLower)) {
      results.push(article)
      if (results.length >= maxResults) {
        break
      }
    }
  }
  
  return results
}

/**
 * Get multiple articles by their numbers
 */
export async function getArticles(
  codeName: string,
  articleNumbers: string[]
): Promise<LegalArticle[]> {
  const code = await loadLegalCode(codeName)
  
  if (!code) {
    return []
  }
  
  const articles: LegalArticle[] = []
  
  for (const number of articleNumbers) {
    const article = code.articles.get(number)
    if (article) {
      articles.push(article)
    }
  }
  
  return articles
}

/**
 * Get articles in a range (e.g., articles 10-15)
 */
export async function getArticleRange(
  codeName: string,
  startNumber: number,
  endNumber: number
): Promise<LegalArticle[]> {
  const code = await loadLegalCode(codeName)
  
  if (!code) {
    return []
  }
  
  const articles: LegalArticle[] = []
  
  for (let i = startNumber; i <= endNumber; i++) {
    const article = code.articles.get(i.toString())
    if (article) {
      articles.push(article)
    }
  }
  
  return articles
}

/**
 * Format article for display in chat
 */
export function formatArticleForChat(article: LegalArticle, codeName: string): string {
  const codeTitle = codeName === 'codigo-civil' 
    ? 'Código Civil de Costa Rica (Ley N° 63)'
    : 'Código de Comercio de Costa Rica (Ley N° 3284)'
  
  return `**${codeTitle}**

**Artículo ${article.number}:**
> ${article.content}

---`
}
