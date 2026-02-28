import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createTilopayPayment } from '@/lib/tilopay'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user || !session.user.organizationId) {
            return NextResponse.json({ error: 'Debes pertenecer a una firma para suscribirte' }, { status: 401 })
        }

        const { planType } = await req.json() // 'PROFESSIONAL', etc

        const org = await prisma.organization.findUnique({
            where: { id: session.user.organizationId },
        })

        if (!org) {
            return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
        }

        const orderId = `ORG_${org.id}_${Date.now()}`
        const amount = planType === 'PROFESSIONAL' ? 49 : 0 // En USD o CRC según config

        // Prepare Tilopay Payment Data
        const tilopayData = await createTilopayPayment({
            amount: amount,
            currency: 'USD',
            orderId: orderId,
            description: `Plan LexAI ${planType} para ${org.name}`,
            customerName: session.user.name || 'Abogado LexAI',
            customerEmail: session.user.email || '',
            redirectUrl: `${process.env.NEXTAUTH_URL}/api/tilopay/webhook/callback`
        })

        // In a real Tilopay integration, you might need to send the user to a specific Tilopay URL
        // with these params as form data. For this example, we return the data so the frontend can redirect.
        return NextResponse.json({
            success: true,
            url: `https://app.tilopay.me/checkout?${new URLSearchParams(tilopayData as any).toString()}`
        })
    } catch (error: any) {
        console.error('Error in Tilopay Checkout:', error)
        return NextResponse.json({ error: 'Error al iniciar el pago con Tilopay' }, { status: 500 })
    }
}
