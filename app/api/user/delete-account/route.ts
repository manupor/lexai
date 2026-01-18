import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        // Obtener usuario
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            )
        }

        // Eliminar usuario (Prisma eliminará automáticamente las relaciones en cascada)
        await prisma.user.delete({
            where: { id: user.id }
        })

        return NextResponse.json({ message: 'Cuenta eliminada exitosamente' })
    } catch (error) {
        console.error('Error deleting account:', error)
        return NextResponse.json(
            { error: 'Error al eliminar cuenta' },
            { status: 500 }
        )
    }
}
