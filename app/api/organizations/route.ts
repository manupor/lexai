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

        const { name, slug } = await req.json()

        if (!name || !slug) {
            return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 })
        }

        // Verificar si el slug ya existe
        const existing = await prisma.organization.findUnique({
            where: { slug }
        })

        if (existing) {
            return NextResponse.json({ error: 'El identificador (slug) ya está en uso' }, { status: 400 })
        }

        // Crear la organización y asignar al usuario
        const org = await prisma.organization.create({
            data: {
                name,
                slug,
                plan: 'PROFESSIONAL' // Plan por defecto para beta
            }
        })

        await prisma.user.update({
            where: { id: session.user.id },
            data: { organizationId: org.id }
        })

        return NextResponse.json({
            success: true,
            organization: org
        })
    } catch (error: any) {
        console.error('Error creating organization:', error)
        return NextResponse.json({ error: 'Error al crear la organización' }, { status: 500 })
    }
}
