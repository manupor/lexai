"""
📄 AGENT 2: Document Analysis Agent
=====================================

An AI-powered agent that analyzes uploaded legal documents (PDFs, TXT, DOCX)
against the Costa Rican legal code repository, identifying legal issues,
relevant articles, risks, and providing professional legal analysis.

Uses GPT-4o-mini with RAG:
1. User uploads a document (contract, complaint, legal brief, etc.)
2. Agent extracts text from the document
3. Agent searches the legal knowledge base for relevant articles
4. Agent sends document text + relevant articles + analysis prompt to GPT-4o-mini
5. GPT-4o-mini generates a comprehensive legal analysis

Features:
- PDF text extraction (via PyMuPDF)
- TXT / RTF file reading
- Automatic legal code reference detection in documents
- Topic-based search for relevant legal framework
- Structured professional legal analysis output
- Interactive chat for follow-up questions about the document

Usage:
    python -m agents.document_analysis_agent
    python -m agents.document_analysis_agent path/to/document.pdf
"""

import json
import os
import re
import sys
from typing import Optional

from openai import OpenAI
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.legal_knowledge_base import get_knowledge_base, Article

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL = "gpt-4o-mini"
MAX_CONTEXT_ARTICLES = 20
MAX_TOKENS_RESPONSE = 3000
MAX_DOCUMENT_CHARS = 15000  # Max chars to send from document (GPT-4o-mini context limit)

# System prompt for document analysis
SYSTEM_PROMPT = """Eres un ABOGADO EXPERTO especializado en el análisis de documentos legales 
bajo el sistema jurídico de Costa Rica.

🎯 TU ROL: Analizar documentos legales (contratos, demandas, escrituras, etc.) 
y proporcionar un análisis jurídico profesional, fundamentado en los códigos 
legales de Costa Rica que se te proporcionan como contexto.

📋 METODOLOGÍA DE ANÁLISIS:

1. **IDENTIFICACIÓN DEL DOCUMENTO**
   - Tipo de documento (contrato, demanda, recurso, etc.)
   - Partes involucradas
   - Objeto del documento
   - Fecha y vigencia

2. **ANÁLISIS DE CLÁUSULAS / CONTENIDO**
   - Revisa cada cláusula o sección relevante
   - Identifica obligaciones de cada parte
   - Detecta condiciones, plazos y penalidades

3. **MARCO JURÍDICO APLICABLE**
   - Cita TEXTUALMENTE los artículos relevantes del contexto
   - Formato: > **Artículo X del [Código] ([Ley]):** "[TEXTO]"
   - Indica qué artículos aplican a cada cláusula o situación

4. **ANÁLISIS DE RIESGOS Y PROBLEMAS**
   - Cláusulas abusivas o ilegales
   - Inconsistencias con la legislación vigente
   - Omisiones importantes
   - Riesgos para cada parte

5. **RECOMENDACIONES**
   - Modificaciones sugeridas
   - Cláusulas faltantes que deberían incluirse
   - Pasos legales a seguir
   - Advertencias y precauciones

🚫 REGLAS:
❌ NUNCA inventes artículos que no estén en el contexto
❌ NUNCA uses leyes de otros países
❌ NUNCA des conclusiones sin fundamentación legal
✅ SIEMPRE cita textualmente los artículos
✅ SIEMPRE indica cuando algo debería verificarse con un abogado presencial
✅ SIEMPRE identifica riesgos legales

📚 CÓDIGOS DISPONIBLES:
- Código Civil de Costa Rica (Ley N° 63)
- Código de Comercio de Costa Rica (Ley N° 3284)
- Código Penal de Costa Rica (Ley N° 4573)
- Código Procesal Penal de Costa Rica (Ley N° 7594)
- Código de Trabajo de Costa Rica (Ley N° 2)

Responde siempre en español con análisis profesional y detallado."""


# ---------------------------------------------------------------------------
# Document text extraction
# ---------------------------------------------------------------------------

