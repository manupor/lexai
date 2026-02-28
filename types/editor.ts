export interface DocumentEditor {
  id: string
  userId: string
  titulo: string
  contenidoHtml: string
  tipo: DocumentTipo
  estado: DocumentEstado
  createdAt: string
  updatedAt: string
  versions?: DocumentVersion[]
  firmaRequests?: FirmaRequest[]
}

export type DocumentTipo = 'apelacion' | 'contrato' | 'escrito' | 'otro'
export type DocumentEstado = 'borrador' | 'revision' | 'firmado'

export interface DocumentVersion {
  id: string
  documentId: string
  contenidoHtml: string
  createdAt: string
}

export interface Firmante {
  nombre: string
  email: string
}

export interface FirmaRequest {
  id: string
  documentId: string
  signatureRequestId: string | null
  firmantes: Firmante[]
  estado: 'pendiente' | 'firmado' | 'cancelado'
  pdfFirmadoUrl: string | null
  createdAt: string
  completadoAt: string | null
}
