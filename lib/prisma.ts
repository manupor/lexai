// Prisma Client - lazy loaded to allow build without DATABASE_URL
let prisma: any

try {
  const { PrismaClient } = require('@prisma/client')
  const { PrismaNeon } = require('@prisma/adapter-neon')
  const { Pool } = require('@neondatabase/serverless')
  
  const globalForPrisma = globalThis as unknown as {
    prisma: any | undefined
  }

  if (!globalForPrisma.prisma) {
    // Check if DATABASE_URL is available
    if (process.env.DATABASE_URL) {
      try {
        // Use Neon adapter for production
        const connectionString = process.env.DATABASE_URL
        const adapter = new PrismaNeon({ connectionString })
        globalForPrisma.prisma = new PrismaClient({ 
          adapter,
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        })
        console.log('✅ Prisma Client initialized with Neon adapter')
      } catch (adapterError) {
        console.error('Failed to initialize Neon adapter, using standard client:', adapterError)
        // Fallback to standard client
        globalForPrisma.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
        })
      }
    } else {
      console.warn('DATABASE_URL not set, Prisma features will not work')
      globalForPrisma.prisma = null
    }
  }

  prisma = globalForPrisma.prisma
} catch (error) {
  // Prisma Client not generated - will fail at runtime if database is needed
  console.warn('Prisma Client not available - database features will not work')
  prisma = null
}

export { prisma }
