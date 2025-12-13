/**
 * Convert text files to structured JSON
 * This is a simple fallback when PDF parsing fails
 */

const fs = require('fs')
const path = require('path')

function parseArticles(text) {
  const articles = []
  
  // Match "Artículo N.-" pattern
  const lines = text.split('\n')
  let currentArticle = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Check if this line starts an article
    const match = line.match(/^Artículo\s+(\d+)\.-\s*(.*)/)
    
    if (match) {
      // Save previous article if exists
      if (currentArticle) {
        articles.push(currentArticle)
      }
      
      // Start new article
      currentArticle = {
        number: match[1],
        title: `Artículo ${match[1]}`,
        content: match[2] || ''
      }
    } else if (currentArticle && line && !line.match(/^(TÍTULO|CAPÍTULO|LIBRO|CÓDIGO)/)) {
      // Continue current article content
      currentArticle.content += ' ' + line
    } else if (line.match(/^(TÍTULO|CAPÍTULO|LIBRO)/)) {
      // Save article before section header
      if (currentArticle) {
        articles.push(currentArticle)
        currentArticle = null
      }
    }
  }
  
  // Save last article
  if (currentArticle) {
    articles.push(currentArticle)
  }
  
  // Clean up content
  articles.forEach(article => {
    article.content = article.content.replace(/\s+/g, ' ').trim()
  })
  
  return articles
}

function convertFile(inputFile, outputFile, name, lawNumber) {
  console.log(`\n📄 Converting: ${inputFile}`)
  
  const text = fs.readFileSync(inputFile, 'utf8')
  const articles = parseArticles(text)
  
  const data = {
    name,
    law_number: lawNumber,
    articles,
    full_text: text,
    extracted_at: new Date().toISOString()
  }
  
  fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8')
  console.log(`✅ Saved: ${outputFile}`)
  console.log(`   Articles: ${articles.length}`)
  
  // Also create index
  const index = {}
  articles.forEach(article => {
    index[article.number] = article.content
  })
  
  const indexFile = outputFile.replace('.json', '-index.json')
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2), 'utf8')
  console.log(`✅ Index: ${indexFile}`)
}

// Convert files
const dataDir = path.join(process.cwd(), 'data')
const processedDir = path.join(dataDir, 'processed')

if (!fs.existsSync(processedDir)) {
  fs.mkdirSync(processedDir, { recursive: true })
}

console.log('🔄 Converting text files to JSON...')

// Código de Comercio
if (fs.existsSync(path.join(dataDir, 'codigo-comercio.txt'))) {
  convertFile(
    path.join(dataDir, 'codigo-comercio.txt'),
    path.join(processedDir, 'codigo-comercio.json'),
    'Código de Comercio de Costa Rica',
    'Ley N° 3284'
  )
}

// Código Civil
if (fs.existsSync(path.join(dataDir, 'codigo-civil.txt'))) {
  convertFile(
    path.join(dataDir, 'codigo-civil.txt'),
    path.join(processedDir, 'codigo-civil.json'),
    'Código Civil de Costa Rica',
    'Ley N° 63'
  )
}

console.log('\n✅ Conversion complete!')
