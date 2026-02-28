import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { neon } from '@neondatabase/serverless';

export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: Request) {
    try {
        const { query, materias, topK = 5 } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'El texto de busqueda (query) es requerido' }, { status: 400 });
        }

        // 1. Generar embedding para la consulta
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });

        if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
            throw new Error('No se pudo generar el embedding');
        }

        const embedding = embeddingResponse.data[0].embedding;
        const embeddingStr = `[${embedding.join(',')}]`;

        const sql = neon(process.env.DATABASE_URL!);

        // 2. Búsqueda vectorial con filtro opcional de materias
        let rows: any[];

        if (materias && Array.isArray(materias) && materias.length > 0) {
            rows = await sql`
                SELECT
                    fuente,
                    materia,
                    articulo,
                    contenido,
                    1 - (embedding <=> ${embeddingStr}::vector) AS score
                FROM documents
                WHERE materia = ANY(${materias}::text[])
                ORDER BY embedding <=> ${embeddingStr}::vector
                LIMIT ${topK}
            `;
        } else {
            rows = await sql`
                SELECT
                    fuente,
                    materia,
                    articulo,
                    contenido,
                    1 - (embedding <=> ${embeddingStr}::vector) AS score
                FROM documents
                ORDER BY embedding <=> ${embeddingStr}::vector
                LIMIT ${topK}
            `;
        }

        return NextResponse.json({ results: rows });
    } catch (error) {
        console.error('Error en búsqueda de normativa (RAG vector similarity):', error);
        return NextResponse.json({ error: 'Error interno del servidor procesando busqueda vectorial' }, { status: 500 });
    }
}
