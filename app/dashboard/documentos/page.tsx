"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus, Search, FileText, Calendar, Loader2,
  Edit, FileDown, PenLine, Trash2, MoreVertical, Filter,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import type { DocumentEditor, DocumentTipo, DocumentEstado } from '@/types/editor'

const TIPO_LABELS: Record<DocumentTipo, string> = {
  apelacion: 'Apelación',
  contrato: 'Contrato',
  escrito: 'Escrito',
  otro: 'Otro',
}

const TIPO_COLORS: Record<DocumentTipo, string> = {
  apelacion: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  contrato: 'bg-purple-600/20 text-purple-400 border-purple-600/30',
  escrito: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
  otro: 'bg-slate-700 text-slate-300 border-slate-600',
}

const ESTADO_COLORS: Record<DocumentEstado, string> = {
  borrador: 'bg-slate-700 text-slate-300 border-slate-600',
  revision: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  firmado: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
}

const ESTADO_LABELS: Record<DocumentEstado, string> = {
  borrador: 'Borrador',
  revision: 'En revisión',
  firmado: 'Firmado',
}

function SkeletonCard() {
  return (
    <Card className="bg-[#1e293b] border-slate-700 animate-pulse">
      <CardContent className="p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4" />
        <div className="h-3 bg-slate-700 rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-700 rounded w-16" />
          <div className="h-5 bg-slate-700 rounded w-16" />
        </div>
      </CardContent>
    </Card>
  )
}

