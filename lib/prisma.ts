// Prisma Client - configured for Neon Database
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

declare global {
  var cachedPrisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient | undefined

function getPrismaClient(): PrismaClient {
  if (prismaInstance) return prismaInstance

  // Only initialize if DATABASE_URL is available
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined')
  }

  if (process.env.NODE_ENV === 'production') {
    // Production: Use Neon adapter
    const connectionString = process.env.DATABASE_URL
    const adapter = new PrismaNeon({ connectionString })
    prismaInstance = new PrismaClient({ adapter })
  } else {
    // Development: Use standard client with caching
    if (!global.cachedPrisma) {
      const connectionString = process.env.DATABASE_URL
      const adapter = new PrismaNeon({ connectionString })
      global.cachedPrisma = new PrismaClient({ adapter })
    }
    prismaInstance = global.cachedPrisma
  }

  return prismaInstance
}

// Export a proxy that lazily initializes Prisma
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient()
    return (client as any)[prop]
  }
})
