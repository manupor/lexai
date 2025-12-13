import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...')

  // Limpiar datos existentes
  await prisma.article.deleteMany()
  await prisma.legalCode.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.document.deleteMany()
  await prisma.subscription.deleteMany()
  await prisma.user.deleteMany()

  // Crear usuarios de ejemplo
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user1 = await prisma.user.create({
    data: {
      email: 'abogado@example.com',
      name: 'Juan Pérez',
      password: hashedPassword,
      role: 'LAWYER',
      tokens: 5000,
    },
  })

  const user2 = await prisma.user.create({
    data: {
      email: 'cliente@example.com',
      name: 'María González',
      password: hashedPassword,
      role: 'CLIENT',
      tokens: 100,
    },
  })

  console.log('✅ Usuarios creados')

  // Crear suscripciones
  await prisma.subscription.create({
    data: {
      userId: user1.id,
      plan: 'PROFESSIONAL',
      status: 'ACTIVE',
      tokens: 5000,
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  await prisma.subscription.create({
    data: {
      userId: user2.id,
      plan: 'FREE',
      status: 'ACTIVE',
      tokens: 100,
    },
  })

  console.log('✅ Suscripciones creadas')

  // Crear códigos legales de ejemplo
  const codigoCivil = await prisma.legalCode.create({
    data: {
      code: 'CC',
      title: 'Código Civil de Costa Rica',
      category: 'CIVIL',
      content: 'El Código Civil regula las relaciones jurídicas entre particulares...',
      lastUpdated: new Date(),
    },
  })

  const codigoTrabajo = await prisma.legalCode.create({
    data: {
      code: 'CT',
      title: 'Código de Trabajo de Costa Rica',
      category: 'LABORAL',
      content: 'El Código de Trabajo regula las relaciones laborales...',
      lastUpdated: new Date(),
    },
  })

  const codigoPenal = await prisma.legalCode.create({
    data: {
      code: 'CP',
      title: 'Código Penal de Costa Rica',
      category: 'PENAL',
      content: 'El Código Penal establece los delitos y las penas...',
      lastUpdated: new Date(),
    },
  })

  console.log('✅ Códigos legales creados')

  // Crear artículos de ejemplo
  await prisma.article.createMany({
    data: [
      {
        legalCodeId: codigoCivil.id,
        number: '1',
        title: 'Capacidad jurídica',
        content: 'Toda persona es capaz de derechos y obligaciones...',
      },
      {
        legalCodeId: codigoCivil.id,
        number: '2',
        title: 'Mayoría de edad',
        content: 'La mayoría de edad se adquiere a los dieciocho años cumplidos...',
      },
      {
        legalCodeId: codigoTrabajo.id,
        number: '45',
        title: 'Jornada de trabajo',
        content: 'La jornada ordinaria de trabajo no podrá exceder de ocho horas en el día...',
      },
      {
        legalCodeId: codigoTrabajo.id,
        number: '162',
        title: 'Causas justas de despido',
        content: 'Son causas justas que facultan al patrono para dar por terminado el contrato de trabajo...',
      },
      {
        legalCodeId: codigoPenal.id,
        number: '111',
        title: 'Homicidio simple',
        content: 'Será reprimido con prisión de doce a veinticinco años, quien matare a otro...',
      },
    ],
  })

  console.log('✅ Artículos creados')

  // Crear conversación de ejemplo
  const conversation = await prisma.conversation.create({
    data: {
      userId: user2.id,
      title: 'Consulta sobre divorcio',
    },
  })

  await prisma.message.createMany({
    data: [
      {
        conversationId: conversation.id,
        role: 'USER',
        content: '¿Cuáles son los requisitos para un divorcio en Costa Rica?',
        tokensUsed: 15,
      },
      {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: 'En Costa Rica, el divorcio puede tramitarse de dos formas principales...',
        tokensUsed: 250,
      },
    ],
  })

  console.log('✅ Conversaciones creadas')

  // Crear documentos de ejemplo
  await prisma.document.create({
    data: {
      userId: user1.id,
      title: 'Contrato de Arrendamiento',
      content: 'CONTRATO DE ARRENDAMIENTO...',
      type: 'CONTRACT',
      analysis: 'El contrato presenta las cláusulas estándar...',
      tokensUsed: 150,
    },
  })

  console.log('✅ Documentos creados')

  console.log('🎉 Seed completado exitosamente!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
