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
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const versions = await prisma.documentVersion.findMany({
      where: { documentId: params.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(versions)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
