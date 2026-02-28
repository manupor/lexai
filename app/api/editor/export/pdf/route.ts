import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import React from 'react'

export const dynamic = 'force-dynamic'

function htmlToPlainText(html: string): string {
  return html
    .replace(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/gi, '\n\n$1\n\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '$1')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '$1')
    .replace(/<u[^>]*>(.*?)<\/u>/gi, '$1')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '\n• $1')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { titulo, contenidoHtml } = await request.json()

    const { renderToBuffer } = await import('@react-pdf/renderer')
    const { LegalPdfDocument } = await import('@/lib/pdf-template')

    const cleanText = htmlToPlainText(contenidoHtml)
    const fechaGeneracion = new Date().toLocaleDateString('es-CR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const element = React.createElement(LegalPdfDocument, { titulo, cleanText, fechaGeneracion })
    const buffer = await renderToBuffer(element as any)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(titulo)}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('PDF export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
