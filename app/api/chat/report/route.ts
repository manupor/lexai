import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
    try {
        const { messageId, comment } = await req.json()

        if (!messageId || !comment) {
            return NextResponse.json(
                { error: 'messageId and comment are required' },
                { status: 400 }
            )
        }

        const report = await prisma.errorReport.create({
            data: {
                messageId,
                comment,
            },
        })

        return NextResponse.json({
            success: true,
            reportId: report.id,
        })
    } catch (error: any) {
        console.error('Error reporting message:', error)
        return NextResponse.json(
            { error: 'Failed to report message error' },
            { status: 500 }
        )
    }
}