export default function DocumentosPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<DocumentEditor[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => { fetchDocs() }, [filterTipo, filterEstado, filterDesde, filterHasta])

  async function fetchDocs() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterTipo !== 'all') params.set('tipo', filterTipo)
      if (filterEstado !== 'all') params.set('estado', filterEstado)
      if (search) params.set('search', search)
      if (filterDesde) params.set('desde', filterDesde)
      if (filterHasta) params.set('hasta', filterHasta)
      const res = await fetch(`/api/editor/documents?${params}`)
      if (res.ok) setDocs(await res.json())
    } catch {
      toast.error('Error al cargar documentos')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    setCreating(true)
    try {
      const res = await fetch('/api/editor/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo: `Documento ${new Date().toLocaleDateString('es-CR')}`,
          tipo: 'otro',
        }),
      })
      if (!res.ok) throw new Error('Error al crear')
      const doc: DocumentEditor = await res.json()
      router.push(`/dashboard/editor/${doc.id}`)
    } catch {
      toast.error('Error al crear documento')
      setCreating(false)
    }
  }

  async function handleDelete(id: string, titulo: string) {
    if (!confirm(`¿Eliminar "${titulo}"? Esta acción no se puede deshacer.`)) return
    try {
      const res = await fetch(`/api/editor/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setDocs(docs.filter(d => d.id !== id))
      toast.success('Documento eliminado')
    } catch {
      toast.error('Error al eliminar el documento')
    }
  }

  async function handleExport(doc: DocumentEditor, format: 'pdf' | 'docx') {
    try {
      const res = await fetch(`/api/editor/export/${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ titulo: doc.titulo, contenidoHtml: doc.contenidoHtml }),
      })
      if (!res.ok) throw new Error()
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

  const filteredDocs = docs.filter(d =>
    !search || d.titulo.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: docs.length,
    borradores: docs.filter(d => d.estado === 'borrador').length,
    revision: docs.filter(d => d.estado === 'revision').length,
    firmados: docs.filter(d => d.estado === 'firmado').length,
  }

  return (
    <div className="min-h-full bg-[#0f172a] p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Editor de Documentos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Crea, edita y firma tus documentos legales
            </p>
          </div>
          <Button
            onClick={handleCreate}
            disabled={creating}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/30"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Nuevo Documento
          </Button>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, color: 'text-white' },
            { label: 'Borradores', value: stats.borradores, color: 'text-slate-400' },
            { label: 'En revisión', value: stats.revision, color: 'text-amber-400' },
            { label: 'Firmados', value: stats.firmados, color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-[#1e293b] border border-slate-700/50 rounded-lg p-4">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchDocs()}
                className="pl-9 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>
            <Button
              variant="outline"
              className="border-slate-700 text-slate-400 hover:text-white hover:border-slate-600"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#1e293b] border border-slate-700 rounded-lg"
            >
              <div className="space-y-1">
                <label className="text-xs text-slate-400">Tipo</label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="h-8 bg-slate-800 border-slate-600 text-slate-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="apelacion">Apelación</SelectItem>
                    <SelectItem value="contrato">Contrato</SelectItem>
                    <SelectItem value="escrito">Escrito</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Estado</label>
                <Select value={filterEstado} onValueChange={setFilterEstado}>
                  <SelectTrigger className="h-8 bg-slate-800 border-slate-600 text-slate-300 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="borrador">Borrador</SelectItem>
                    <SelectItem value="revision">En revisión</SelectItem>
                    <SelectItem value="firmado">Firmado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Desde</label>
                <Input
                  type="date"
                  value={filterDesde}
                  onChange={e => setFilterDesde(e.target.value)}
                  className="h-8 bg-slate-800 border-slate-600 text-slate-300 text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Hasta</label>
                <Input
                  type="date"
                  value={filterHasta}
                  onChange={e => setFilterHasta(e.target.value)}
                  className="h-8 bg-slate-800 border-slate-600 text-slate-300 text-sm"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Document grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-medium">No hay documentos aún</p>
            <p className="text-slate-600 text-sm mt-1">Crea tu primer documento legal</p>
            <Button
              onClick={handleCreate}
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={creating}
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear documento
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc, idx) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Card className="bg-[#1e293b] border-slate-700 hover:border-emerald-700/50 transition-all hover:shadow-lg hover:shadow-emerald-900/10 group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-medium text-white truncate cursor-pointer hover:text-emerald-400 transition-colors"
                          onClick={() => router.push(`/dashboard/editor/${doc.id}`)}
                        >
                          {doc.titulo}
                        </h3>
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                          <Calendar className="h-3 w-3" />
                          {new Date(doc.updatedAt).toLocaleDateString('es-CR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-44">
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white cursor-pointer"
                            onClick={() => router.push(`/dashboard/editor/${doc.id}`)}
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white cursor-pointer"
                            onClick={() => handleExport(doc, 'pdf')}
                          >
                            <FileDown className="h-3.5 w-3.5 mr-2" /> Descargar PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-slate-300 hover:text-white cursor-pointer"
                            onClick={() => handleExport(doc, 'docx')}
                          >
                            <FileDown className="h-3.5 w-3.5 mr-2" /> Descargar Word
                          </DropdownMenuItem>
                          {doc.estado !== 'firmado' && (
                            <DropdownMenuItem
                              className="text-slate-300 hover:text-white cursor-pointer"
                              onClick={() => router.push(`/dashboard/editor/${doc.id}`)}
                            >
                              <PenLine className="h-3.5 w-3.5 mr-2" /> Enviar a firmar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator className="bg-slate-700" />
                          <DropdownMenuItem
                            className="text-red-400 hover:text-red-300 cursor-pointer"
                            onClick={() => handleDelete(doc.id, doc.titulo)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className={`text-xs border ${TIPO_COLORS[doc.tipo as DocumentTipo] || TIPO_COLORS.otro}`}
                      >
                        {TIPO_LABELS[doc.tipo as DocumentTipo] || doc.tipo}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs border ${ESTADO_COLORS[doc.estado as DocumentEstado] || ESTADO_COLORS.borrador}`}
                      >
                        {ESTADO_LABELS[doc.estado as DocumentEstado] || doc.estado}
                      </Badge>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full mt-3 h-7 text-xs text-slate-500 hover:text-emerald-400 hover:bg-emerald-600/10"
                      onClick={() => router.push(`/dashboard/editor/${doc.id}`)}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Abrir editor
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* New doc card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: filteredDocs.length * 0.04 }}
            >
              <button
                onClick={handleCreate}
                disabled={creating}
                className="w-full h-full min-h-[140px] border-2 border-dashed border-slate-700 hover:border-emerald-600/50 hover:bg-emerald-600/5 rounded-lg flex flex-col items-center justify-center gap-2 text-slate-600 hover:text-emerald-400 transition-all"
              >
                {creating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Plus className="h-6 w-6" />
                )}
                <span className="text-sm">Nuevo documento</span>
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}
