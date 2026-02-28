"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import {
  Save, FileDown, ChevronDown, Clock, PenLine,
  ArrowLeft, Loader2, CheckCircle2, FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { VersionsDrawer } from '@/components/editor/VersionsDrawer'
import { FirmaModal } from '@/components/editor/FirmaModal'
import { FirmaStatusPanel } from '@/components/editor/FirmaStatusPanel'
import type { DocumentEditor, FirmaRequest } from '@/types/editor'

const AUTOSAVE_INTERVAL = 30_000

export default function EditorPage() {
  const { documentId } = useParams() as { documentId: string }
  const router = useRouter()
  const { data: session } = useSession()

  const [doc, setDoc] = useState<DocumentEditor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [versionsOpen, setVersionsOpen] = useState(false)
  const [firmaOpen, setFirmaOpen] = useState(false)
  const [firmaRequests, setFirmaRequests] = useState<FirmaRequest[]>([])

  const lastSavedContent = useRef<string>('')
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-slate max-w-none focus:outline-none min-h-[500px] px-8 py-6 font-serif text-slate-100 leading-relaxed',
      },
    },
    onUpdate: ({ editor }) => {
      scheduleAutosave(editor.getHTML())
    },
  })

  useEffect(() => {
    fetchDocument()
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [documentId])

  async function fetchDocument() {
    try {
      const res = await fetch(`/api/editor/documents/${documentId}`)
      if (!res.ok) { router.push('/dashboard/documentos'); return }
      const data: DocumentEditor = await res.json()
      setDoc(data)
      editor?.commands.setContent(data.contenidoHtml || '')
      lastSavedContent.current = data.contenidoHtml || ''
      setFirmaRequests(data.firmaRequests || [])
    } catch {
      toast.error('Error al cargar el documento')
    } finally {
      setLoading(false)
    }
  }

  function scheduleAutosave(html: string) {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      if (html !== lastSavedContent.current) saveDocument(html, true)
    }, AUTOSAVE_INTERVAL)
  }

  const saveDocument = useCallback(async (html?: string, createVersion = false) => {
    const content = html ?? editor?.getHTML() ?? ''
    setSaveStatus('saving')
    try {
      const res = await fetch(`/api/editor/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenidoHtml: content, createVersion }),
      })
      if (!res.ok) throw new Error('Error al guardar')
      lastSavedContent.current = content
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch {
      setSaveStatus('idle')
      toast.error('Error al guardar el documento')
    }
  }, [editor, documentId])

  async function handleExport(format: 'pdf' | 'docx') {
    if (!doc) return
    const content = editor?.getHTML() || ''
    try {
      const res = await fetch(`/api/editor/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: doc.titulo, contenidoHtml: content }),
      })
      if (!res.ok) throw new Error('Error al exportar')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${doc.titulo}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error(`Error al exportar como ${format.toUpperCase()}`)
    }
  }

  async function refreshFirmaStatus() {
    const res = await fetch(`/api/firma/${documentId}/status`)
    if (res.ok) setFirmaRequests(await res.json())
  }

  const wordCount = editor
    ? editor.getText().split(/\s+/).filter(Boolean).length
    : 0

  const latestFirma = firmaRequests[0] ?? null

  const estadoBadge: Record<string, React.ReactElement> = {
    borrador: <Badge className="bg-slate-700 text-slate-300 border-slate-600 border">Borrador</Badge>,
    revision: <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 border">⏳ En revisión</Badge>,
    firmado: <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">✅ Firmado</Badge>,
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0f172a]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
      </div>
    )
  }

  if (!doc) return null

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-800 bg-[#1e293b]">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/documentos')}
            className="text-slate-400 hover:text-white flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <h1 className="font-semibold text-white truncate text-sm md:text-base">
            {doc.titulo}
          </h1>
          {estadoBadge[doc.estado] ?? null}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {saveStatus === 'saving' && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Loader2 className="h-3 w-3 animate-spin" /> Guardando...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Guardado ✓
            </span>
          )}

          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-700 h-8"
            onClick={() => setVersionsOpen(true)}
          >
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Versiones</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:bg-slate-700 h-8"
            onClick={() => saveDocument(undefined, true)}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" />
            <span className="hidden sm:inline">Guardar</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-700 h-8">
                <FileDown className="h-3.5 w-3.5 mr-1.5" />
                <span className="hidden sm:inline">Exportar</span>
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
              <DropdownMenuItem onClick={() => handleExport('pdf')} className="text-slate-300 hover:text-white cursor-pointer">
                📄 Exportar como PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('docx')} className="text-slate-300 hover:text-white cursor-pointer">
                📝 Exportar como Word (.docx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {doc.estado !== 'firmado' && (
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white h-8"
              onClick={() => setFirmaOpen(true)}
            >
              <PenLine className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline">Firmar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 py-6">
            {/* Firma status */}
            {latestFirma && (
              <div className="mb-4">
                <FirmaStatusPanel
                  documentId={documentId}
                  firmaRequest={latestFirma}
                  onRefresh={refreshFirmaStatus}
                />
              </div>
            )}

            {/* Tiptap Editor card */}
            <div className="bg-[#1e293b] rounded-lg border border-slate-700 shadow-xl overflow-hidden">
              <EditorToolbar editor={editor} />
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-2 border-t border-slate-800 bg-[#1e293b] flex items-center justify-between text-xs text-slate-500">
        <span>{wordCount} palabras</span>
        <span>
          Última modificación:{' '}
          {new Date(doc.updatedAt).toLocaleString('es-CR', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
          })}
        </span>
      </div>

      {/* Drawers & Modals */}
      <VersionsDrawer
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        documentId={documentId}
        onRestore={(html) => {
          editor?.commands.setContent(html)
          lastSavedContent.current = html
        }}
      />

      <FirmaModal
        open={firmaOpen}
        onClose={() => setFirmaOpen(false)}
        documentId={documentId}
        documentTitle={doc.titulo}
        contenidoHtml={editor?.getHTML() || ''}
        currentUserName={session?.user?.name || ''}
        currentUserEmail={session?.user?.email || ''}
        onSuccess={() => {
          refreshFirmaStatus()
          setDoc(prev => prev ? { ...prev, estado: 'revision' } : prev)
        }}
      />
    </div>
  )
}
