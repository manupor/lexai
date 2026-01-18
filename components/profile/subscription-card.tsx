'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sparkles, TrendingUp, Calendar, CreditCard } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface SubscriptionCardProps {
    plan: string
    status: string
    tokens: number
    maxTokens: number
    currentPeriodEnd?: Date | null
    stripeCustomerId?: string | null
}

export default function SubscriptionCard({
    plan,
    status,
    tokens,
    maxTokens,
    currentPeriodEnd,
    stripeCustomerId
}: SubscriptionCardProps) {
    const tokenPercentage = (tokens / maxTokens) * 100
    const isLow = tokenPercentage < 20
    const isFree = plan === 'FREE'

    const planConfig = {
        FREE: {
            name: 'Gratis',
            color: 'bg-gray-500',
            price: '$0',
            features: ['100 tokens/mes', '5 conversaciones', 'Acceso básico']
        },
        BASIC: {
            name: 'Básico',
            color: 'bg-blue-500',
            price: '$9.99',
            features: ['1,000 tokens/mes', '50 conversaciones', 'Análisis de documentos']
        },
        PROFESSIONAL: {
            name: 'Profesional',
            color: 'bg-purple-500',
            price: '$49',
            features: ['5,000 tokens/mes', 'Conversaciones ilimitadas', 'Prioridad en respuestas']
        },
        ENTERPRISE: {
            name: 'Empresarial',
            color: 'bg-orange-500',
            price: '$199',
            features: ['25,000 tokens/mes', 'Todo incluido', 'Soporte dedicado']
        }
    }

    const currentPlan = planConfig[plan as keyof typeof planConfig] || planConfig.FREE

    const handleManageSubscription = async () => {
        if (isFree) {
            // Redirigir a página de pricing
            window.location.href = '/pricing'
        } else {
            // Abrir portal de Stripe
            try {
                const response = await fetch('/api/stripe/create-portal-session', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ customerId: stripeCustomerId })
                })
                const data = await response.json()
                if (data.url) {
                    window.location.href = data.url
                }
            } catch (error) {
                console.error('Error opening portal:', error)
                alert('Error al abrir el portal de suscripción')
            }
        }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Suscripción</CardTitle>
                        <CardDescription>Plan actual y tokens disponibles</CardDescription>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'}`} />
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Plan Actual */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Plan</span>
                        <Badge className={currentPlan.color}>
                            {currentPlan.name}
                        </Badge>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{currentPlan.price}</span>
                        {!isFree && <span className="text-muted-foreground">/mes</span>}
                    </div>
                </div>

                {/* Tokens */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                            <Sparkles className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-yellow-500'}`} />
                            <span className="text-sm font-medium">Tokens Disponibles</span>
                        </div>
                        {isLow && <Badge variant="destructive">Bajo</Badge>}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-baseline justify-between">
                            <span className="text-2xl font-bold">{tokens.toLocaleString()}</span>
                            <span className="text-sm text-muted-foreground">de {maxTokens.toLocaleString()}</span>
                        </div>
                        <Progress value={tokenPercentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                            {tokenPercentage.toFixed(0)}% restante
                        </p>
                    </div>
                </div>

                {/* Renovación */}
                {currentPeriodEnd && !isFree && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                            Renueva el {format(new Date(currentPeriodEnd), "d 'de' MMMM", { locale: es })}
                        </span>
                    </div>
                )}

                {/* Características */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Incluye:</p>
                    <ul className="space-y-1">
                        {currentPlan.features.map((feature, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Botón de Acción */}
                <Button
                    onClick={handleManageSubscription}
                    className="w-full"
                    variant={isFree ? 'default' : 'outline'}
                >
                    {isFree ? (
                        <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Mejorar Plan
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            Gestionar Suscripción
                        </>
                    )}
                </Button>
            </CardContent>
        </Card>
    )
}
