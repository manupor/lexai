import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session || !session.user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const { inviteCode } = await req.json()

        if (!inviteCode) {
            return NextResponse.json({ error: 'Código de invitación requerido' }, { status: 400 })
        }

        const org = await prisma.organization.findUnique({
            where: { inviteCode }
        })

        if (!org) {
            return NextResponse.json({ error: 'Código de invitación inválido' }, { status: 404 })
        }

        await prisma.user.update({
            where: { id: session.user.id },
            data: { organizationId: org.id }
        })

        return NextResponse.json({
            success: true,
            organization: {
                id: org.id,
                name: org.name,
                slug: org.slug
            }
        })
    } catch (error: any) {
        console.error('Error joining organization:', error)
        return NextResponse.json({ error: 'Error al unirse a la organización' }, { status: 500 })
    }
}
