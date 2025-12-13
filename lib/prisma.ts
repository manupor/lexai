// Prisma Client - configured for Neon Database
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

try {
  if (process.env.NODE_ENV === 'production') {
    // Production: Use Neon adapter
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not defined')
    }
    const connectionString = process.env.DATABASE_URL
    const adapter = new PrismaNeon({ connectionString })
    prisma = new PrismaClient({ adapter })
  } else {
    // Development: Use standard client with caching
    if (!global.prisma) {
      if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is not defined')
      }
      const connectionString = process.env.DATABASE_URL
      const adapter = new PrismaNeon({ connectionString })
      global.prisma = new PrismaClient({ adapter })
    }
    prisma = global.prisma
  }
} catch (error) {
  console.error('Failed to initialize Prisma:', error)
  // Create a dummy client that will fail gracefully
  prisma = new PrismaClient()
}

export { prisma }
