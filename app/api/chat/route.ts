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
import { prisma } from '@/lib/prisma'
import { LegalMatter } from '@prisma/client'

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
 * Normalize text for searching: lowercase and remove accents
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Search articles by keyword (accent-insensitive, case-insensitive).
 */
function searchLegalByKeyword(codeName: string, keyword: string, maxResults: number = 2): NormalizedArticle[] {
  if (!ALL_CODES.includes(codeName)) return []

  ensureAllCodesLoaded()

  const articles = codeCache[codeName] || []
  const keywordNorm = normalizeText(keyword)
  const results: NormalizedArticle[] = []

  for (const art of articles) {
    const contentNorm = normalizeText(art.content)
    if (contentNorm.includes(keywordNorm)) {
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
> ${article.content.trim()}

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

    // --- STEP 1: ARTICLE NUMBER DETECTION ---
    const articleRefs: number[] = []
    let detectedCodeName: string | null = null
    let historyCodeName: string | null = null
    let contextualAlert = ''
    let confusionRisk: 'bajo' | 'medio' | 'alto' = 'bajo'

    // 1a. Detect in current message
    const artRegex = /(?:art[íi]culo|art[íi]culos|artícu|art[s\.]?)\.?\s*(\d+)(?:\s*(?:a|al|y|hasta\s*el)\s*(\d+))?/gi
    let match
    while ((match = artRegex.exec(message)) !== null) {
      const start = parseInt(match[1])
      articleRefs.push(start)
      if (match[2]) {
        const end = parseInt(match[2])
        for (let i = start + 1; i <= Math.min(end, start + 10); i++) {
          articleRefs.push(i)
        }
      }
    }

    // 1b. Check history for code context
    if (messages.length > 0) {
      for (let i = messages.length - 1; i >= Math.max(0, messages.length - 5); i--) {
        const hMsg = messages[i].content.toLowerCase()
        if (hMsg.includes('procesal penal') || hMsg.includes('cpp')) { historyCodeName = 'codigo-procesal-penal'; break; }
        if (hMsg.includes('código penal') || hMsg.includes('cp ')) { historyCodeName = 'codigo-penal'; break; }
        if (hMsg.includes('civil') || hMsg.includes('cc ')) { historyCodeName = 'codigo-civil'; break; }
        if (hMsg.includes('comercio')) { historyCodeName = 'codigo-comercio'; break; }
        if (hMsg.includes('trabajo')) { historyCodeName = 'codigo-trabajo'; break; }
      }
    }

    // 1c. Follow-up detection
    if (articleRefs.length === 0 && messages.length > 0) {
      for (let i = messages.length - 1; i >= Math.max(0, messages.length - 3); i--) {
        const historyMatch = messages[i].content.match(/art[íi]culo\s+(\d+)/i)
        if (historyMatch) {
          articleRefs.push(parseInt(historyMatch[1]))
          detectedCodeName = historyCodeName
          break
        }
      }
    }

    if (articleRefs.length > 0) {
      // Detect code in CURRENT message
      let currentMsgCode: string | null = null
      if (/(procesal\s*penal|procesal\s*pp|cpp)/i.test(lowerQuery)) currentMsgCode = 'codigo-procesal-penal'
      else if (/(penal|c[oó]digo\s*penal|cp\b)/i.test(lowerQuery)) currentMsgCode = 'codigo-penal'
      else if (/(civil|c[oó]digo\s*civil|cc\b)/i.test(lowerQuery)) currentMsgCode = 'codigo-civil'
      else if (/(comercio|comercial)/i.test(lowerQuery)) currentMsgCode = 'codigo-comercio'
      else if (/(trabajo|laboral|patrono|empleado)/i.test(lowerQuery)) currentMsgCode = 'codigo-trabajo'

      // Detect "Mode Litigante" (Drafting resources/exceptions)
      const isLitigantMode = /(recurso|apelaci[oó]n|excepci[oó]n|escrito|demanda|querella|formal)/i.test(lowerQuery)

      // Risk & Ambiguity Logic
      if (articleRefs.length > 0 && !currentMsgCode && historyCodeName) {
        // [SAAS SAFE MODE]
        contextualAlert = `ℹ️ **Confirmación Contextual**: LexAI ha detectado que anteriormente se discutía sobre el **${historyCodeName.replace('codigo-', '').replace('-', ' ').toUpperCase()}**. Para mayor seguridad, confirme si desea continuar con este código o consultar otro.`

        // Internal Ambiguity Logging
        try {
          const { appendFileSync } = require('fs');
          const logData = { timestamp: new Date().toISOString(), type: 'history_fallback', prevCode: historyCodeName, query: message };
          appendFileSync('logs/ambiguity.log', JSON.stringify(logData) + '\n');
        } catch (e) { }

        detectedCodeName = historyCodeName
      } else if (currentMsgCode) {
        // Detected a code change - Flag Risk
        if (historyCodeName && historyCodeName !== currentMsgCode) {
          const isHighRiskPair = (historyCodeName.includes('penal') && currentMsgCode.includes('penal')) ||
            (historyCodeName.includes('civil') && currentMsgCode.includes('procesal'));
          confusionRisk = isHighRiskPair ? 'medio' : 'bajo';
        }
        detectedCodeName = currentMsgCode
      }

      console.log(`🔍 Buscando artículos: ${articleRefs.join(', ')} (Código: ${detectedCodeName || 'Todos'}, Riesgo: ${confusionRisk})`)

      // Litigant Mode override: If ambiguous but drafting, provide BOTH to be elegant
      if (isLitigantMode && !currentMsgCode && articleRefs.length > 0) {
        for (const num of articleRefs) {
          const numStr = String(num);
          for (const codeName of ALL_CODES) {
            const article = searchLegalArticle(codeName, numStr)
            if (article) {
              foundRelevantLaw = true
              additionalContext += `\n\n${formatArticleForChat(article, codeName)}\n`
            }
          }
        }
      } else {
        // Standard retrieval
        for (const num of articleRefs) {
          const numStr = String(num)
          if (detectedCodeName) {
            const article = searchLegalArticle(detectedCodeName, numStr)
            if (article) {
              foundRelevantLaw = true
              additionalContext += `\n\n${formatArticleForChat(article, detectedCodeName)}\n`
            }
          } else {
            for (const codeName of ALL_CODES) {
              const article = searchLegalArticle(codeName, numStr)
              if (article) {
                foundRelevantLaw = true
                additionalContext += `\n\n${formatArticleForChat(article, codeName)}\n`
              }
            }
          }
        }
      }
    }

    // --- STEP 2: TOPIC-BASED SEARCH (Ported from Python) ---
    // Detect key legal topics to find relevant articles even without mention of article numbers
    if (!foundRelevantLaw || articleRefs.length < 3) {
      const topicPatterns: [RegExp, string][] = [
        [/\bcontrat/i, 'contrato'],
        [/\bdespi/i, 'despido'],
        [/\bvacacion/i, 'vacaciones'],
        [/\b(?:aguinaldo|décimo.?tercer)\b/i, 'aguinaldo'],
        [/\b(?:salario|sueldo|remunerac)/i, 'salario'],
        [/\b(?:matrimonio|casar)/i, 'matrimonio'],
        [/\bdivorci/i, 'divorcio'],
        [/\b(?:herencia|hered)/i, 'herencia'],
        [/\b(?:propiedad|inmueble|terreno|finca)\b/i, 'propiedad'],
        [/\b(?:arrendamiento|alquiler|inquilin)/i, 'arrendamiento'],
        [/\b(?:sociedad|empresa|compañía|anonima|s.a.|srl)\b/i, 'sociedad'],
        [/\b(?:prescripci|prescrib|venci[oó]|vencimiento)\b/i, 'prescripción'],
        [/\b(?:obligaci|deuda|cobro|préstamo|acreedor)/i, 'obligación'],
        [/\b(?:delito|crimen|criminal)\b/i, 'delito'],
        [/\b(?:homicidio|asesinat|matar)\b/i, 'homicidio'],
        [/\b(?:robo|hurto|robar)\b/i, 'robo'],
        [/\b(?:estafa|fraude|engaño)\b/i, 'estafa'],
        [/\b(?:daños|perjuicios|indemnizaci)\b/i, 'daños'],
        [/\b(?:embargo|embargar)\b/i, 'embargo'],
        [/\b(?:alimento|pensión.?alimentaria|manutenci)/i, 'alimentos'],
        [/\b(?:jornada|horas.?extra|horario)\b/i, 'jornada laboral'],
        [/\b(?:pagar[eé]|letra|cheque|t[ií]tulo.?valor)\b/i, 'títulos valores'],
        [/\bfalsedad|firma|falso/i, 'falsedad'],
        [/\bjusta.?causa\b/i, 'despido'],
        [/\btitulo.?ejecutivo/i, 'proceso ejecutivo']
      ]

      const detectedTopics = new Set<string>()
      for (const [pattern, topic] of topicPatterns) {
        if (pattern.test(lowerQuery)) {
          detectedTopics.add(topic)
        }
      }

      const searchTerms = Array.from(detectedTopics)
      if (searchTerms.length === 0) {
        // Fallback to extraction of long words
        const fallbackKeywords = lowerQuery
          .replace(/[^a-záéíóúñü\s]/g, '')
          .split(/\s+/)
          .filter((w: string) => w.length > 5)
          .slice(0, 2)
        searchTerms.push(...fallbackKeywords)
      }

      console.log(`🔍 Temas buscados: ${searchTerms.join(', ')}`)

      const maxNewArticles = 6
      let count = 0
      for (const term of searchTerms) {
        if (count >= maxNewArticles) break
        for (const codeName of ALL_CODES) {
          const results = searchLegalByKeyword(codeName, term, 2)
          for (const art of results) {
            // Check if already added
            if (!additionalContext.includes(art.content.substring(0, 50))) {
              foundRelevantLaw = true
              additionalContext += `\n\n${formatArticleForChat(art, codeName)}\n`
              count++
              if (count >= maxNewArticles) break
            }
          }
          if (count >= maxNewArticles) break
        }
      }
    }

    // 3. Detect specialized intents (Analysis, Verification, Review)
    const isAnalysisRequest = /(analiza|verifica|corrige|chequea|revisa|error|redacta|recurso)/i.test(lowerQuery) || message.length > 200
    const isReviewMode = /(riesgo procesal|revisar escrito|auditoría|legitimación|prescripción)/i.test(lowerQuery)

    // 4. Build instructions based on context and intent
    if (foundRelevantLaw) {
      additionalContext = `═══════════════════════════════════════════════════════════════
📚 CONTEXTO LEGAL DE COSTA RICA (GROUND TRUTH)
═══════════════════════════════════════════════════════════════

⚖️ INSTRUCCIONES PARA LEXAI:
1. Los artículos mostrados abajo son EL TEXTO OFICIAL.
2. Si el usuario proporcionó un texto, COMPÁRALO con estos artículos.
3. Detecta contradicciones o errores en la cita del usuario.
4. Clasifica el resultado usando estas etiquetas:
   - [ERROR NORMATIVO]: Si cita el artículo o ley que no es.
   - [ERROR INTERPRETATIVO]: Si el contenido no coincide con la ley.
   - [ERROR DE FUNDAMENTACIÓN]: Si aplica mal la norma al caso.
   - [CORRECTO]: Si la información es precisa.

${additionalContext}

═══════════════════════════════════════════════════════════════`
    } else {
      additionalContext = `\n\n⚠️ ADVERTENCIA: No se encontraron artículos específicos en los códigos oficiales.
📋 INSTRUCCIONES: Responde basándote en principios generales, advirtiendo la falta de texto exacto.`
    }

    // 5. Build the final grounded message
    let groundedUserMessage = message
    if (foundRelevantLaw) {
      const alertSnippet = contextualAlert ? `\n\nℹ️ **ALERTA CONTEXTUAL (MODO SEGURO):**\n${contextualAlert}\n\n` : ''
      const riskSnippet = confusionRisk !== 'bajo' ? `\n\n⚠️ **INDICADOR DE RIESGO:** Se ha detectado un cambio entre cuerpos normativos relacionados (${confusionRisk.toUpperCase()}). Por favor, valide la fundamentación.\n\n` : ''

      groundedUserMessage = `📚 **CONTEXTO LEGAL PARA TU ANÁLISIS:**\n${alertSnippet}${riskSnippet}${additionalContext}\n\n`

      if (isReviewMode) {
        groundedUserMessage += `🛡️ **MODO REVISIÓN CRÍTICA (PREMIUM):**
El usuario solicita una auditoría de este escrito. DEBES actuar como un auditor legal implacable:
1. Revisa **Contradicciones internas** en los hechos narrados.
2. Verifica la **Legitimación** (¿es el sujeto el titular del derecho?).
3. Analiza plazos de **Prescripción o Caducidad** según el Código correspondiente.
4. Detecta **Incongruencia omisiva** o falta de fundamentación.
5. Presenta un informe de fallos críticos detectados antes de que se presente al juzgado.\n\n---\n\n`
      } else if (isAnalysisRequest) {
        groundedUserMessage += `🔍 **SOLICITUD DE ANÁLISIS TÉCNICO:**\nEl usuario solicita revisar/redactar un texto jurídico. 
Por favor, utiliza la estructura de "Análisis de LexAI" con:
1. Estado de la Norma y Clasificación de Error ([ERROR...]).
2. Nivel de Riesgo Procesal [BAJO/MEDIO/ALTO].
3. Cita textual del artículo real.
4. Versión mejorada (Modo Litigio) si aplica.
5. Ejemplo procesal costarricense.\n\n---\n\n`
      }

      if (contextualAlert && additionalContext.split('Artí').length > 2) {
        groundedUserMessage += `💡 **MODO LITIGANTE ACTIVO**: Se han proporcionado múltiples opciones legales debido a la ambigüedad detectada. Analiza y presenta AMBAS opciones con elegancia.\n\n`
      }

      groundedUserMessage += `**CONSULTA DEL USUARIO:**\n${message}`
    } else {
      groundedUserMessage = `⚠️ **NO SE ENCONTRARON ARTÍCULOS ESPECÍFICOS.**\n${additionalContext}\n\n---\n\n**CONSULTA DEL USUARIO:**\n${message}`
    }

    // Construir el historial de mensajes para OpenAI
    const chatMessages = [
      { role: 'system' as const, content: LEGAL_SYSTEM_PROMPT },
      ...messages.map((msg: any) => ({
        role: String(msg.role).toLowerCase() as 'user' | 'assistant' | 'system',
        content: msg.content,
      })).slice(-10), // Limit focus to recent history
      { role: 'user' as const, content: groundedUserMessage },
    ]

    // DEBUG LOG
    const debugInfo = {
      timestamp: new Date().toISOString(),
      query: message,
      articleRefs,
      foundRelevantLaw,
      contextLength: additionalContext.length,
      numMessagesSent: chatMessages.length
    }
    console.log(`💬 Enviando a OpenAI:`, debugInfo)

    try {
      const logDir = join(process.cwd(), 'logs')
      const logFile = join(logDir, 'chat-debug.log')
      // Ensure directory exists
      const { existsSync, mkdirSync, appendFileSync } = require('fs')
      if (!existsSync(logDir)) mkdirSync(logDir)
      appendFileSync(logFile, JSON.stringify(debugInfo) + '\n')
    } catch (e) {
      console.error('Error writing debug log:', e)
    }

    // Llamar a OpenAI con configuración optimizada para máxima precisión
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Usar GPT-4o para mejores resultados (más preciso que mini)
      messages: chatMessages,
      temperature: 0.1, // Temperatura muy baja para máxima precisión (evita alucinaciones)
      max_tokens: 2500,
      top_p: 1.0,
    })

    let responseMessage = completion.choices[0].message.content || ''
    const tokensUsed = completion.usage?.total_tokens || 0

    // --- STEP 6: METADATA PARSING & DATABASE SAVING ---
    const matterMatch = responseMessage.match(/Materia\*\*:\s*\[?([A-ZÁÉÍÓÚÑ]+)\]?/i)
    const typeMatch = responseMessage.match(/Tipo\*\*:\s*\[?([A-ZÁÉÍÓÚÑ\s]+)\]?/i)
    const riskMatch = responseMessage.match(/Riesgo Procesal\*\*:?\s*\[?([A-Z]+)\]?/i)

    const rawMatter = matterMatch ? matterMatch[1].trim().toUpperCase() : 'OTHER'
    // Map raw content to LegalMatter enum
    const matterMap: Record<string, LegalMatter> = {
      'PENAL': LegalMatter.PENAL,
      'CIVIL': LegalMatter.CIVIL,
      'LABORAL': LegalMatter.LABORAL,
      'FAMILIA': LegalMatter.FAMILIA,
      'COMERCIAL': LegalMatter.COMERCIAL,
      'COMERCIO': LegalMatter.COMERCIAL,
      'ADMINISTRATIVO': LegalMatter.ADMINISTRATIVO,
      'CONSTITUCIONAL': LegalMatter.CONSTITUCIONAL,
      'TRANSITO': LegalMatter.TRANSITO,
      'OTHER': LegalMatter.OTHER
    }
    const detectedMatter = matterMap[rawMatter] || LegalMatter.OTHER
    const detectedType = typeMatch ? typeMatch[1].trim() : 'Consulta'
    const detectedRiskFormatted = riskMatch ? riskMatch[1].trim().toLowerCase() : confusionRisk !== 'bajo' ? confusionRisk : 'bajo'

    // Clean up response for the user (remove SaaS classification block)
    const cleanResponseMessage = responseMessage
      .replace(/### 📊 Clasificación SaaS[\s\S]*?(?=---|$)/i, '')
      .trim()

    // Database Persistence
    try {
      // For now we assume a guest user if no session, but we still want to log the interaction
      // In a real SaaS, we would use the authenticated user ID
      const tempUserId = 'guest-litigante' // Fallback for beta

      // Ensure user exists (only for beta/demo purposes)
      const user = await prisma.user.upsert({
        where: { email: 'beta-litigante@lexai.cr' },
        update: {},
        create: {
          email: 'beta-litigante@lexai.cr',
          name: 'Beta Tester',
          role: 'LAWYER'
        }
      })

      const targetConversationId = conversationId || (await prisma.conversation.create({
        data: {
          userId: user.id,
          title: message.substring(0, 50) + '...',
          matter: detectedMatter
        }
      })).id

      // Save Message and its Metadata
      const savedMessage = await prisma.message.create({
        data: {
          conversationId: targetConversationId,
          role: 'ASSISTANT',
          content: cleanResponseMessage,
          tokensUsed,
          metadata: {
            create: {
              matter: detectedMatter,
              writingType: detectedType,
              riskLevel: detectedRiskFormatted,
              isLitigantMode: /(recurso|apelaci[oó]n|excepci[oó]n|escrito|demanda|querella)/i.test(lowerQuery),
              ambiguityDetected: !!contextualAlert,
              detectedArticles: articleRefs.map(String)
            }
          }
        }
      })

      console.log(`✅ Consulta guardada con éxito: ${savedMessage.id} (Materia: ${detectedMatter})`)
    } catch (dbError) {
      console.error('❌ Error guardando consulta en DB:', dbError)
    }

    return NextResponse.json({
      message: cleanResponseMessage,
      tokensUsed,
      conversationId: conversationId || 'new-beta-conv',
      metadata: {
        matter: detectedMatter,
        type: detectedType,
        risk: detectedRiskFormatted
      }
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
