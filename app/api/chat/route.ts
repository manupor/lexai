/**
 * CHAT API ROUTE - PRODUCTION ARCHITECTURE
 * 
 * WHY THIS DESIGN:
 * - NO runtime PDF parsing (fast responses < 2s)
 * - Uses pre-processed JSON files from /data/processed (DIRECT READ)
 * - O(1) article lookup by number via in-memory index
 * - Deterministic legal citations
 * - No database dependency for legal data — all 3,734 articles loaded from JSON
 * - No worker errors, no Buffer issues
 */

import { NextRequest, NextResponse } from 'next/server'
import { openai, LEGAL_SYSTEM_PROMPT } from '@/lib/openai'
import { readFileSync } from 'fs'
import { join } from 'path'
// TODO: Uncomment when implementing token system
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
// import { checkTokenLimit, deductTokens, getUserTokens } from '@/lib/token-manager'

// ============================================================
// JSON-BASED KNOWLEDGE BASE (no database dependency)
// ============================================================

interface RawArticle {
  number?: number
  article?: number
  title?: string
  content?: string
  text?: string
  law?: string
}

interface NormalizedArticle {
  number: string
  content: string
}

// In-memory cache: code -> Map<articleNumber, article>
const codeCache: Record<string, NormalizedArticle[]> = {}
// Index for O(1) lookup: code -> Map<articleNumber, article[]>
const codeIndex: Record<string, Map<string, NormalizedArticle[]>> = {}

const ALL_CODES = [
  'codigo-civil',
  'codigo-comercio',
  'codigo-trabajo',
  'codigo-penal',
  'codigo-procesal-penal',
]

// Mapeo de códigos a nombres completos
const CODE_NAMES: Record<string, string> = {
  'codigo-civil': 'Código Civil de Costa Rica (Ley N° 63)',
  'codigo-comercio': 'Código de Comercio de Costa Rica (Ley N° 3284)',
  'codigo-trabajo': 'Código de Trabajo de Costa Rica (Ley N° 2)',
  'codigo-procesal-penal': 'Código Procesal Penal de Costa Rica (Ley N° 7594)',
  'codigo-penal': 'Código Penal de Costa Rica (Ley N° 4573)',
}

/**
 * Load a legal code from its JSON file and cache it in memory.
 * Handles both article schemas (number/content vs article/text).
 */
function loadCode(codeName: string): NormalizedArticle[] {
  if (codeCache[codeName]) return codeCache[codeName]

  try {
    const filePath = join(process.cwd(), 'data', 'processed', `${codeName}.json`)
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw)

    const articles: NormalizedArticle[] = (data.articles || [])
      .map((a: RawArticle) => {
        const num = String(a.number ?? a.article ?? '0')
        const content = a.content ?? a.text ?? ''
        if (!content) return null
        return { number: num, content }
      })
      .filter((a: NormalizedArticle | null): a is NormalizedArticle => a !== null)

    // Build index for O(1) lookup
    const index = new Map<string, NormalizedArticle[]>()
    for (const art of articles) {
      const existing = index.get(art.number) || []
      existing.push(art)
      index.set(art.number, existing)
    }

    codeCache[codeName] = articles
    codeIndex[codeName] = index
    console.log(`📚 Loaded ${codeName}: ${articles.length} articles`)
    return articles
  } catch (error) {
    console.error(`❌ Error loading ${codeName}:`, error)
    codeCache[codeName] = []
    codeIndex[codeName] = new Map()
    return []
  }
}

/**
 * Pre-load all codes on first request. Cached for subsequent requests.
 */
function ensureAllCodesLoaded() {
  for (const code of ALL_CODES) {
    loadCode(code)
  }
}

/**
 * Search for a specific article by number in a code.
 * O(1) lookup via the in-memory index.
 */
