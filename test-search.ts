#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function testSearch() {
  console.log('🔍 Testing search function...\n')

  // Test the exact same logic as in chat/route.ts
  const CODE_MAP: Record<string, string> = {
    'codigo-civil': 'codigo-civil',
    'codigo-comercio': 'codigo-comercio',
    'codigo-trabajo': 'codigo-trabajo',
    'codigo-procesal-penal': 'codigo-procesal-penal',
    'codigo-penal': 'codigo-penal'
  }

  const codeName = 'codigo-procesal-penal'
  const articleNumber = '12'

  const codeId = CODE_MAP[codeName]
  console.log(`Code ID for ${codeName}: ${codeId}`)

  const article = await prisma.article.findFirst({
    where: {
      legalCode: { code: codeId },
      number: articleNumber
    }
  })

  if (article) {
    console.log('✅ Article found!')
    console.log('Number:', article.number)
    console.log('Content:', article.content.substring(0, 100))
  } else {
    console.log('❌ Article NOT found')

    // Debug: Check what's in the database
    const allCodes = await prisma.legalCode.findMany()
    console.log('\nAll codes in DB:', allCodes.map(c => c.code))

    const ctArticles = await prisma.article.findMany({
      where: { legalCode: { code: 'CT' } },
      take: 5
    })
    console.log('\nFirst 5 CT articles:', ctArticles.map(a => a.number))
  }
}

testSearch()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
