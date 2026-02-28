import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import ProfileHeader from '@/components/profile/profile-header'
import SubscriptionCard from '@/components/profile/subscription-card'
import UsageStats from '@/components/profile/usage-stats'
import ProfileSettings from '@/components/profile/profile-settings'

export default async function ProfilePage() {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
        redirect('/login')
    }

    // Obtener datos completos del usuario y su organización
    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: {
            organization: {
                include: {
                    subscription: true
                }
            },
            conversations: {
                take: 10,
                orderBy: { createdAt: 'desc' }
            },
            documents: {
                take: 5,
                orderBy: { createdAt: 'desc' }
            }
        }
    })

    if (!user) {
        redirect('/login')
    }

    // Calcular estadísticas
    const conversationCount = await prisma.conversation.count({
        where: { userId: user.id }
    })

    const documentCount = await prisma.document.count({
        where: { userId: user.id }
    })

    const totalTokensUsed = await prisma.message.aggregate({
        where: {
            conversation: {
                userId: user.id
            }
        },
        _sum: {
            tokensUsed: true
        }
    })

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Mi Perfil</h1>
                    <p className="text-gray-600 mt-2">Gestiona tu cuenta y suscripción</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna izquierda: Perfil y Suscripción */}
                    <div className="lg:col-span-1 space-y-6">
                        <ProfileHeader
                            name={user.name || 'Usuario'}
                            email={user.email}
                            image={user.image}
                            role={user.role}
                            createdAt={user.createdAt}
                        />

                        <SubscriptionCard
                            plan={user.organization?.subscription?.plan || 'FREE'}
                            status={user.organization?.subscription?.status || 'ACTIVE'}
                            tokens={user.organization?.subscription?.tokens || 0}
                            maxTokens={user.organization?.subscription?.plan === 'PROFESSIONAL' ? 5000 : 100}
                            currentPeriodEnd={user.organization?.subscription?.currentPeriodEnd}
                            gatewayCustomerId={user.organization?.gatewayCustomerId}
                        />
                    </div>

                    {/* Columna derecha: Estadísticas y Configuración */}
                    <div className="lg:col-span-2 space-y-6">
                        <UsageStats
                            conversationCount={conversationCount}
                            documentCount={documentCount}
                            tokensUsed={totalTokensUsed._sum.tokensUsed || 0}
                            recentConversations={user.conversations}
                        />

                        <ProfileSettings userId={user.id} />
                    </div>
                </div>
            </div>
        </div>
    )
}
