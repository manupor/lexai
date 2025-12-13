// Prisma Client - configured for Neon Database
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient | undefined

function getPrismaClient(): PrismaClient {
  if (prisma) return prisma

  // Only initialize if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }

  if (process.env.NODE_ENV === 'production') {
    // Production: Use Neon adapter
    const connectionString = process.env.DATABASE_URL
    const adapter = new PrismaNeon({ connectionString })
    prisma = new PrismaClient({ adapter })
  } else {
    // Development: Use standard client with caching
    if (!global.prisma) {
      const connectionString = process.env.DATABASE_URL
      const adapter = new PrismaNeon({ connectionString })
      global.prisma = new PrismaClient({ adapter })
    }
    prisma = global.prisma
  }

  return prisma
}

// Export a proxy that lazily initializes Prisma
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})
