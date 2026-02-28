// Simulación simplificada de la lógica de Safe Mode
function simulateSafeMode(message: string, history: { role: string, content: string }[]) {
    const lowerQuery = message.toLowerCase()
    let historyCodeName: string | null = null
    let detectedCodeName: string | null = null
    let contextualAlert = ''

    // 1. Detectar código en el historial (últimos 5 mensajes)
    if (history.length > 0) {
        for (let i = history.length - 1; i >= 0; i--) {
            const hMsg = history[i].content.toLowerCase()
            if (hMsg.includes('procesal penal') || hMsg.includes('cpp')) { historyCodeName = 'codigo-procesal-penal'; break; }
            if (hMsg.includes('código penal') || hMsg.includes('cp ')) { historyCodeName = 'codigo-penal'; break; }
            if (hMsg.includes('comercio')) { historyCodeName = 'codigo-comercio'; break; }
            if (hMsg.includes('civil')) { historyCodeName = 'codigo-civil'; break; }
        }
    }

    // 2. ¿El usuario especificó un código en este mensaje?
    let currentMsgCode: string | null = null
    if (lowerQuery.includes('comercio')) currentMsgCode = 'codigo-comercio'
    if (lowerQuery.includes('penal')) currentMsgCode = 'codigo-penal'
    if (lowerQuery.includes('procesal penal')) currentMsgCode = 'codigo-procesal-penal'

    // 3. ¿Menciona un artículo?
    const artNum = message.match(/\d+/) ? message.match(/\d+/)[0] : null

    // 4. Lógica de Ambigüedad (SaaS Safe Mode)
    if (artNum && !currentMsgCode && historyCodeName) {
        contextualAlert = `⚠️ ALERTA CONTEXTUAL: En mensajes anteriores se hablaba de "${historyCodeName.toUpperCase().replace('CODIGO-', '')}". ¿Te refieres a ese o a otro?`
        detectedCodeName = historyCodeName
    } else if (currentMsgCode) {
        detectedCodeName = currentMsgCode
    }

    console.log(`\n==========================================`)
    console.log(`USUARIO DICE: "${message}"`)
    console.log(`HISTORIAL RECIENTE: ${historyCodeName ? historyCodeName : "Sin contexto"}`)
    console.log(`RESULTADO DE SEGURIDAD:`)
    if (contextualAlert) {
        console.log(`[!] ${contextualAlert}`)
        console.log(`[Action] LexAI preguntará antes de asumir.`)
    } else {
        console.log(`[✓] No hay ambigüedad. Procediendo con: ${detectedCodeName || "Búsqueda general"}`)
    }
}

// PRUEBA 1: Ambigüedad con el Art 41
simulateSafeMode("¿Y qué dice el artículo 41?", [
    { role: 'user', content: "Analiza el artículo 2 del Código de Comercio" },
    { role: 'assistant', content: "El artículo 2 de Comercio trata sobre actos de comercio..." }
])

// PRUEBA 2: Cambio explícito de contexto (No hay alerta)
simulateSafeMode("Ahora dime el 41 del Código Penal", [
    { role: 'user', content: "Analiza el artículo 2 del Código de Comercio" },
    { role: 'assistant', content: "..." }
])

// PRUEBA 3: Seguimiento tras Procesal Penal
simulateSafeMode("Explícame el 41", [
    { role: 'user', content: "Háblame del Código Procesal Penal" },
    { role: 'assistant', content: "..." }
])
