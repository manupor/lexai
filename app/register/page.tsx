'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Chrome, Facebook, Loader2 } from 'lucide-react'

export default function RegisterPage() {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [loadingProvider, setLoadingProvider] = useState<string | null>(null)
    const [error, setError] = useState('')

    const handleOAuthSignIn = async (provider: 'google' | 'facebook') => {
        try {
            setIsLoading(true)
            setLoadingProvider(provider)
            await signIn(provider, { callbackUrl: '/dashboard' })
        } catch (error) {
            console.error('Error signing in:', error)
            setError('Error al registrarse. Por favor intenta de nuevo.')
        } finally {
            setIsLoading(false)
            setLoadingProvider(null)
        }
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validaciones
        if (!name || !email || !password || !confirmPassword) {
            setError('Todos los campos son requeridos')
            return
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden')
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres')
            return
        }

        try {
            setIsLoading(true)

            // Llamar a la API de registro
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'Error al registrarse')
            }

            // Registro exitoso, iniciar sesión automáticamente
            const result = await signIn('credentials', {
                email,
                password,
                callbackUrl: '/dashboard',
                redirect: false,
            })

            if (result?.error) {
                setError('Registro exitoso pero error al iniciar sesión')
            } else if (result?.ok) {
                router.push('/dashboard')
            }
        } catch (error: any) {
            console.error('Error registering:', error)
            setError(error.message || 'Error al registrarse')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">L</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
                    <CardDescription className="text-center">
                        Regístrate para acceder a consultas legales con IA
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* OAuth Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthSignIn('google')}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {loadingProvider === 'google' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Chrome className="mr-2 h-4 w-4" />
                            )}
                            Google
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => handleOAuthSignIn('facebook')}
                            disabled={isLoading}
                            className="w-full"
                        >
                            {loadingProvider === 'facebook' ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Facebook className="mr-2 h-4 w-4" />
                            )}
                            Facebook
                        </Button>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <Separator />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white px-2 text-muted-foreground">O continúa con</span>
                        </div>
                    </div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Juan Pérez"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Correo Electrónico</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isLoading}
                                required
                            />
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creando cuenta...
                                </>
                            ) : (
                                'Crear Cuenta'
                            )}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        ¿Ya tienes cuenta?{' '}
                        <a href="/login" className="text-primary hover:underline font-medium">
                            Inicia sesión
                        </a>
                    </div>

                    <div className="text-xs text-center text-muted-foreground">
                        Al registrarte, aceptas nuestros{' '}
                        <a href="/terms" className="underline hover:text-primary">
                            Términos de Servicio
                        </a>{' '}
                        y{' '}
                        <a href="/privacy" className="underline hover:text-primary">
                            Política de Privacidad
                        </a>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
