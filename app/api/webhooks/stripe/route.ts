import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
        return NextResponse.json(
            { error: 'No signature' },
            { status: 400 }
        )
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error.message)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                await handleCheckoutCompleted(session)
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionUpdate(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await handleSubscriptionDeleted(subscription)
                break
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object as Stripe.Invoice
                await handleInvoicePaymentSucceeded(invoice)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object as Stripe.Invoice
                await handleInvoicePaymentFailed(invoice)
                break
            }

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error: any) {
        console.error('Error processing webhook:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId

    if (!userId) {
        console.error('No userId in session metadata')
        return
    }

    const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string
    )

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id)
    const tokens = getTokensForPlan(plan)

    await prisma.subscription.upsert({
        where: { userId },
        create: {
            userId,
            plan,
            status: 'ACTIVE',
            tokens,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
        update: {
            plan,
            status: 'ACTIVE',
            tokens,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: subscription.id,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
    })

    // Actualizar tokens del usuario
    await prisma.user.update({
        where: { id: userId },
        data: { tokens },
    })

    console.log(`Subscription created for user ${userId}`)
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
    })

    if (!dbSubscription) {
        console.error('Subscription not found in database')
        return
    }

    const plan = getPlanFromPriceId(subscription.items.data[0].price.id)
    const tokens = getTokensForPlan(plan)

    await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
            plan,
            status: subscription.status === 'active' ? 'ACTIVE' : 'CANCELED',
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
        },
    })

    console.log(`Subscription updated: ${subscription.id}`)
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id },
    })

    if (!dbSubscription) {
        console.error('Subscription not found in database')
        return
    }

    await prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: {
            status: 'CANCELED',
            plan: 'FREE',
            tokens: 100,
        },
    })

    // Resetear tokens del usuario a FREE
    await prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { tokens: 100 },
    })

    console.log(`Subscription deleted: ${subscription.id}`)
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    const subscriptionId = (invoice as any).subscription as string | undefined

    const subscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscriptionId },
    })

    if (!subscription) {
        console.error('Subscription not found for invoice')
        return
    }

    // Renovar tokens
    const tokens = getTokensForPlan(subscription.plan)

    await prisma.user.update({
        where: { id: subscription.userId },
        data: { tokens },
    })

    console.log(`Tokens renewed for subscription: ${subscription.id}`)
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice: ${invoice.id}`)
    // Aquí podrías enviar un email al usuario notificando el fallo
}

function getPlanFromPriceId(priceId: string): 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' {
    const priceMap: Record<string, 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'> = {
        [process.env.STRIPE_PRICE_BASIC || '']: 'BASIC',
        [process.env.STRIPE_PRICE_PROFESSIONAL || '']: 'PROFESSIONAL',
        [process.env.STRIPE_PRICE_ENTERPRISE || '']: 'ENTERPRISE',
    }

    return priceMap[priceId] || 'FREE'
}

function getTokensForPlan(plan: string): number {
    const tokenMap: Record<string, number> = {
        FREE: 100,
        BASIC: 1000,
        PROFESSIONAL: 5000,
        ENTERPRISE: 25000,
    }

    return tokenMap[plan] || 100
}
