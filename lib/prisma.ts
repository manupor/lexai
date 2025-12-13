// Prisma Client - lazy loaded to allow build without DATABASE_URL
let prisma: any

try {
  const { PrismaClient } = require('@prisma/client')
  
  const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
  }

  prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
} catch (error) {
  // Prisma Client not generated - will fail at runtime if database is needed
  console.warn('Prisma Client not available - database features will not work')
  prisma = null
}

export { prisma }
