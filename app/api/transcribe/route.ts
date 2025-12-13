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

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No se proporcionó archivo de audio' },
        { status: 400 }
      )
    }

    // Transcribir con Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'es', // Español
      response_format: 'json'
    })

    return NextResponse.json({
      text: transcription.text
    })
  } catch (error: any) {
    console.error('Error al transcribir audio:', error)
    
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
      { error: error.message || 'Error al transcribir el audio' },
      { status: 500 }
    )
  }
}
