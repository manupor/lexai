'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Lock, Trash2, Save } from 'lucide-react'

interface ProfileSettingsProps {
    userId: string
}

export default function ProfileSettings({ userId }: ProfileSettingsProps) {
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isChangingPassword, setIsChangingPassword] = useState(false)

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (newPassword !== confirmPassword) {
            alert('Las contraseñas no coinciden')
            return
        }

        if (newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres')
            return
        }

        try {
            setIsChangingPassword(true)

            const response = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Error al cambiar contraseña')
            }

            alert('Contraseña cambiada exitosamente')
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        const confirmed = confirm(
            '¿Estás seguro de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.'
        )

        if (!confirmed) return

        try {
            const response = await fetch('/api/user/delete-account', {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Error al eliminar cuenta')
            }

            // Redirigir a página de inicio
            window.location.href = '/'
        } catch (error) {
            alert('Error al eliminar la cuenta')
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Gestiona la seguridad de tu cuenta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Cambiar Contraseña */}
                <div>
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Cambiar Contraseña
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Contraseña Actual</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                disabled={isChangingPassword}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isChangingPassword}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={isChangingPassword}
                            />
                        </div>

                        <Button type="submit" disabled={isChangingPassword}>
                            <Save className="w-4 h-4 mr-2" />
                            {isChangingPassword ? 'Guardando...' : 'Guardar Contraseña'}
                        </Button>
                    </form>
                </div>

                <Separator />

                {/* Zona de Peligro */}
                <div>
                    <h3 className="text-sm font-medium mb-2 text-red-600">Zona de Peligro</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, está seguro.
                    </p>
                    <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar Cuenta
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
