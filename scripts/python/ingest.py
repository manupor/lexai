import os
import re
import argparse
import psycopg2
from openai import OpenAI
from pypdf import PdfReader
import striprtf.striprtf
import docx
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
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"), http_client=httpx.Client(verify=False))
DB_URL = os.environ.get("DATABASE_URL")

def get_db_connection():
    if not DB_URL:
        raise ValueError("DATABASE_URL no está configurada en las variables de entorno.")
    return psycopg2.connect(DB_URL)

def get_embedding(text):
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def extract_text_from_pdf(pdf_path):
    text = ""
    with open(pdf_path, 'rb') as file:
        reader = PdfReader(file)
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
    return text

def parse_articles(text):
    # Detección inteligente para dividir por "Artículo X" o "ARTÍCULO X" usando re.split
    parts = re.split(r'(Art[ií]culo\s+\d+[\w\s°]*\.?)', text, flags=re.IGNORECASE)
    
    chunks = []
    
    preambulo = parts[0].strip()
    if preambulo:
        chunks.append({
            "articulo": "Preámbulo/Contexto",
            "contenido": preambulo
        })
        
    for i in range(1, len(parts), 2):
        art_title = parts[i].strip()
        art_content = parts[i+1].strip() if i + 1 < len(parts) else ""
        
        full_content = f"{art_title}\n{art_content}".strip()
        
        if full_content:
            chunks.append({
                "articulo": art_title,
                "contenido": full_content
            })
            
    if not chunks:
        # Fallback si no encuentra artículos
        chunks = [{"articulo": "Documento completo (o fragmento)", "contenido": text.strip()}]
        
    return chunks

def ingest_document(file_path, fuente, materia):
    print(f"Iniciando ingesta de: {file_path}")
    print(f"Fuente: {fuente} | Materia: {materia}")
    
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == '.pdf':
        text = extract_text_from_pdf(file_path)
    elif ext == '.rtf':
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            text = striprtf.striprtf.rtf_to_text(f.read())
    elif ext == '.docx':
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    else:
        with open(file_path, 'r', encoding='utf-8') as f:
            text = f.read()

    chunks = parse_articles(text)
    print(f"Se generaron {len(chunks)} chunks mediante partición por artículos.")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    inserted = 0
    for i, chunk in enumerate(chunks):
        contenido = chunk["contenido"]
        if not contenido or len(contenido.strip()) < 10:
            continue
            
        print(f"Generando vector embedding y procesando artículo {i+1}/{len(chunks)}...")
        try:
            embedding = get_embedding(contenido)
            cur.execute("""
                INSERT INTO documents (fuente, materia, articulo, contenido, embedding)
                VALUES (%s, %s, %s, %s, %s)
            """, (fuente, materia, chunk["articulo"], contenido, embedding))
            inserted += 1
        except Exception as e:
            print(f"Error procesando el chunk {chunk['articulo']}: {e}")
            
    conn.commit()
    cur.close()
    conn.close()
    print(f"\n¡Éxito! Se insertaron {inserted} registros/chunks en la base de datos (pgvector).")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Ingesta de legislación en formato text/PDF y generación de embeddings para RAG")
    parser.add_argument("--file", required=True, help="Ruta al archivo PDF o TXT")
    parser.add_argument("--fuente", required=True, help="Nombre de la fuente (Ej: Código Procesal Civil)")
    parser.add_argument("--materia", required=True, help="Materia (civil, penal, laboral, administrativo, constitucional)")
    
    args = parser.parse_args()
    ingest_document(args.file, args.fuente, args.materia)
