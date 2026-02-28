"use client"

import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2, Scale, User, AlertCircle, ShieldCheck, Search, CheckCircle2, Filter } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { VoiceInput } from "@/components/voice-input"
import { VoiceModeToggle } from "@/components/voice-mode-toggle"
import { motion, AnimatePresence } from "framer-motion"
import { FiltroMaterias } from "./filtro-materias"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  tokensUsed?: number
  messageId?: string
  isLitigantMode?: boolean
  isReviewMode?: boolean
  reported?: boolean
}

interface ChatInterfaceProps {
  conversationId?: string
  initialMessages?: Message[]
}

export function ChatInterface({ conversationId, initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [voiceMode, setVoiceMode] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedMaterias, setSelectedMaterias] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Limpiar mensajes cuando conversationId es null (nueva conversación)
  useEffect(() => {
    if (conversationId === null || conversationId === undefined) {
      setMessages([])
    }
  }, [conversationId])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const speakText = async (text: string) => {
    if (!voiceMode) return

    try {
      setIsSpeaking(true)

      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error('Error al generar audio')
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.pause()
      }

      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(audioUrl)
      }

      await audio.play()
    } catch (error) {
      console.error('Error al reproducir audio:', error)
      setIsSpeaking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          conversationId,
          messages: messages,
          materias: selectedMaterias,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el mensaje")
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
        tokensUsed: data.tokensUsed,
        messageId: data.messageId,
        isLitigantMode: data.metadata?.isLitigantMode,
        isReviewMode: data.metadata?.isReviewMode,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Reproducir respuesta por voz si está activado
      if (voiceMode) {
        await speakText(data.message)
      }
    } catch (error: any) {
      console.error("Error:", error)

      let errorText = "Lo siento, ocurrió un error al procesar tu consulta."

      if (error.message.includes("API key")) {
        errorText = "⚠️ **Configuración Requerida**\n\n" +
          "La API key de OpenAI no está configurada correctamente.\n\n" +
          "**Pasos para configurar:**\n" +
          "1. Obtén tu API key en https://platform.openai.com/api-keys\n" +
          "2. Edita el archivo `.env` en la raíz del proyecto\n" +
          "3. Reemplaza `OPENAI_API_KEY=\"your-openai-api-key-here\"` con tu key real\n" +
          "4. Reinicia el servidor (`npm run dev`)\n\n" +
          "Consulta `CONFIGURACION_OPENAI.md` para más detalles."
      } else if (error.message.includes("créditos")) {
        errorText = "⚠️ **Sin Créditos en OpenAI**\n\n" +
          "Tu cuenta de OpenAI no tiene créditos disponibles.\n\n" +
          "Agrega créditos en: https://platform.openai.com/account/billing"
      } else if (error.message) {
        errorText = `⚠️ **Error**: ${error.message}`
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: errorText,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReportError = async (messageId: string, id: string) => {
    const comment = window.prompt("¿Cuál es el error o imprecisión que detectaste?")
    if (!comment) return

    try {
      const response = await fetch("/api/chat/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, comment }),
      })

      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, reported: true } : m))
        alert("Reporte enviado con éxito. Gracias por ayudar a mejorar LexAI.")
      }
    } catch (error) {
      console.error("Error reporting:", error)
    }
  }

  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      {/* Workspace Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
            {session?.user?.organizationId ? "FW" : "LX"}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
              {session?.user?.organizationId ? "Espacio de Trabajo Legal" : "LexAI Costa Rica"}
            </span>
            {session?.user?.organizationId && (
              <span className="text-[8px] text-blue-600 dark:text-blue-400 font-bold uppercase -mt-0.5">
                Firma Conectada
              </span>
            )}
          </div>
          {!session?.user?.organizationId && session?.user && (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-[9px] border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
              onClick={() => router.push("/onboarding")}
            >
              Configurar Firma
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-700 dark:text-slate-200 font-bold">{session.user.name}</span>
              <span className="text-[8px] text-slate-500 font-medium uppercase tracking-tighter">Abogado Autorizado</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="text-[10px] h-7"
              onClick={() => router.push("/login")}
            >
              Iniciar Sesión
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 overscroll-contain" ref={scrollRef}>
        <div className="space-y-4 max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center px-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative mb-8"
              >
                <div className="absolute inset-0 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
                <Scale className="relative h-16 w-16 text-blue-600 dark:text-blue-500" />
              </motion.div>
              <h3 className="mb-4 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                ¿En qué puedo ayudarte hoy?
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-10">
                Consulta leyes, analiza contratos o redacta documentos legales con IA.
              </p>
              <div className="grid gap-3 w-full max-w-sm">
                <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Ejemplos de consultas:</p>
                <Button
                  variant="outline"
                  className="justify-start text-left text-xs sm:text-sm h-auto py-3 sm:py-2.5 px-4 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-all active:scale-[0.98]"
                  onClick={() => setInput("¿Cuáles son los requisitos para un divorcio en Costa Rica?")}
                >
                  <span className="line-clamp-2">¿Cuáles son los requisitos para un divorcio en Costa Rica?</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left text-xs sm:text-sm h-auto py-3 sm:py-2.5 px-4 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-all active:scale-[0.98]"
                  onClick={() => setInput("Explícame el artículo 45 del Código de Trabajo")}
                >
                  <span className="line-clamp-2">Explícame el artículo 45 del Código de Trabajo</span>
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left text-xs sm:text-sm h-auto py-3 sm:py-2.5 px-4 hover:bg-blue-50 dark:hover:bg-blue-950 hover:border-blue-400 transition-all active:scale-[0.98]"
                  onClick={() => setInput("¿Qué dice la ley sobre accidentes de tránsito?")}
                >
                  <span className="line-clamp-2">¿Qué dice la ley sobre accidentes de tránsito?</span>
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2.5 sm:gap-3 ${message.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-900">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] p-3.5 sm:p-4 shadow-sm ${message.role === "user"
                  ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0"
                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}
              >
                {(message.isLitigantMode || message.isReviewMode) && (
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {message.isLitigantMode && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-[10px] font-bold uppercase tracking-wider border border-blue-200 dark:border-blue-800">
                        <ShieldCheck className="h-3 w-3" />
                        Modo Litigante
                      </div>
                    )}
                    {message.isReviewMode && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                        <Search className="h-3 w-3" />
                        Revisión Crítica
                      </div>
                    )}
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] sm:text-sm leading-relaxed">
                  {message.role === "assistant" ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.role === "assistant" && (
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {message.tokensUsed && (
                        <p className="text-[10px] text-gray-500 font-medium">
                          Métrica: {message.tokensUsed} tokens
                        </p>
                      )}
                    </div>
                    {message.messageId && (
                      <button
                        onClick={() => handleReportError(message.messageId!, message.id)}
                        disabled={message.reported}
                        className={`group flex items-center gap-1.5 text-[10px] font-semibold transition-colors ${message.reported
                          ? "text-green-600 dark:text-green-400"
                          : "text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                          }`}
                      >
                        {message.reported ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" />
                            Reportado
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 group-hover:animate-pulse" />
                            Reportar error
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </Card>

              {message.role === "user" && (
                <Avatar className="h-8 w-8 sm:h-9 sm:w-9 flex-shrink-0 ring-2 ring-blue-100 dark:ring-blue-900">
                  <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-700 text-white">
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <Avatar className="h-8 w-8 sm:h-9 sm:w-9 ring-2 ring-blue-100 dark:ring-blue-900">
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                  <Scale className="h-4 w-4 sm:h-5 sm:w-5" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin text-blue-600" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Pensando...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 md:p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, y: 10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: 10, height: 0 }}
                className="overflow-hidden mb-2"
              >
                <FiltroMaterias selectedMaterias={selectedMaterias} onChange={setSelectedMaterias} />
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 items-center">
              <Button
                type="button"
                variant={showFilters ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={`h-12 w-12 rounded-2xl border transition-all shadow-sm flex-shrink-0 ${showFilters ? "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800" : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400"}`}
                title="Filtrar materias"
              >
                <Filter className="h-5 w-5" />
                {selectedMaterias.length > 0 && !showFilters && (
                  <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                )}
              </Button>
              <div className="flex-1 relative flex items-center">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={voiceMode ? "Escuchando..." : "Haz una pregunta legal..."}
                  disabled={isLoading || isSpeaking}
                  className="w-full text-sm sm:text-base h-12 rounded-2xl border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pr-12 focus-visible:ring-blue-500 transition-all shadow-sm"
                />
                <div className="absolute right-1">
                  <Button
                    type="submit"
                    disabled={isLoading || isSpeaking || !input.trim()}
                    size="icon"
                    className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md disabled:bg-slate-200 dark:disabled:bg-slate-800"
                  >
                    {isLoading || isSpeaking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-1">
                <VoiceInput
                  onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)}
                  disabled={isLoading || isSpeaking}
                />
                <VoiceModeToggle
                  enabled={voiceMode}
                  onToggle={setVoiceMode}
                  disabled={isLoading || isSpeaking}
                />
              </div>

              {voiceMode && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tighter animate-pulse"
                >
                  Voz Activa
                </motion.span>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
