#!/usr/bin/env tsx
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL!
const adapter = new PrismaNeon({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🔧 Agregando artículos faltantes del Código de Trabajo...\n')
  
  // Buscar el Código de Trabajo
  const codigoTrabajo = await prisma.legalCode.findUnique({
    where: { code: 'CT' }
  })
  
  if (!codigoTrabajo) {
    console.log('❌ Código de Trabajo no encontrado')
    return
  }
  
  // Artículos faltantes importantes
  const missingArticles = [
    {
      number: '45',
      title: 'Artículo 45',
      content: 'Es entendido que las restricciones contempladas en los cuatro artículos anteriores no rigen para los profesionales titulados ni para aquellos técnicos cuyo trabajo requiera conocimientos muy calificados.'
    },
    {
      number: '136',
      title: 'Artículo 136 - Jornada Ordinaria de Trabajo',
      content: 'La jornada ordinaria de trabajo efectivo no podrá ser mayor de ocho horas en el día, de seis en la noche y de cuarenta y ocho horas por semana.\n\nSin embargo, en los trabajos que por su propia condición no sean insalubres o peligrosos, podrá estipularse una jornada ordinaria diurna hasta de diez horas y una jornada mixta hasta de ocho horas, siempre que el trabajo semanal no exceda de las cuarenta y ocho horas.\n\nLas partes podrán contratar libremente las horas destinadas a descanso y comidas, atendiendo a la naturaleza del trabajo y a las disposiciones legales.'
    }
  ]
  
  for (const article of missingArticles) {
    // Verificar si ya existe
    const existing = await prisma.article.findFirst({
      where: {
        legalCodeId: codigoTrabajo.id,
        number: article.number
      }
    })
    
    if (existing) {
      console.log(`⚠️  Artículo ${article.number} ya existe, actualizando...`)
      await prisma.article.update({
        where: { id: existing.id },
        data: {
          title: article.title,
          content: article.content
        }
      })
      console.log(`✅ Artículo ${article.number} actualizado`)
    } else {
      console.log(`➕ Agregando artículo ${article.number}...`)
      await prisma.article.create({
        data: {
          legalCodeId: codigoTrabajo.id,
          number: article.number,
          title: article.title,
          content: article.content
        }
      })
      console.log(`✅ Artículo ${article.number} agregado`)
    }
  }
  
  console.log('\n🎉 Artículos faltantes agregados/actualizados exitosamente!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
