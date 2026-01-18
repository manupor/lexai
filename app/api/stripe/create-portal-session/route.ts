import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { stripe } from '@/lib/stripe'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const { customerId } = await request.json()

        if (!customerId) {
            return NextResponse.json(
                { error: 'Customer ID requerido' },
                { status: 400 }
            )
        }

        // Crear sesión del portal de cliente
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${process.env.NEXTAUTH_URL}/dashboard/profile`,
        })

        return NextResponse.json({ url: portalSession.url })
    } catch (error: any) {
        console.error('Error creating portal session:', error)
        return NextResponse.json(
            { error: error.message || 'Error al crear sesión del portal' },
            { status: 500 }
        )
    }
}
