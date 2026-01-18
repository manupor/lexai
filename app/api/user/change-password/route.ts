import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.email) {
            return NextResponse.json(
                { error: 'No autenticado' },
                { status: 401 }
            )
        }

        const { currentPassword, newPassword } = await request.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Contraseña actual y nueva son requeridas' },
                { status: 400 }
            )
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: 'La nueva contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Obtener usuario
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        })

        if (!user || !user.password) {
            return NextResponse.json(
                { error: 'Usuario no encontrado o sin contraseña configurada' },
                { status: 404 }
            )
        }

        // Verificar contraseña actual
        const isValid = await bcrypt.compare(currentPassword, user.password)

        if (!isValid) {
            return NextResponse.json(
                { error: 'Contraseña actual incorrecta' },
                { status: 400 }
            )
        }

        // Hash de la nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10)

        // Actualizar contraseña
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        })

        return NextResponse.json({ message: 'Contraseña actualizada exitosamente' })
    } catch (error) {
        console.error('Error changing password:', error)
        return NextResponse.json(
            { error: 'Error al cambiar contraseña' },
            { status: 500 }
        )
    }
}
