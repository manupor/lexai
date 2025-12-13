#!/usr/bin/env tsx
/**
 * LOAD CÓDIGO DE TRABAJO TO DATABASE
 * 
 * This script loads the parsed Código de Trabajo articles into the database.
 * It creates a LegalCode entry and all its articles.
 * 
 * USAGE:
 *   npx tsx scripts/load-codigo-trabajo.ts
 */

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { readFileSync } from 'fs'
import { join } from 'path'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

interface ParsedArticle {
  law: string
  article: number
  title: string
  text: string
}

interface ParsedLegalCode {
  name: string
  law_number: string
  total_articles: number
  articles: ParsedArticle[]
  extracted_at: string
  parser_version: string
}

async function main() {
  console.log('📚 Cargando Código de Trabajo a la base de datos...\n')

  try {
    // Read the parsed JSON file
    const jsonPath = join(process.cwd(), 'data', 'processed', 'codigo-trabajo.json')
    console.log(`📖 Leyendo: ${jsonPath}`)
    
    const data: ParsedLegalCode = JSON.parse(readFileSync(jsonPath, 'utf-8'))
    console.log(`✅ Archivo cargado: ${data.total_articles} artículos encontrados\n`)

    // Check if the legal code already exists
    console.log('🔍 Verificando si el código ya existe...')
    const existingCode = await prisma.legalCode.findUnique({
      where: { code: 'CT' }
    })

    if (existingCode) {
      console.log('⚠️  El Código de Trabajo ya existe en la base de datos')
      console.log('🗑️  Eliminando artículos antiguos...')
      
      await prisma.article.deleteMany({
        where: { legalCodeId: existingCode.id }
      })
      
      console.log('🔄 Actualizando código legal...')
      await prisma.legalCode.update({
        where: { id: existingCode.id },
        data: {
          title: data.name,
          lastUpdated: new Date(),
          content: `${data.name} - ${data.law_number}. Total de artículos: ${data.total_articles}`
        }
      })
      
      var legalCodeId = existingCode.id
    } else {
      console.log('✨ Creando nuevo código legal...')
      const newCode = await prisma.legalCode.create({
        data: {
          code: 'CT',
          title: data.name,
          category: 'LABORAL',
          content: `${data.name} - ${data.law_number}. Total de artículos: ${data.total_articles}`,
          lastUpdated: new Date()
        }
      })
      
      var legalCodeId = newCode.id
    }

    console.log(`✅ Código legal listo (ID: ${legalCodeId})\n`)

    // Load articles in batches to avoid memory issues
    console.log('📝 Cargando artículos...')
    const BATCH_SIZE = 100
    let loaded = 0

    // Group articles by number to handle duplicates
    const articleGroups = new Map<number, ParsedArticle[]>()
    
    for (const article of data.articles) {
      if (!articleGroups.has(article.article)) {
        articleGroups.set(article.article, [])
      }
      articleGroups.get(article.article)!.push(article)
    }

    console.log(`📊 Total de números de artículos únicos: ${articleGroups.size}`)
    console.log(`⚠️  Artículos duplicados: ${data.articles.length - articleGroups.size}\n`)

    // Process each article group
    for (const [articleNumber, articles] of articleGroups) {
      // If there are duplicates, combine their content
      let combinedText = ''
      let title = articles[0].title

      if (articles.length > 1) {
        // Multiple versions of the same article (reforms, interpretations, etc.)
        combinedText = articles.map((art, idx) => {
          if (idx === 0) return art.text
          return `\n\n--- VERSIÓN/REFORMA ${idx + 1} ---\n\n${art.text}`
        }).join('')
      } else {
        combinedText = articles[0].text
      }

      // Create the article
      await prisma.article.create({
        data: {
          legalCodeId: legalCodeId,
          number: articleNumber.toString(),
          title: title,
          content: combinedText
        }
      })

      loaded++

      // Progress indicator
      if (loaded % BATCH_SIZE === 0) {
        console.log(`   ✓ ${loaded} artículos cargados...`)
      }
    }

    console.log(`\n✅ Total cargado: ${loaded} artículos`)
    console.log(`\n📊 Resumen:`)
    console.log(`   - Código: ${data.name}`)
    console.log(`   - Ley: ${data.law_number}`)
    console.log(`   - Artículos únicos: ${loaded}`)
    console.log(`   - Categoría: LABORAL`)
    console.log(`\n🎉 ¡Código de Trabajo cargado exitosamente!`)

  } catch (error: any) {
    console.error('\n❌ Error:', error.message)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
