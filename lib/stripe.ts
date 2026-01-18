import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

export const stripe = new Stripe(stripeSecretKey || '', {
    apiVersion: '2025-12-15.clover',
    typescript: true,
})

// Función de utilidad para verificar Stripe antes de usarlo
export function validateStripeConfig() {
    if (!stripeSecretKey) {
        throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
}

