import 'dotenv/config'
import { prisma } from '../lib/prisma'

const CODE_MAP: Record<string, string> = {
    'codigo-civil': 'codigo-civil',
    'codigo-comercio': 'codigo-comercio',
    'codigo-trabajo': 'codigo-trabajo',
    'codigo-procesal-penal': 'codigo-procesal-penal',
    'codigo-penal': 'codigo-penal'
}

async function searchLegalArticle(codeName: string, articleNumber: string) {
    try {
        const codeId = CODE_MAP[codeName]
        console.log(`Searching for article ${articleNumber} in ${codeId}`)
        const article = await prisma.article.findFirst({
            where: {
                legalCode: { code: codeId },
                number: articleNumber
            }
        })
        return article
    } catch (error) {
        console.error(error)
        return null
    }
}

async function simulate(message: string) {
    console.log(`\n--- Simulating Query: "${message}" ---`)
    const lowerQuery = message.toLowerCase()
    const articleMatch = message.match(/art[íi]cul?[oi]?\s+(\d+)/i)

    if (articleMatch) {
        const articleNumber = articleMatch[1]
        console.log(`Regex matched article number: "${articleNumber}"`)

        let targetCodeName: string | null = null;

        if (/(procesal\s*penal|procesal\s*pp|cpp)/i.test(lowerQuery)) {
            console.log('Detectado: Código Procesal Penal')
            targetCodeName = 'codigo-procesal-penal'
        } else if (/(penal|cp)/i.test(lowerQuery)) {
            console.log('Detectado: Código Penal')
            targetCodeName = 'codigo-penal'
        } else {
            console.log('No specific code detected')
        }

        if (targetCodeName) {
            const article = await searchLegalArticle(targetCodeName, articleNumber);
            if (article) {
                console.log('✅ Article FOUND via specific code path')
            } else {
                console.log('❌ Article NOT FOUND via specific code path')
            }
        } else {
            console.log('Would try all codes...')
        }

    } else {
        console.log('Regex did NOT match article number')
    }
}

simulate('que dice el articulo 10 del codigo penal?')
