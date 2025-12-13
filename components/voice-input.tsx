"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Mic, MicOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceInputProps {
  onTranscript: (text: string) => void
  disabled?: boolean
}

export function VoiceInput({ onTranscript, disabled = false }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      })

      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        
        // Enviar a Whisper API
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start()
      mediaRecorderRef.current = mediaRecorder
      setIsRecording(true)
    } catch (error) {
      console.error('Error al acceder al micrófono:', error)
      alert('No se pudo acceder al micrófono. Por favor verifica los permisos.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsProcessing(true)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')

      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al transcribir')
      }

      if (data.text) {
        onTranscript(data.text)
      }
    } catch (error: any) {
      console.error('Error al transcribir:', error)
      alert('Error al transcribir el audio: ' + error.message)
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Button
      type="button"
      variant={isRecording ? "destructive" : "outline"}
      size="icon"
      onClick={toggleRecording}
      disabled={disabled || isProcessing}
      className={cn(
        "transition-all",
        isRecording && "animate-pulse"
      )}
      title={isRecording ? "Detener grabación" : "Grabar voz"}
    >
      {isProcessing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <MicOff className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  )
}
