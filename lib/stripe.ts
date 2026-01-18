import Stripe from 'stripe'

// Durante el build o evaluación, Stripe requiere una llave que empiece por sk_ o pk_.
// Usamos un placeholder para evitar que falle la inicialización del cliente.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_build_placeholder'

export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
})

// Función de utilidad para verificar Stripe antes de usarlo en runtime
export function validateStripeConfig() {
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is not defined in environment variables')
    }
}


