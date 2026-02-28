"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageSquare, FileText, User, Settings, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

export function MobileNav() {
    const pathname = usePathname()

    const navItems = [
        {
            icon: MessageSquare,
            label: "Chat",
            href: "/dashboard",
            active: pathname === "/dashboard"
        },
        {
            icon: FileText,
            label: "Docs",
            href: "/dashboard/documents",
            active: pathname.startsWith("/dashboard/documents")
        },
        {
            icon: Sparkles,
            label: "Pro",
            href: "/pricing",
            active: pathname === "/pricing"
        },
        {
            icon: User,
            label: "Perfil",
            href: "/dashboard/profile",
            active: pathname.startsWith("/dashboard/profile")
        }
    ]

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-950 dark:via-slate-950/80">
            <nav className="flex items-center justify-around bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-2 shadow-2xl">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="relative flex flex-col items-center justify-center w-16 py-1"
                    >
                        {item.active && (
                            <motion.div
                                layoutId="nav-active"
                                className="absolute inset-0 bg-blue-600/10 dark:bg-blue-400/10 rounded-xl"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <item.icon
                            className={cn(
                                "h-5 w-5 mb-1 transition-colors duration-200",
                                item.active
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-500 dark:text-slate-400"
                            )}
                        />
                        <span
                            className={cn(
                                "text-[10px] font-medium transition-colors duration-200",
                                item.active
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-500 dark:text-slate-400"
                            )}
                        >
                            {item.label}
                        </span>
                    </Link>
                ))}
            </nav>
        </div>
    )
}
