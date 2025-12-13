/**
 * DOCUMENT PARSER API ROUTE
 * 
 * ⚠️ CRITICAL ARCHITECTURE DECISION:
 * NO PDF PROCESSING AT RUNTIME - BY DESIGN
 * 
 * WHY:
 * - PDF parsing is SLOW (10-30 seconds per document)
 * - PDF libraries (pdfjs-dist, pdf2json) are UNSTABLE in serverless
 * - Legal codes are PRE-PROCESSED offline into JSON (see /data/processed/)
 * - This ensures FAST (<2s), DETERMINISTIC responses
 * 
 * SUPPORTED FORMATS:
 * - .txt (plain text)
 * - .docx (Word documents via mammoth)
 * 
 * NOT SUPPORTED:
 * - .pdf (users should convert to .txt or .docx, or use main chat for legal codes)
 * 
 * For legal code queries, users should use the main chat interface which has
 * instant access to pre-processed Código Civil and Código de Comercio.
 */

import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    let text = ''

    // Convertir archivo a buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Procesar según el tipo de archivo
    if (fileName.endsWith('.pdf')) {
      // ⚠️ NO PDF PROCESSING AT RUNTIME - BY DESIGN
      // PDFs are NOT supported to ensure fast, stable responses
      return NextResponse.json(
        { 
          error: 'Archivos PDF no soportados. Para consultas legales, usa el chat principal (tiene acceso instantáneo a Código Civil y Código de Comercio). Para otros documentos, convierte a .txt o .docx.' 
        },
        { status: 400 }
      )
    } else if (fileName.endsWith('.docx')) {
      // Procesar DOCX
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (fileName.endsWith('.txt')) {
      // Procesar TXT
      text = buffer.toString('utf-8')
    } else {
      return NextResponse.json(
        { error: 'Formato de archivo no soportado. Use PDF, DOCX o TXT' },
        { status: 400 }
      )
    }

    // Validar que se extrajo texto
    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No se pudo extraer texto del documento' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      text: text.trim(),
      fileName: file.name,
      size: file.size
    })
  } catch (error: any) {
    console.error('Error al procesar documento:', error)
    return NextResponse.json(
      { error: `Error al procesar el archivo: ${error.message}` },
      { status: 500 }
    )
  }
}
