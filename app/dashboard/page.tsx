"use client"

import { useState, useEffect } from "react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChatInterface } from "@/components/chat/chat-interface"
import { DocumentUpload } from "@/components/document-upload"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Scale, MessageSquare, FileText, Plus, Coins, LogOut, Settings, User, Menu, X } from "lucide-react"
import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("chat")
  const [conversations, setConversations] = useState<any[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [chatKey, setChatKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  
  // Redirigir a login si no está autenticado
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])
  
  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }
  
  if (!session) {
    return null
  }
  
  const userTokens = session.user?.tokens || 0
  const userPlan = session.user?.subscription?.plan || "FREE"
  const userName = session.user?.name || "Usuario"
  const userEmail = session.user?.email || ""
  const userImage = session.user?.image
  
  // Obtener iniciales del nombre
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
  
  const handleNewConversation = () => {
    // Limpiar conversación actual
    setCurrentConversationId(null)
    // Incrementar key para forzar re-render completo del chat
    setChatKey(prev => prev + 1)
    // Asegurar que estamos en la pestaña de chat
    setActiveTab("chat")
    // Cerrar sidebar en móvil
    setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60">
        <div className="flex h-14 sm:h-16 items-center justify-between px-3 sm:px-6">
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
          
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-3 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/20">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600 dark:text-yellow-500" />
              <span className="font-semibold text-xs sm:text-sm">{userTokens}</span>
              <Badge variant="outline" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 text-xs hidden sm:inline-flex">
                {userPlan}
              </Badge>
            </div>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={userImage || undefined} alt={userName} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(userName)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Mi Cuenta</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
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

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar - Hidden on mobile, overlay on tablet, fixed on desktop */}
        <aside className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-64 lg:w-64
          border-r border-slate-200/50 dark:border-slate-800/50 
          bg-white dark:bg-slate-900 lg:bg-white/50 lg:dark:bg-slate-900/50
          backdrop-blur-xl p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:block
        `}>
          <div className="space-y-2">
            <Button
              variant="default"
              className="w-full justify-start bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50 hover:from-blue-700 hover:to-indigo-700 transition-all"
              onClick={handleNewConversation}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Consulta
            </Button>
            
            <Button
              variant={activeTab === "documents" ? "default" : "ghost"}
              className={`w-full justify-start transition-all ${
                activeTab === "documents"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/50"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
              onClick={() => {
                setActiveTab("documents")
                setSidebarOpen(false)
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Documentos
            </Button>
          </div>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
              Conversaciones Recientes
            </h3>
            <div className="space-y-1">
              {conversations.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-500 text-center py-4">
                  No hay conversaciones aún
                </p>
              ) : (
                conversations.map((conv) => (
                  <Button
                    key={conv.id}
                    variant="ghost"
                    className="w-full justify-start text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    size="sm"
                    onClick={() => {
                      setCurrentConversationId(conv.id)
                      setChatKey(prev => prev + 1)
                      setSidebarOpen(false)
                    }}
                  >
                    <span className="truncate">{conv.title}</span>
                  </Button>
                ))
              )}
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

        {/* Main Content */}
        <main className="flex-1 overflow-hidden w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsContent value="chat" className="h-full m-0">
              <ChatInterface 
                conversationId={currentConversationId || undefined}
                key={chatKey}
              />
            </TabsContent>

            <TabsContent value="documents" className="h-full p-6 overflow-hidden">
              <DocumentUpload />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
