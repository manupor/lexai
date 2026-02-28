// test-db-vector.ts
import { Pool } from 'pg';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

// Load env from .env file manually for simple script
try {
    const envFile = fs.readFileSync(path.join(__dirname, '../../.env'), 'utf-8');
    envFile.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)/);
        if (match) {
            if (!process.env[match[1]]) process.env[match[1]] = match[2].trim().replace(/^"|"$/g, '');
        }
    });
} catch (e) {
    // Ignorar si no hay .env local
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function checkPgVector(client: any) {
    console.log('1. Verificando extensión pgvector...');
    const res = await client.query("SELECT * FROM pg_extension WHERE extname = 'vector';");
    if (res.rows.length > 0) {
        console.log('✅ Extensión \'vector\' encontrada y activa.\n');
    } else {
        console.log('❌ Error: La extensión \'vector\' NO está activa en la base de datos.');
        console.log('💡 Instrucciones de Fix: Conéctate a tu base de datos y ejecuta: CREATE EXTENSION IF NOT EXISTS vector;');
        process.exit(1);
    }
}

async function checkTable(client: any) {
    console.log('==================== 2. Verificando tabla \'documents\' ====================');
    const res = await client.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'documents';
  `);

    if (res.rows.length === 0) {
        console.log('❌ Error: La tabla \'documents\' no existe.');
        console.log('💡 Instrucciones de Fix: Ejecuta el script SQL de creación de tablas.');
        process.exit(1);
    }

    console.log('Columnas encontradas:');
    const foundCols = new Set();
    res.rows.forEach((row: any) => {
        console.log(`  - ${row.column_name} (${row.data_type})`);
        foundCols.add(row.column_name);
    });

    const expected = ['id', 'fuente', 'materia', 'articulo', 'contenido', 'embedding'];
    const missing = expected.filter(col => !foundCols.has(col));

    if (missing.length > 0) {
        console.log(`\n❌ Error: Faltan columnas requeridas: ${missing.join(', ')}`);
        process.exit(1);
    }

    console.log('\n✅ Estructura de tabla correcta.\n');
}

async function checkStats(client: any) {
    console.log('==================== 3. Resumen de la Base de Datos ====================');

    const resTotal = await client.query("SELECT COUNT(*) FROM documents;");
    const total = parseInt(resTotal.rows[0].count);
    console.log(`Total de chunks en BD: ${total}`);

    if (total === 0) {
        console.log('⚠️ Advertencia: La tabla \'documents\' está vacía. No hay legislación ingerida.');
        console.log('💡 Usa ingest.py para añadir documentos antes de realizar búsquedas.\n');
        return false;
    }

    const resMaterias = await client.query(`
    SELECT materia, COUNT(*) 
    FROM documents 
    GROUP BY materia 
    ORDER BY count DESC;
  `);

    console.log('\nChunks por materia:');
    resMaterias.rows.forEach((row: any) => {
        console.log(`  - ${row.materia}: ${row.count} chunks`);
    });
    console.log('');
    return true;
}

async function testSemanticSearch(client: any) {
    console.log('==================== 4. Prueba de Búsqueda Semántica ====================');
    const query = "derecho al trabajo";
    console.log(`Query: '${query}'`);
    console.log('Generando embedding (text-embedding-3-small)...');

    let embedding;
    try {
        const embeddingResponse = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: query,
        });
        embedding = embeddingResponse.data[0].embedding;
    } catch (e: any) {
        console.log(`❌ Error generando el embedding en OpenAI: ${e.message}`);
        console.log('💡 Instrucciones de Fix: Verifica tu OPENAI_API_KEY.');
        process.exit(1);
    }

    console.log('Buscando en la BD...');
    try {
        const embeddingStr = `[${embedding.join(',')}]`;
        const result = await client.query(`
      SELECT fuente, materia, articulo, (1 - (embedding <=> $1::vector)) AS score
      FROM documents
      ORDER BY embedding <=> $1::vector
      LIMIT 3;
    `, [embeddingStr]);

        if (result.rows.length > 0) {
            console.log('\n✅ Búsqueda exitosa. Top 3 resultados:\n');
            let totalScore = 0;
            result.rows.forEach((row: any, i: number) => {
                const score = parseFloat(row.score || "0");
                totalScore += score;
                console.log(`[${i + 1}] Score: ${score.toFixed(4)}`);
                console.log(`    Fuente: ${row.fuente} (${row.materia}) - ${row.articulo}`);
            });

            const average = totalScore / result.rows.length;
            console.log(`\n📊 Score promedio de los top resultados: ${average.toFixed(4)}`);
        } else {
            console.log('⚠️ No se encontraron resultados (tabla vacía).');
        }
    } catch (e: any) {
        console.log(`❌ Error mapeando consulta vectorial: ${e.message}`);
        process.exit(1);
    }
}

async function main() {
    console.log('Iniciando validación del sistema RAG de LexAI...\n');
    const client = await pool.connect();
    try {
        await checkPgVector(client);
        await checkTable(client);
        const hasData = await checkStats(client);
        if (hasData) {
            await testSemanticSearch(client);
        } else {
            console.log('==================== 4. Prueba de Búsqueda Semántica ====================');
            console.log('Saltando prueba de búsqueda ya que la base de datos está vacía.');
        }
        console.log('\n==================================================\n');
        console.log('🎉 ¡Validación técnica completada! Todo el pipeline vectorial y de base de datos parece estar listo.');
    } finally {
        client.release();
        pool.end();
    }
}

main().catch(console.error);
