import { prisma } from '@/lib/prisma'

// Token limits por plan
export const TOKEN_LIMITS = {
  FREE: 100,
  BASIC: 1000,
  PROFESSIONAL: 5000,
  ENTERPRISE: 25000,
}

// Límite de conversaciones por plan
export const CONVERSATION_LIMITS = {
  FREE: 5,
  BASIC: 50,
  PROFESSIONAL: -1, // ilimitado
  ENTERPRISE: -1, // ilimitado
}

export async function getUserTokens(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Si tiene suscripción activa, usar tokens de suscripción
    if (user.subscription && user.subscription.status === 'ACTIVE') {
      return {
        tokensAvailable: user.subscription.tokens,
        plan: user.subscription.plan,
        isSubscribed: true,
      }
    }

    // Usuario gratuito
    return {
      tokensAvailable: user.tokens,
      plan: 'FREE' as const,
      isSubscribed: false,
    }
  } catch (error) {
    console.error('Error getting user tokens:', error)
    throw error
  }
}

export async function deductTokens(userId: string, tokensUsed: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Si tiene suscripción activa, descontar de suscripción
    if (user.subscription && user.subscription.status === 'ACTIVE') {
      await prisma.subscription.update({
        where: { id: user.subscription.id },
        data: {
          tokens: Math.max(0, user.subscription.tokens - tokensUsed),
        },
      })
    } else {
      // Usuario gratuito, descontar de tokens de usuario
      await prisma.user.update({
        where: { id: userId },
        data: {
          tokens: Math.max(0, user.tokens - tokensUsed),
        },
      })
    }

    return true
  } catch (error) {
    console.error('Error deducting tokens:', error)
    throw error
  }
}

export async function checkTokenLimit(userId: string, tokensNeeded: number = 0) {
  try {
    const { tokensAvailable, plan } = await getUserTokens(userId)
    
    if (tokensAvailable < tokensNeeded) {
      return {
        allowed: false,
        tokensAvailable,
        plan,
        message: plan === 'FREE' 
          ? 'Has agotado tus tokens gratuitos. Suscríbete para continuar consultando.'
          : 'Has agotado tus tokens. Por favor renueva tu suscripción.',
      }
    }

    return {
      allowed: true,
      tokensAvailable,
      plan,
    }
  } catch (error) {
    console.error('Error checking token limit:', error)
    throw error
  }
}

export async function checkConversationLimit(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        conversations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    const plan = (user.subscription?.plan || 'FREE') as keyof typeof CONVERSATION_LIMITS
    const limit = CONVERSATION_LIMITS[plan]
    const currentCount = user.conversations.length

    // Si es ilimitado (-1), siempre permitir
    if (limit === -1) {
      return {
        allowed: true,
        currentCount,
        limit: -1,
        plan,
      }
    }

    // Verificar si ha alcanzado el límite
    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount,
        limit,
        plan,
        message: 'Has alcanzado el límite de conversaciones para el plan gratuito. Suscríbete para conversaciones ilimitadas.',
      }
    }

    return {
      allowed: true,
      currentCount,
      limit,
      plan,
    }
  } catch (error) {
    console.error('Error checking conversation limit:', error)
    throw error
  }
}

// Limpiar conversaciones antiguas si excede el límite (solo para FREE)
export async function cleanupOldConversations(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        conversations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) return

    const plan = (user.subscription?.plan || 'FREE') as keyof typeof CONVERSATION_LIMITS
    const limit = CONVERSATION_LIMITS[plan]

    // Solo limpiar para usuarios FREE
    if (plan !== 'FREE' || limit === -1) return

    const conversations = user.conversations
    if (conversations.length > limit) {
      // Eliminar las conversaciones más antiguas
      const toDelete = conversations.slice(limit)
      await prisma.conversation.deleteMany({
        where: {
          id: {
            in: toDelete.map((c: { id: string }) => c.id),
          },
        },
      })
    }
  } catch (error) {
    console.error('Error cleaning up conversations:', error)
  }
}

// Inicializar tokens para nuevo usuario
export async function initializeUserTokens(userId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        tokens: TOKEN_LIMITS.FREE,
      },
    })
  } catch (error) {
    console.error('Error initializing user tokens:', error)
  }
}
