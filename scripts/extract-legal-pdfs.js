/**
 * PDF EXTRACTION SCRIPT - RUN ONCE OFFLINE
 * 
 * This script extracts text from Costa Rican legal PDFs and saves them as structured JSON.
 * 
 * WHY THIS ARCHITECTURE:
 * - PDF parsing is SLOW (10-30s per PDF)
 * - pdfjs-dist BREAKS in Node.js (requires browser APIs)
 * - pdf-parse works in Node but should NEVER run in API routes
 * - Extract ONCE, read MANY times = fast API responses
 * 
 * USAGE:
 *   npm run extract-pdfs
 */

const fs = require('fs')
const path = require('path')
const { PDFParse } = require('pdf-parse')

/**
 * Extract text from PDF using pdf-parse
 */
async function extractPDFText(pdfPath) {
  console.log(`📄 Reading PDF: ${path.basename(pdfPath)}`)
  
  const dataBuffer = fs.readFileSync(pdfPath)
  const parser = new PDFParse()
  const data = await parser.parse(dataBuffer)
  
  console.log(`   ✅ Extracted ${data.numpages} pages, ${(data.text.length / 1024).toFixed(0)}KB`)
  
  return data.text
}

/**
 * Parse Código de Comercio into structured articles
 */
function parseCodigoComercio(text) {
  const articles = []
  
  // Match "Artículo N.-" or "Artículo N:" or "Artículo N." patterns
  const articleRegex = /Artículo\s+(\d+)[\.\-:]\s*([^\n]+(?:\n(?!Artículo\s+\d+)[^\n]+)*)/gi
  
  let match
  while ((match = articleRegex.exec(text)) !== null) {
    const number = match[1]
    const content = match[2].trim()
    
    articles.push({
      number,
      title: `Artículo ${number}`,
      content: content.replace(/\s+/g, ' ').trim()
    })
  }
  
  console.log(`   📋 Parsed ${articles.length} articles`)
  return articles
}

/**
 * Parse Código Civil into structured articles
 */
function parseCodigoCivil(text) {
  const articles = []
  
  // Match "Artículo N.-" or "Artículo N:" patterns
  const articleRegex = /Artículo\s+(\d+)[\.\-:]\s*([^\n]+(?:\n(?!Artículo\s+\d+)[^\n]+)*)/gi
  
  let match
  while ((match = articleRegex.exec(text)) !== null) {
    const number = match[1]
    const content = match[2].trim()
    
    articles.push({
      number,
      title: `Artículo ${number}`,
      content: content.replace(/\s+/g, ' ').trim()
    })
  }
  
  console.log(`   📋 Parsed ${articles.length} articles`)
  return articles
}

/**
 * Main extraction function
 */
async function extractAllLegalCodes() {
  console.log('🚀 Starting legal PDF extraction...\n')
  
  const pdfsDir = path.join(process.cwd(), 'data', 'pdfs')
  const textDir = path.join(process.cwd(), 'data', 'text')
  const processedDir = path.join(process.cwd(), 'data', 'processed')
  
  // Ensure directories exist
  ;[pdfsDir, textDir, processedDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  })
  
  const codes = [
    {
      pdfName: 'codigo-comercio.pdf',
      outputName: 'codigo-comercio',
      name: 'Código de Comercio de Costa Rica',
      lawNumber: 'Ley N° 3284',
      parser: parseCodigoComercio
    },
    {
      pdfName: 'codigo-civil.pdf',
      outputName: 'codigo-civil',
      name: 'Código Civil de Costa Rica',
      lawNumber: 'Ley N° 63',
      parser: parseCodigoCivil
    }
  ]
  
  for (const code of codes) {
    try {
      console.log(`\n📚 Processing: ${code.name}`)
      
      const pdfPath = path.join(pdfsDir, code.pdfName)
      
      if (!fs.existsSync(pdfPath)) {
        console.log(`   ⚠️  PDF not found: ${pdfPath}`)
        console.log(`   💡 Please copy the PDF to: data/pdfs/${code.pdfName}`)
        continue
      }
      
      // Extract raw text
      const fullText = await extractPDFText(pdfPath)
      
      // Save raw text
      const txtPath = path.join(textDir, `${code.outputName}.txt`)
      fs.writeFileSync(txtPath, fullText, 'utf8')
      console.log(`   💾 Saved raw text: ${txtPath}`)
      
      // Parse into articles
      const articles = code.parser(fullText)
      
      // Create structured JSON
      const legalCode = {
        name: code.name,
        law_number: code.lawNumber,
        articles,
        full_text: fullText,
        extracted_at: new Date().toISOString()
      }
      
      // Save structured JSON
      const jsonPath = path.join(processedDir, `${code.outputName}.json`)
      fs.writeFileSync(jsonPath, JSON.stringify(legalCode, null, 2), 'utf8')
      console.log(`   💾 Saved structured JSON: ${jsonPath}`)
      
      // Create search index (article number -> content)
      const indexPath = path.join(processedDir, `${code.outputName}-index.json`)
      const index = {}
      articles.forEach(article => {
        index[article.number] = article.content
      })
      fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf8')
      console.log(`   💾 Saved search index: ${indexPath}`)
      
      console.log(`   ✅ Successfully processed ${code.name}`)
      
    } catch (error) {
      console.error(`   ❌ Error processing ${code.name}:`, error.message)
    }
  }
  
  console.log('\n✅ Extraction complete!')
  console.log('\n📊 Summary:')
  console.log('   - Raw text files: data/text/*.txt')
  console.log('   - Structured JSON: data/processed/*.json')
  console.log('   - Search indexes: data/processed/*-index.json')
  console.log('\n💡 API routes will now load these pre-processed files (fast!)')
}

// Run extraction
extractAllLegalCodes().catch(console.error)
