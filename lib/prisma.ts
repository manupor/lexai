// Prisma Client - Lazy initialization for build-time compatibility
import type { PrismaClient } from '@prisma/client'

declare global {
  var __prismaClient: PrismaClient | undefined
}

let cachedClient: PrismaClient | undefined

function initPrisma(): PrismaClient {
  if (cachedClient) return cachedClient
  if (global.__prismaClient) return global.__prismaClient

  // Dynamic imports to avoid build-time execution
  const { PrismaClient } = require('@prisma/client')
  const { PrismaNeon } = require('@prisma/adapter-neon')

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const adapter = new PrismaNeon({ 
    connectionString: process.env.DATABASE_URL 
  })
  
  const client = new PrismaClient({ adapter })

  if (process.env.NODE_ENV !== 'production') {
    global.__prismaClient = client
  }

  cachedClient = client
  return client
}

// Proxy-based lazy initialization
export const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = initPrisma()
    const value = (client as any)[prop]
    return typeof value === 'function' ? value.bind(client) : value
  }
})
