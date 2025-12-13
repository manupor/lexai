/**
 * LEGAL RESPONSE VALIDATION LAYER
 * 
 * ⚠️ CRITICAL: This module prevents AI from citing non-existent articles
 * 
 * LEGAL RISK:
 * - AI models can hallucinate article numbers
 * - Citing fake articles is legally dangerous
 * - Could mislead users or cause legal harm
 * - Must validate ALL article citations
 * 
 * VALIDATION RULES:
 * 1. Extract all article numbers from AI response
 * 2. Verify each article exists in legal codes
 * 3. If any article is invalid → BLOCK response
 * 4. Log all validation failures for review
 * 5. Return safe error message to user
 * 
 * DESIGN PRINCIPLES:
 * - Fail safe: Block if uncertain
 * - Log everything for audit trail
 * - Clear error messages for users
 * - No false positives (don't block valid responses)
 */

import { findLegalArticle, articleExists, type LegalCode } from './legal-search'

/**
 * Article citation found in AI response
 */
interface ArticleCitation {
  fullMatch: string        // e.g., "Artículo 46 del Código Civil"
  articleNumber: number    // e.g., 46
  legalCode?: string       // e.g., "Código Civil", "Código de Comercio"
  position: number         // Position in text
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  citations: ArticleCitation[]
  invalidCitations: ArticleCitation[]
  errors: string[]
  warnings: string[]
  safeResponse?: string
}

/**
 * Validation log entry
 */
interface ValidationLog {
  timestamp: string
  aiResponse: string
  citations: ArticleCitation[]
  invalidCitations: ArticleCitation[]
  blocked: boolean
  reason?: string
}

// In-memory validation log (in production, use database)
const validationLogs: ValidationLog[] = []

/**
 * Extract article citations from AI response
 * 
 * Matches patterns like:
 * - "Artículo 46"
 * - "artículo 46"
 * - "ARTÍCULO 46"
 * - "Artículo 46 del Código Civil"
 * - "art. 46"
 * - "Art. 46"
 * 
 * @param text - AI response text
 * @returns Array of article citations found
 */
function extractArticleCitations(text: string): ArticleCitation[] {
  const citations: ArticleCitation[] = []
  
  // Pattern 1: Full citation with code name
  // e.g., "Artículo 46 del Código Civil"
  const fullPattern = /(?:ARTÍCULO|Artículo|artículo|ART\.|Art\.|art\.)\s+(\d+)\s+del\s+(Código\s+(?:Civil|de\s+Comercio|de\s+Trabajo))/gi
  
  let match
  while ((match = fullPattern.exec(text)) !== null) {
    citations.push({
      fullMatch: match[0],
      articleNumber: parseInt(match[1], 10),
      legalCode: match[2],
      position: match.index,
    })
  }
  
  // Pattern 2: Article number only
  // e.g., "Artículo 46"
  const simplePattern = /(?:ARTÍCULO|Artículo|artículo|ART\.|Art\.|art\.)\s+(\d+)(?!\s+del\s+Código)/gi
  
  while ((match = simplePattern.exec(text)) !== null) {
    // Skip if already captured by full pattern
    const alreadyCaptured = citations.some(c => c.position === match!.index)
    if (!alreadyCaptured) {
      citations.push({
        fullMatch: match[0],
        articleNumber: parseInt(match[1], 10),
        position: match.index,
      })
    }
  }
  
  return citations
}

/**
 * Map legal code name to identifier
 */
function mapLegalCodeName(codeName: string): LegalCode | null {
  const normalized = codeName.toLowerCase()
  
  if (normalized.includes('civil')) {
    return 'codigo-civil'
  }
  if (normalized.includes('comercio')) {
    return 'codigo-comercio'
  }
  if (normalized.includes('trabajo')) {
    return 'codigo-trabajo'
  }
  
  return null
}

/**
 * Verify if an article citation is valid
 * 
 * @param citation - Article citation to verify
 * @param contextCodes - Legal codes that were provided in context
 * @returns True if valid, false otherwise
 */
async function verifyCitation(
  citation: ArticleCitation,
  contextCodes: LegalCode[]
): Promise<boolean> {
  // If citation specifies a legal code, check that code only
  if (citation.legalCode) {
    const codeId = mapLegalCodeName(citation.legalCode)
    if (codeId) {
      return articleExists(codeId, citation.articleNumber)
    }
  }
  
  // Otherwise, check all codes that were in context
  for (const code of contextCodes) {
    if (articleExists(code, citation.articleNumber)) {
      return true
    }
  }
  
  return false
}

/**
 * MAIN VALIDATION FUNCTION
 * 
 * Validates AI response to ensure all article citations are real.
 * 
 * @param aiResponse - AI-generated response text
 * @param contextCodes - Legal codes that were provided in context
 * @param providedArticles - Articles that were explicitly provided to AI
 * @returns Validation result with safe response or error
 */
