import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, Footer, PageNumber, Header, SimpleField,
} from 'docx'

export const dynamic = 'force-dynamic'

function htmlToDocxParagraphs(html: string): Paragraph[] {
  const paragraphs: Paragraph[] = []
  const normalized = html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '<h1>$1</h1>')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '<h2>$1</h2>')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '<h3>$1</h3>')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '<p>$1</p>')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '<li>$1</li>')
    .replace(/<br\s*\/?>/gi, '\n')

  const blocks = normalized.match(/<(h[1-3]|p|li)>([\s\S]*?)<\/\1>/gi) || []

  for (const block of blocks) {
    const tag = block.match(/^<(h[1-3]|p|li)/)?.[1] || 'p'
    const content = block
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()

    if (!content) continue

    if (tag === 'h1') {
      paragraphs.push(new Paragraph({ text: content, heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }))
    } else if (tag === 'h2') {
      paragraphs.push(new Paragraph({ text: content, heading: HeadingLevel.HEADING_2 }))
    } else if (tag === 'h3') {
      paragraphs.push(new Paragraph({ text: content, heading: HeadingLevel.HEADING_3 }))
    } else if (tag === 'li') {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: `• ${content}`, size: 22 })] }))
    } else {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: content, size: 22 })],
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 120 },
      }))
    }
  }

  if (paragraphs.length === 0 && html.trim()) {
    const text = html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    paragraphs.push(new Paragraph({ children: [new TextRun({ text, size: 22 })] }))
  }

  return paragraphs
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    const { titulo, contenidoHtml } = await request.json()

    const fechaGeneracion = new Date().toLocaleDateString('es-CR', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

    const bodyParagraphs = htmlToDocxParagraphs(contenidoHtml)

    const doc = new Document({
      sections: [{
        properties: {
          page: {
            margin: { top: 1417, bottom: 1417, left: 1417, right: 1417 },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: 'LexAI CR', bold: true, color: '10B981', size: 24 }),
                  new TextRun({ text: '  —  Documento Legal', size: 20, color: '666666' }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: `Generado el ${fechaGeneracion}  |  Página `, size: 18, color: '888888' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, color: '888888' }),
                ],
                alignment: AlignmentType.RIGHT,
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            text: titulo,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
          }),
          ...bodyParagraphs,
        ],
      }],
    })

    const buffer = await Packer.toBuffer(doc)

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(titulo)}.docx"`,
      },
    })
  } catch (error: any) {
    console.error('DOCX export error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
