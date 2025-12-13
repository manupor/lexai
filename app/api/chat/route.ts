/**
 * CHAT API ROUTE - PRODUCTION ARCHITECTURE
 * 
 * WHY THIS DESIGN:
 * - NO runtime PDF parsing (fast responses < 2s)
 * - Uses pre-processed JSON files from /data/processed
 * - O(1) article lookup by number
 * - Deterministic legal citations
 * - No worker errors, no Buffer issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { openai, LEGAL_SYSTEM_PROMPT } from '@/lib/openai'
import { searchLegalArticle, searchLegalByKeyword, formatArticleForChat } from '@/lib/legal-loader'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkTokenLimit, deductTokens, getUserTokens } from '@/lib/token-manager'

export async function POST(request: NextRequest) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      return NextResponse.json(
        { error: 'La API key de OpenAI no está configurada. Por favor configura OPENAI_API_KEY en el archivo .env' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { message, conversationId, messages = [] } = body

    if (!message) {
      return NextResponse.json(
        { error: 'El mensaje es requerido' },
        { status: 400 }
      )
    }

    // ============================================================
    // LEGAL CONTEXT RETRIEVAL - NEW ARCHITECTURE
    // ============================================================
    
    let additionalContext = ''
    let foundRelevantLaw = false
    
    // 1. Detect if user asks for specific article number
    const articleMatch = message.match(/art[íi]culo\s+(\d+)/i)
    
    if (articleMatch) {
      const articleNumber = articleMatch[1]
      
      // Try Código Civil first
      const civilArticle = await searchLegalArticle('codigo-civil', articleNumber)
      if (civilArticle) {
        foundRelevantLaw = true
        additionalContext += `\n\n${formatArticleForChat(civilArticle, 'codigo-civil')}\n`
      }
      
      // Try Código de Comercio
      const comercioArticle = await searchLegalArticle('codigo-comercio', articleNumber)
      if (comercioArticle) {
        foundRelevantLaw = true
        additionalContext += `\n\n${formatArticleForChat(comercioArticle, 'codigo-comercio')}\n`
      }
      
      if (foundRelevantLaw) {
        additionalContext = `🎯 ARTÍCULO ENCONTRADO - CITA TEXTUALMENTE:\n${additionalContext}`
      }
    }
    
    // 2. If no specific article, do keyword search
    if (!foundRelevantLaw) {
      // Extract keywords from query
      const keywords = message.toLowerCase()
        .replace(/[^a-záéíóúñü\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 4)
        .slice(0, 3)
      
      for (const keyword of keywords) {
        // Search in Código Civil
        const civilResults = await searchLegalByKeyword('codigo-civil', keyword, 2)
        civilResults.forEach(article => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-civil')}\n`
        })
        
        // Search in Código de Comercio
        const comercioResults = await searchLegalByKeyword('codigo-comercio', keyword, 2)
        comercioResults.forEach(article => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-comercio')}\n`
        })
        
        if (foundRelevantLaw) break // Stop after first keyword with results
      }
    }
    
    // 3. Add instructions based on whether we found legal context
    if (foundRelevantLaw) {
      additionalContext = `═══════════════════════════════════════════════════════════════
📚 CONTEXTO LEGAL DE COSTA RICA
═══════════════════════════════════════════════════════════════

⚖️ INSTRUCCIONES CRÍTICAS:
1. Los artículos mostrados abajo son TEXTO EXACTO de los códigos oficiales
2. DEBES citarlos TEXTUALMENTE usando el formato de cita (>)
3. NO parafrasees ni inventes contenido
4. Después de citar, puedes interpretar y analizar
5. Si el artículo no responde completamente, indica qué falta

${additionalContext}

═══════════════════════════════════════════════════════════════`
    } else {
      additionalContext = `\n\n⚠️ ADVERTENCIA: No se encontraron artículos específicos en los códigos disponibles.

📋 INSTRUCCIONES:
- Responde basándote en principios generales del derecho costarricense
- NO inventes números de artículos
- Indica claramente que no tienes el texto exacto
- Recomienda verificar en SCIJ: http://www.pgrweb.go.cr/scij/
- Sugiere consultar con un abogado colegiado`
    }

    // Construir el prompt del sistema con contexto adicional si existe
    let systemPrompt = LEGAL_SYSTEM_PROMPT
    if (additionalContext) {
      systemPrompt += additionalContext
    }

    // Construir el historial de mensajes para OpenAI
    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user' as const, content: message },
    ]

    // Llamar a OpenAI con configuración optimizada para máxima precisión
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Usar GPT-4o para mejores resultados (más preciso que mini)
      messages: chatMessages,
      temperature: 0.1, // Temperatura muy baja para máxima precisión y consistencia
      max_tokens: 3000, // Aumentar tokens para respuestas más completas
      top_p: 0.95, // Más determinístico
      frequency_penalty: 0.5, // Reducir más las repeticiones
      presence_penalty: 0.1, // Menos diversidad, más precisión
    })

    let responseMessage = completion.choices[0].message.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0

    // Agregar nota de verificación al final si no está ya incluida
    const verificationNote = '\n\n---\n⚠️ **Nota:** Verifica esta información en http://www.pgrweb.go.cr/scij/ o consulta con un abogado colegiado.'
    if (!responseMessage.includes('⚠️')) {
      responseMessage += verificationNote
    }

    // TODO: Guardar en base de datos cuando esté configurado
    // Por ahora solo retornamos la respuesta

    return NextResponse.json({
      message: responseMessage,
      tokensUsed,
      conversationId,
    })
  } catch (error: any) {
    console.error('Error en chat API:', error)
    
    // Manejar errores específicos de OpenAI
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'API key de OpenAI inválida. Por favor verifica tu configuración en el archivo .env' },
        { status: 401 }
      )
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Sin créditos en OpenAI. Por favor agrega créditos en https://platform.openai.com/account/billing' },
        { status: 402 }
      )
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor espera un momento e intenta de nuevo.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al procesar la consulta. Por favor intenta de nuevo.' },
      { status: 500 }
    )
  }
}
