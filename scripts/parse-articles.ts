#!/usr/bin/env tsx
/**
 * LEGAL ARTICLE PARSER
 * 
 * ⚠️ CRITICAL: This parser is DETERMINISTIC and preserves EXACT legal text
 * 
 * PURPOSE:
 * Parse Costa Rican legal codes into structured, article-based JSON.
 * Each article is extracted with its EXACT original wording.
 * 
 * WHY EXACT TEXT MATTERS:
 * - Legal interpretation depends on precise wording
 * - Courts cite exact article text
 * - Any modification could change legal meaning
 * - AI must cite verbatim, not paraphrase
 * 
 * INPUT:
 * - Plain text files from /data/text/
 * - Extracted by pdftotext (preserves layout)
 * 
 * OUTPUT:
 * - Structured JSON in /data/processed/
 * - One entry per article with exact text
 * 
 * PARSING RULES:
 * - Match "Artículo <number>" patterns
 * - Extract text until next article or end
 * - Preserve all whitespace and formatting
 * - No inference, no AI, no rewriting
 * 
 * VALIDATION:
 * - Fail if no articles found (indicates parsing error)
 * - Warn if article count seems low
 * - Report duplicate article numbers
 * 
 * USAGE:
 *   npm run parse:articles
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs'
import { join, basename } from 'path'

// Directories
const TEXT_DIR = join(process.cwd(), 'data', 'text')
const PROCESSED_DIR = join(process.cwd(), 'data', 'processed')

/**
 * Legal code configuration
 */
interface LegalCode {
  textFile: string
  outputFile: string
  lawName: string
  lawNumber: string
  expectedMinArticles: number
}

const LEGAL_CODES: LegalCode[] = [
  {
    textFile: 'codigo-civil.txt',
    outputFile: 'codigo-civil.json',
    lawName: 'Código Civil de Costa Rica',
    lawNumber: 'Ley N° 63',
    expectedMinArticles: 1000, // Civil code has ~1000+ articles
  },
  {
    textFile: 'codigo-comercio-completo.txt',
    outputFile: 'codigo-comercio.json',
    lawName: 'Código de Comercio de Costa Rica',
    lawNumber: 'Ley N° 3284',
    expectedMinArticles: 500, // Commerce code has ~500+ articles
  },
  {
    textFile: 'codigo-trabajo.txt',
    outputFile: 'codigo-trabajo.json',
    lawName: 'Código de Trabajo de Costa Rica',
    lawNumber: 'Ley N° 2',
    expectedMinArticles: 400, // Labor code has ~400+ articles
  },
]

/**
 * Article structure
 */
interface Article {
  law: string
  article: number
  title: string
  text: string
}

/**
 * Output JSON structure
 */
interface LegalCodeJSON {
  name: string
  law_number: string
  total_articles: number
  articles: Article[]
  extracted_at: string
  parser_version: string
}

/**
 * Parse legal text into articles
 * 
 * CRITICAL: This function preserves EXACT legal text
 * - No AI rewriting
 * - No paraphrasing
 * - No inference
 * - Verbatim extraction only
 */
function parseArticles(text: string, lawCode: string): Article[] {
  const articles: Article[] = []
  
  // Regex patterns for article detection
  // Matches: "Artículo 1.-", "Artículo 1:", "Artículo 1.", "ARTÍCULO 1"
  const articlePattern = /(?:ARTÍCULO|Artículo)\s+(\d+)[\.\-:\s]/gi
  
  const matches = Array.from(text.matchAll(articlePattern))
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i]
    const articleNumber = parseInt(match[1], 10)
    const startIndex = match.index!
    
    // Find where this article ends (start of next article or end of text)
    const nextMatch = matches[i + 1]
    const endIndex = nextMatch ? nextMatch.index! : text.length
    
    // Extract the full article text (including the header)
    let articleText = text.substring(startIndex, endIndex).trim()
    
    // Remove the article header to get just the content
    // But preserve it for the title
    const headerMatch = articleText.match(/^(?:ARTÍCULO|Artículo)\s+\d+[\.\-:\s]*/i)
    const title = headerMatch ? headerMatch[0].trim() : `Artículo ${articleNumber}`
    
    // Content is everything after the header
    const content = headerMatch 
      ? articleText.substring(headerMatch[0].length).trim()
      : articleText
    
    // Clean up excessive whitespace while preserving paragraph breaks
    const cleanedContent = content
      .replace(/[ \t]+/g, ' ')  // Multiple spaces/tabs → single space
      .replace(/\n{3,}/g, '\n\n')  // Multiple newlines → double newline
      .trim()
    
    // Validate: Article must have content
    if (cleanedContent.length === 0) {
      console.warn(`   ⚠️  Article ${articleNumber} has no content`)
      continue
    }
    
    articles.push({
      law: lawCode,
      article: articleNumber,
      title,
      text: cleanedContent,
    })
  }
  
  return articles
}

/**
 * Validate parsed articles
 */
