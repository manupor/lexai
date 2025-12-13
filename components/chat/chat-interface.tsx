"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Loader2, Scale, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { VoiceInput } from "@/components/voice-input"
import { VoiceModeToggle } from "@/components/voice-mode-toggle"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  tokensUsed?: number
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

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 overscroll-contain" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 sm:py-12 text-center px-3 sm:px-4">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur-xl opacity-30 animate-pulse"></div>
                <Scale className="relative h-14 w-14 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-500" />
              </div>
              <h3 className="mb-3 text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Bienvenido a LexAI Costa Rica</h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-md">
                Realiza consultas sobre leyes costarricenses, analiza documentos o genera opiniones legales.
              </p>
              <div className="mt-6 sm:mt-8 grid gap-3 text-left w-full max-w-md px-2">
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
                className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] p-3.5 sm:p-4 shadow-sm ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] sm:text-sm leading-relaxed">
                  {message.role === "assistant" ? (
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  ) : (
                    <p>{message.content}</p>
                  )}
                </div>
                {message.tokensUsed && (
                  <p className="mt-2 text-xs text-gray-500">
                    Tokens usados: {message.tokensUsed}
                  </p>
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

      <div className="border-t border-slate-200 dark:border-slate-800 p-3 sm:p-4 flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-lg">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <div className="flex gap-2">
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
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voiceMode ? "Modo voz activado..." : "Escribe tu consulta..."}
            disabled={isLoading || isSpeaking}
            className="flex-1 text-sm sm:text-base h-10 sm:h-11 rounded-xl border-slate-300 dark:border-slate-700 focus-visible:ring-blue-500"
          />
          <Button 
            type="submit" 
            disabled={isLoading || isSpeaking || !input.trim()}
            size="default"
            className="h-10 w-10 sm:h-11 sm:w-11 p-0 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 active:scale-95 transition-all"
          >
            {isLoading || isSpeaking ? (
              <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            ) : (
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </Button>
        </form>
        {voiceMode && (
          <p className="text-xs text-green-600 mt-2 text-center">
            🎤 Modo conversación por voz activado
          </p>
        )}
      </div>
    </div>
  )
}
