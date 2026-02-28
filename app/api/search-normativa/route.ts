import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { Pool } from 'pg';

export const maxDuration = 60; // Set timeout for API route

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
            throw new Error("No se pudo generar el embedding");
        }

        const embedding = embeddingResponse.data[0].embedding;

        // 2. Construir la consulta SQL para similitud del vector
        let sql = `
      SELECT 
        id, 
        fuente, 
        materia, 
        articulo, 
        contenido, 
        1 - (embedding <=> $1::vector) AS score
      FROM documents
    `;

        // Convertir el embedding a string formatado de pgvector
        const embeddingStr = `[${embedding.join(',')}]`;
        const params: any[] = [embeddingStr];
        let paramIndex = 2;

        // Si existen materias indicadas en el request, filtar
        if (materias && materias.length > 0) {
            sql += ` WHERE materia = ANY($${paramIndex}::text[])`;
            params.push(materias);
            paramIndex++;
        }

        // Ordenar por similitud y limitar resultados
        sql += ` ORDER BY embedding <=> $1::vector LIMIT $${paramIndex};`;
        params.push(topK);

        // 3. Ejecutar la búsqueda Vectorial
        const result = await pool.query(sql, params);

        return NextResponse.json({ results: result.rows });
    } catch (error) {
        console.error('Error en búsqueda de normativa (RAG vector similarity):', error);
        return NextResponse.json({ error: 'Error interno del servidor procesando busqueda vectorial' }, { status: 500 });
    }
}
