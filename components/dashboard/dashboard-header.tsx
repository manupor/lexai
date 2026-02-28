"use client"

import Link from "next/link"
import { Scale, Coins, User, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ThemeToggle } from "@/components/theme-toggle"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"

interface DashboardHeaderProps {
    user: {
        name?: string | null
        email?: string | null
        image?: string | null
        tokens?: number
        plan?: string
    }
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
    }

    const handleSignOut = async () => {
        await signOut({ callbackUrl: "/" })
    }

    return (
        <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40">
            <div className="flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                            <Scale className="relative h-6 w-6 sm:h-7 sm:w-7 text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-1 rounded-lg" />
                        </div>
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            LexAI
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-bold text-xs">{user.tokens || 0}</span>
                    </div>

                    <div className="hidden sm:block">
                        <ThemeToggle />
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-full ring-2 ring-transparent hover:ring-blue-500/20 transition-all">
                                <Avatar className="h-full w-full">
                                    <AvatarImage src={user.image || undefined} alt={user.name || "Usuario"} />
                                    <AvatarFallback className="bg-blue-600 text-white text-xs">
                                        {getInitials(user.name || "U")}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">
                                        {user.email}
                                    </p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/dashboard/profile" className="cursor-pointer">
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Mi Cuenta</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="sm:hidden">
                                <Link href="/dashboard/settings" className="cursor-pointer">
                                    <ThemeToggle />
                                    <span className="ml-2">Tema</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600 focus:text-red-600">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