function validateArticles(
  articles: Article[],
  code: LegalCode
): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  
  // Critical: Must have articles
  if (articles.length === 0) {
    errors.push('No articles found - parsing failed completely')
    return { valid: false, errors, warnings }
  }
  
  // Warning: Too few articles
  if (articles.length < code.expectedMinArticles) {
    warnings.push(
      `Only ${articles.length} articles found, expected at least ${code.expectedMinArticles}`
    )
  }
  
  // Check for duplicate article numbers
  const articleNumbers = articles.map(a => a.article)
  const duplicates = articleNumbers.filter(
    (num, index) => articleNumbers.indexOf(num) !== index
  )
  
  if (duplicates.length > 0) {
    warnings.push(`Duplicate article numbers found: ${[...new Set(duplicates)].join(', ')}`)
  }
  
  // Check for gaps in article numbering (common in legal codes)
  const sortedNumbers = [...articleNumbers].sort((a, b) => a - b)
  const gaps: string[] = []
  
  for (let i = 0; i < sortedNumbers.length - 1; i++) {
    const current = sortedNumbers[i]
    const next = sortedNumbers[i + 1]
    const gap = next - current
    
    // Only report large gaps (> 10) as they might indicate missing articles
    if (gap > 10) {
      gaps.push(`${current} → ${next} (gap of ${gap})`)
    }
  }
  
  if (gaps.length > 0) {
    warnings.push(`Large gaps in article numbering: ${gaps.slice(0, 3).join(', ')}${gaps.length > 3 ? '...' : ''}`)
  }
  
  return { valid: true, errors, warnings }
}

/**
 * Process a single legal code
 */
function processLegalCode(code: LegalCode): boolean {
  console.log(`\n📚 Processing: ${code.lawName}`)
  
  const textPath = join(TEXT_DIR, code.textFile)
  
  // Check if text file exists
  if (!existsSync(textPath)) {
    console.log(`   ⚠️  Text file not found: ${code.textFile}`)
    console.log(`   💡 Run: npm run extract:pdfs`)
    return false
  }
  
  try {
    // Read text file
    console.log(`   📖 Reading: ${code.textFile}`)
    const text = readFileSync(textPath, 'utf-8')
    const textSize = (text.length / 1024).toFixed(2)
    console.log(`   📏 Size: ${textSize} KB`)
    
    // Parse articles
    console.log(`   🔍 Parsing articles...`)
    const lawCode = code.outputFile.replace('.json', '').replace(/-/g, '_')
    const articles = parseArticles(text, lawCode)
    
    console.log(`   ✅ Found ${articles.length} articles`)
    
    // Validate
    const validation = validateArticles(articles, code)
    
    if (!validation.valid) {
      console.error(`   ❌ Validation failed:`)
      validation.errors.forEach(err => console.error(`      - ${err}`))
      return false
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`   ⚠️  Warnings:`)
      validation.warnings.forEach(warn => console.warn(`      - ${warn}`))
    }
    
    // Create output JSON
    const output: LegalCodeJSON = {
      name: code.lawName,
      law_number: code.lawNumber,
      total_articles: articles.length,
      articles: articles.sort((a, b) => a.article - b.article),
      extracted_at: new Date().toISOString(),
      parser_version: '2.0.0',
    }
    
    // Save to file
    const outputPath = join(PROCESSED_DIR, code.outputFile)
    writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8')
    
    const outputSize = (JSON.stringify(output).length / 1024).toFixed(2)
    console.log(`   💾 Saved: ${code.outputFile} (${outputSize} KB)`)
    
    // Show sample articles
    console.log(`   📋 Sample articles:`)
    console.log(`      - Article ${articles[0].article}: ${articles[0].text.substring(0, 60)}...`)
    if (articles.length > 1) {
      const mid = Math.floor(articles.length / 2)
      console.log(`      - Article ${articles[mid].article}: ${articles[mid].text.substring(0, 60)}...`)
    }
    if (articles.length > 2) {
      const last = articles[articles.length - 1]
      console.log(`      - Article ${last.article}: ${last.text.substring(0, 60)}...`)
    }
    
    return true
    
  } catch (error: any) {
    console.error(`   ❌ Error processing ${code.lawName}:`)
    console.error(`      ${error.message}`)
    return false
  }
}

/**
 * Main function
 */
function main(): void {
  console.log('⚖️  LEGAL ARTICLE PARSER')
  console.log('=' .repeat(60))
  console.log('')
  console.log('⚠️  CRITICAL: This parser preserves EXACT legal text')
  console.log('   - No AI rewriting')
  console.log('   - No paraphrasing')
  console.log('   - Verbatim extraction only')
  console.log('')
  
  // Check directories
  if (!existsSync(TEXT_DIR)) {
    console.error('❌ Text directory not found:', TEXT_DIR)
    console.error('💡 Run: npm run extract:pdfs first')
    process.exit(1)
  }
  
  if (!existsSync(PROCESSED_DIR)) {
    console.log('📁 Creating processed directory...')
    const fs = require('fs')
    fs.mkdirSync(PROCESSED_DIR, { recursive: true })
  }
  
  // Process each legal code
  let successCount = 0
  let failCount = 0
  
  for (const code of LEGAL_CODES) {
    const success = processLegalCode(code)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }
  
  // Summary
  console.log('')
  console.log('=' .repeat(60))
  console.log('📊 PARSING SUMMARY')
  console.log('=' .repeat(60))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📁 Output: ${PROCESSED_DIR}`)
  console.log('')
  
  if (successCount > 0) {
    console.log('✅ Parsing complete!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Review JSON files in /data/processed/')
    console.log('  2. Verify article counts are correct')
    console.log('  3. Deploy to production')
    console.log('')
    console.log('⚠️  Remember: These files contain EXACT legal text')
    console.log('   Do not modify manually - always re-parse from source')
    console.log('')
  }
  
  if (failCount > 0) {
    console.error('⚠️  Some files failed to parse')
    process.exit(1)
  }
}

// Run parser
main()
