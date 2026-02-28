import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyTilopaySignature } from '@/lib/tilopay'

/**
 * Tilopay Redirect Callback
 * Tilopay sends the user back with params like: order_id, amount, status, hash
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const orderId = searchParams.get('order_id')
    const amount = searchParams.get('amount')
    const status = searchParams.get('status')
    const hash = searchParams.get('hash')

    if (!orderId || !status || !hash) {
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?billing=error`)
    }

    // Verify the signature from Tilopay to ensure authenticity
    const isValid = verifyTilopaySignature(orderId, amount || '0', status, hash)
    if (!isValid) {
        console.error('❌ Fraude detectado o firma inválida de Tilopay')
        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?billing=fraud`)
    }

    // Extract Organization ID from Order ID (we used ORG_{id}_{timestamp})
    const orgId = orderId.split('_')[1]

    if (status === '1' || status === 'success') { // Tilopay status '1' usually means success
        await prisma.subscription.upsert({
            where: { organizationId: orgId },
            update: {
                status: 'ACTIVE',
                plan: 'PROFESSIONAL',
                gateway: 'TILOPAY',
                gatewaySubscriptionId: orderId, // Replaced by transaction ID
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
                tokens: { increment: 5000 }
            },
            create: {
                organizationId: orgId,
                status: 'ACTIVE',
                plan: 'PROFESSIONAL',
                gateway: 'TILOPAY',
                gatewaySubscriptionId: orderId,
                currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                tokens: 5000
            }
        })

        return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?billing=success`)
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard?billing=failed`)
}

// Support for POST webhooks if Tilopay sends asynchronus confirmation
export async function POST(req: NextRequest) {
    // Logic very similar to GET but reading from body
    return NextResponse.json({ received: true })
}
