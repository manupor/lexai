"use client"

import { useState } from 'react'
import { CheckCircle2, Clock, XCircle, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { FirmaRequest, Firmante } from '@/types/editor'

interface FirmaStatusPanelProps {
  documentId: string
  firmaRequest: FirmaRequest
  onRefresh: () => void
}

export function FirmaStatusPanel({ documentId, firmaRequest, onRefresh }: FirmaStatusPanelProps) {
  const [reminding, setReminding] = useState<string | null>(null)
  const firmantes = firmaRequest.firmantes as Firmante[]

  async function handleRemind(email: string) {
    setReminding(email)
    try {
      const res = await fetch(`/api/firma/${documentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmanteEmail: email }),
      })
      if (!res.ok) throw new Error('Error al enviar recordatorio')
      toast.success(`Recordatorio enviado a ${email}`)
    } catch {
      toast.error('Error al enviar recordatorio')
    } finally {
      setReminding(null)
    }
  }

  const estadoBadge = {
    pendiente: <Badge className="bg-amber-600/20 text-amber-400 border-amber-600/30 border">⏳ Pendiente de firma</Badge>,
    firmado: <Badge className="bg-emerald-600/20 text-emerald-400 border-emerald-600/30 border">✅ Firmado</Badge>,
    cancelado: <Badge className="bg-red-600/20 text-red-400 border-red-600/30 border">❌ Cancelado</Badge>,
  }[firmaRequest.estado] ?? null

  return (
    <div className="bg-slate-800/40 rounded-lg border border-slate-700/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-white">Estado de firmas</span>
        <div className="flex items-center gap-2">
          {estadoBadge}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-slate-400 hover:text-white"
            onClick={onRefresh}
            title="Actualizar estado"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {firmantes.map((f, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between bg-slate-900/40 rounded p-2.5"
          >
            <div className="flex items-center gap-2.5">
              {firmaRequest.estado === 'firmado' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              ) : firmaRequest.estado === 'cancelado' ? (
                <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
              ) : (
                <Clock className="h-4 w-4 text-amber-400 flex-shrink-0" />
              )}
              <div>
                <p className="text-sm text-white">{f.nombre}</p>
                <p className="text-xs text-slate-500">{f.email}</p>
              </div>
            </div>
            {firmaRequest.estado === 'pendiente' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-slate-400 hover:text-emerald-400 px-2"
                onClick={() => handleRemind(f.email)}
                disabled={reminding === f.email}
              >
                {reminding === f.email ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Recordar'
                )}
              </Button>
            )}
          </div>
        ))}
      </div>

      {firmaRequest.completadoAt && (
        <p className="text-xs text-slate-500">
          Completado el {new Date(firmaRequest.completadoAt).toLocaleDateString('es-CR', {
            day: '2-digit', month: 'long', year: 'numeric',
          })}
        </p>
      )}

      {firmaRequest.pdfFirmadoUrl && (
        <a
          href={firmaRequest.pdfFirmadoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-emerald-400 hover:underline"
        >
          📄 Descargar PDF firmado
        </a>
      )}
    </div>
  )
}
