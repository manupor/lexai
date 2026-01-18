"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar"

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { data: session, status } = useSession()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
            </div>
        )
    }

    if (status === "unauthenticated") {
        redirect("/login")
    }

    return (
        <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <DashboardHeader
                user={{
                    name: session?.user?.name,
                    email: session?.user?.email,
                    image: session?.user?.image,
                    tokens: session?.user?.tokens,
                    plan: session?.user?.subscription?.plan
                }}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            <div className="flex flex-1 overflow-hidden relative">
                <DashboardSidebar
                    userPlan={session?.user?.subscription?.plan}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                />

                <main className="flex-1 overflow-y-auto w-full p-0">
                    {children}
                </main>
            </div>
        </div>
    )
}
