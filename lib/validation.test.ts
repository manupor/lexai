/**
 * VALIDATION LAYER TESTS
 * 
 * Demonstrates validation behavior and edge cases.
 */

import {
  validateLegalResponse,
  validateAndSanitize,
  containsArticleCitations,
  extractArticleNumbers,
  getValidationStats,
  clearValidationLogs,
} from './validation'

/**
 * Test Case 1: Valid response with provided articles
 */
async function testValidResponse() {
  console.log('\n📋 Test 1: Valid Response (articles were provided)')
  
  const aiResponse = `Según el Artículo 1 del Código Civil, la personalidad civil comienza con el nacimiento.`
  
  const result = await validateLegalResponse(
    aiResponse,
    ['codigo-civil'],
    [1] // Article 1 was provided in context
  )
  
  console.log('Valid:', result.valid)
  console.log('Citations found:', result.citations.length)
  console.log('Invalid citations:', result.invalidCitations.length)
  console.log('Expected: valid=true, citations=1, invalid=0')
  console.log(result.valid ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 2: Invalid response with hallucinated article
 */
async function testInvalidResponse() {
  console.log('\n📋 Test 2: Invalid Response (hallucinated article)')
  
  const aiResponse = `Según el Artículo 99999 del Código Civil, esto es inventado.`
  
  const result = await validateLegalResponse(
    aiResponse,
    ['codigo-civil'],
    [] // No articles provided
  )
  
  console.log('Valid:', result.valid)
  console.log('Citations found:', result.citations.length)
  console.log('Invalid citations:', result.invalidCitations.length)
  console.log('Safe response:', result.safeResponse?.substring(0, 50) + '...')
  console.log('Expected: valid=false, citations=1, invalid=1')
  console.log(!result.valid ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 3: Response with no citations
 */
async function testNoCitations() {
  console.log('\n📋 Test 3: No Citations (general legal advice)')
  
  const aiResponse = `En Costa Rica, el derecho civil regula las relaciones entre particulares.`
  
  const result = await validateLegalResponse(
    aiResponse,
    ['codigo-civil'],
    []
  )
  
  console.log('Valid:', result.valid)
  console.log('Citations found:', result.citations.length)
  console.log('Expected: valid=true, citations=0')
  console.log(result.valid && result.citations.length === 0 ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 4: Multiple citations, some valid, some invalid
 */
async function testMixedCitations() {
  console.log('\n📋 Test 4: Mixed Citations (some valid, some invalid)')
  
  const aiResponse = `
    El Artículo 1 del Código Civil establece la personalidad civil.
    El Artículo 99999 del Código Civil es inventado.
    El Artículo 2 del Código Civil trata sobre la muerte.
  `
  
  const result = await validateLegalResponse(
    aiResponse,
    ['codigo-civil'],
    [1, 2] // Only articles 1 and 2 were provided
  )
  
  console.log('Valid:', result.valid)
  console.log('Citations found:', result.citations.length)
  console.log('Invalid citations:', result.invalidCitations.length)
  console.log('Expected: valid=false (one invalid), citations=3, invalid=1')
  console.log(!result.valid && result.invalidCitations.length === 1 ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 5: Sanitize function
 */
async function testSanitize() {
  console.log('\n📋 Test 5: Sanitize Function')
  
  const validResponse = `El Artículo 1 del Código Civil...`
  const invalidResponse = `El Artículo 99999 del Código Civil...`
  
  const sanitized1 = await validateAndSanitize(validResponse, ['codigo-civil'], [1])
  const sanitized2 = await validateAndSanitize(invalidResponse, ['codigo-civil'], [])
  
  console.log('Valid response returned as-is:', sanitized1 === validResponse)
  console.log('Invalid response replaced:', sanitized2 !== invalidResponse)
  console.log('Safe response starts with "Lo siento":', sanitized2.startsWith('Lo siento'))
  console.log('Expected: valid unchanged, invalid replaced')
  console.log(sanitized1 === validResponse && sanitized2 !== invalidResponse ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 6: Citation extraction
 */
function testCitationExtraction() {
  console.log('\n📋 Test 6: Citation Extraction')
  
  const text = `
    Artículo 1 del Código Civil
    artículo 46 del Código de Comercio
    ARTÍCULO 100
    Art. 200
  `
  
  const hasCitations = containsArticleCitations(text)
  const numbers = extractArticleNumbers(text)
  
  console.log('Contains citations:', hasCitations)
  console.log('Article numbers:', numbers)
  console.log('Expected: true, [1, 46, 100, 200]')
  console.log(hasCitations && numbers.length === 4 ? '✅ PASS' : '❌ FAIL')
}

/**
 * Test Case 7: Validation statistics
 */
async function testStatistics() {
  console.log('\n📋 Test 7: Validation Statistics')
  
  clearValidationLogs()
  
  // Generate some validations
  await validateLegalResponse('Artículo 1', ['codigo-civil'], [1])
  await validateLegalResponse('Artículo 99999', ['codigo-civil'], [])
  await validateLegalResponse('Artículo 2', ['codigo-civil'], [2])
  
  const stats = getValidationStats()
  
  console.log('Total validations:', stats.total)
  console.log('Blocked:', stats.blocked)
  console.log('Block rate:', stats.blockRate.toFixed(2) + '%')
  console.log('Expected: total=3, blocked=1, rate=33.33%')
  console.log(stats.total === 3 && stats.blocked === 1 ? '✅ PASS' : '❌ FAIL')
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('═'.repeat(60))
  console.log('LEGAL VALIDATION LAYER - Tests')
  console.log('═'.repeat(60))
  
  try {
    await testValidResponse()
    await testInvalidResponse()
    await testNoCitations()
    await testMixedCitations()
    await testSanitize()
    testCitationExtraction()
    await testStatistics()
    
    console.log('\n' + '═'.repeat(60))
    console.log('✅ All tests complete')
    console.log('═'.repeat(60))
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests()
}

export { runAllTests }
