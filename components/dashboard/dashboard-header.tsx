"use client"

import Link from "next/link"
import { Scale, Menu, Coins, User, Settings, LogOut, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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

export function DashboardHeader({ user, sidebarOpen, setSidebarOpen }: DashboardHeaderProps) {
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
        <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 sticky top-0 z-40">
            <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
                <div className="flex items-center gap-4">
                    {/* Mobile menu button */}
                    <Button
                        variant="ghost"
                        size="sm"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur-sm opacity-75"></div>
                            <Scale className="relative h-6 w-6 sm:h-8 sm:w-8 text-white bg-gradient-to-r from-blue-600 to-indigo-600 p-1 sm:p-1.5 rounded-lg" />
                        </div>
                        <span className="text-base sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hidden sm:inline">
                            LexAI Costa Rica
                        </span>
                        <span className="text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:hidden">
                            LexAI
                        </span>
                    </Link>
                </div>

                <div className="flex items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
                        <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-500" />
                        <span className="font-semibold text-xs sm:text-sm">{user.tokens || 0}</span>
                        <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs hidden sm:inline-flex">
                            {user.plan || "FREE"}
                        </Badge>
                    </div>

                    <ThemeToggle />

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={user.image || undefined} alt={user.name || "Usuario"} />
                                    <AvatarFallback className="bg-blue-600 text-white">
                                        {getInitials(user.name || "U")}
                                    </AvatarFallback>
                                </Avatar>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56" align="end" forceMount>
                            <DropdownMenuLabel className="font-normal">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.name}</p>
                                    <p className="text-xs leading-none text-muted-foreground">
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
                            <DropdownMenuItem asChild>
                                <Link href="/pricing" className="cursor-pointer">
                                    <Coins className="mr-2 h-4 w-4" />
                                    <span>Planes</span>
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
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
