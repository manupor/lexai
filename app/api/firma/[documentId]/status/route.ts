import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const doc = await prisma.documentEditor.findFirst({
      where: { id: params.documentId, userId: session.user.id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const firmaRequests = await prisma.firmaRequest.findMany({
      where: { documentId: params.documentId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(firmaRequests)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { documentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { firmanteEmail } = await request.json()

    const firmaRequest = await prisma.firmaRequest.findFirst({
      where: { documentId: params.documentId, estado: 'pendiente' },
      orderBy: { createdAt: 'desc' },
    })

    if (!firmaRequest || !firmaRequest.signatureRequestId) {
      return NextResponse.json({ error: 'No hay solicitud de firma activa' }, { status: 404 })
    }

    const DROPBOX_SIGN_API_KEY = process.env.DROPBOX_SIGN_API_KEY
    if (!DROPBOX_SIGN_API_KEY) {
      return NextResponse.json({ error: 'API key no configurada' }, { status: 500 })
    }

    const firmantes = firmaRequest.firmantes as { nombre: string; email: string }[]
    const firmante = firmantes.find(f => f.email === firmanteEmail)

    if (!firmante) {
      return NextResponse.json({ error: 'Firmante no encontrado' }, { status: 404 })
    }

    const response = await fetch(
      `https://api.hellosign.com/v3/signature_request/remind/${firmaRequest.signatureRequestId}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${DROPBOX_SIGN_API_KEY}:`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email_address: firmanteEmail }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: `Error Dropbox Sign: ${response.status}` }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
