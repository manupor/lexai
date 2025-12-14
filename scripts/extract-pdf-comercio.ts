/**
 * Extract complete text from Código de Comercio PDF
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const pdf = require('pdf-parse')

async function extractPDF() {
  console.log('📄 Extrayendo texto del PDF del Código de Comercio...\n')

  const pdfPath = join(process.cwd(), 'data', 'codigo-comercio.pdf')
  const outputPath = join(process.cwd(), 'data', 'text', 'codigo-comercio-completo.txt')

  try {
    // Read PDF
    const dataBuffer = readFileSync(pdfPath)
    console.log('✅ PDF leído correctamente')

    // Parse PDF
    console.log('⚙️  Extrayendo texto...')
    const data = await pdf(dataBuffer)

    console.log(`✅ Texto extraído: ${data.numpages} páginas`)
    console.log(`   Caracteres: ${data.text.length}`)

    // Count articles
    const articleMatches = data.text.match(/(?:ARTÍCULO|Artículo|ARTICULO|Articulo)\s+\d+/gi)
    console.log(`   Artículos encontrados: ${articleMatches ? articleMatches.length : 0}`)

    // Save to file
    writeFileSync(outputPath, data.text, 'utf-8')
    console.log(`\n✅ Texto guardado en: ${outputPath}`)

    // Show first few articles
    console.log('\n📜 Primeros artículos encontrados:')
    if (articleMatches) {
      articleMatches.slice(0, 10).forEach((match, i) => {
        console.log(`   ${i + 1}. ${match}`)
      })
    }

    console.log('\n✅ Extracción completada')
    console.log('\n🔄 Próximos pasos:')
    console.log('   1. npm run parse:articles')
    console.log('   2. npx tsx scripts/load-all-codes.ts')
    console.log('   3. npx tsx scripts/verify-all-codes.ts')
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

extractPDF()
