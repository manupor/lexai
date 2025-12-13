#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔍 Verificando artículos del Código de Trabajo...\n')
  
  // Buscar el Código de Trabajo
  const codigoTrabajo = await prisma.legalCode.findUnique({
    where: { code: 'CT' },
    include: {
      articles: {
        where: {
          number: {
            in: ['45', '136', '1', '162']
          }
        },
        orderBy: { number: 'asc' }
      }
    }
  })
  
  if (!codigoTrabajo) {
    console.log('❌ Código de Trabajo no encontrado en la BD')
    return
  }
  
  console.log(`✅ Código: ${codigoTrabajo.title}`)
  console.log(`📊 Total de artículos en BD: ${await prisma.article.count({ where: { legalCodeId: codigoTrabajo.id } })}`)
  console.log('\n📋 Artículos específicos:\n')
  
  for (const article of codigoTrabajo.articles) {
    console.log(`\n--- Artículo ${article.number} ---`)
    console.log(`Título: ${article.title}`)
    console.log(`Contenido (primeros 200 chars): ${article.content.substring(0, 200)}...`)
  }
  
  // Buscar artículo 45 específicamente
  const art45 = await prisma.article.findFirst({
    where: {
      legalCodeId: codigoTrabajo.id,
      number: '45'
    }
  })
  
  console.log('\n\n🎯 Artículo 45:')
  if (art45) {
    console.log('✅ ENCONTRADO')
    console.log(`Contenido completo:\n${art45.content}`)
  } else {
    console.log('❌ NO ENCONTRADO')
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
