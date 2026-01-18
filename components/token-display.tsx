'use client'

import { Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface TokenDisplayProps {
    tokens: number
    maxTokens: number
    plan: string
    compact?: boolean
}

export default function TokenDisplay({ tokens, maxTokens, plan, compact = false }: TokenDisplayProps) {
    const percentage = (tokens / maxTokens) * 100
    const isLow = percentage < 20
    const isCritical = percentage < 10

    if (compact) {
        return (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-accent transition-colors">
                <Sparkles className={`w-4 h-4 ${isLow ? 'text-red-500' : 'text-yellow-500'}`} />
                <span className="text-sm font-medium">
                    {tokens.toLocaleString()}
                </span>
                {isLow && (
                    <Badge variant="destructive" className="text-xs">
                        Bajo
                    </Badge>
                )}
            </div>
        )
    }

    return (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border bg-card">
            <Sparkles className={`w-5 h-5 ${isLow ? 'text-red-500' : 'text-yellow-500'}`} />
            <div className="flex-1 min-w-[120px]">
                <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-semibold">{tokens.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">/ {maxTokens.toLocaleString()}</span>
                </div>
                <Progress
                    value={percentage}
                    className="h-1.5"
                />
            </div>
            {isLow && (
                <Badge variant={isCritical ? "destructive" : "secondary"} className="text-xs">
                    {isCritical ? 'Crítico' : 'Bajo'}
                </Badge>
            )}
        </div>
    )
}
