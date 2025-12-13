/**
 * Parse Código de Trabajo from the text provided by user
 * This extracts all articles from the complete text
 */

const fs = require('fs');
const path = require('path');

// Read the full text from user's message (saved in a file)
const textPath = path.join(__dirname, '..', 'data', 'text', 'codigo-trabajo-full.txt');
const outputPath = path.join(__dirname, '..', 'data', 'processed', 'codigo-trabajo.json');

console.log('⚖️  Parsing Código de Trabajo from text...\n');

// Read the text file
let text;
try {
  text = fs.readFileSync(textPath, 'utf-8');
  console.log(`✅ Loaded text: ${(text.length / 1024).toFixed(2)} KB`);
} catch (error) {
  console.error('❌ Error reading file:', error.message);
  console.log('\n💡 Please save the complete Código de Trabajo text to:');
  console.log('   data/text/codigo-trabajo-full.txt');
  process.exit(1);
}

// Parse articles
const articles = [];

// Match patterns like:
// ARTICULO 1º.- Text...
// ARTICULO 2º.- Text...
// Artículo 45.- Text...
const articleRegex = /(?:ARTICULO|Artículo|Artículo)\s+(\d+)[ºª°]?[\.\-:]\s*([^]*?)(?=(?:ARTICULO|Artículo|Artículo)\s+\d+[ºª°]?[\.\-:]|Ficha articulo|$)/gi;

let match;
let count = 0;

while ((match = articleRegex.exec(text)) !== null) {
  const articleNumber = parseInt(match[1], 10);
  let articleText = match[2].trim();
  
  // Clean up the text
  articleText = articleText
    .replace(/Ficha articulo/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  // Skip if empty
  if (!articleText || articleText.length < 10) {
    continue;
  }
  
  articles.push({
    law: 'codigo_trabajo',
    article: articleNumber,
    title: `Artículo ${articleNumber}`,
    text: articleText
  });
  
  count++;
  
  if (count % 50 === 0) {
    console.log(`   Processed ${count} articles...`);
  }
}

// Sort by article number
articles.sort((a, b) => a.article - b.article);

console.log(`\n✅ Found ${articles.length} articles`);

// Show sample
if (articles.length > 0) {
  console.log('\n📋 Sample articles:');
  console.log(`   - Article ${articles[0].article}: ${articles[0].text.substring(0, 60)}...`);
  if (articles.length > 1) {
    const mid = Math.floor(articles.length / 2);
    console.log(`   - Article ${articles[mid].article}: ${articles[mid].text.substring(0, 60)}...`);
  }
  if (articles.length > 2) {
    const last = articles[articles.length - 1];
    console.log(`   - Article ${last.article}: ${last.text.substring(0, 60)}...`);
  }
}

// Create output JSON
const output = {
  name: 'Código de Trabajo de Costa Rica',
  law_number: 'Ley N° 2',
  total_articles: articles.length,
  articles: articles,
  extracted_at: new Date().toISOString(),
  parser_version: '2.0.0'
};

// Save
fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

const outputSize = (JSON.stringify(output).length / 1024).toFixed(2);
console.log(`\n💾 Saved: ${outputPath} (${outputSize} KB)`);
console.log('\n✅ Código de Trabajo ready for queries!');
