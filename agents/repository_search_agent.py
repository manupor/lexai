"""
🔍 AGENT 1: Legal Repository Search Agent
==========================================

An AI-powered chatbot agent that searches through Costa Rican legal codes
(PDFs extracted to JSON) to find specific articles, answer legal questions,
and provide accurate analysis with proper citations.

Uses GPT-4o-mini with RAG (Retrieval-Augmented Generation):
1. User asks a legal question
2. Agent extracts article numbers and/or keywords from the query
3. Agent searches the legal knowledge base for relevant articles
4. Agent sends the ACTUAL article text + user query to GPT-4o-mini
5. GPT-4o-mini generates a response grounded in real legal text

This ensures accuracy — the model NEVER fabricates article content.

Usage:
    python -m agents.repository_search_agent
"""

import json
import os
import re
import sys
from typing import Optional

from openai import OpenAI
from dotenv import load_dotenv

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from agents.legal_knowledge_base import get_knowledge_base, Article

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

MODEL = "gpt-4o-mini"
MAX_CONTEXT_ARTICLES = 15  # Max articles to include in context
MAX_TOKENS_RESPONSE = 2000

# System prompt for the search agent
SYSTEM_PROMPT = """Eres un ABOGADO EXPERTO especializado EXCLUSIVAMENTE en el sistema jurídico de Costa Rica.

🎯 TU ROL: Eres un agente de búsqueda legal. Recibes consultas y las respondes 
usando ÚNICAMENTE los artículos de ley que se te proporcionan en el contexto.

📋 REGLAS ABSOLUTAS:

1. CITAR TEXTUALMENTE: Cuando tengas artículos en el contexto, SIEMPRE cítalos 
   textualmente usando este formato:
   > **Artículo [número] del [Código] ([Ley]):**
   > "[TEXTO EXACTO DEL ARTÍCULO]"

2. NUNCA INVENTAR: Si no tienes un artículo en el contexto, NUNCA inventes su 
   contenido. Di explícitamente que no tienes acceso a ese artículo específico.

3. ANALIZAR: Después de citar, ANALIZA y EXPLICA cómo aplica al caso del usuario.

4. RECOMENDAR VERIFICACIÓN: Al final, siempre recomienda verificar en SCIJ 
   (http://www.pgrweb.go.cr/scij/) o consultar con un abogado colegiado.

📚 CÓDIGOS DISPONIBLES EN TU BASE DE DATOS:
- Código Civil de Costa Rica (Ley N° 63)
- Código de Comercio de Costa Rica (Ley N° 3284)  
- Código Penal de Costa Rica (Ley N° 4573)
- Código Procesal Penal de Costa Rica (Ley N° 7594)
- Código de Trabajo de Costa Rica (Ley N° 2)

🚫 PROHIBICIONES:
❌ NUNCA inventes números de artículos que no estén en el contexto
❌ NUNCA uses leyes de otros países (México, España, etc.)
❌ NUNCA cites artículos que no estén en el contexto proporcionado
❌ NUNCA parafrasees — cita TEXTUALMENTE

📝 FORMATO DE RESPUESTA:
1. **Planteamiento**: Reformula la consulta brevemente
2. **Marco Jurídico**: Artículos relevantes citados textualmente
3. **Análisis**: Interpretación y aplicación al caso
4. **Conclusión**: Respuesta directa
5. **Recomendaciones**: Pasos a seguir y advertencia de verificar en SCIJ

Responde siempre en español."""

# ---------------------------------------------------------------------------
# Article number extraction from user queries
# ---------------------------------------------------------------------------

def extract_article_references(query: str) -> list[dict]:
    """
    Extract article number references from a user query.
    
    Handles patterns like:
    - "artículo 45"
    - "art. 123"
    - "articulo 78 del código civil"
    - "artículos 10 al 15"
    - "art 200"
    
    Returns list of {"number": int, "code_hint": str|None}
    """
    results = []
    query_lower = query.lower()
    
    # Pattern 1: "artículo(s) X" or "art. X" or "art X"
    pattern_single = re.compile(
        r'(?:art[ií]culos?|arts?\.?)\s*(\d+)',
        re.IGNORECASE
    )
    for match in pattern_single.finditer(query):
        num = int(match.group(1))
        results.append({"number": num, "code_hint": None})
    
    # Pattern 2: "artículos X al Y" (range)
    pattern_range = re.compile(
        r'(?:art[ií]culos?|arts?\.?)\s*(\d+)\s*(?:al|a|hasta)\s*(\d+)',
        re.IGNORECASE
    )
    for match in pattern_range.finditer(query):
        start = int(match.group(1))
        end = int(match.group(2))
        # Limit range to prevent huge queries
        if end - start <= 20:
            for n in range(start, end + 1):
                if not any(r["number"] == n for r in results):
                    results.append({"number": n, "code_hint": None})
    
    # Detect code hints
    code_hints = {
        "civil": "codigo-civil",
        "comercio": "codigo-comercio",
        "penal": "codigo-penal",
        "procesal penal": "codigo-procesal-penal",
        "procesal": "codigo-procesal-penal",
        "trabajo": "codigo-trabajo",
        "laboral": "codigo-trabajo",
    }
    
    detected_code = None
    for keyword, code_id in code_hints.items():
        if keyword in query_lower:
            detected_code = code_id
            break
    
    # Apply detected code hint to all results
    if detected_code:
        for r in results:
            r["code_hint"] = detected_code
    
    return results


