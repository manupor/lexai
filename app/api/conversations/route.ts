import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// GET - Listar conversaciones del usuario
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Obtener conversaciones del usuario
    const conversations = await prisma.conversation.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50, // Limitar a las últimas 50 conversaciones
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error al obtener conversaciones:', error)
    return NextResponse.json(
      { error: 'Error al obtener conversaciones' },
      { status: 500 }
    )
  }
}
