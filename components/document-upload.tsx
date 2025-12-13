/**
 * DOCUMENT UPLOAD COMPONENT
 * 
 * ⚠️ NO PDF PROCESSING - By design
 * 
 * SUPPORTED:
 * - .txt files (plain text)
 * - .docx files (Word documents)
 * 
 * NOT SUPPORTED:
 * - .pdf files (to ensure fast, stable responses)
 * 
 * For legal code queries (Código Civil, Código de Comercio),
 * users should use the main chat interface which has instant
 * access to pre-processed JSON files.
 */

"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, Loader2, X, CheckCircle, Send, MessageCircle } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { VoiceInput } from "@/components/voice-input"

interface UploadedDocument {
  name: string
  size: number
  content: string
  analysis?: string
  isAnalyzing?: boolean
  chatMessages?: ChatMessage[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function DocumentUpload() {
  const [documents, setDocuments] = useState<UploadedDocument[]>([])
  const [selectedDoc, setSelectedDoc] = useState<UploadedDocument | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [isChatLoading, setIsChatLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Validar tipo de archivo
    const fileName = file.name.toLowerCase()
    const validExtensions = ['.txt', '.docx']
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      alert('Por favor sube un archivo .txt o .docx\n\n⚠️ PDFs no son soportados por diseño (para mantener respuestas rápidas).\n\nPara consultas legales, usa el chat principal que tiene acceso instantáneo a los códigos de Costa Rica.')
      return
    }

    // Validar tamaño (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('El archivo es muy grande. Máximo 10MB')
      return
    }

    // Crear documento temporal
    const newDoc: UploadedDocument = {
      name: file.name,
      size: file.size,
      content: '',
      isAnalyzing: true
    }

    setDocuments(prev => [...prev, newDoc])
    setSelectedDoc(newDoc)

    try {
      // Enviar archivo al servidor para procesamiento
      const formData = new FormData()
      formData.append('file', file)

      const parseResponse = await fetch('/api/parse-document', {
        method: 'POST',
        body: formData
      })

      const parseData = await parseResponse.json()

      if (!parseResponse.ok) {
        throw new Error(parseData.error || 'Error al procesar el archivo')
      }

      const content = parseData.text

      if (!content || content.trim().length === 0) {
        throw new Error('No se pudo extraer texto del documento')
      }

      // Actualizar documento con contenido
      setDocuments(prev => prev.map(d => 
        d.name === file.name ? { ...d, content } : d
      ))
      setSelectedDoc(prev => 
        prev?.name === file.name ? { ...prev, content } : prev
      )

      // Analizar el documento
      await analyzeDocument(newDoc, content)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      
      // Remover documento con error
      setDocuments(prev => prev.filter(d => d.name !== file.name))
      setSelectedDoc(null)
    }
    
    // Limpiar input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const analyzeDocument = async (doc: UploadedDocument, content: string) => {
    try {
      const response = await fetch('/api/analyze-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: doc.name,
          content: content
        })
      })

      let data
      try {
        data = await response.json()
      } catch (e) {
        throw new Error('Error al procesar la respuesta del servidor')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Error al analizar el documento')
      }

      // Actualizar documento con análisis
      setDocuments(prev => prev.map(d => 
        d.name === doc.name 
          ? { ...d, analysis: data.analysis, isAnalyzing: false }
          : d
      ))

      setSelectedDoc(prev => 
        prev?.name === doc.name 
          ? { ...prev, analysis: data.analysis, isAnalyzing: false }
          : prev
      )
    } catch (error: any) {
      console.error('Error:', error)
      
      setDocuments(prev => prev.map(d => 
        d.name === doc.name 
          ? { ...d, analysis: `Error: ${error.message}`, isAnalyzing: false }
          : d
      ))

      setSelectedDoc(prev => 
        prev?.name === doc.name 
          ? { ...prev, analysis: `Error: ${error.message}`, isAnalyzing: false }
          : prev
      )
    }
  }

  const removeDocument = (docName: string) => {
    setDocuments(prev => prev.filter(d => d.name !== docName))
    if (selectedDoc?.name === docName) {
      setSelectedDoc(null)
    }
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatInput.trim() || !selectedDoc || isChatLoading) return

    const userMessage: ChatMessage = {
      role: 'user',
      content: chatInput
    }

    // Agregar mensaje del usuario
    const updatedMessages = [...(selectedDoc.chatMessages || []), userMessage]
    
    setDocuments(prev => prev.map(d =>
      d.name === selectedDoc.name
        ? { ...d, chatMessages: updatedMessages }
        : d
    ))
    setSelectedDoc(prev => prev ? { ...prev, chatMessages: updatedMessages } : null)
    
    setChatInput("")
    setIsChatLoading(true)

    try {
      const response = await fetch('/api/chat-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: chatInput,
          documentContent: selectedDoc.content,
          documentAnalysis: selectedDoc.analysis,
          chatHistory: updatedMessages
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la pregunta')
      }

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.answer
      }

      const finalMessages = [...updatedMessages, assistantMessage]

      setDocuments(prev => prev.map(d =>
        d.name === selectedDoc.name
          ? { ...d, chatMessages: finalMessages }
          : d
      ))
      setSelectedDoc(prev => prev ? { ...prev, chatMessages: finalMessages } : null)

      // Scroll al final
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setIsChatLoading(false)
    }
  }

  return (
    <div className="flex h-full gap-4">
      {/* Lista de documentos */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Subir Documento</CardTitle>
            <CardDescription>
              Sube un documento legal para análisis con IA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Seleccionar Archivo
            </Button>
            <p className="mt-2 text-xs text-gray-500">
              Formatos: TXT, DOCX (máx. 10MB)
            </p>
            <p className="mt-1 text-xs text-blue-600">
              💡 Prueba con ejemplo-contrato.txt
            </p>
            <p className="mt-1 text-xs text-amber-600">
              ⚠️ PDFs no soportados (usa chat para códigos legales)
            </p>
          </CardContent>
        </Card>

        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                    selectedDoc?.name === doc.name ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                  onClick={() => setSelectedDoc(doc)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-gray-500">
                        {(doc.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.isAnalyzing && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    )}
                    {doc.analysis && !doc.isAnalyzing && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeDocument(doc.name)
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Análisis del documento */}
      <div className="flex-1">
        {!selectedDoc ? (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center">
              <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No hay documento seleccionado</h3>
              <p className="text-gray-600">
                Sube un documento legal para ver su análisis con IA
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>{selectedDoc.name}</CardTitle>
              <CardDescription>
                Análisis legal generado por IA
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto flex flex-col">
              {selectedDoc.isAnalyzing ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                  <p className="text-lg font-semibold">Analizando documento...</p>
                  <p className="text-gray-600">Esto puede tomar unos segundos</p>
                </div>
              ) : selectedDoc.analysis ? (
                <div className="flex-1 flex flex-col gap-4">
                  {/* Análisis */}
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{selectedDoc.analysis}</ReactMarkdown>
                  </div>

                  <Separator />

                  {/* Chat sobre el documento */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">Preguntas sobre el documento</h3>
                    </div>

                    {/* Mensajes del chat */}
                    {selectedDoc.chatMessages && selectedDoc.chatMessages.length > 0 && (
                      <div className="space-y-3 mb-3">
                        {selectedDoc.chatMessages.map((msg, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-100 ml-8'
                                : 'bg-gray-100 mr-8'
                            }`}
                          >
                            <div className="prose prose-sm max-w-none">
                              {msg.role === 'assistant' ? (
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              ) : (
                                <p className="m-0">{msg.content}</p>
                              )}
                            </div>
                          </div>
                        ))}
                        <div ref={chatEndRef} />
                      </div>
                    )}

                    {/* Input del chat */}
                    <form onSubmit={handleChatSubmit} className="flex gap-2">
                      <VoiceInput
                        onTranscript={(text) => setChatInput(prev => prev + (prev ? ' ' : '') + text)}
                        disabled={isChatLoading}
                      />
                      <Input
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder="Escribe o habla tu pregunta..."
                        disabled={isChatLoading}
                      />
                      <Button type="submit" disabled={isChatLoading || !chatInput.trim()}>
                        {isChatLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-600">
                  <p>No hay análisis disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