def detect_search_topics(query: str) -> list[str]:
    """
    Detect legal topics in the query for keyword-based search.
    Returns a list of search terms to use.
    """
    # Common legal topic patterns
    topic_patterns = [
        (r'\bcontrat', 'contrato'),
        (r'\bdespi', 'despido'),
        (r'\bvacacion', 'vacaciones'),
        (r'\b(?:aguinaldo|décimo.?tercer)\b', 'aguinaldo'),
        (r'\b(?:salario|sueldo|remunerac)', 'salario'),
        (r'\b(?:matrimonio|casar)', 'matrimonio'),
        (r'\bdivorci', 'divorcio'),
        (r'\b(?:herencia|hered)', 'herencia'),
        (r'\b(?:propiedad|inmueble|terreno|finca)\b', 'propiedad'),
        (r'\b(?:arrendamiento|alquiler|inquilin)', 'arrendamiento'),
        (r'\b(?:sociedad|empresa|compañía)\b', 'sociedad'),
        (r'\b(?:prescripci|prescrib)', 'prescripción'),
        (r'\b(?:obligaci|deuda)', 'obligación'),
        (r'\b(?:delito|crimen|criminal)\b', 'delito'),
        (r'\b(?:homicidio|asesinat|matar)\b', 'homicidio'),
        (r'\b(?:robo|hurto|robar)\b', 'robo'),
        (r'\b(?:estafa|fraude|engaño)\b', 'estafa'),
        (r'\b(?:daños|perjuicios|indemnizaci)', 'daños'),
        (r'\b(?:embargo|embargar)\b', 'embargo'),
        (r'\b(?:alimento|pensión.?alimentaria|manutenci)', 'alimentos'),
        (r'\b(?:jornada|horas.?extra|horario)\b', 'jornada laboral'),
        (r'\bpreaviso\b', 'preaviso'),
        (r'\bcesant[ií]a\b', 'cesantía'),
        (r'\b(?:garantía|fianza)\b', 'garantía'),
        (r'\bhipoteca', 'hipoteca'),
        (r'\b(?:testamento|sucesi)', 'testamento'),
        (r'\busufruct', 'usufructo'),
        (r'\bservidumbre', 'servidumbre'),
        (r'\b(?:posesi[oó]n|poseedor)\b', 'posesión'),
        (r'\b(?:compraventa|compra|venta)\b', 'compraventa'),
        (r'\b(?:donaci[oó]n|donar)\b', 'donación'),
        (r'\b(?:poder|mandato|poderdante)\b', 'mandato'),
        (r'\bresponsabilidad\b', 'responsabilidad'),
        (r'\b(?:capacidad|incapacidad|menor)\b', 'capacidad'),
        (r'\b(?:persona.?jur[ií]dica|asociaci)', 'persona jurídica'),
        (r'\b(?:comerciant|actividad.?comercial)\b', 'comerciante'),
        (r'\b(?:quiebra|insolvencia)\b', 'quiebra'),
        (r'\b(?:t[ií]tulo.?valor|letra.?de.?cambio|pagar[eé]|cheque)\b', 'títulos valores'),
        (r'\b(?:trabajador|patrono|empleador|emplead)', 'relación laboral'),
        (r'\b(?:sindicato|huelga)\b', 'sindicato'),
        (r'\b(?:seguridad.?social|ccss)\b', 'seguridad social'),
        (r'\bjusta.?causa\b', 'despido'),
        (r'\b(?:derecho|derechos)\b.*\b(?:laboral|trabajador)', 'relación laboral'),
    ]
    
    query_lower = query.lower()
    topics = []
    seen = set()
    for pattern, topic in topic_patterns:
        if topic not in seen and re.search(pattern, query_lower, re.IGNORECASE):
            topics.append(topic)
            seen.add(topic)
    
    return topics


# ---------------------------------------------------------------------------
# Agent Core
# ---------------------------------------------------------------------------

