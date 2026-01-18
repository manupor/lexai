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
import { prisma } from '@/lib/prisma'
// TODO: Uncomment when implementing token system
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { checkTokenLimit, deductTokens, getUserTokens } from '@/lib/token-manager'

// Mapeo de códigos a IDs en la base de datos
// IMPORTANTE: Estos deben coincidir EXACTAMENTE con los códigos en la tabla LegalCode
const CODE_MAP: Record<string, string> = {
  'codigo-civil': 'codigo-civil',
  'codigo-comercio': 'codigo-comercio',
  'codigo-trabajo': 'codigo-trabajo',
  'codigo-procesal-penal': 'codigo-procesal-penal',
  'codigo-penal': 'codigo-penal'
}

// Mapeo de códigos a nombres completos
const CODE_NAMES: Record<string, string> = {
  'codigo-civil': 'Código Civil de Costa Rica (Ley N° 63)',
  'codigo-comercio': 'Código de Comercio de Costa Rica (Ley N° 3284)',
  'codigo-trabajo': 'Código de Trabajo de Costa Rica (Ley N° 2)',
  'codigo-procesal-penal': 'Código Procesal Penal de Costa Rica (Ley N° 7594)',
  'codigo-penal': 'Código Penal de Costa Rica (Ley N° 4573)'
}

// Buscar artículo por número en la base de datos
async function searchLegalArticle(codeName: string, articleNumber: string) {
  try {
    const codeId = CODE_MAP[codeName]
    if (!codeId) {
      console.log(`Código no encontrado: ${codeName}`)
      return null
    }

    console.log(`Buscando artículo ${articleNumber} en código ${codeId}`)

    const article = await prisma.article.findFirst({
      where: {
        legalCode: { code: codeId },
        number: articleNumber
      }
    })

    if (article) {
      console.log(`✅ Artículo ${articleNumber} encontrado en ${codeName}`)
    } else {
      console.log(`❌ Artículo ${articleNumber} NO encontrado en ${codeName}`)
    }

    return article ? { number: article.number, content: article.content } : null
  } catch (error) {
    console.error(`Error buscando artículo ${articleNumber} en ${codeName}:`, error)
    return null
  }
}

// Buscar artículos por palabra clave
async function searchLegalByKeyword(codeName: string, keyword: string, maxResults: number = 2) {
  try {
    const codeId = CODE_MAP[codeName]
    if (!codeId) return []

    const articles = await prisma.article.findMany({
      where: {
        legalCode: { code: codeId },
        content: { contains: keyword, mode: 'insensitive' }
      },
      take: maxResults
    })

    console.log(`Búsqueda keyword "${keyword}" en ${codeName}: ${articles.length} resultados`)

    return articles.map((a: any) => ({ number: a.number, content: a.content }))
  } catch (error) {
    console.error(`Error buscando keyword "${keyword}" en ${codeName}:`, error)
    return []
  }
}

// Formatear artículo para el chat
function formatArticleForChat(article: { number: string; content: string }, codeName: string): string {
  const codeTitle = CODE_NAMES[codeName] || 'Código Legal de Costa Rica'
  return `**${codeTitle}**

**Artículo ${article.number}:**
> ${article.content}

---`
}

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
    const lowerQuery = message.toLowerCase()

    // 1. Detect if user asks for specific article number
    // Match variations: artículo, articulo, articuli, art, etc.
    const articleMatch = message.match(/art[íi]cul?[oi]?\s+(\d+)/i)

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

      // Try Código de Trabajo
      let targetCodeName: string | null = null;

      // Prioritize specific code mentions
      if (/(procesal\s*penal|procesal\s*pp|cpp)/i.test(lowerQuery)) {
        console.log('Detectado: Código Procesal Penal')
        targetCodeName = 'codigo-procesal-penal'
      } else if (/(penal|cp)/i.test(lowerQuery)) {
        console.log('Detectado: Código Penal')
        targetCodeName = 'codigo-penal'
      } else if (/(civil|cc)/i.test(lowerQuery)) {
        console.log('Detectado: Código Civil')
        targetCodeName = 'codigo-civil'
      } else if (/(comercio|comercial)/i.test(lowerQuery)) {
        console.log('Detectado: Código de Comercio')
        targetCodeName = 'codigo-comercio'
      } else if (/(trabajo|laboral)/i.test(lowerQuery)) {
        console.log('Detectado: Código de Trabajo')
        targetCodeName = 'codigo-trabajo'
      }

      if (targetCodeName) {
        const article = await searchLegalArticle(targetCodeName, articleNumber);
        if (article) {
          foundRelevantLaw = true;
          additionalContext += `\n\n${formatArticleForChat(article, targetCodeName)}\n`;
        }
      } else {
        // If no specific code mentioned, try all codes
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

        // Try Código de Trabajo
        const trabajoArticle = await searchLegalArticle('codigo-trabajo', articleNumber)
        if (trabajoArticle) {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(trabajoArticle, 'codigo-trabajo')}\n`
        }

        // Try Código Procesal Penal
        const penalProcesalArticle = await searchLegalArticle('codigo-procesal-penal', articleNumber)
        if (penalProcesalArticle) {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(penalProcesalArticle, 'codigo-procesal-penal')}\n`
        }

        // Try Código Penal
        const penalArticle = await searchLegalArticle('codigo-penal', articleNumber)
        if (penalArticle) {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(penalArticle, 'codigo-penal')}\n`
        }
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
        civilResults.forEach((article: { number: string; content: string }) => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-civil')}\n`
        })

        // Search in Código de Comercio
        const comercioResults = await searchLegalByKeyword('codigo-comercio', keyword, 2)
        comercioResults.forEach((article: { number: string; content: string }) => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-comercio')}\n`
        })

        // Search in Código de Trabajo
        const trabajoResults = await searchLegalByKeyword('codigo-trabajo', keyword, 2)
        trabajoResults.forEach((article: { number: string; content: string }) => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-trabajo')}\n`
        })

        // Search in Código Procesal Penal
        const penalResults = await searchLegalByKeyword('codigo-procesal-penal', keyword, 2)
        penalResults.forEach((article: { number: string; content: string }) => {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, 'codigo-procesal-penal')}\n`
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
