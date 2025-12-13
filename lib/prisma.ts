// Prisma Client - configured for Neon Database
import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

declare global {
  var prisma: PrismaClient | undefined
}

let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Production: Use Neon adapter
  const connectionString = process.env.DATABASE_URL!
  const adapter = new PrismaNeon({ connectionString })
  prisma = new PrismaClient({ adapter })
} else {
  // Development: Use standard client with caching
  if (!global.prisma) {
    const connectionString = process.env.DATABASE_URL!
    const adapter = new PrismaNeon({ connectionString })
    global.prisma = new PrismaClient({ adapter })
  }
  prisma = global.prisma
}

export { prisma }