def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        raise ImportError(
            "PyMuPDF is required for PDF processing. Install: pip install pymupdf"
        )
    
    doc = fitz.open(file_path)
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return "\n".join(text_parts)


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from a file based on its extension.
    
    Supported formats: .pdf, .txt, .rtf, .md
    """
    ext = os.path.splitext(file_path)[1].lower()
    
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".txt", ".md", ".rtf"):
        # For RTF, we do a basic text extraction (strip RTF commands)
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        if ext == ".rtf":
            text = _strip_rtf(text)
        return text
    else:
        raise ValueError(f"Formato no soportado: {ext}. Use .pdf, .txt, .rtf, o .md")


def _strip_rtf(rtf_text: str) -> str:
    """Basic RTF to plain text conversion."""
    # Remove RTF control words and groups
    text = re.sub(r'\\[a-z]+\d*\s?', ' ', rtf_text)
    text = re.sub(r'[{}]', '', text)
    text = re.sub(r'\\\'[0-9a-f]{2}', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


# ---------------------------------------------------------------------------
# Document analysis helpers
# ---------------------------------------------------------------------------

def detect_document_type(text: str) -> str:
    """Detect the type of legal document from its content."""
    text_lower = text.lower()
    
    patterns = [
        (r'\bcontrato\b', 'Contrato'),
        (r'\bconvenio\b', 'Convenio'),
        (r'\bdemanda\b', 'Demanda'),
        (r'\brecurso.de.amparo\b', 'Recurso de Amparo'),
        (r'\bapelaci[oó]n\b', 'Apelación'),
        (r'\btestamento\b', 'Testamento'),
        (r'\bescritura\b', 'Escritura Pública'),
        (r'\bpoder\b.*\bespecial\b', 'Poder Especial'),
        (r'\bpoder\b.*\bgeneral\b', 'Poder General'),
        (r'\bnotificaci[oó]n\b', 'Notificación'),
        (r'\bresoluci[oó]n\b', 'Resolución'),
        (r'\bsentencia\b', 'Sentencia'),
        (r'\bdenuncia\b', 'Denuncia'),
        (r'\bquerella\b', 'Querella'),
        (r'\barrendamiento\b', 'Contrato de Arrendamiento'),
        (r'\bcompraventa\b', 'Contrato de Compraventa'),
        (r'\blaboral\b.*\bcontrato\b|\bcontrato\b.*\btrabajo\b', 'Contrato Laboral'),
        (r'\bsociedad\b.*\ban[oó]nima\b', 'Constitución de Sociedad'),
        (r'\bfideicomiso\b', 'Fideicomiso'),
        (r'\bhipoteca\b', 'Hipoteca'),
        (r'\bpagaré\b', 'Pagaré'),
        (r'\bletra.de.cambio\b', 'Letra de Cambio'),
    ]
    
    for pattern, doc_type in patterns:
        if re.search(pattern, text_lower):
            return doc_type
    
    return "Documento Legal (tipo no identificado)"


def extract_legal_references_from_doc(text: str) -> list[dict]:
    """
    Extract article references found WITHIN the document text.
    
    These are articles cited by the document itself (e.g., a contract
    referencing specific Civil Code articles).
    """
    results = []
    
    # Find "artículo X" patterns in the document
    pattern = re.compile(
        r'(?:art[ií]culos?|arts?\.?)\s*(\d+)(?:\s*(?:del|de\s+la?|al)\s*)?'
        r'(?:(?:c[oó]digo|ley)\s+(?:de\s+)?)?'
        r'(civil|comercio|penal|trabajo|laboral|procesal)?',
        re.IGNORECASE
    )
    
    code_map = {
        "civil": "codigo-civil",
        "comercio": "codigo-comercio",
        "penal": "codigo-penal",
        "trabajo": "codigo-trabajo",
        "laboral": "codigo-trabajo",
        "procesal": "codigo-procesal-penal",
    }
    
    seen = set()
    for match in pattern.finditer(text):
        num = int(match.group(1))
        code_hint = None
        if match.group(2):
            code_hint = code_map.get(match.group(2).lower())
        
        key = (num, code_hint)
        if key not in seen:
            seen.add(key)
            results.append({"number": num, "code_hint": code_hint})
    
    return results


def detect_document_topics(text: str) -> list[str]:
    """Detect key legal topics in the document for article search."""
    text_lower = text.lower()
    
    topic_checks = [
        ("contrato", ["contrato", "cláusula", "obligación", "acuerdo"]),
        ("arrendamiento", ["arrendamiento", "alquiler", "inquilino", "arrendatario"]),
        ("compraventa", ["compraventa", "precio", "vendedor", "comprador"]),
        ("trabajo", ["trabajador", "patrono", "empleador", "salario", "despido", "laboral"]),
        ("sociedad", ["sociedad", "acciones", "socios", "capital social", "asamblea"]),
        ("propiedad", ["propiedad", "inmueble", "finca", "terreno", "inscripción"]),
        ("herencia", ["herencia", "heredero", "testamento", "sucesión", "legado"]),
        ("matrimonio", ["matrimonio", "cónyuge", "bienes gananciales"]),
        ("hipoteca", ["hipoteca", "garantía hipotecaria", "acreedor hipotecario"]),
        ("daños", ["daños", "perjuicios", "indemnización", "responsabilidad"]),
        ("obligaciones", ["obligación", "acreedor", "deudor", "pago", "mora"]),
        ("prescripción", ["prescripción", "caducidad", "plazo"]),
        ("delito", ["delito", "pena", "imputado", "víctima", "denuncia"]),
        ("familia", ["alimentos", "custodia", "patria potestad", "divorcio"]),
        ("títulos valores", ["letra de cambio", "pagaré", "cheque", "título valor"]),
        ("comerciante", ["comerciante", "registro mercantil", "empresa"]),
    ]
    
    found_topics = []
    for topic, keywords in topic_checks:
        if any(kw in text_lower for kw in keywords):
            found_topics.append(topic)
    
    return found_topics


# ---------------------------------------------------------------------------
# Agent Core
# ---------------------------------------------------------------------------

class DocumentAnalysisAgent:
    """
    AI Agent that analyzes legal documents against the Costa Rican legal
    code repository using GPT-4o-mini with RAG.
    
    The agent:
    1. Extracts text from uploaded documents (PDF, TXT, RTF)
    2. Detects document type and key topics
    3. Finds article references within the document
    4. Searches the knowledge base for relevant legal articles
    5. Sends document + articles to GPT-4o-mini for professional analysis
    6. Supports follow-up questions about the analyzed document
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the agent.
        
        Args:
            api_key: OpenAI API key. Defaults to OPENAI_API_KEY env var.
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "❌ OPENAI_API_KEY not set. Set it in .env or pass directly."
            )
        
        self.client = OpenAI(api_key=self.api_key)
        self.kb = get_knowledge_base()
        self.conversation_history: list[dict] = []
        self.current_document: Optional[str] = None
        self.current_doc_name: Optional[str] = None
        self.current_doc_type: Optional[str] = None
        
        self.conversation_history.append({
            "role": "system",
            "content": SYSTEM_PROMPT,
        })

    def analyze_document(self, file_path: str) -> str:
        """
        Analyze a legal document file.
        
        This is the main entry point. Extracts text, finds relevant articles,
        and generates a comprehensive legal analysis.
        
        Args:
            file_path: Path to the document file (PDF, TXT, RTF, MD).
        
        Returns:
            Comprehensive legal analysis with citations.
        """
        # Step 1: Extract text
        if not os.path.exists(file_path):
            return f"❌ Archivo no encontrado: {file_path}"
        
        try:
            doc_text = extract_text_from_file(file_path)
        except Exception as e:
            return f"❌ Error al procesar el archivo: {e}"
        
        if not doc_text.strip():
            return "❌ El documento está vacío o no se pudo extraer texto."
        
        self.current_document = doc_text
        self.current_doc_name = os.path.basename(file_path)
        
        return self.analyze_text(doc_text, document_name=self.current_doc_name)

    def analyze_text(self, doc_text: str, document_name: str = "Documento") -> str:
        """
        Analyze document text directly (for text passed in, not from file).
        
        Args:
            doc_text: The document text to analyze.
            document_name: Name identifier for the document.
        
        Returns:
            Comprehensive legal analysis.
        """
        self.current_document = doc_text
        self.current_doc_name = document_name
        
        # Step 1: Detect document type
        doc_type = detect_document_type(doc_text)
        self.current_doc_type = doc_type
        
        # Step 2: Find article references within the document
        doc_refs = extract_legal_references_from_doc(doc_text)
        
        # Step 3: Detect topics for keyword search
        topics = detect_document_topics(doc_text)
        
        # Step 4: Search knowledge base
        found_articles: list[Article] = []
        search_log: list[str] = [
            f"📄 Tipo de documento detectado: {doc_type}",
            f"📝 Longitud del documento: {len(doc_text):,} caracteres",
        ]
        
        # 4a: Exact article references found in document
        for ref in doc_refs:
            code_hint = ref.get("code_hint")
            num = ref["number"]
            
            if code_hint:
                arts = self.kb.find_article(code_hint, num)
            else:
                arts = self.kb.find_article_any_code(num)
            
            if arts:
                for art in arts:
                    if art not in found_articles:
                        found_articles.append(art)
                search_log.append(f"✅ Referencia del documento: Art. {num}")
        
        # 4b: Topic-based search
        for topic in topics:
            remaining = MAX_CONTEXT_ARTICLES - len(found_articles)
            if remaining <= 0:
                break
            keyword_results = self.kb.search_by_topic(topic, max_results=min(5, remaining))
            for art in keyword_results:
                if art not in found_articles:
                    found_articles.append(art)
            search_log.append(f"🔍 Tema detectado '{topic}': {len(keyword_results)} arts. relevantes")
        
        search_log.append(f"\n📚 Total artículos en contexto: {len(found_articles)}")
        
        # Step 5: Truncate document if too long
        doc_for_context = doc_text[:MAX_DOCUMENT_CHARS]
        if len(doc_text) > MAX_DOCUMENT_CHARS:
            doc_for_context += f"\n\n[... Documento truncado. Se muestran los primeros {MAX_DOCUMENT_CHARS:,} caracteres de {len(doc_text):,} totales ...]"
        
        # Step 6: Build prompt and send to GPT-4o-mini
        articles_context = self._build_articles_context(found_articles)
        
        analysis_prompt = f"""ANÁLISIS DE DOCUMENTO LEGAL

{'='*60}
📊 INFORMACIÓN DE BÚSQUEDA:
{chr(10).join(search_log)}

{'='*60}
📄 DOCUMENTO A ANALIZAR ({document_name}):
Tipo detectado: {doc_type}
{'='*60}
{doc_for_context}

{'='*60}
📚 ARTÍCULOS LEGALES RELEVANTES ENCONTRADOS:
{articles_context}

{'='*60}
INSTRUCCIONES DE ANÁLISIS:

Proporciona un análisis jurídico PROFESIONAL y COMPLETO del documento:

1. **IDENTIFICACIÓN DEL DOCUMENTO**: Tipo, partes, objeto, fecha
2. **ANÁLISIS DE CLÁUSULAS/CONTENIDO**: Revisa las cláusulas principales
3. **MARCO JURÍDICO**: Cita TEXTUALMENTE los artículos relevantes del contexto
4. **RIESGOS Y PROBLEMAS**: Identifica cláusulas potencialmente ilegales, abusivas u omisiones
5. **RECOMENDACIONES**: Sugiere modificaciones, cláusulas faltantes, pasos a seguir
6. **CONCLUSIÓN**: Resumen ejecutivo del estado legal del documento

IMPORTANTE: Fundamenta CADA observación en artículos específicos del contexto."""

        self.conversation_history.append({"role": "user", "content": analysis_prompt})
        
        try:
            response = self.client.chat.completions.create(
                model=MODEL,
                messages=self.conversation_history,
                max_tokens=MAX_TOKENS_RESPONSE,
                temperature=0.1,
            )
            
            assistant_message = response.choices[0].message.content
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message,
            })
            
            # Keep history manageable
            if len(self.conversation_history) > 21:
                self.conversation_history = (
                    [self.conversation_history[0]]
                    + self.conversation_history[-20:]
                )
            
            return assistant_message
            
        except Exception as e:
            return f"❌ Error al consultar GPT-4o-mini: {str(e)}"

    def ask_followup(self, question: str) -> str:
        """
        Ask a follow-up question about the currently loaded document.
        
        Args:
            question: Follow-up question about the document.
        
        Returns:
            Agent's response.
        """
        if not self.current_document:
            return "⚠️ No hay documento cargado. Use 'analyze_document' primero."
        
        # Search for specific articles if the question references them
        from agents.repository_search_agent import extract_article_references, detect_search_topics
        
        article_refs = extract_article_references(question)
        topics = detect_search_topics(question)
        
        additional_articles: list[Article] = []
        
        for ref in article_refs:
            code_hint = ref.get("code_hint")
            num = ref["number"]
            if code_hint:
                arts = self.kb.find_article(code_hint, num)
            else:
                arts = self.kb.find_article_any_code(num)
            additional_articles.extend(arts)
        
        for topic in topics:
            remaining = 5 - len(additional_articles)
            if remaining <= 0:
                break
            additional_articles.extend(
                self.kb.search_by_topic(topic, max_results=min(3, remaining))
            )
        
        # Build follow-up prompt
        context = ""
        if additional_articles:
            context = "\n\nARTÍCULOS ADICIONALES RELEVANTES:\n"
            context += self._build_articles_context(additional_articles)
        
        followup_prompt = f"""PREGUNTA DE SEGUIMIENTO sobre el documento "{self.current_doc_name}" ({self.current_doc_type}):

{question}
{context}

Responde basándote en el análisis previo del documento y los artículos disponibles.
Cita textualmente los artículos cuando sea relevante."""

        self.conversation_history.append({"role": "user", "content": followup_prompt})
        
        try:
            response = self.client.chat.completions.create(
                model=MODEL,
                messages=self.conversation_history,
                max_tokens=MAX_TOKENS_RESPONSE,
                temperature=0.1,
            )
            
            assistant_message = response.choices[0].message.content
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message,
            })
            
            if len(self.conversation_history) > 21:
                self.conversation_history = (
                    [self.conversation_history[0]]
                    + self.conversation_history[-20:]
                )
            
            return assistant_message
            
        except Exception as e:
            return f"❌ Error: {str(e)}"

    def _build_articles_context(self, articles: list[Article]) -> str:
        """Build formatted context string from articles."""
        if not articles:
            return "⚠️ No se encontraron artículos directamente relevantes en la base de datos."
        
        parts = []
        for i, art in enumerate(articles, 1):
            parts.append(f"\n--- Artículo {i}/{len(articles)} ---")
            parts.append(f"📌 {art.citation()}")
            parts.append(f"📝 Texto:")
            parts.append(f'"{art.content}"')
        
        return "\n".join(parts)

    def reset(self):
        """Reset agent state (document and conversation)."""
        self.conversation_history = [self.conversation_history[0]]
        self.current_document = None
        self.current_doc_name = None
        self.current_doc_type = None


