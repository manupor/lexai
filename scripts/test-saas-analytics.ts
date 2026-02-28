import { prisma } from '../lib/prisma'
import { LegalMatter } from '@prisma/client'

async function simulateAnalytics(userQuery: string) {
    console.log(`\n🚀 INICIANDO PRUEBA DE ANALÍTICA SAAS`)
    console.log(`Consulta: "${userQuery}"`)

    // 1. Simulación de detección de intención (Lógica de route.ts)
    const lowerQuery = userQuery.toLowerCase()
    const isAnalysisRequest = /(analiza|verifica|corrige|chequea|revisa|error|redacta|recurso)/i.test(lowerQuery) || userQuery.length > 200
    const isReviewMode = /(riesgo procesal|revisar escrito|auditoría|legitimación|prescripción)/i.test(lowerQuery)
    const isLitigantMode = /(recurso|apelaci[oó]n|excepci[oó]n|escrito|demanda|querella)/i.test(lowerQuery)

    // 2. Mock de respuesta de OpenAI (Incluyendo el bloque SaaS que inyectamos en el prompt)
    const mockAIResponse = `
### 🔎 Análisis de LexAI
- **Estado de la Norma**: Correcto
- **Clasificación Error**: NINGUNO
- **Riesgo Procesal**: MEDIO

El Proceso Monitorio de Cobro en Costa Rica se rige por el Código Procesal Civil. La prescripción en deudas comerciales suele ser de 4 años según el Código de Comercio...

### 📊 Clasificación SaaS
- **Materia**: CIVIL
- **Tipo**: Excepción
- **Proceso**: Monitorio

---
ℹ️ Herramienta de apoyo técnico-jurídico...
`

    // 3. Extracción de Metadatos (Misma lógica que en route.ts)
    const matterMatch = mockAIResponse.match(/Materia\*\*:\s*\[?([A-ZÁÉÍÓÚÑ]+)\]?/i)
    const typeMatch = mockAIResponse.match(/Tipo\*\*:\s*\[?([A-ZÁÉÍÓÚÑ\s]+)\]?/i)
    const processMatch = mockAIResponse.match(/Proceso\*\*:\s*\[?([A-ZÁÉÍÓÚÑ\s]+)\]?/i)
    const riskMatch = mockAIResponse.match(/Riesgo Procesal\*\*:?\s*\[?([A-Z]+)\]?/i)

    const rawMatter = matterMatch ? matterMatch[1].trim().toUpperCase() : 'OTHER'
    const matterMap: Record<string, LegalMatter> = {
        'CIVIL': LegalMatter.CIVIL,
        'PENAL': LegalMatter.PENAL,
        'OTHER': LegalMatter.OTHER
    }
    const detectedMatter = matterMap[rawMatter] || LegalMatter.OTHER
    const detectedType = typeMatch ? typeMatch[1].trim() : 'Consulta'
    const detectedProcess = processMatch ? processMatch[1].trim() : 'no aplica'
    const detectedRisk = riskMatch ? riskMatch[1].trim().toLowerCase() : 'bajo'

    console.log(`\n📊 Metadatos Detectados:`)
    console.log(`- Materia: ${detectedMatter}`)
    console.log(`- Tipo: ${detectedType}`)
    console.log(`- Proceso: ${detectedProcess}`)
    console.log(`- Riesgo: ${detectedRisk}`)
    console.log(`- Modo Litigante: ${isLitigantMode}`)

    // 4. Guardado en DB (Simulación de Prisma)
    try {
        const user = await prisma.user.upsert({
            where: { email: 'beta-litigante@lexai.cr' },
            update: {},
            create: {
                email: 'beta-litigante@lexai.cr',
                name: 'Beta Tester',
                role: 'LAWYER'
            }
        })

        const conv = await prisma.conversation.create({
            data: {
                userId: user.id,
                title: "Prueba SaaS: " + userQuery.substring(0, 20),
                matter: detectedMatter
            }
        })

        const msg = await prisma.message.create({
            data: {
                conversationId: conv.id,
                role: 'ASSISTANT',
                content: "Contenido de prueba...",
                metadata: {
                    create: {
                        matter: detectedMatter,
                        writingType: detectedType,
                        processType: detectedProcess,
                        riskLevel: detectedRisk,
                        isLitigantMode: isLitigantMode,
                        durationMs: 1200,
                        promptTokens: 800,
                        completionTokens: 400,
                        modelUsed: 'gpt-4o'
                    }
                }
            },
            include: { metadata: true }
        })

        console.log(`\n✅ REGISTRO EN BASE DE DATOS EXITOSO`)
        console.log(`Message ID: ${msg.id}`)
        console.log(`Metadata guardada:`, msg.metadata)
    } catch (err) {
        console.error(`\n❌ ERROR EN GUARDADO:`, err)
    }
}

simulateAnalytics("Redacta una excepción de prescripción en un proceso monitorio de cobro judicial.")
    .then(() => process.exit(0))
    .catch((e) => { console.error(e); process.exit(1); })
