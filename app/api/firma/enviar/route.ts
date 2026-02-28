import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { documentoId, firmantes, pdfBase64 } = await request.json()

    const doc = await prisma.documentEditor.findFirst({
      where: { id: documentoId, userId: session.user.id },
    })

    if (!doc) {
      return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 })
    }

    const DROPBOX_SIGN_API_KEY = process.env.DROPBOX_SIGN_API_KEY
    if (!DROPBOX_SIGN_API_KEY) {
      return NextResponse.json({ error: 'DROPBOX_SIGN_API_KEY no configurada' }, { status: 500 })
    }

    const formData = new FormData()
    formData.append('title', doc.titulo)
    formData.append('subject', `Solicitud de firma: ${doc.titulo}`)
    formData.append('message', 'Por favor firme este documento legal generado por LexAI CR.')

    firmantes.forEach((firmante: { nombre: string; email: string }, idx: number) => {
      formData.append(`signers[${idx}][name]`, firmante.nombre)
      formData.append(`signers[${idx}][email_address]`, firmante.email)
      formData.append(`signers[${idx}][order]`, String(idx + 1))
    })

    if (pdfBase64) {
      const pdfBuffer = Buffer.from(pdfBase64, 'base64')
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      formData.append('files[0]', blob, `${doc.titulo}.pdf`)
    }

    const webhookUrl = process.env.NEXTAUTH_URL
      ? `${process.env.NEXTAUTH_URL}/api/firma/webhook`
      : null

    if (webhookUrl) {
      formData.append('metadata[callback_url]', webhookUrl)
    }

    const response = await fetch('https://api.hellosign.com/v3/signature_request/send', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${DROPBOX_SIGN_API_KEY}:`).toString('base64')}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Dropbox Sign error:', errBody)
      return NextResponse.json({ error: `Error de Dropbox Sign: ${response.status}` }, { status: 502 })
    }

    const result = await response.json()
    const signatureRequestId = result.signature_request?.signature_request_id

    const firmaRequest = await prisma.firmaRequest.create({
      data: {
        documentId: documentoId,
        signatureRequestId: signatureRequestId ?? null,
        firmantes: firmantes,
        estado: 'pendiente',
      },
    })

    await prisma.documentEditor.update({
      where: { id: documentoId },
      data: { estado: 'revision' },
    })

    return NextResponse.json({ firmaRequest, signatureRequestId })
  } catch (error: any) {
    console.error('Error enviando firma:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