# ---------------------------------------------------------------------------
# Interactive CLI
# ---------------------------------------------------------------------------

def main():
    """Run the document analysis agent in interactive mode."""
    try:
        from rich.console import Console
        from rich.markdown import Markdown
        from rich.panel import Panel
        USE_RICH = True
    except ImportError:
        USE_RICH = False

    if USE_RICH:
        console = Console()
        console.print(Panel(
            "[bold magenta]📄 LexAI Costa Rica — Agente de Análisis de Documentos[/bold magenta]\n\n"
            "[dim]Analiza contratos, demandas y documentos legales\n"
            "contra los códigos legales de Costa Rica.[/dim]\n\n"
            "[yellow]Comandos:[/yellow]\n"
            "  [green]/cargar <ruta>[/green]    — Cargar y analizar un documento\n"
            "  [green]/texto[/green]            — Pegar texto para analizar\n"
            "  [green]/codigos[/green]          — Ver códigos disponibles\n"
            "  [green]/reset[/green]            — Reiniciar (nuevo documento)\n"
            "  [green]/salir[/green]            — Salir\n",
            title="🇨🇷 LexAI Documentos",
            border_style="magenta",
        ))
    else:
        print("=" * 60)
        print("📄 LexAI Costa Rica — Agente de Análisis de Documentos")
        print("=" * 60)
        print("Comandos: /cargar <ruta>, /texto, /codigos, /reset, /salir")
        print()

    try:
        agent = DocumentAnalysisAgent()
    except ValueError as e:
        print(f"\n{e}")
        sys.exit(1)

    # Check if a file was passed as argument
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
        if os.path.exists(file_path):
            if USE_RICH:
                with console.status(f"[bold magenta]Analizando {file_path}...[/bold magenta]"):
                    result = agent.analyze_document(file_path)
                console.print(Panel(Markdown(result), title="⚖️ Análisis", border_style="blue", padding=(1, 2)))
            else:
                print(f"\n📄 Analizando: {file_path}...")
                result = agent.analyze_document(file_path)
                print(f"\n{result}\n")
        else:
            print(f"❌ Archivo no encontrado: {file_path}")

    while True:
        try:
            if USE_RICH:
                user_input = console.input("[bold green]👤 Usted:[/bold green] ").strip()
            else:
                user_input = input("👤 Usted: ").strip()
            
            if not user_input:
                continue
            
            # Handle commands
            if user_input.lower() in ("/salir", "/exit", "/quit", "salir", "exit"):
                print("\n👋 ¡Hasta luego!")
                break
            
            if user_input.lower().startswith("/cargar"):
                parts = user_input.split(maxsplit=1)
                if len(parts) < 2:
                    print("⚠️ Uso: /cargar <ruta_del_archivo>")
                    continue
                
                file_path = parts[1].strip()
                if USE_RICH:
                    with console.status(f"[bold magenta]Analizando {file_path}...[/bold magenta]"):
                        result = agent.analyze_document(file_path)
                    console.print(Panel(
                        Markdown(result),
                        title=f"⚖️ Análisis: {os.path.basename(file_path)}",
                        border_style="blue",
                        padding=(1, 2),
                    ))
                else:
                    print(f"\n📄 Analizando: {file_path}...")
                    result = agent.analyze_document(file_path)
                    print(f"\n{result}\n")
                continue
            
            if user_input.lower() == "/texto":
                print("📝 Pegue el texto del documento (termine con una línea vacía '---'):")
                lines = []
                while True:
                    line = input()
                    if line.strip() == "---":
                        break
                    lines.append(line)
                
                doc_text = "\n".join(lines)
                if not doc_text.strip():
                    print("⚠️ No se recibió texto.")
                    continue
                
                if USE_RICH:
                    with console.status("[bold magenta]Analizando texto...[/bold magenta]"):
                        result = agent.analyze_text(doc_text, "Texto pegado")
                    console.print(Panel(
                        Markdown(result),
                        title="⚖️ Análisis del Texto",
                        border_style="blue",
                        padding=(1, 2),
                    ))
                else:
                    print("\n📄 Analizando texto...")
                    result = agent.analyze_text(doc_text, "Texto pegado")
                    print(f"\n{result}\n")
                continue
            
            if user_input.lower() == "/codigos":
                codes = agent.kb.get_available_codes()
                for c in codes:
                    print(f"  • {c['name']} ({c['law_number']}) — {c['total_articles']} artículos")
                continue
            
            if user_input.lower() == "/reset":
                agent.reset()
                print("🔄 Reiniciado. Puede cargar un nuevo documento.")
                continue
            
            # Follow-up question
            if agent.current_document:
                if USE_RICH:
                    with console.status("[bold magenta]Analizando...[/bold magenta]"):
                        result = agent.ask_followup(user_input)
                    console.print(Panel(
                        Markdown(result),
                        title="⚖️ Respuesta",
                        border_style="blue",
                        padding=(1, 2),
                    ))
                else:
                    result = agent.ask_followup(user_input)
                    print(f"\n⚖️ {result}\n")
            else:
                print("⚠️ No hay documento cargado. Use /cargar <archivo> o /texto para comenzar.")
                
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()
