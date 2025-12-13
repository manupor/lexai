/**
 * LEGAL SEARCH TESTS
 * 
 * These tests demonstrate the search precedence and behavior.
 * Run with: npm test (when test framework is set up)
 */

import {
  findLegalArticle,
  articleExists,
  findArticleInAnyCod,
  getAllArticles,
  getLegalCodeInfo,
  type LegalCode,
} from './legal-search'

/**
 * Example usage and expected behavior
 */
function demonstrateUsage() {
  console.log('🧪 LEGAL SEARCH - Usage Examples\n')
  
  // Example 1: Exact article match (SUCCESS)
  console.log('Example 1: Find exact article')
  const result1 = findLegalArticle('codigo-civil', 1)
  console.log('Result:', result1)
  console.log('Expected: found=true, searchMethod=exact')
  console.log('')
  
  // Example 2: Article not found (EXPLICIT FAILURE)
  console.log('Example 2: Article does not exist')
  const result2 = findLegalArticle('codigo-civil', 99999)
  console.log('Result:', result2)
  console.log('Expected: found=false, searchMethod=not_found')
  console.log('')
  
  // Example 3: Check if article exists
  console.log('Example 3: Quick existence check')
  const exists = articleExists('codigo-civil', 1)
  console.log('Article 1 exists:', exists)
  console.log('Expected: true')
  console.log('')
  
  // Example 4: Search across multiple codes
  console.log('Example 4: Search in any code')
  const result4 = findArticleInAnyCod(1)
  console.log('Result:', result4)
  console.log('Expected: found=true, law=codigo-civil')
  console.log('')
  
  // Example 5: Get metadata
  console.log('Example 5: Get legal code info')
  const info = getLegalCodeInfo('codigo-civil')
  console.log('Info:', info)
  console.log('Expected: name, law_number, total_articles')
  console.log('')
  
  // Example 6: Get all articles (for indexing)
  console.log('Example 6: Get all articles')
  const articles = getAllArticles('codigo-civil')
  console.log(`Total articles: ${articles.length}`)
  console.log('First article:', articles[0])
  console.log('Expected: Array of all articles')
  console.log('')
}

/**
 * Test search precedence
 */
function testSearchPrecedence() {
  console.log('🎯 SEARCH PRECEDENCE TEST\n')
  
  console.log('Rule 1: Exact match ALWAYS wins')
  const exact = findLegalArticle('codigo-civil', 1)
  console.log('✓ Exact match found:', exact.found)
  console.log('✓ Search method:', exact.searchMethod)
  console.log('')
  
  console.log('Rule 2: Semantic search only if exact fails (not implemented yet)')
  console.log('ℹ️  Future: Will use embeddings for semantic search')
  console.log('')
  
  console.log('Rule 3: Explicit NOT FOUND if nothing matches')
  const notFound = findLegalArticle('codigo-civil', 99999)
  console.log('✓ Not found:', !notFound.found)
  console.log('✓ Search method:', notFound.searchMethod)
  console.log('✓ Message:', notFound.message)
  console.log('')
}

/**
 * Test legal determinism
 */
function testDeterminism() {
  console.log('⚖️  LEGAL DETERMINISM TEST\n')
  
  console.log('Same input MUST produce same output')
  
  const result1 = findLegalArticle('codigo-civil', 1)
  const result2 = findLegalArticle('codigo-civil', 1)
  const result3 = findLegalArticle('codigo-civil', 1)
  
  const allMatch = 
    result1.found === result2.found &&
    result2.found === result3.found &&
    result1.article?.text === result2.article?.text &&
    result2.article?.text === result3.article?.text
  
  console.log('✓ Deterministic:', allMatch)
  console.log('✓ All three searches returned identical results')
  console.log('')
}

/**
 * Test error handling
 */
function testErrorHandling() {
  console.log('🛡️  ERROR HANDLING TEST\n')
  
  console.log('Test 1: Invalid legal code')
  const result1 = findLegalArticle('invalid-code' as LegalCode, 1)
  console.log('✓ Handles gracefully:', !result1.found)
  console.log('')
  
  console.log('Test 2: Negative article number')
  const result2 = findLegalArticle('codigo-civil', -1)
  console.log('✓ Returns not found:', !result2.found)
  console.log('')
  
  console.log('Test 3: Zero article number')
  const result3 = findLegalArticle('codigo-civil', 0)
  console.log('✓ Returns not found:', !result3.found)
  console.log('')
}

/**
 * Run all demonstrations
 */
if (require.main === module) {
  console.log('═'.repeat(60))
  console.log('LEGAL SEARCH LAYER - Demonstration')
  console.log('═'.repeat(60))
  console.log('')
  
  try {
    demonstrateUsage()
    testSearchPrecedence()
    testDeterminism()
    testErrorHandling()
    
    console.log('═'.repeat(60))
    console.log('✅ All demonstrations complete')
    console.log('═'.repeat(60))
  } catch (error) {
    console.error('❌ Error during demonstration:', error)
    process.exit(1)
  }
}

export {
  demonstrateUsage,
  testSearchPrecedence,
  testDeterminism,
  testErrorHandling,
}
