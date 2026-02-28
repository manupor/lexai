import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get('tipo')
    const estado = searchParams.get('estado')
    const search = searchParams.get('search')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where: any = { userId: session.user.id }
    if (tipo) where.tipo = tipo
    if (estado) where.estado = estado
    if (search) where.titulo = { contains: search, mode: 'insensitive' }
    if (desde || hasta) {
      where.updatedAt = {}
      if (desde) where.updatedAt.gte = new Date(desde)
      if (hasta) where.updatedAt.lte = new Date(hasta)
    }

    const documents = await prisma.documentEditor.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        firmaRequests: { orderBy: { createdAt: 'desc' }, take: 1 },
        user: { select: { name: true, email: true } },
      },
    })

    return NextResponse.json(documents)
  } catch (error: any) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { titulo, contenidoHtml = '', tipo = 'otro', estado = 'borrador' } = body

    if (!titulo) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    const doc = await prisma.documentEditor.create({
      data: {
        userId: session.user.id,
        titulo,
        contenidoHtml,
        tipo,
        estado,
      },
    })

    return NextResponse.json(doc, { status: 201 })
  } catch (error: any) {
    console.error('Error creating document:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
