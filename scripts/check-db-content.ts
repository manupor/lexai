import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function checkContent() {
    console.log('Checking database content...')

    try {
        // Check if LegalCode exists
        const penalCode = await prisma.legalCode.findUnique({
            where: { code: 'codigo-penal' },
            include: {
                _count: {
                    select: { articles: true }
                }
            }
        })

        console.log('Legal Code: codigo-penal')
        console.log('Found:', !!penalCode)
        if (penalCode) {
            console.log('Total articles:', penalCode._count.articles)
        }

        // Check for specific article 10
        const article10 = await prisma.article.findFirst({
            where: {
                legalCode: { code: 'codigo-penal' },
                number: '10'
            }
        })

        console.log('\nArticle 10 search:')
        if (article10) {
            console.log('Found ID:', article10.id)
            console.log('Content preview:', article10.content.substring(0, 100))
        } else {
            console.log('❌ Article 10 NOT FOUND')

            // List first 5 articles to see what format they have
            const first5 = await prisma.article.findMany({
                where: { legalCode: { code: 'codigo-penal' } },
                take: 5
            })
            console.log('\nFirst 5 articles in DB:')
            first5.forEach(a => console.log(`- Art ${a.number}: ${a.content.substring(0, 50)}...`))
        }

    } catch (error) {
        console.error('Error checking DB:', error)
    }
}

checkContent()
