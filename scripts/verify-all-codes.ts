/**
 * Verify all legal codes in database
 */

import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function verifyAllCodes() {
  try {
    console.log('🔍 Verificando códigos en la base de datos...\n')

    const codes = await prisma.legalCode.findMany({
      select: {
        code: true,
        title: true,
        category: true,
        _count: {
          select: { articles: true },
        },
      },
      orderBy: { code: 'asc' },
    })

    if (codes.length === 0) {
      console.log('⚠️  No hay códigos en la base de datos\n')
      console.log('Ejecuta: npm run db:seed')
      process.exit(1)
    }

    console.log(`✅ Total de códigos: ${codes.length}\n`)

    codes.forEach((code) => {
      console.log(`📚 ${code.title}`)
      console.log(`   Code: ${code.code}`)
      console.log(`   Categoría: ${code.category}`)
      console.log(`   Artículos: ${code._count.articles}`)
      console.log()
    })

    // Verificar artículos específicos
    console.log('🔎 Verificando artículos de ejemplo:\n')

    const testArticles = [
      { code: 'codigo-civil', number: '1' },
      { code: 'codigo-comercio', number: '1' },
      { code: 'codigo-trabajo', number: '45' },
    ]

    for (const test of testArticles) {
      const article = await prisma.article.findFirst({
        where: {
          legalCode: { code: test.code },
          number: test.number,
        },
        include: { legalCode: true },
      })

      if (article) {
        console.log(`✅ ${article.legalCode.title} - Artículo ${article.number}`)
        console.log(`   Contenido: ${article.content.substring(0, 100)}...`)
      } else {
        console.log(`❌ ${test.code} - Artículo ${test.number} NO ENCONTRADO`)
      }
      console.log()
    }

    console.log('✅ Verificación completada')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

verifyAllCodes()