export async function validateLegalResponse(
  aiResponse: string,
  contextCodes: LegalCode[] = [],
  providedArticles: number[] = []
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    citations: [],
    invalidCitations: [],
    errors: [],
    warnings: [],
  }
  
  // Step 1: Extract all article citations
  const citations = extractArticleCitations(aiResponse)
  result.citations = citations
  
  if (citations.length === 0) {
    // No citations found - response is safe
    return result
  }
  
  // Step 2: Verify each citation
  for (const citation of citations) {
    // Check if article was explicitly provided in context
    const wasProvided = providedArticles.includes(citation.articleNumber)
    
    if (wasProvided) {
      // Article was in context - safe to cite
      continue
    }
    
    // Article was NOT in context - verify it exists
    const isValid = await verifyCitation(citation, contextCodes)
    
    if (!isValid) {
      result.invalidCitations.push(citation)
      result.errors.push(
        `AI cited non-existent article: ${citation.fullMatch}`
      )
    }
  }
  
  // Step 3: Determine if response is valid
  if (result.invalidCitations.length > 0) {
    result.valid = false
    
    // Create safe error response
    result.safeResponse = `Lo siento, no puedo proporcionar esa información en este momento debido a una inconsistencia en los datos legales.

Por favor:
1. Verifica los números de artículo en http://www.pgrweb.go.cr/scij/
2. Consulta con un abogado colegiado para asesoría legal específica

⚠️ **Nota:** Esta respuesta fue bloqueada para proteger la precisión legal.`
  }
  
  // Step 4: Log validation attempt
  logValidation({
    timestamp: new Date().toISOString(),
    aiResponse,
    citations,
    invalidCitations: result.invalidCitations,
    blocked: !result.valid,
    reason: result.errors.join('; '),
  })
  
  return result
}

/**
 * Validate and sanitize AI response
 * 
 * This is the main function to use in API routes.
 * Returns either the original response (if valid) or a safe error message.
 * 
 * @param aiResponse - AI-generated response
 * @param contextCodes - Legal codes in context
 * @param providedArticles - Articles provided to AI
 * @returns Safe response text
 */
export async function validateAndSanitize(
  aiResponse: string,
  contextCodes: LegalCode[] = [],
  providedArticles: number[] = []
): Promise<string> {
  const validation = await validateLegalResponse(
    aiResponse,
    contextCodes,
    providedArticles
  )
  
  if (validation.valid) {
    return aiResponse
  }
  
  // Log blocked response for review
  console.warn('⚠️  BLOCKED AI RESPONSE - Invalid article citations')
  console.warn('Invalid citations:', validation.invalidCitations)
  console.warn('Errors:', validation.errors)
  
  return validation.safeResponse!
}

/**
 * Log validation attempt
 * 
 * In production, this should write to a database for audit trail.
 * For now, keeps in memory (limited to last 1000 entries).
 */
function logValidation(log: ValidationLog): void {
  validationLogs.push(log)
  
  // Keep only last 1000 entries (prevent memory leak)
  if (validationLogs.length > 1000) {
    validationLogs.shift()
  }
  
  // In production, write to database:
  // await prisma.validationLog.create({ data: log })
}

/**
 * Get validation logs
 * 
 * For admin review and monitoring.
 * 
 * @param limit - Maximum number of logs to return
 * @returns Recent validation logs
 */
export function getValidationLogs(limit: number = 100): ValidationLog[] {
  return validationLogs.slice(-limit)
}

/**
 * Get validation statistics
 * 
 * For monitoring and alerting.
 * 
 * @returns Validation statistics
 */
export function getValidationStats(): {
  total: number
  blocked: number
  blockRate: number
  recentBlocked: number
} {
  const total = validationLogs.length
  const blocked = validationLogs.filter(log => log.blocked).length
  const blockRate = total > 0 ? (blocked / total) * 100 : 0
  
  // Recent = last 100 validations
  const recent = validationLogs.slice(-100)
  const recentBlocked = recent.filter(log => log.blocked).length
  
  return {
    total,
    blocked,
    blockRate,
    recentBlocked,
  }
}

/**
 * Clear validation logs
 * 
 * For testing or memory management.
 */
export function clearValidationLogs(): void {
  validationLogs.length = 0
}

/**
 * Check if response contains any article citations
 * 
 * Quick check without full validation.
 * 
 * @param text - Text to check
 * @returns True if contains article citations
 */
export function containsArticleCitations(text: string): boolean {
  const citations = extractArticleCitations(text)
  return citations.length > 0
}

/**
 * Extract article numbers from text
 * 
 * Utility function for getting just the numbers.
 * 
 * @param text - Text to extract from
 * @returns Array of article numbers
 */
export function extractArticleNumbers(text: string): number[] {
  const citations = extractArticleCitations(text)
  return citations.map(c => c.articleNumber)
}
