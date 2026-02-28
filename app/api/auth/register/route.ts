import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json()

        // Validaciones
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: 'Todos los campos son requeridos' },
                { status: 400 }
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            )
        }

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'Este correo ya está registrado' },
                { status: 400 }
            )
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10)

        // Crear usuario con plan FREE
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                role: 'CLIENT',
                tokens: 100,
            }
        })

        // No devolver la contraseña
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json(
            {
                message: 'Usuario creado exitosamente',
                user: userWithoutPassword
            },
            { status: 201 }
        )
    } catch (error: any) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Error al crear el usuario' },
            { status: 500 }
        )
    }
}
