import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const doc = await prisma.documentEditor.findFirst({
      where: { id: params.id, userId: session.user.id },
      include: {
        firmaRequests: { orderBy: { createdAt: 'desc' } },
        versions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    return NextResponse.json(doc)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const body = await request.json()
    const { titulo, contenidoHtml, tipo, estado, createVersion } = body

    const existing = await prisma.documentEditor.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    if (createVersion && existing.contenidoHtml) {
      const versionCount = await prisma.documentVersion.count({
        where: { documentId: params.id },
      })

      if (versionCount >= 10) {
        const oldest = await prisma.documentVersion.findFirst({
          where: { documentId: params.id },
          orderBy: { createdAt: 'asc' },
        })
        if (oldest) await prisma.documentVersion.delete({ where: { id: oldest.id } })
      }

      await prisma.documentVersion.create({
        data: {
          documentId: params.id,
          contenidoHtml: existing.contenidoHtml,
        },
      })
    }

    const updated = await prisma.documentEditor.update({
      where: { id: params.id },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(contenidoHtml !== undefined && { contenidoHtml }),
        ...(tipo !== undefined && { tipo }),
        ...(estado !== undefined && { estado }),
      },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const existing = await prisma.documentEditor.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    await prisma.documentEditor.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
