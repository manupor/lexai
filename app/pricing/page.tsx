'use client'

import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function PricingPage() {
    const plans = [
        {
            name: 'Gratis',
            price: '$0',
            period: '',
            description: 'Perfecto para probar LexAI',
            features: [
                '100 tokens por mes',
                '5 conversaciones',
                'Acceso a códigos legales',
                'Respuestas básicas de IA',
            ],
            cta: 'Comenzar Gratis',
            popular: false,
            priceId: null,
        },
        {
            name: 'Básico',
            price: '$9.99',
            period: '/mes',
            description: 'Ideal para uso personal',
            features: [
                '1,000 tokens por mes',
                '50 conversaciones',
                'Análisis de documentos',
                'Respuestas detalladas',
                'Soporte por email',
            ],
            cta: 'Suscribirse',
            popular: false,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC,
        },
        {
            name: 'Profesional',
            price: '$49',
            period: '/mes',
            description: 'Para abogados y profesionales',
            features: [
                '5,000 tokens por mes',
                'Conversaciones ilimitadas',
                'Análisis avanzado de documentos',
                'Prioridad en respuestas',
                'Exportar conversaciones',
                'Soporte prioritario',
            ],
            cta: 'Suscribirse',
            popular: true,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PROFESSIONAL,
        },
        {
            name: 'Empresarial',
            price: '$199',
            period: '/mes',
            description: 'Para firmas y equipos',
            features: [
                '25,000 tokens por mes',
                'Todo lo de Profesional',
                'Múltiples usuarios',
                'API access',
                'Integración personalizada',
                'Soporte dedicado 24/7',
            ],
            cta: 'Contactar Ventas',
            popular: false,
            priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
        },
    ]

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Planes y Precios
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Elige el plan perfecto para tus necesidades legales. Cancela cuando quieras.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {plans.map((plan, index) => (
                        <Card
                            key={index}
                            className={`relative flex flex-col ${plan.popular
                                ? 'border-2 border-primary shadow-xl scale-105'
                                : 'border shadow-md'
                                }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                    <Badge className="bg-primary text-white px-4 py-1">
                                        Más Popular
                                    </Badge>
                                </div>
                            )}

                            <CardHeader>
                                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                            </CardHeader>

                            <CardContent className="flex-1">
                                <div className="mb-6">
                                    <div className="flex items-baseline">
                                        <span className="text-4xl font-bold">{plan.price}</span>
                                        <span className="text-gray-600 ml-1">{plan.period}</span>
                                    </div>
                                </div>

                                <ul className="space-y-3">
                                    {plan.features.map((feature, featureIndex) => (
                                        <li key={featureIndex} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>

                            <CardFooter>
                                <PricingButton
                                    plan={plan.name}
                                    priceId={plan.priceId}
                                    cta={plan.cta}
                                    popular={plan.popular}
                                />
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {/* FAQ Section */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-center mb-8">
                        Preguntas Frecuentes
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-lg font-semibold mb-2">¿Qué son los tokens?</h3>
                            <p className="text-gray-600">
                                Los tokens son unidades que se consumen al usar la IA. Una pregunta típica usa entre 50-200 tokens.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">¿Puedo cambiar de plan?</h3>
                            <p className="text-gray-600">
                                Sí, puedes actualizar o degradar tu plan en cualquier momento desde tu perfil.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold mb-2">¿Cómo cancelo mi suscripción?</h3>
                            <p className="text-gray-600">
                                Puedes cancelar desde tu perfil en cualquier momento. Mantendrás acceso hasta el final del período pagado.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function PricingButton({
    plan,
    priceId,
    cta,
    popular,
}: {
    plan: string
    priceId: string | null | undefined
    cta: string
    popular: boolean
}) {
    const handleSubscribe = async () => {
        if (plan === 'Gratis') {
            window.location.href = '/register'
            return
        }

        if (plan === 'Empresarial') {
            window.location.href = 'mailto:ventas@lexai.com'
            return
        }

        if (!priceId) {
            alert('Plan no disponible')
            return
        }

        try {
            const response = await fetch('/api/stripe/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            })

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error || 'Error al crear sesión de pago')
            }
        } catch (error: any) {
            console.error('Error:', error)
            alert(error.message || 'Error al procesar el pago')
        }
    }

    return (
        <Button
            onClick={handleSubscribe}
            className="w-full"
            variant={popular ? 'default' : 'outline'}
        >
            {cta}
        </Button>
    )
}
