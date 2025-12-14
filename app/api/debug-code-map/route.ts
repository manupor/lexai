import { NextResponse } from 'next/server'

// Same CODE_MAP as in chat route
const CODE_MAP: Record<string, string> = {
  'codigo-civil': 'codigo-civil',
  'codigo-comercio': 'codigo-comercio',
  'codigo-trabajo': 'codigo-trabajo'
}

export async function GET() {
  return NextResponse.json({
    codeMap: CODE_MAP,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    env: {
      hasDatabase: !!process.env.DATABASE_URL,
      hasOpenAI: !!process.env.OPENAI_API_KEY
    }
  })
}
