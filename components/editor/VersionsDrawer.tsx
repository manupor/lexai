"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, RotateCcw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DocumentVersion } from '@/types/editor'

interface VersionsDrawerProps {
  open: boolean
  onClose: () => void
  documentId: string
  onRestore: (contenidoHtml: string) => void
}

export function VersionsDrawer({ open, onClose, documentId, onRestore }: VersionsDrawerProps) {
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (open) fetchVersions()
  }, [open, documentId])

  async function fetchVersions() {
    setLoading(true)
    try {
      const res = await fetch(`/api/editor/documents/${documentId}/versions`)
      if (res.ok) setVersions(await res.json())
    } catch {
      toast.error('Error al cargar versiones')
    } finally {
      setLoading(false)
    }
  }

  async function handleRestore(versionId: string) {
    setRestoring(versionId)
    try {
      const res = await fetch(
        `/api/editor/documents/${documentId}/versions/${versionId}/restore`,
        { method: 'POST' }
      )
      if (!res.ok) throw new Error('Error al restaurar')
      const doc = await res.json()
      onRestore(doc.contenidoHtml)
      toast.success('Versión restaurada exitosamente')
      onClose()
    } catch {
      toast.error('Error al restaurar versión')
    } finally {
      setRestoring(null)
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
            className="fixed inset-0 bg-black/60 z-40"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-[#1e293b] border-l border-slate-700 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-400" />
                <h2 className="font-semibold text-white">Historial de Versiones</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-emerald-400" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <Clock className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No hay versiones guardadas</p>
                  <p className="text-xs mt-1 opacity-70">Se guardan automáticamente al editar</p>
                </div>
              ) : (
                versions.map((v, idx) => (
                  <div
                    key={v.id}
                    className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-emerald-400">
                        Versión {versions.length - idx}
                      </span>
                      <span className="text-xs text-slate-500">
                        {new Date(v.createdAt).toLocaleString('es-CR', {
                          day: '2-digit', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                      {v.contenidoHtml.replace(/<[^>]+>/g, '').slice(0, 100)}...
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full h-7 text-xs border-slate-600 text-slate-300 hover:bg-emerald-600/20 hover:border-emerald-500 hover:text-emerald-300"
                      onClick={() => handleRestore(v.id)}
                      disabled={restoring === v.id}
                    >
                      {restoring === v.id ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <RotateCcw className="h-3 w-3 mr-1" />
                      )}
                      Restaurar
                    </Button>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-700">
              <p className="text-xs text-slate-500 text-center">Máximo 10 versiones por documento</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
