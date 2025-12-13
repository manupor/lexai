import { NextRequest, NextResponse } from 'next/server'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
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
      // Procesar PDF con pdfjs
      try {
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdfDocument = await loadingTask.promise
        
        const textParts = []
        for (let i = 1; i <= pdfDocument.numPages; i++) {
          const page = await pdfDocument.getPage(i)
          const content = await page.getTextContent()
          const pageText = content.items.map((item: any) => item.str).join(' ')
          textParts.push(pageText)
        }
        text = textParts.join('\n\n')
      } catch (error) {
        return NextResponse.json(
          { error: 'Error al procesar el PDF. Intenta con un archivo TXT o DOCX.' },
          { status: 400 }
        )
      }
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
