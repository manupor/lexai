# 🎯 Sistema de Tokens y Stripe - Plan de Implementación

## ✅ Completado

### 1. Token Management System
- ✅ Creado `lib/token-manager.ts` con todas las funciones necesarias
- ✅ Límites por plan definidos:
  - FREE: 100 tokens, 5 conversaciones
  - BASIC: 1,000 tokens, 50 conversaciones
  - PROFESSIONAL: 5,000 tokens, ilimitadas
  - ENTERPRISE: 25,000 tokens, ilimitadas
- ✅ Sistema de deducción de tokens
- ✅ Verificación de límites
- ✅ Auto-limpieza de conversaciones antiguas (FREE)

## 🔄 Pendiente

### 2. Integrar Tokens en Chat API
```typescript
// En app/api/chat/route.ts

// 1. Verificar autenticación
const session = await getServerSession(authOptions)
if (!session?.user?.email) {
  return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
}

// 2. Obtener usuario
const user = await prisma.user.findUnique({
  where: { email: session.user.email }
})

// 3. Verificar tokens disponibles
const tokenCheck = await checkTokenLimit(user.id, 50) // estimado
if (!tokenCheck.allowed) {
  return NextResponse.json({
    error: tokenCheck.message,
    needsSubscription: true,
    plan: tokenCheck.plan
  }, { status: 402 })
}

// 4. Después de la respuesta de OpenAI
await deductTokens(user.id, tokensUsed)
```

### 3. Configurar Stripe

#### 3.1 Instalar dependencias
```bash
npm install stripe @stripe/stripe-js
```

#### 3.2 Variables de entorno (.env)
```bash
# Stripe Keys (obtener de https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Price IDs (crear en Stripe Dashboard)
STRIPE_PRICE_BASIC=price_...
STRIPE_PRICE_PROFESSIONAL=price_...
STRIPE_PRICE_ENTERPRISE=price_...
```

#### 3.3 Crear Stripe Client
```typescript
// lib/stripe.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})
```

#### 3.4 API Routes necesarias

**a) Crear Checkout Session**
```typescript
// app/api/stripe/create-checkout-session/route.ts
import { stripe } from '@/lib/stripe'
import { getServerSession } from 'next-auth'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  const { priceId } = await request.json()
  
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?success=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard?canceled=true`,
    customer_email: session?.user?.email,
    metadata: {
      userId: user.id,
    },
  })
  
  return NextResponse.json({ url: checkoutSession.url })
}
```

**b) Webhook Handler**
```typescript
// app/api/stripe/webhook/route.ts
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!
  
  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  )
  
  switch (event.type) {
    case 'checkout.session.completed':
      // Crear o actualizar suscripción
      break
    case 'invoice.payment_succeeded':
      // Renovar tokens
      break
    case 'customer.subscription.deleted':
      // Cancelar suscripción
      break
  }
  
  return NextResponse.json({ received: true })
}
```

**c) Portal de Cliente**
```typescript
// app/api/stripe/create-portal-session/route.ts
export async function POST(request: Request) {
  const { customerId } = await request.json()
  
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard`,
  })
  
  return NextResponse.json({ url: portalSession.url })
}
```

### 4. UI Components

#### 4.1 Pricing Cards con Stripe
```typescript
// components/pricing-card-with-stripe.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export function PricingCardWithStripe({ priceId, plan }) {
  const [loading, setLoading] = useState(false)
  
  const handleSubscribe = async () => {
    setLoading(true)
    const res = await fetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    })
    const { url } = await res.json()
    window.location.href = url
  }
  
  return (
    <Button onClick={handleSubscribe} disabled={loading}>
      {loading ? 'Procesando...' : 'Suscribirse'}
    </Button>
  )
}
```

#### 4.2 Token Display
```typescript
// components/token-display.tsx
'use client'

export function TokenDisplay({ tokens, plan }) {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="h-4 w-4" />
      <span>{tokens} tokens</span>
      {tokens < 20 && (
        <Badge variant="destructive">Bajo</Badge>
      )}
    </div>
  )
}
```

#### 4.3 Upgrade Modal
```typescript
// components/upgrade-modal.tsx
'use client'

export function UpgradeModal({ open, onClose }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Has agotado tus tokens</DialogTitle>
          <DialogDescription>
            Suscríbete para continuar consultando sin límites
          </DialogDescription>
        </DialogHeader>
        {/* Pricing cards aquí */}
      </DialogContent>
    </Dialog>
  )
}
```

### 5. Crear Productos en Stripe Dashboard

1. Ir a https://dashboard.stripe.com/products
2. Crear 3 productos:
   - **Basic** - $9.99/mes - 1,000 tokens
   - **Professional** - $49/mes - 5,000 tokens
   - **Enterprise** - $199/mes - 25,000 tokens
3. Copiar los Price IDs a .env

### 6. Configurar Webhook en Stripe

1. Ir a https://dashboard.stripe.com/webhooks
2. Agregar endpoint: `https://lex-ai.dev/api/stripe/webhook`
3. Seleccionar eventos:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copiar Signing Secret a .env

### 7. Testing

#### Test Cards de Stripe
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

## 📋 Checklist de Implementación

- [ ] Integrar token check en chat API
- [ ] Instalar Stripe packages
- [ ] Crear lib/stripe.ts
- [ ] Crear API routes de Stripe
- [ ] Crear productos en Stripe Dashboard
- [ ] Configurar webhook
- [ ] Agregar Price IDs a .env
- [ ] Crear UI components
- [ ] Integrar en pricing page
- [ ] Integrar en dashboard
- [ ] Mostrar tokens en header
- [ ] Modal de upgrade cuando se agoten tokens
- [ ] Testing con test cards
- [ ] Deploy y verificar webhook

## 🎯 Resultado Final

Cuando esté completo:
- ✅ Usuarios FREE: 100 tokens, 5 conversaciones
- ✅ Sistema de pago con Stripe
- ✅ Renovación automática de tokens
- ✅ Portal de cliente para gestionar suscripción
- ✅ Notificaciones cuando tokens bajos
- ✅ Modal de upgrade cuando se agoten
- ✅ Tracking de uso en dashboard

## 📚 Recursos

- Stripe Docs: https://stripe.com/docs
- Stripe Testing: https://stripe.com/docs/testing
- Webhooks: https://stripe.com/docs/webhooks
- Next.js + Stripe: https://github.com/vercel/nextjs-subscription-payments
