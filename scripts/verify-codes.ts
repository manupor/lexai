#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔍 Verificando códigos en la base de datos...\n')
  
  const codes = await prisma.legalCode.findMany({
    select: {
      code: true,
      title: true,
      _count: {
        select: { articles: true }
      }
    }
  })
  
  console.log('📚 Códigos legales en la BD:\n')
  for (const code of codes) {
    console.log(`Código: "${code.code}"`)
    console.log(`Título: ${code.title}`)
    console.log(`Artículos: ${code._count.articles}`)
    console.log('---')
  }
  
  // Buscar artículo 45 en todos los códigos
  console.log('\n🎯 Buscando artículo 45 en todos los códigos...\n')
  
  const article45 = await prisma.article.findMany({
    where: { number: '45' },
    include: { legalCode: true }
  })
  
  if (article45.length === 0) {
    console.log('❌ Artículo 45 NO encontrado en ningún código')
  } else {
    for (const art of article45) {
      console.log(`✅ Artículo 45 encontrado en: ${art.legalCode.title}`)
      console.log(`   Código: "${art.legalCode.code}"`)
      console.log(`   Contenido: ${art.content.substring(0, 100)}...`)
      console.log('---')
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
