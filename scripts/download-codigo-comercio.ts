/**
 * Download Código de Comercio from SCIJ
 * SCIJ URL: http://www.pgrweb.go.cr/scij/
 */

import { writeFileSync } from 'fs'
import { join } from 'path'

async function downloadFromSCIJ() {
  console.log('🌐 Descargando Código de Comercio de SCIJ...\n')

  // SCIJ URL for Código de Comercio (Ley 3284)
  const url = 'http://www.pgrweb.go.cr/scij/Busqueda/Normativa/Normas/nrm_texto_completo.aspx?param1=NRTC&nValor1=1&nValor2=6239&nValor3=6720&strTipM=TC'

  try {
    console.log('📥 Descargando desde SCIJ...')
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const html = await response.text()
    console.log(`✅ Descargado: ${html.length} caracteres`)

    // Extract text from HTML (SCIJ returns HTML)
    // Remove HTML tags and clean up
    let text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, '\n')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()

    // Count articles
    const articleMatches = text.match(/(?:ARTÍCULO|Artículo|ARTICULO|Articulo)\s+\d+/gi)
    console.log(`📜 Artículos encontrados: ${articleMatches ? articleMatches.length : 0}`)

    // Save
    const outputPath = join(process.cwd(), 'data', 'text', 'codigo-comercio-completo.txt')
    writeFileSync(outputPath, text, 'utf-8')
    console.log(`\n✅ Guardado en: ${outputPath}`)

    // Show first articles
    if (articleMatches && articleMatches.length > 0) {
      console.log('\n📋 Primeros 10 artículos:')
      articleMatches.slice(0, 10).forEach((match: string, i: number) => {
        console.log(`   ${i + 1}. ${match}`)
      })
    }

    console.log('\n✅ Descarga completada')
    console.log('\n🔄 Próximos pasos:')
    console.log('   1. Verificar el archivo: data/text/codigo-comercio-completo.txt')
    console.log('   2. npm run parse:articles')
    console.log('   3. npx tsx scripts/load-all-codes.ts')
  } catch (error) {
    console.error('❌ Error:', error)
    console.log('\n💡 Alternativa: Descarga manual desde SCIJ')
    console.log('   1. Ve a: http://www.pgrweb.go.cr/scij/')
    console.log('   2. Busca "Código de Comercio" (Ley 3284)')
    console.log('   3. Copia el texto completo')
    console.log('   4. Pégalo en: data/text/codigo-comercio-completo.txt')
    process.exit(1)
  }
}

downloadFromSCIJ()
