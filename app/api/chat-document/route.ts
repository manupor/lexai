import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { searchLegalByKeyword } from '@/lib/legal-loader'

export async function POST(request: NextRequest) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      return NextResponse.json(
        { error: 'La API key de OpenAI no está configurada' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { question, documentContent, documentAnalysis, chatHistory = [] } = body

    if (!question) {
      return NextResponse.json(
        { error: 'La pregunta es requerida' },
        { status: 400 }
      )
    }

    // Verificar si la pregunta menciona el Código de Comercio
    const mentionsCodigoComercio = /c[óo]digo\s+de\s+comercio|comercial|comerciante|sociedad\s+(mercantil|an[óo]nima|limitada|colectiva)|contrato\s+mercantil|t[íi]tulos?\s+valores?|letra\s+de\s+cambio|pagar[ée]|cheque|quiebra|comercio/i.test(question)
    
    // Verificar si la pregunta menciona el Código Civil
    const mentionsCodigoCivil = /c[óo]digo\s+civil|derecho\s+civil|contrato|obligaci[óo]n|propiedad|matrimonio|divorcio|familia|sucesi[óo]n|herencia|testamento|persona|capacidad|bienes|arrendamiento|compraventa|donaci[óo]n|pr[ée]stamo|mandato|fianza|hipoteca|servidumbre|usufructo|nulidad|rescisi[óo]n|resoluci[óo]n|responsabilidad\s+civil|da[ñn]os?\s+y\s+perjuicios|patria\s+potestad|pensi[óo]n\s+alimentaria|tutela|curatela|adopci[óo]n/i.test(question)
    
    let additionalContext = ''
    
    // Buscar en Código de Comercio si es relevante
    if (mentionsCodigoComercio) {
      try {
        const relevantArticles = await searchLegalByKeyword('codigo-comercio', question, 3)
        if (relevantArticles.length > 0) {
          const articlesText = relevantArticles.map(a => `Artículo ${a.number}: ${a.content}`).join('\n\n---\n\n')
          additionalContext += `\n\n**TEXTO LITERAL DEL CÓDIGO DE COMERCIO DE COSTA RICA (Ley N° 3284):**\n\nDEBES citar estos artículos TEXTUALMENTE en tu respuesta. NO parafrasees.\n\n${articlesText}`
        }
      } catch (error) {
        console.error('Error al buscar en Código de Comercio:', error)
      }
    }
    
    // Buscar en Código Civil si es relevante
    if (mentionsCodigoCivil) {
      try {
        const relevantArticles = await searchLegalByKeyword('codigo-civil', question, 3)
        if (relevantArticles.length > 0) {
          const articlesText = relevantArticles.map(a => `Artículo ${a.number}: ${a.content}`).join('\n\n---\n\n')
          additionalContext += `\n\n**TEXTO LITERAL DEL CÓDIGO CIVIL DE COSTA RICA (Ley N° 63):**\n\nDEBES citar estos artículos TEXTUALMENTE en tu respuesta. NO parafrasees.\n\n${articlesText}`
        }
      } catch (error) {
        console.error('Error al buscar en Código Civil:', error)
      }
    }

    // Construir el contexto para la IA
    const systemPrompt = `Eres un experto abogado especializado en el sistema jurídico de Costa Rica.

Tienes acceso a un documento legal que ya has analizado. Tu tarea es responder preguntas específicas sobre este documento.

DOCUMENTO ANALIZADO:
${documentContent.substring(0, 5000)}

ANÁLISIS PREVIO:
${documentAnalysis}
${additionalContext}

Responde las preguntas de forma:
- Precisa y directa
- Basada en el contenido del documento
- Con referencias específicas a secciones o cláusulas
- Profesional pero comprensible
- Citando leyes de Costa Rica cuando sea relevante`

    // Construir mensajes para OpenAI
    const messages: any[] = [
      { role: 'system', content: systemPrompt }
    ]

    // Agregar historial de chat (últimos 5 mensajes para no exceder límites)
    const recentHistory = chatHistory.slice(-5)
    recentHistory.forEach((msg: any) => {
      messages.push({
        role: msg.role,
        content: msg.content
      })
    })

    // Agregar pregunta actual
    messages.push({
      role: 'user',
      content: question
    })

    // Llamar a OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    })

    const answer = completion.choices[0].message.content
    const tokensUsed = completion.usage?.total_tokens || 0

    return NextResponse.json({
      answer,
      tokensUsed
    })
  } catch (error: any) {
    console.error('Error en chat de documento:', error)
    
    // Manejar errores específicos de OpenAI
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'API key de OpenAI inválida' },
        { status: 401 }
      )
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Sin créditos en OpenAI' },
        { status: 402 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espera un momento.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al procesar la pregunta' },
      { status: 500 }
    )
  }
}
