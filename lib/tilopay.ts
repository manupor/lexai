import crypto from 'crypto'

export interface TilopayConfig {
    apiKey: string
    apiPassword: string
    apiSecret: string
    terminalId: string
    baseUrl: string
}

const config: TilopayConfig = {
    apiKey: process.env.TILOPAY_API_KEY || '',
    apiPassword: process.env.TILOPAY_API_PASSWORD || '',
    apiSecret: process.env.TILOPAY_API_SECRET || '',
    terminalId: process.env.TILOPAY_TERMINAL_ID || '',
    baseUrl: process.env.TILOPAY_BASE_URL || 'https://app.tilopay.me/api/v1', // Default to sandbox
}

/**
 * Generates the Tilopay Signature (Hash)
 * Tilopay hashes vary by endpoint, but common one is: 
 * SHA256(api_key + amount + currency + order_id + api_secret)
 */
export function generateTilopayHash(data: { amount: string, currency: string, orderId: string }): string {
    const rawString = `${config.apiKey}${data.amount}${data.currency}${data.orderId}${config.apiSecret}`
    return crypto.createHash('sha256').update(rawString).digest('hex')
}

/**
 * Create a Tilopay Checkout Session (Redirect flow)
 */
export async function createTilopayPayment(data: {
    amount: number,
    currency: 'CRC' | 'USD',
    orderId: string,
    description: string,
    customerName: string,
    customerEmail: string,
    redirectUrl: string
}) {
    const amountStr = data.amount.toFixed(2)
    const hash = generateTilopayHash({ amount: amountStr, currency: data.currency, orderId: data.orderId })

    // Tilopay logic for "Payment with Redirect"
    // Usually this is a form submission or a redirect to a specific URL with params
    // But we can also use their API to get a payment link if supported

    const payload = {
        api_key: config.apiKey,
        terminal_id: config.terminalId,
        amount: amountStr,
        currency: data.currency,
        order_id: data.orderId,
        description: data.description,
        customer_name: data.customerName,
        customer_email: data.customerEmail,
        redirect_url: data.redirectUrl,
        hash: hash
    }

    // Note: Tilopay integration often involves a direct POST from terminal to their URL
    // but we can generate the data here for the frontend to handle or proxy it.
    return payload
}

/**
 * Verify Tilopay Response Signature (Webhook/Callback)
 */
export function verifyTilopaySignature(orderId: string, amount: string, status: string, serverHash: string): boolean {
    // Verification logic depends on Tilopay's specific callback signature format
    const expectedHash = crypto
        .createHash('sha256')
        .update(`${orderId}${amount}${status}${config.apiSecret}`)
        .digest('hex')

    return expectedHash === serverHash
}
