'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, FileText, Zap, TrendingUp } from 'lucide-react'

interface UsageStatsProps {
    conversationCount: number
    documentCount: number
    tokensUsed: number
    recentConversations: any[]
}

export default function UsageStats({
    conversationCount,
    documentCount,
    tokensUsed,
    recentConversations
}: UsageStatsProps) {
    const stats = [
        {
            label: 'Conversaciones',
            value: conversationCount,
            icon: MessageSquare,
            color: 'text-blue-600',
            bgColor: 'bg-blue-100'
        },
        {
            label: 'Documentos Analizados',
            value: documentCount,
            icon: FileText,
            color: 'text-purple-600',
            bgColor: 'bg-purple-100'
        },
        {
            label: 'Tokens Usados',
            value: tokensUsed.toLocaleString(),
            icon: Zap,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100'
        }
    ]

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas de Uso</CardTitle>
                <CardDescription>Tu actividad en LexAI</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon
                        return (
                            <div key={index} className="flex items-center gap-3 p-4 rounded-lg border bg-card">
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <Icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Recent Conversations */}
                {recentConversations.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Conversaciones Recientes
                        </h3>
                        <div className="space-y-2">
                            {recentConversations.slice(0, 5).map((conversation) => (
                                <a
                                    key={conversation.id}
                                    href={`/dashboard?conversation=${conversation.id}`}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <p className="font-medium text-sm truncate">{conversation.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(conversation.createdAt).toLocaleDateString('es', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
