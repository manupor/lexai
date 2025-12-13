/**
 * DOCUMENT PARSER - SIMPLIFIED
 * 
 * PDF support removed (use pre-processed legal codes instead)
 * Only supports .txt and .docx files now
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
      // PDF support removed - use pre-processed legal codes instead
      return NextResponse.json(
        { 
          error: 'Los archivos PDF ya no son soportados. Para consultas legales, usa el chat principal que tiene acceso a los códigos de Costa Rica. Para otros documentos, usa archivos .txt o .docx.' 
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
