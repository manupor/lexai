import { UserRole, SubscriptionPlan, SubscriptionStatus } from '@prisma/client'
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: UserRole
      tokens: number
      subscription?: {
        id: string
        plan: SubscriptionPlan
        status: SubscriptionStatus
        tokens: number
        currentPeriodEnd?: Date | null
      } | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role: UserRole
    tokens: number
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: UserRole
  }
}
