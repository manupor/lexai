import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test 1: Check if prisma is available
    if (!prisma) {
      return NextResponse.json({ 
        error: 'Prisma not initialized',
        prisma: null 
      })
    }

    // Test 2: Check legal codes
    const codes = await prisma.legalCode.findMany({
      select: { code: true, title: true }
    })

    // Test 3: Check article 45
    const article45 = await prisma.article.findFirst({
      where: {
        legalCode: { code: 'CT' },
        number: '45'
      },
      include: { legalCode: true }
    })

    return NextResponse.json({
      success: true,
      prismaAvailable: true,
      codes: codes,
      article45: article45 ? {
        found: true,
        number: article45.number,
        content: article45.content.substring(0, 100),
        legalCode: article45.legalCode.code
      } : {
        found: false
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}
