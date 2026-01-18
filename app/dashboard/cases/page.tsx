"use client"

import { useState } from "react"
import { Plus, Search, Filter, Briefcase, Calendar, MoreVertical, FileText, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export default function CasesPage() {
    const [searchQuery, setSearchQuery] = useState("")

    // Mock data for initial UI dev
    const cases = [
        {
            id: "1",
            title: "Expediente vs Importadora S.A.",
            client: "Juan Pérez",
            matter: "LABORAL",
            status: "OPEN",
            updatedAt: "2024-01-15",
            conversations: 3,
            documents: 5
        },
        {
            id: "2",
            title: "Recurso de Amparo - Caja Costarricense",
            client: "Asociación de Vecinos",
            matter: "CONSTITUCIONAL",
            status: "IN_PROGRESS",
            updatedAt: "2024-01-18",
            conversations: 1,
            documents: 2
        },
        {
            id: "3",
            title: "Divorcio Mutuo Consentimiento",
            client: "Familia Rodríguez",
            matter: "FAMILIA",
            status: "CLOSED",
            updatedAt: "2023-12-20",
            conversations: 0,
            documents: 8
        }
    ]

    // KPI Data
    const kpis = [
        { label: "Casos Activos", value: 3, trend: "+1 este mes", color: "text-blue-600" },
        { label: "Consultas", value: 4, trend: "Vinculadas a casos", color: "text-purple-600" },
        { label: "Documentos", value: 15, trend: "En expedientes", color: "text-emerald-600" },
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
            case 'CLOSED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            default: return 'bg-slate-100 text-slate-700'
        }
    }

    const getMatterLabel = (matter: string) => {
        return matter.charAt(0) + matter.slice(1).toLowerCase()
    }

    return (
        <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                        Gestión de Casos
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Tu centro de comando legal. Administra expedientes y vincula consultas.
                    </p>
                </div>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Nuevo Caso
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {kpis.map((kpi, idx) => (
                    <Card key={idx} className="border-slate-200 dark:border-slate-800">
                        <CardContent className="p-6">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{kpi.label}</p>
                            <div className="flex items-baseline gap-2 mt-2">
                                <span className={`text-3xl font-bold ${kpi.color}`}>{kpi.value}</span>
                                <span className="text-xs text-slate-400">{kpi.trend}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por título, cliente o materia..."
                        className="pl-9 bg-white dark:bg-slate-900"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                </Button>
            </div>

            {/* Cases Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cases.map((c) => (
                    <Link href={`/dashboard/cases/${c.id}`} key={c.id}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer border-slate-200 dark:border-slate-800 group h-full flex flex-col">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start">
                                    <Badge variant="outline" className={`${getStatusColor(c.status)} border-0`}>
                                        {c.status === 'IN_PROGRESS' ? 'En Proceso' : c.status === 'OPEN' ? 'Abierto' : 'Cerrado'}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                                            <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-slate-400 hover:text-slate-600">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>Editar</DropdownMenuItem>
                                            <DropdownMenuItem>Archivar</DropdownMenuItem>
                                            <DropdownMenuItem className="text-red-600">Eliminar</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="text-lg leading-tight group-hover:text-blue-600 transition-colors mt-2">
                                    {c.title}
                                </CardTitle>
                                <CardDescription className="line-clamp-1">
                                    Cliente: {c.client}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <div className="flex items-center gap-2 mb-4">
                                    <Badge variant="secondary" className="font-medium">
                                        {getMatterLabel(c.matter)}
                                    </Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm text-slate-500">
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1" title="Conversaciones">
                                            <MessageSquare className="h-4 w-4" />
                                            <span>{c.conversations}</span>
                                        </div>
                                        <div className="flex items-center gap-1" title="Documentos">
                                            <FileText className="h-4 w-4" />
                                            <span>{c.documents}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Actualizado: {c.updatedAt}
                            </CardFooter>
                        </Card>
                    </Link>
                ))}

                {/* New Case Card Placeholder */}
                <Button variant="outline" className="h-full min-h-[200px] border-dashed border-2 flex flex-col gap-4 text-slate-400 hover:text-blue-600 hover:border-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-900/10">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Plus className="h-6 w-6" />
                    </div>
                    <span>Crear un nuevo expediente</span>
                </Button>
            </div>
        </div>
    )
}