class RepositorySearchAgent:
    """
    AI Agent that searches the legal repository and answers questions 
    using GPT-4o-mini with RAG (Retrieval-Augmented Generation).
    
    The agent:
    1. Parses the user query to extract article references and topics
    2. Searches the knowledge base for relevant articles
    3. Builds a context with actual article text
    4. Sends context + query to GPT-4o-mini
    5. Returns grounded, accurate legal analysis
    """

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the agent.
        
        Args:
            api_key: OpenAI API key. If None, reads from OPENAI_API_KEY env var.
        """
        self.api_key = api_key or os.environ.get("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError(
                "❌ OPENAI_API_KEY not set. Please set it in your .env file or pass it directly."
            )
        
        self.client = OpenAI(api_key=self.api_key)
        self.kb = get_knowledge_base()
        self.conversation_history: list[dict] = []
        
        # Initialize with system prompt
        self.conversation_history.append({
            "role": "system",
            "content": SYSTEM_PROMPT,
        })

    def search_and_respond(self, user_query: str) -> str:
        """
        Process a user query: search the repository and generate a response.
        
        This is the main entry point for the agent.
        
        Args:
            user_query: The user's legal question or search query.
        
        Returns:
            The agent's response with citations and analysis.
        """
        # Step 1: Extract article references
        article_refs = extract_article_references(user_query)
        
        # Step 2: Detect topics for keyword search
        topics = detect_search_topics(user_query)
        
        # Step 3: Search the knowledge base
        found_articles: list[Article] = []
        search_log: list[str] = []
        
        # 3a: Exact article searches
        for ref in article_refs:
            code_hint = ref.get("code_hint")
            num = ref["number"]
            
            if code_hint:
                arts = self.kb.find_article(code_hint, num)
                if arts:
                    found_articles.extend(arts)
                    search_log.append(f"✅ Encontrado: Art. {num} en {code_hint}")
                else:
                    search_log.append(f"❌ No encontrado: Art. {num} en {code_hint}")
            else:
                arts = self.kb.find_article_any_code(num)
                if arts:
                    found_articles.extend(arts)
                    search_log.append(f"✅ Encontrado: Art. {num} en {', '.join(set(a.code_id for a in arts))}")
                else:
                    search_log.append(f"❌ No encontrado: Art. {num} en ningún código")
        
        # 3b: Topic/keyword searches
        if topics and len(found_articles) < MAX_CONTEXT_ARTICLES:
            for topic in topics:
                remaining = MAX_CONTEXT_ARTICLES - len(found_articles)
                if remaining <= 0:
                    break
                keyword_results = self.kb.search_by_topic(topic, max_results=min(5, remaining))
                for art in keyword_results:
                    if art not in found_articles:
                        found_articles.append(art)
                search_log.append(f"🔍 Búsqueda por tema '{topic}': {len(keyword_results)} resultados")
        
        # 3c: If no specific articles found, do a general keyword search
        if not found_articles and not article_refs:
            keyword_results = self.kb.search_by_keywords(user_query, max_results=MAX_CONTEXT_ARTICLES)
            found_articles.extend(keyword_results)
            search_log.append(f"🔍 Búsqueda general: {len(keyword_results)} resultados")
        
        # Step 4: Build context with actual article text
        context = self._build_context(found_articles, search_log)
        
        # Step 5: Send to GPT-4o-mini with context
        user_message = f"""CONTEXTO DE BÚSQUEDA LEGAL:
{context}

CONSULTA DEL USUARIO:
{user_query}

