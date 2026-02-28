import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; versionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const doc = await prisma.documentEditor.findFirst({
      where: { id: params.id, userId: session.user.id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const version = await prisma.documentVersion.findFirst({
      where: { id: params.versionId, documentId: params.id },
    })

    if (!version) {
      return NextResponse.json({ error: 'Versión no encontrada' }, { status: 404 })
    }

    const versionCount = await prisma.documentVersion.count({ where: { documentId: params.id } })
    if (versionCount >= 10) {
      const oldest = await prisma.documentVersion.findFirst({
        where: { documentId: params.id },
        orderBy: { createdAt: 'asc' },
      })
      if (oldest) await prisma.documentVersion.delete({ where: { id: oldest.id } })
    }

    await prisma.documentVersion.create({
      data: { documentId: params.id, contenidoHtml: doc.contenidoHtml },
    })

    const updated = await prisma.documentEditor.update({
      where: { id: params.id },
      data: { contenidoHtml: version.contenidoHtml },
    })

    return NextResponse.json(updated)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
