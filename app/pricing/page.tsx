"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Check, Loader2, Scale } from "lucide-react"

const plans = [
    {
        name: "Beta Gratuito",
        price: "$0",
        description: "Para exploradores legales",
        features: ["100 tokens de consulta", "Acceso a Códigos Base", "Soporte Comunitario"],
        priceId: null,
        buttonText: "Plan Actual"
    },
    {
        name: "Profesional",
        price: "$49",
        period: "/mes",
        description: "Para firmas de alto rendimiento",
        features: ["5,000 tokens/mes", "Modo Litigante Avanzado", "Análisis de Documentos ilimitado", "Soporte Prioritario"],
        priceId: "price_1PROFESSIONAL_ID", // Change this to your real Stripe Price ID
        buttonText: "Subscribir Firma",
        highlight: true
    }
]

export default function PricingPage() {
    const { data: session } = useSession()
    const [loading, setLoading] = useState<string | null>(null)

    const handleSubscription = async (planName: string) => {
        if (!session) {
            window.location.href = "/register"
            return
        }

        setLoading(planName)
        try {
            const res = await fetch("/api/tilopay/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ planType: planName.toUpperCase() }),
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                throw new Error(data.error)
            }
        } catch (err: any) {
            alert(err.message || "Error al iniciar el pago con Tilopay")
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-20 px-4">
            <div className="max-w-5xl mx-auto text-center mb-16">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold mb-6">
                    <Scale size={14} />
                    LexAI Pro para Bufetes
                </div>
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                    Potencia tu práctica legal con <span className="text-blue-600">Inteligencia Artificial</span>
                </h1>
                <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                    Planes diseñados para firmas costarricenses que buscan precisión técnica y eficiencia procesal.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {plans.map((plan) => (
                    <Card
                        key={plan.name}
                        className={`relative flex flex-col ${plan.highlight ? 'border-2 border-blue-600 shadow-2xl scale-105 z-10' : 'border-slate-200'}`}
                    >
                        {plan.highlight && (
                            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-lg uppercase tracking-tighter">
                                Recomendado
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-4xl font-black">{plan.price}</span>
                                <span className="text-slate-500">{plan.period}</span>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3">
                                {plan.features.map((feature) => (
                                    <li key={feature} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                        <Check size={18} className="text-blue-600 mt-0.5 shrink-0" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={`w-full ${plan.highlight ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                                variant={plan.highlight ? 'default' : 'outline'}
                                disabled={plan.name === "Beta Gratuito" || !!loading}
                                onClick={() => plan.name !== "Beta Gratuito" && handleSubscription(plan.name)}
                            >
                                {loading === plan.priceId ? <Loader2 className="animate-spin" /> : plan.buttonText}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <p className="mt-12 text-center text-xs text-slate-500">
                ¿Tu firma tiene más de 5 abogados? Contáctanos para un plan Enterprise personalizado.
            </p>
        </div>
    )
}