INSTRUCCIONES:
- Usa ÚNICAMENTE los artículos proporcionados arriba para fundamentar tu respuesta
- Cita TEXTUALMENTE los artículos relevantes
- Si no hay artículos relevantes en el contexto, indícalo claramente
- Analiza y explica cómo aplican al caso del usuario
- Incluye recomendaciones prácticas"""

        self.conversation_history.append({"role": "user", "content": user_message})
        
        try:
            response = self.client.chat.completions.create(
                model=MODEL,
                messages=self.conversation_history,
                max_tokens=MAX_TOKENS_RESPONSE,
                temperature=0.1,  # Low temperature for accuracy
            )
            
            assistant_message = response.choices[0].message.content
            self.conversation_history.append({
                "role": "assistant",
                "content": assistant_message,
            })
            
            # Keep conversation history manageable (last 20 messages + system)
            if len(self.conversation_history) > 21:
                self.conversation_history = (
                    [self.conversation_history[0]]  # system prompt
                    + self.conversation_history[-20:]  # last 20 messages
                )
            
            return assistant_message
            
        except Exception as e:
            return f"❌ Error al consultar GPT-4o-mini: {str(e)}"

    def _build_context(self, articles: list[Article], search_log: list[str]) -> str:
        """Build the context string with found articles."""
        parts = []
        
        # Search log
        parts.append("📊 RESULTADOS DE BÚSQUEDA:")
        for log in search_log:
            parts.append(f"  {log}")
        parts.append("")
        
        if not articles:
            parts.append("⚠️ No se encontraron artículos relevantes en la base de datos.")
            parts.append("El agente debe indicar que no tiene acceso al texto específico.")
            return "\n".join(parts)
        
        # Article content
        parts.append(f"📚 ARTÍCULOS ENCONTRADOS ({len(articles)}):")
        parts.append("=" * 60)
        
        for i, art in enumerate(articles, 1):
            parts.append(f"\n--- Artículo {i}/{len(articles)} ---")
            parts.append(f"📌 {art.citation()}")
            parts.append(f"📝 Texto completo:")
            parts.append(f'"{art.content}"')
            parts.append("")
        
        parts.append("=" * 60)
        return "\n".join(parts)

    def get_available_codes(self) -> str:
        """Return formatted list of available codes."""
        codes = self.kb.get_available_codes()
        lines = ["📚 Códigos legales disponibles:"]
        for c in codes:
            lines.append(f"  • {c['name']} ({c['law_number']}) — {c['total_articles']} artículos")
        return "\n".join(lines)

    def reset_conversation(self):
        """Reset conversation history (keep system prompt)."""
        self.conversation_history = [self.conversation_history[0]]


# ---------------------------------------------------------------------------
# Interactive CLI
# ---------------------------------------------------------------------------

def main():
    """Run the agent in interactive chat mode."""
    try:
        from rich.console import Console
        from rich.markdown import Markdown
        from rich.panel import Panel
        from rich.text import Text
        USE_RICH = True
    except ImportError:
        USE_RICH = False

    if USE_RICH:
        console = Console()
        console.print(Panel(
            "[bold cyan]🔍 LexAI Costa Rica — Agente de Búsqueda Legal[/bold cyan]\n\n"
            "[dim]Busca artículos específicos, consulta por temas legales,\n"
            "y recibe análisis jurídico fundamentado en los códigos de Costa Rica.[/dim]\n\n"
            "[yellow]Comandos especiales:[/yellow]\n"
            "  [green]/codigos[/green]  — Ver códigos disponibles\n"
            "  [green]/stats[/green]    — Ver estadísticas de la base de datos\n"
            "  [green]/reset[/green]    — Reiniciar conversación\n"
            "  [green]/salir[/green]    — Salir\n",
            title="🇨🇷 LexAI",
            border_style="cyan",
        ))
    else:
        print("=" * 60)
        print("🔍 LexAI Costa Rica — Agente de Búsqueda Legal")
        print("=" * 60)
        print("Comandos: /codigos, /stats, /reset, /salir")
        print()

    try:
        agent = RepositorySearchAgent()
    except ValueError as e:
        print(f"\n{e}")
        print("Configure OPENAI_API_KEY en su archivo .env")
        sys.exit(1)

    if USE_RICH:
        console.print(f"\n[dim]{agent.get_available_codes()}[/dim]\n")
    else:
        print(agent.get_available_codes())
        print()

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
                print("\n👋 ¡Hasta luego! Gracias por usar LexAI.")
                break
            
            if user_input.lower() == "/codigos":
                if USE_RICH:
                    console.print(f"\n[cyan]{agent.get_available_codes()}[/cyan]\n")
                else:
                    print(agent.get_available_codes())
                continue
            
            if user_input.lower() == "/stats":
                stats = agent.kb.get_stats()
                if USE_RICH:
                    console.print(Panel(
                        f"[cyan]Total códigos:[/cyan] {stats['total_codes']}\n"
                        f"[cyan]Total artículos:[/cyan] {stats['total_articles']}\n\n"
                        + "\n".join(f"  • {cid}: {count} arts." for cid, count in stats['codes'].items()),
                        title="📊 Estadísticas",
                        border_style="blue",
                    ))
                else:
                    print(f"\n📊 Stats: {json.dumps(stats, indent=2)}\n")
                continue
            
            if user_input.lower() == "/reset":
                agent.reset_conversation()
                print("🔄 Conversación reiniciada.\n")
                continue
            
            # Process query
            if USE_RICH:
                with console.status("[bold cyan]Buscando en la base legal...[/bold cyan]"):
                    response = agent.search_and_respond(user_input)
                console.print()
                console.print(Panel(
                    Markdown(response),
                    title="⚖️ LexAI",
                    border_style="blue",
                    padding=(1, 2),
                ))
                console.print()
            else:
                print("\n🔍 Buscando...")
                response = agent.search_and_respond(user_input)
                print(f"\n⚖️ LexAI:\n{response}\n")
                
        except KeyboardInterrupt:
            print("\n\n👋 ¡Hasta luego!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}\n")


if __name__ == "__main__":
    main()
