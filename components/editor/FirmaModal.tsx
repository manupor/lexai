"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, Send, Loader2, PenLine } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import type { Firmante } from '@/types/editor'

interface FirmaModalProps {
  open: boolean
  onClose: () => void
  documentId: string
  documentTitle: string
  contenidoHtml: string
  currentUserName?: string
  currentUserEmail?: string
  onSuccess: () => void
}

export function FirmaModal({
  open, onClose, documentId, documentTitle,
  contenidoHtml, currentUserName, currentUserEmail, onSuccess,
}: FirmaModalProps) {
  const [firmantes, setFirmantes] = useState<Firmante[]>([
    { nombre: currentUserName || '', email: currentUserEmail || '' },
  ])
  const [loading, setLoading] = useState(false)

  function addFirmante() {
    if (firmantes.length >= 3) return
    setFirmantes([...firmantes, { nombre: '', email: '' }])
  }

  function removeFirmante(idx: number) {
    if (firmantes.length <= 1) return
    setFirmantes(firmantes.filter((_, i) => i !== idx))
  }

  function updateFirmante(idx: number, field: keyof Firmante, value: string) {
    const updated = [...firmantes]
    updated[idx] = { ...updated[idx], [field]: value }
    setFirmantes(updated)
  }

  async function handleSubmit() {
    const invalid = firmantes.some(f => !f.nombre.trim() || !f.email.trim())
    if (invalid) {
      toast.error('Completa nombre y email de todos los firmantes')
      return
    }

    setLoading(true)
    try {
      let pdfBase64: string | null = null
      try {
        const pdfRes = await fetch('/api/editor/export/pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo: documentTitle, contenidoHtml }),
        })
        if (pdfRes.ok) {
          const blob = await pdfRes.blob()
          pdfBase64 = await blobToBase64(blob)
        }
      } catch {
        console.warn('PDF generation failed, sending without PDF')
      }

      const res = await fetch('/api/firma/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentoId: documentId, firmantes, pdfBase64 }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Error al enviar')
      }

      toast.success('Solicitud de firma enviada exitosamente')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar solicitud de firma')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-[#1e293b] border border-slate-700 rounded-xl shadow-2xl w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                    <PenLine className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white">Enviar a Firmar</h2>
                    <p className="text-xs text-slate-400 truncate max-w-[200px]">{documentTitle}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-slate-400">
                  El documento se exportará como PDF y se enviará a los siguientes firmantes vía Dropbox Sign.
                </p>

                <div className="space-y-3">
                  {firmantes.map((f, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-3 space-y-2 border border-slate-700/50">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-emerald-400">
                          Firmante {idx + 1}
                        </span>
                        {firmantes.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-500 hover:text-red-400"
                            onClick={() => removeFirmante(idx)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <Input
                        placeholder="Nombre completo"
                        value={f.nombre}
                        onChange={e => updateFirmante(idx, 'nombre', e.target.value)}
                        className="h-8 text-sm bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                      <Input
                        placeholder="Correo electrónico"
                        type="email"
                        value={f.email}
                        onChange={e => updateFirmante(idx, 'email', e.target.value)}
                        className="h-8 text-sm bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                      />
                    </div>
                  ))}
                </div>

                {firmantes.length < 3 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-dashed border-slate-600 text-slate-400 hover:text-white hover:border-emerald-500 hover:bg-emerald-600/10"
                    onClick={addFirmante}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar firmante ({firmantes.length}/3)
                  </Button>
                )}
              </div>

              <div className="flex gap-3 p-5 pt-0">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300"
                  onClick={onClose}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar solicitud
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