function searchLegalArticle(codeName: string, articleNumber: string): NormalizedArticle | null {
  if (!ALL_CODES.includes(codeName)) {
    console.log(`Código no reconocido: ${codeName}`)
    return null
  }

  ensureAllCodesLoaded()

  const index = codeIndex[codeName]
  if (!index) return null

  const matches = index.get(articleNumber)
  if (matches && matches.length > 0) {
    console.log(`✅ Artículo ${articleNumber} encontrado en ${codeName}`)
    return matches[0]
  }

  console.log(`❌ Artículo ${articleNumber} NO encontrado en ${codeName}`)
  return null
}

/**
 * Search articles by keyword (case-insensitive substring match).
 */
function searchLegalByKeyword(codeName: string, keyword: string, maxResults: number = 2): NormalizedArticle[] {
  if (!ALL_CODES.includes(codeName)) return []

  ensureAllCodesLoaded()

  const articles = codeCache[codeName] || []
  const keywordLower = keyword.toLowerCase()
  const results: NormalizedArticle[] = []

  for (const art of articles) {
    if (art.content.toLowerCase().includes(keywordLower)) {
      results.push(art)
      if (results.length >= maxResults) break
    }
  }

  console.log(`🔍 Keyword "${keyword}" en ${codeName}: ${results.length} resultados`)
  return results
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
    // LEGAL CONTEXT RETRIEVAL - JSON-BASED (all 5 codes, 3734 articles)
    // ============================================================

    // Pre-load all codes into memory on first request
    ensureAllCodesLoaded()

    let additionalContext = ''
    let foundRelevantLaw = false
    const lowerQuery = message.toLowerCase()

    // 1. Detect if user asks for specific article number
    // Match variations: artículo, articulo, art., etc.
    const articleMatch = message.match(/art[íi]cul?[oi]?\s+(\d+)/i)

    if (articleMatch) {
      const articleNumber = articleMatch[1]

      // Detect if user mentions a specific code
      let targetCodeName: string | null = null
      if (/(procesal\s*penal|procesal\s*pp|cpp)/i.test(lowerQuery)) {
        targetCodeName = 'codigo-procesal-penal'
      } else if (/(penal|c[oó]digo\s*penal|cp\b)/i.test(lowerQuery)) {
        targetCodeName = 'codigo-penal'
      } else if (/(civil|c[oó]digo\s*civil|cc\b)/i.test(lowerQuery)) {
        targetCodeName = 'codigo-civil'
      } else if (/(comercio|comercial)/i.test(lowerQuery)) {
        targetCodeName = 'codigo-comercio'
      } else if (/(trabajo|laboral)/i.test(lowerQuery)) {
        targetCodeName = 'codigo-trabajo'
      }

      if (targetCodeName) {
        // Search only the specified code
        console.log(`🎯 Busca artículo ${articleNumber} en ${targetCodeName}`)
        const article = searchLegalArticle(targetCodeName, articleNumber)
        if (article) {
          foundRelevantLaw = true
          additionalContext += `\n\n${formatArticleForChat(article, targetCodeName)}\n`
        }
      } else {
        // No specific code mentioned — search ALL 5 codes
        console.log(`🔍 Busca artículo ${articleNumber} en todos los códigos`)
        for (const codeName of ALL_CODES) {
          const article = searchLegalArticle(codeName, articleNumber)
          if (article) {
            foundRelevantLaw = true
            additionalContext += `\n\n${formatArticleForChat(article, codeName)}\n`
          }
        }
      }

      if (foundRelevantLaw) {
        additionalContext = `🎯 ARTÍCULO ENCONTRADO - CITA TEXTUALMENTE:\n${additionalContext}`
      }
    }

    // 2. If no specific article, do keyword search across ALL codes
    if (!foundRelevantLaw) {
      const keywords = message.toLowerCase()
        .replace(/[^a-záéíóúñü\s]/g, '')
        .split(/\s+/)
        .filter((w: string) => w.length > 4)
        .slice(0, 3)

      for (const keyword of keywords) {
        for (const codeName of ALL_CODES) {
          const results = searchLegalByKeyword(codeName, keyword, 2)
          results.forEach((article) => {
            foundRelevantLaw = true
            additionalContext += `\n\n${formatArticleForChat(article, codeName)}\n`
          })
        }
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
