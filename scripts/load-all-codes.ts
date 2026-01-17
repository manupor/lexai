/**
 * Load ALL legal codes into database
 * - Código Civil
 * - Código de Comercio
 * - Código de Trabajo
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { readFileSync } from 'fs'
import { join } from 'path'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

interface LegalCodeData {
  name: string
  law_number: string
  total_articles: number
  articles: Array<{
    law: string
    article?: number
    number?: number
    title?: string
    text?: string
    content?: string
  }>
}

const CODES_TO_LOAD = [
  {
    file: 'codigo-civil.json',
    code: 'codigo-civil',
    category: 'CIVIL' as const,
  },
  {
    file: 'codigo-comercio.json',
    code: 'codigo-comercio',
    category: 'COMERCIAL' as const,
  },
  {
    file: 'codigo-trabajo.json',
    code: 'codigo-trabajo',
    category: 'LABORAL' as const,
  },
]

async function loadAllCodes() {
  console.log('🚀 Cargando todos los códigos legales...\n')

  for (const codeConfig of CODES_TO_LOAD) {
    try {
      const filePath = join(process.cwd(), 'data', 'processed', codeConfig.file)
      console.log(`📖 Leyendo ${codeConfig.file}...`)

      const fileContent = readFileSync(filePath, 'utf-8')
      const data: LegalCodeData = JSON.parse(fileContent)

      console.log(`   Nombre: ${data.name}`)
      console.log(`   Ley: ${data.law_number}`)
      console.log(`   Artículos: ${data.total_articles}`)

      // Check if code already exists
      const existingCode = await prisma.legalCode.findUnique({
        where: { code: codeConfig.code },
      })

      let legalCode

      if (existingCode) {
        console.log(`   ⚠️  Código ya existe, actualizando...`)
        
        // Delete old articles
        await prisma.article.deleteMany({
          where: { legalCodeId: existingCode.id },
        })

        // Update code
        legalCode = await prisma.legalCode.update({
          where: { id: existingCode.id },
          data: {
            title: data.name,
            category: codeConfig.category,
            content: `${data.name} - ${data.law_number}`,
            lastUpdated: new Date(),
          },
        })
      } else {
        console.log(`   ✨ Creando nuevo código...`)
        
        legalCode = await prisma.legalCode.create({
          data: {
            code: codeConfig.code,
            title: data.name,
            category: codeConfig.category,
            content: `${data.name} - ${data.law_number}`,
            lastUpdated: new Date(),
          },
        })
      }

      // Load articles
      console.log(`   📝 Cargando ${data.articles.length} artículos...`)
      let loaded = 0

      const articlesToCreate = data.articles
        .map((article) => {
          const articleNumber = String(article.article || article.number || 0)
          const articleContent = article.text || article.content || ''
          
          if (!articleContent) return null
          
          return {
            legalCodeId: legalCode.id,
            number: articleNumber,
            title: article.title || `Artículo ${articleNumber}`,
            content: articleContent,
          }
        })
        .filter((a): a is NonNullable<typeof a> => a !== null)

      if (articlesToCreate.length > 0) {
        await prisma.article.createMany({
          data: articlesToCreate,
        })
        loaded = articlesToCreate.length
      }

      console.log(`   ✅ ${loaded} artículos cargados exitosamente\n`)
    } catch (error) {
      console.error(`   ❌ Error cargando ${codeConfig.file}:`, error)
      console.log()
    }
  }

  // Verify
  console.log('🔍 Verificación final:\n')
  const codes = await prisma.legalCode.findMany({
    select: {
      code: true,
      title: true,
      _count: { select: { articles: true } },
    },
    orderBy: { code: 'asc' },
  })

  codes.forEach((code) => {
    console.log(`✅ ${code.title}`)
    console.log(`   Code: ${code.code}`)
    console.log(`   Artículos: ${code._count.articles}\n`)
  })

  console.log('✅ Carga completada exitosamente')
}

loadAllCodes()
  .catch((error) => {
    console.error('❌ Error fatal:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
