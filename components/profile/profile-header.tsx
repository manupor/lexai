'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Camera, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface ProfileHeaderProps {
    name: string
    email: string
    image?: string | null
    role: string
    createdAt: Date
}

export default function ProfileHeader({ name, email, image, role, createdAt }: ProfileHeaderProps) {
    const [isUploading, setIsUploading] = useState(false)

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            setIsUploading(true)

            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/upload/avatar', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Error al subir imagen')

            const data = await response.json()

            // Recargar la página para mostrar la nueva imagen
            window.location.reload()
        } catch (error) {
            console.error('Error uploading image:', error)
            alert('Error al subir la imagen')
        } finally {
            setIsUploading(false)
        }
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
    }

    const getRoleBadge = (role: string) => {
        const roleConfig = {
            CLIENT: { label: 'Cliente', variant: 'default' as const },
            LAWYER: { label: 'Abogado', variant: 'secondary' as const },
            ADMIN: { label: 'Admin', variant: 'destructive' as const },
        }
        return roleConfig[role as keyof typeof roleConfig] || roleConfig.CLIENT
    }

    const roleBadge = getRoleBadge(role)

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                    <div className="relative group">
                        <Avatar className="w-24 h-24">
                            <AvatarImage src={image || undefined} alt={name} />
                            <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                                {getInitials(name)}
                            </AvatarFallback>
                        </Avatar>

                        <label
                            htmlFor="avatar-upload"
                            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                            {isUploading ? (
                                <Upload className="w-6 h-6 text-white animate-pulse" />
                            ) : (
                                <Camera className="w-6 h-6 text-white" />
                            )}
                        </label>
                        <input
                            id="avatar-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={isUploading}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        Click para cambiar foto
                    </p>
                </div>

                {/* Información */}
                <div className="space-y-3">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Nombre</p>
                        <p className="text-lg font-semibold">{name}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-sm">{email}</p>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Rol</p>
                        <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                    </div>

                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Miembro desde</p>
                        <p className="text-sm">
                            {format(new Date(createdAt), "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
