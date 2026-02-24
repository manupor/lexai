"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Scale, Building2, Users, ArrowRight, Loader2 } from "lucide-react"

export default function OnboardingPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Form states
    const [orgName, setOrgName] = useState("")
    const [orgSlug, setOrgSlug] = useState("")
    const [inviteCode, setInviteCode] = useState("")

    const handleCreateOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/organizations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: orgName, slug: orgSlug.toLowerCase().replace(/\s+/g, '-') }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Error al crear la firma")

            router.push("/")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleJoinOrg = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        setError(null)

        try {
            const res = await fetch("/api/organizations/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ inviteCode }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || "Código de invitación inválido")

            router.push("/")
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-4 shadow-xl shadow-blue-500/20">
                    <Scale size={32} />
                </div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Bienvenido a LexAI</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2">Configura tu espacio de trabajo legal para comenzar</p>
            </div>

            <Card className="w-full max-w-md shadow-2xl border-slate-200 dark:border-slate-800">
                <Tabs defaultValue="create" className="w-full">
                    <CardHeader className="text-center">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="create">Nueva Firma</TabsTrigger>
                            <TabsTrigger value="join">Unirse</TabsTrigger>
                        </TabsList>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg text-red-600 dark:text-red-400 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <TabsContent value="create">
                            <form onSubmit={handleCreateOrg} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nombre de la Firma / Bufete</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="name"
                                            placeholder="Ej. García & Asociados"
                                            className="pl-10"
                                            value={orgName}
                                            onChange={(e) => setOrgName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="slug">Identificador único (slug)</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-400">lexai.cr/firme/</span>
                                        <Input
                                            id="slug"
                                            placeholder="garcia-asociados"
                                            value={orgSlug}
                                            onChange={(e) => setOrgSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 italic">Este será el enlace para tu portal privado.</p>
                                </div>
                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Building2 className="mr-2 h-4 w-4" />}
                                    Crear Firma Legal
                                </Button>
                            </form>
                        </TabsContent>

                        <TabsContent value="join">
                            <form onSubmit={handleJoinOrg} className="space-y-4">
                                <div className="space-y-2 text-center pb-2">
                                    <p className="text-sm text-slate-500">Ingresa el código proporcionado por el administrador de tu firma.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="code">Código de Invitación</Label>
                                    <Input
                                        id="code"
                                        placeholder="cuid_de_la_organizacion"
                                        value={inviteCode}
                                        onChange={(e) => setInviteCode(e.target.value)}
                                        required
                                    />
                                </div>
                                <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                                    Unirse al Equipo
                                </Button>
                            </form>
                        </TabsContent>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                        <p className="text-xs text-slate-400 text-center">
                            Al crear una firma, te convertirás en el Socio Principal.
                        </p>
                    </CardFooter>
                </Tabs>
            </Card>

            <button
                onClick={() => router.push("/")}
                className="mt-6 text-slate-500 hover:text-blue-600 text-sm flex items-center gap-1 transition-colors"
            >
                Continuar como invitado (Beta) <ArrowRight size={14} />
            </button>
        </div>
    )
}
