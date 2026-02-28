import { prisma } from '@/lib/prisma'

// Token limits por plan (ahora por FIRMA)
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

/**
 * Obtiene los tokens disponibles para la firma a la que pertenece el usuario
 */
export async function getUserTokens(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          }
        },
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Si pertenece a una organización, usar sus tokens
    if (user.organization?.subscription) {
      const sub = user.organization.subscription
      return {
        tokensAvailable: sub.tokens,
        plan: sub.plan,
        isSubscribed: sub.plan !== 'FREE',
        organizationId: user.organizationId
      }
    }

    // Fallback para usuarios sin organización (legacy o nuevos)
    return {
      tokensAvailable: user.tokens,
      plan: 'FREE' as const,
      isSubscribed: false,
      organizationId: null
    }
  } catch (error) {
    console.error('Error getting user tokens:', error)
    throw error
  }
}

/**
 * Deduce tokens del balance de la firma
 */
export async function deductTokens(userId: string, tokensUsed: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: true
          }
        }
      },
    })

    if (!user) {
      throw new Error('Usuario no encontrado')
    }

    // Si tiene organización y suscripción, descontar de ahí
    if (user.organization?.subscription) {
      await prisma.subscription.update({
        where: { id: user.organization.subscription.id },
        data: {
          tokens: { decrement: tokensUsed }
        }
      })
    } else {
      // Descontar de tokens individuales (legacy/free)
      await prisma.user.update({
        where: { id: userId },
        data: {
          tokens: { decrement: tokensUsed }
        }
      })
    }

    return true
  } catch (error) {
    console.error('Error deducting tokens:', error)
    throw error
  }
}

/**
 * Verifica si la firma tiene tokens suficientes
 */
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
          : 'Has agotado los tokens de tu firma. Por favor renueva tu suscripción.',
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

/**
 * Verifica límites de conversaciones (ahora por organización si aplica)
 */
export async function checkConversationLimit(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: {
          include: {
            subscription: true,
          }
        }
      },
    })

    if (!user) throw new Error('Usuario no encontrado')

    const plan = (user.organization?.subscription?.plan || 'FREE') as keyof typeof CONVERSATION_LIMITS
    const limit = CONVERSATION_LIMITS[plan]

    // Contar conversaciones del usuario (o de la organización si quisiéramos límite global)
    // Por ahora mantenemos límite por usuario para no castigar a equipos grandes en FREE
    const currentCount = await prisma.conversation.count({
      where: { userId: userId }
    })

    if (limit === -1) return { allowed: true, currentCount, limit, plan }

    if (currentCount >= limit) {
      return {
        allowed: false,
        currentCount,
        limit,
        plan,
        message: 'Límite de conversaciones alcanzado para este plan.',
      }
    }

    return { allowed: true, currentCount, limit, plan }
  } catch (error) {
    console.error('Error checking conversation limit:', error)
    throw error
  }
}

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
