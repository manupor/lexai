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
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Scale className="mb-4 h-16 w-16 text-blue-600" />
              <h3 className="mb-2 text-xl font-semibold">Bienvenido a LexAI Costa Rica</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Realiza consultas sobre leyes costarricenses, analiza documentos o genera opiniones legales.
              </p>
              <div className="mt-6 grid gap-2 text-left">
                <p className="text-sm text-gray-600">Ejemplos de consultas:</p>
                <Button
                  variant="outline"
                  className="justify-start text-left"
                  onClick={() => setInput("¿Cuáles son los requisitos para un divorcio en Costa Rica?")}
                >
                  ¿Cuáles son los requisitos para un divorcio en Costa Rica?
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left"
                  onClick={() => setInput("Explícame el artículo 45 del Código de Trabajo")}
                >
                  Explícame el artículo 45 del Código de Trabajo
                </Button>
                <Button
                  variant="outline"
                  className="justify-start text-left"
                  onClick={() => setInput("¿Qué dice la ley sobre accidentes de tránsito?")}
                >
                  ¿Qué dice la ley sobre accidentes de tránsito?
                </Button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-600 text-white">
                    <Scale className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <Card
                className={`max-w-[80%] p-4 ${
                  message.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800"
                }`}
              >
                <div className="prose prose-sm dark:prose-invert max-w-none">
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
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gray-600 text-white">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white">
                  <Scale className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              <Card className="p-4">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              </Card>
            </div>
          )}
        </div>
      </div>

      <div className="border-t p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <VoiceInput
            onTranscript={(text) => setInput(prev => prev + (prev ? ' ' : '') + text)}
            disabled={isLoading || isSpeaking}
          />
          <VoiceModeToggle
            enabled={voiceMode}
            onToggle={setVoiceMode}
            disabled={isLoading || isSpeaking}
          />
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={voiceMode ? "Modo conversación por voz activado..." : "Escribe o habla tu consulta legal..."}
            disabled={isLoading || isSpeaking}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || isSpeaking || !input.trim()}>
            {isLoading || isSpeaking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        {voiceMode && (
          <p className="text-xs text-green-600 mt-2 text-center">
            🎤 Modo conversación por voz activado - La IA responderá hablando
          </p>
        )}
      </div>
    </div>
  )
}
