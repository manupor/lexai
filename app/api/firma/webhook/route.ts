import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const data = JSON.parse(body)

    const eventType = data?.event?.event_type
    const signatureRequestId = data?.signature_request?.signature_request_id

    if (!signatureRequestId) {
      return NextResponse.json({ error: 'Missing signature_request_id' }, { status: 400 })
    }

    const firmaRequest = await prisma.firmaRequest.findFirst({
      where: { signatureRequestId },
    })

    if (!firmaRequest) {
      return NextResponse.json({ error: 'FirmaRequest not found' }, { status: 404 })
    }

    if (eventType === 'signature_request_signed' || eventType === 'signature_request_all_signed') {
      const pdfUrl = data?.signature_request?.files_url ?? null

      await prisma.firmaRequest.update({
        where: { id: firmaRequest.id },
        data: {
          estado: 'firmado',
          completadoAt: new Date(),
          pdfFirmadoUrl: pdfUrl,
        },
      })

      await prisma.documentEditor.update({
        where: { id: firmaRequest.documentId },
        data: { estado: 'firmado' },
      })
    } else if (eventType === 'signature_request_canceled') {
      await prisma.firmaRequest.update({
        where: { id: firmaRequest.id },
        data: { estado: 'cancelado' },
      })
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
