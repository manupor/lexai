import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const start = Date.now()

        // Check if LegalCode exists
        const legalCode = await prisma.legalCode.findUnique({
            where: { code: 'codigo-penal' },
            include: {
                _count: {
                    select: { articles: true }
                }
            }
        })

        // Check specific article
        const article = await prisma.article.findFirst({
            where: {
                legalCode: { code: 'codigo-penal' },
                number: '10'
            }
        })

        const duration = Date.now() - start

        return NextResponse.json({
            status: 'ok',
            duration: `${duration}ms`,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                nodeEnv: process.env.NODE_ENV
            },
            results: {
                legalCode: legalCode ? {
                    id: legalCode.id,
                    code: legalCode.code,
                    articlesCount: legalCode._count.articles
                } : 'NOT FOUND',
                article10: article ? {
                    id: article.id,
                    number: article.number,
                    preview: article.content.substring(0, 50) + '...'
                } : 'NOT FOUND'
            }
        })
    } catch (error: any) {
        return NextResponse.json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL
            }
        }, { status: 500 })
    }
}
