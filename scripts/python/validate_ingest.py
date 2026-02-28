import os
import sys
import psycopg2
from openai import OpenAI
import httpx

def load_env():
    env_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env')
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                if line.startswith('DATABASE_URL='):
                    os.environ['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"\'')
                elif line.startswith('OPENAI_API_KEY='):
                    os.environ['OPENAI_API_KEY'] = line.split('=', 1)[1].strip().strip('"\'')
    except Exception as e:
        print(f"Error loading .env: {e}")

load_env()
DB_URL = os.environ.get("DATABASE_URL")
if not os.environ.get("OPENAI_API_KEY"):
    print("OPENAI_API_KEY is not set! Checked path:", os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../.env'))
    sys.exit(1)
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"), http_client=httpx.Client(verify=False))

def print_separator(title=""):
    print(f"\n{'=' * 20} {title} {'=' * 20}\n" if title else f"\n{'=' * 50}\n")

def get_db_connection():
    if not DB_URL:
        print("❌ Error: DATABASE_URL no está configurada.")
        print("💡 Instrucciones de Fix: Exporta la variable de entorno o añádela a tu archivo .env")
        print("   Ejemplo: export DATABASE_URL=\"postgresql://usuario:pass@localhost:5432/lexai\"")
        sys.exit(1)
    
    try:
        conn = psycopg2.connect(DB_URL)
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        print("💡 Instrucciones de Fix: Verifica que tus credenciales en DATABASE_URL sean correctas y que la base de datos esté encendida.")
        sys.exit(1)

def check_pgvector_extension(cur):
    print("1. Verificando extensión pgvector...")
    cur.execute("SELECT * FROM pg_extension WHERE extname = 'vector';")
    result = cur.fetchone()
    
    if result:
        print("✅ Extensión 'vector' encontrada y activa.")
    else:
        print("❌ Error: La extensión 'vector' NO está activa en la base de datos.")
        print("💡 Instrucciones de Fix: Conéctate a tu base de datos y ejecuta:")
        print("   CREATE EXTENSION IF NOT EXISTS vector;")
        sys.exit(1)

def check_documents_table(cur):
    print_separator("2. Verificando tabla 'documents'")
    cur.execute("""
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'documents';
    """)
    columns = cur.fetchall()
    
    if not columns:
        print("❌ Error: La tabla 'documents' no existe.")
        print("💡 Instrucciones de Fix: Ejecuta el script SQL de creación de tablas:")
        print("   psql -d DATABASE_URL -f scripts/setup_pgvector.sql")
        sys.exit(1)
        
    expected_cols = {
        'id': 'uuid',
        'fuente': 'text',
        'materia': 'text',
        'articulo': 'text',
        'contenido': 'text',
        'embedding': 'USER-DEFINED' # pgvector column shows up as USER-DEFINED in information_schema
    }
    
    print("Columnas encontradas:")
    found_cols = {}
    for col_name, data_type in columns:
        print(f"  - {col_name} ({data_type})")
        found_cols[col_name] = data_type
        
    missing = [col for col in expected_cols if col not in found_cols]
    if missing:
        print(f"\n❌ Error: Faltan columnas requeridas: {missing}")
        print("💡 Instrucciones de Fix: Revisa y ejecuta tu script scripts/setup_pgvector.sql asegurándote de incluir todas las columnas.")
        sys.exit(1)
        
    print("\n✅ Estructura de tabla correcta.")

def print_db_stats(cur):
    print_separator("3. Resumen de la Base de Datos")
    
    # Total de chunks
    cur.execute("SELECT COUNT(*) FROM documents;")
    total_chunks = cur.fetchone()[0]
    print(f"Total de chunks en BD: {total_chunks}")
    
    if total_chunks == 0:
        print("⚠️ Advertencia: La tabla 'documents' está vacía. No hay legislación ingerida.")
        print("💡 Usa ingest.py para añadir documentos antes de realizar búsquedas.")
        return False
        
    # Chunks por materia
    cur.execute("""
        SELECT materia, COUNT(*) 
        FROM documents 
        GROUP BY materia 
        ORDER BY count DESC;
    """)
    stats = cur.fetchall()
    
    print("\nChunks por materia:")
    for materia, count in stats:
        print(f"  - {materia}: {count} chunks")
        
    return True

def test_semantic_search(cur):
    print_separator("4. Prueba de Búsqueda Semántica")
    query = "derecho al trabajo"
    print(f"Query: '{query}'")
    
    print("Generando embedding (text-embedding-3-small)...")
    try:
        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=query
        )
        query_embedding = response.data[0].embedding
    except Exception as e:
        print(f"❌ Error generando el embedding en OpenAI: {e}")
        print("💡 Instrucciones de Fix: Verifica tu OPENAI_API_KEY y que tengas saldo disponible en tu cuenta.")
        sys.exit(1)
        
    print("Buscando en la BD...")
    try:
        embedding_str = f"[{','.join(map(str, query_embedding))}]"
        
        cur.execute("""
            SELECT fuente, materia, articulo, (1 - (embedding <=> %s::vector)) AS score
            FROM documents
            ORDER BY embedding <=> %s::vector
            LIMIT 3;
        """, (embedding_str, embedding_str))
        
        results = cur.fetchall()
        
        if results:
            print("\n✅ Búsqueda exitosa. Top 3 resultados:\n")
            total_score = 0
            for i, (fuente, materia, articulo, score) in enumerate(results, 1):
                # Extraemos el score para cálculos y display
                score_val = float(score) if score is not None else 0
                total_score += score_val
                
                print(f"[{i}] Score: {score_val:.4f}")
                print(f"    Fuente: {fuente} ({materia}) - {articulo}")
                
            promedio = total_score / len(results)
            print(f"\n📊 Score promedio de los top resultados: {promedio:.4f}")
        else:
            print("⚠️ Búsqueda ejecutada correctamente pero no se encontraron resultados (tabla vacía).")
            
    except Exception as e:
        print(f"❌ Error tipeando en consulta vectorial: {e}")
        print("💡 Instrucciones de Fix: Verifica que la columna embedding exista y sea de tipo vector(1536).")
        sys.exit(1)

def main():
    print("Iniciando validación del sistema RAG de LexAI...\n")
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        check_pgvector_extension(cur)
        check_documents_table(cur)
        has_data = print_db_stats(cur)
        
        if has_data:
            test_semantic_search(cur)
        else:
            print_separator("4. Prueba de Búsqueda Semántica")
            print("Saltando prueba de búsqueda ya que la base de datos está vacía.")
            
        print_separator()
        print("🎉 ¡Validación técnica completada! Todo el pipeline vectorial y de base de datos parece estar listo.")
        
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")
        sys.exit(1)
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
