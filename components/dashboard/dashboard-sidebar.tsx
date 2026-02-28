"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, FileText, Settings, Briefcase, LayoutDashboard, Menu, X, MessageSquare, Scale, PenLine } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DashboardSidebarProps {
    userPlan?: string
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
}

export function DashboardSidebar({ userPlan = "FREE", sidebarOpen, setSidebarOpen }: DashboardSidebarProps) {
    const pathname = usePathname()
    const isEnterprise = userPlan === "ENTERPRISE" || userPlan === "PROFESSIONAL"
    const [conversations, setConversations] = useState<any[]>([])

    // Fetch recent conversations
    useEffect(() => {
        fetch('/api/conversations')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setConversations(data)
            })
            .catch(err => console.error('Error fetching conversations:', err))
    }, [])

    return (
        <>
            <aside className={cn(
                "fixed lg:relative inset-y-0 left-0 z-50",
                "w-64 lg:w-64",
                "border-r border-slate-200/50 dark:border-slate-800/50",
                "bg-white dark:bg-slate-900 lg:bg-white/50 lg:dark:bg-slate-900/50",
                "backdrop-blur-xl flex flex-col", // flex-col para push footer down
                "transform transition-transform duration-300 ease-in-out",
                sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                "lg:block h-full" // Asegurar altura completa
            )}>
                <div className="flex flex-col h-full p-4">
                    <div className="space-y-6 flex-1 overflow-y-auto">
                        {/* Logo Mobile Only */}
                        <div className="lg:hidden flex items-center gap-2 mb-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                                <Scale className="relative h-6 w-6 text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-lg" />
                            </div>
                            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                LexAI
                            </span>
                            <Button variant="ghost" size="icon" className="ml-auto" onClick={() => setSidebarOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Link href="/dashboard">
                                <Button
                                    variant={pathname === "/dashboard" ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start transition-all",
                                        pathname === "/dashboard"
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Nueva Consulta
                                </Button>
                            </Link>

                            <Link href="/dashboard/documents">
                                <Button
                                    variant={pathname.startsWith("/dashboard/documents") ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start transition-all",
                                        pathname.startsWith("/dashboard/documents")
                                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <FileText className="mr-2 h-4 w-4" />
                                    Documentos
                                </Button>
                            </Link>

                            <Link href="/dashboard/documentos">
                                <Button
                                    variant={pathname.startsWith("/dashboard/documentos") || pathname.startsWith("/dashboard/editor") ? "default" : "ghost"}
                                    className={cn(
                                        "w-full justify-start transition-all",
                                        pathname.startsWith("/dashboard/documentos") || pathname.startsWith("/dashboard/editor")
                                            ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/50"
                                            : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    onClick={() => setSidebarOpen(false)}
                                >
                                    <PenLine className="mr-2 h-4 w-4" />
                                    Editor Legal
                                </Button>
                            </Link>

                            {isEnterprise && (
                                <Link href="/dashboard/cases">
                                    <Button
                                        variant={pathname.startsWith("/dashboard/cases") ? "default" : "ghost"}
                                        className={cn(
                                            "w-full justify-start transition-all",
                                            pathname.startsWith("/dashboard/cases")
                                                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/50"
                                                : "hover:bg-slate-100 dark:hover:bg-slate-800"
                                        )}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <Briefcase className="mr-2 h-4 w-4" />
                                        Gestión Legal
                                    </Button>
                                </Link>
                            )}
                        </div>

                        {/* Recent Conversations */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-4">
                            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Recientes
                            </h3>
                            <div className="space-y-1">
                                {conversations.slice(0, 5).map(conv => (
                                    <Link href={`/dashboard?chat=${conv.id}`} key={conv.id}>
                                        <Button
                                            variant="ghost"
                                            className="w-full justify-start text-sm hover:bg-slate-100 dark:hover:bg-slate-800 px-2 h-8 font-normal"
                                            onClick={() => setSidebarOpen(false)}
                                        >
                                            <span className="truncate">{conv.title || 'Consulta sin título'}</span>
                                        </Button>
                                    </Link>
                                ))}
                                {conversations.length === 0 && (
                                    <p className="text-xs text-slate-400 px-2">No tienes consultas recientes</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 mt-auto">
                        <Link href="/dashboard/profile">
                            <Button
                                variant={pathname === "/dashboard/profile" ? "ghost" : "ghost"}
                                className="w-full justify-start text-slate-600 dark:text-slate-300"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <Settings className="mr-2 h-4 w-4" />
                                Configuración
                            </Button>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </>
    )
}
