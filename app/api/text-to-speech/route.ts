import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    // Verificar que la API key esté configurada
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      return NextResponse.json(
        { error: 'La API key de OpenAI no está configurada' },
        { status: 500 }
      )
    }

    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'No se proporcionó texto' },
        { status: 400 }
      )
    }

    // Generar audio con TTS
    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova', // Voz femenina en español
      input: text,
      speed: 1.0
    })

    // Convertir a buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Retornar audio
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error: any) {
    console.error('Error al generar audio:', error)
    
    if (error.code === 'invalid_api_key') {
      return NextResponse.json(
        { error: 'API key de OpenAI inválida' },
        { status: 401 }
      )
    }
    
    if (error.code === 'insufficient_quota') {
      return NextResponse.json(
        { error: 'Sin créditos en OpenAI' },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Error al generar audio' },
      { status: 500 }
    )
  }
}
