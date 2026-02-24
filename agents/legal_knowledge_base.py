"""
Legal Knowledge Base - Core data loader and search engine for Costa Rican legal codes.

This module loads all processed legal code JSONs, normalizes them into a unified
format, and provides both EXACT article search and SEMANTIC keyword search.
It serves as the single source of truth for both the Repository Search Agent
and the Document Analysis Agent.

Supported codes:
- Código Civil (Ley N° 63)
- Código de Comercio (Ley N° 3284)
- Código Penal (Ley N° 4573)
- Código Procesal Penal (Ley N° 7594)
- Código de Trabajo (Ley N° 2)
"""

import json
import os
import re
import unicodedata
from dataclasses import dataclass, field
from typing import Optional

# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class Article:
    """Normalized article from any legal code."""
    code_id: str          # e.g. "codigo-civil"
    code_name: str        # e.g. "Código Civil de Costa Rica"
    law_number: str       # e.g. "Ley N° 63"
    article_number: int
    title: str
    content: str

    def citation(self) -> str:
        return f"Artículo {self.article_number} del {self.code_name} ({self.law_number})"

    def full_text(self) -> str:
        return f"{self.citation()}:\n\"{self.content}\""


@dataclass
class LegalCode:
    """Represents a full legal code with metadata and articles."""
    code_id: str
    name: str
    law_number: str
    total_articles: int
    articles: list[Article] = field(default_factory=list)
    # Index: article_number -> Article (for O(1) exact lookup)
    _index: dict[int, list[Article]] = field(default_factory=dict, repr=False)

    def build_index(self):
        self._index = {}
        for art in self.articles:
            self._index.setdefault(art.article_number, []).append(art)

    def find_exact(self, article_number: int) -> list[Article]:
        """Exact article number lookup — O(1)."""
        return self._index.get(article_number, [])


# ---------------------------------------------------------------------------
# Knowledge Base
# ---------------------------------------------------------------------------

class LegalKnowledgeBase:
    """
    Central knowledge base that loads and searches all Costa Rican legal codes.
    
    Features:
    - Loads all processed JSON files from data/processed/
    - Normalizes different JSON schemas into a unified Article format
    - Provides EXACT article number search (primary, deterministic)
    - Provides KEYWORD search (secondary, for topic-based queries)
    - Caches everything in-memory for fast access
    """

    # Map of code_id to its metadata for loading
    CODE_REGISTRY = {
        "codigo-civil": {"name": "Código Civil de Costa Rica", "law": "Ley N° 63"},
        "codigo-comercio": {"name": "Código de Comercio de Costa Rica", "law": "Ley N° 3284"},
        "codigo-penal": {"name": "Código Penal de Costa Rica", "law": "Ley N° 4573"},
        "codigo-procesal-penal": {"name": "Código Procesal Penal de Costa Rica", "law": "Ley N° 7594"},
        "codigo-trabajo": {"name": "Código de Trabajo de Costa Rica", "law": "Ley N° 2"},
    }

    def __init__(self, data_dir: Optional[str] = None):
        """
        Initialize and load all legal codes.
        
        Args:
            data_dir: Path to the data/processed/ directory.
                      Defaults to <project_root>/data/processed/
        """
        if data_dir is None:
            # Auto-detect: this file is at agents/legal_knowledge_base.py
            project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            data_dir = os.path.join(project_root, "data", "processed")
        
        self.data_dir = data_dir
        self.codes: dict[str, LegalCode] = {}
        self._all_articles: list[Article] = []
        self._loaded = False

    def load(self) -> "LegalKnowledgeBase":
        """Load all legal codes from JSON files. Returns self for chaining."""
        if self._loaded:
            return self

        for code_id, meta in self.CODE_REGISTRY.items():
            json_path = os.path.join(self.data_dir, f"{code_id}.json")
            if not os.path.exists(json_path):
                print(f"⚠️  Skipping {code_id}: file not found at {json_path}")
                continue

            try:
                with open(json_path, "r", encoding="utf-8") as f:
                    raw = json.load(f)

                code_name = raw.get("name", meta["name"])
                law_number = raw.get("law_number", meta["law"])

                legal_code = LegalCode(
                    code_id=code_id,
                    name=code_name,
                    law_number=law_number,
                    total_articles=raw.get("total_articles", 0),
                )

                for raw_art in raw.get("articles", []):
                    article = self._normalize_article(raw_art, code_id, code_name, law_number)
                    if article:
                        legal_code.articles.append(article)
                        self._all_articles.append(article)

                legal_code.build_index()
                self.codes[code_id] = legal_code
                print(f"✅ Loaded {code_id}: {len(legal_code.articles)} articles")

            except Exception as e:
                print(f"❌ Error loading {code_id}: {e}")

        self._loaded = True
        print(f"\n📚 Knowledge base ready: {len(self.codes)} codes, {len(self._all_articles)} total articles")
        return self

    def _normalize_article(
        self, raw: dict, code_id: str, code_name: str, law_number: str
    ) -> Optional[Article]:
        """
        Normalize an article from either JSON schema into our unified format.
        
        Schema A (civil, comercio, penal, procesal-penal):
            {"number": "123", "title": "Artículo 123", "content": "..."}
        
        Schema B (trabajo):
            {"law": "codigo_trabajo", "article": 123, "title": "artículo 123", "text": "..."}
        """
        try:
            # Determine article number
            if "article" in raw:
                art_num = int(raw["article"])
            elif "number" in raw:
                art_num = int(raw["number"])
            else:
                return None

            # Determine content
            content = raw.get("text") or raw.get("content") or ""
            content = content.strip()
            if not content:
                return None

            title = raw.get("title", f"Artículo {art_num}")

            return Article(
                code_id=code_id,
                code_name=code_name,
                law_number=law_number,
                article_number=art_num,
                title=title,
                content=content,
            )
        except (ValueError, TypeError):
            return None

    # ------------------------------------------------------------------
    # Search methods
    # ------------------------------------------------------------------

    def find_article(self, code_id: str, article_number: int) -> list[Article]:
        """
        EXACT search: find article by code + number.
        Returns list because some codes have duplicate numbers (e.g., título preliminar).
        """
        code = self.codes.get(code_id)
        if not code:
            return []
        return code.find_exact(article_number)

    def find_article_any_code(self, article_number: int) -> list[Article]:
        """Search for an article number across ALL codes."""
        results = []
        for code in self.codes.values():
            results.extend(code.find_exact(article_number))
        return results

    def search_by_keywords(
        self,
        query: str,
        code_id: Optional[str] = None,
        max_results: int = 10,
    ) -> list[Article]:
        """
        KEYWORD search: find articles whose content matches the query terms.
        
        This is a TF-based keyword search that scores articles by how many
        query terms they contain (case-insensitive, accent-insensitive).
        
        Args:
            query: Natural language search query
            code_id: If provided, search only this code. Otherwise, search all.
            max_results: Maximum number of results to return.
        
        Returns:
            List of Articles sorted by relevance (most matching terms first).
        """
        # Normalize and tokenize query
        query_terms = self._tokenize(query)
        if not query_terms:
            return []

        articles_to_search = (
            self.codes[code_id].articles if code_id and code_id in self.codes
            else self._all_articles
        )

        scored: list[tuple[float, Article]] = []
        for art in articles_to_search:
            score = self._score_article(art, query_terms)
            if score > 0:
                scored.append((score, art))

        # Sort by score descending
        scored.sort(key=lambda x: x[0], reverse=True)
        return [art for _, art in scored[:max_results]]

    def search_by_topic(
        self,
        topic: str,
        code_id: Optional[str] = None,
        max_results: int = 10,
    ) -> list[Article]:
        """
        TOPIC search: Enhanced keyword search that also checks titles 
        and uses legal term expansion.
        """
        # Expand common legal topic terms
        expanded = self._expand_legal_terms(topic)
        return self.search_by_keywords(expanded, code_id=code_id, max_results=max_results)

    # ------------------------------------------------------------------
    # Utility / Info
    # ------------------------------------------------------------------

    def get_available_codes(self) -> list[dict]:
        """Return metadata about all loaded codes."""
        return [
            {
                "code_id": code.code_id,
                "name": code.name,
                "law_number": code.law_number,
                "total_articles": len(code.articles),
            }
            for code in self.codes.values()
        ]

    def get_stats(self) -> dict:
        """Return overall statistics."""
        return {
            "total_codes": len(self.codes),
            "total_articles": len(self._all_articles),
            "codes": {
                cid: len(c.articles) for cid, c in self.codes.items()
            },
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _remove_accents(text: str) -> str:
        """Remove accent marks for accent-insensitive matching."""
        nfkd = unicodedata.normalize("NFKD", text)
        return "".join(c for c in nfkd if not unicodedata.category(c).startswith("M"))

    def _tokenize(self, text: str) -> list[str]:
        """Tokenize text into lowercase, accent-free terms (min 3 chars)."""
        text = self._remove_accents(text.lower())
        # Remove non-alphanumeric except spaces
        text = re.sub(r"[^a-z0-9\s]", " ", text)
        tokens = text.split()
        # Filter stopwords and short tokens
        stopwords = {
            "el", "la", "los", "las", "un", "una", "unos", "unas",
            "de", "del", "en", "por", "para", "con", "sin", "que",
            "se", "al", "es", "su", "sus", "no", "si", "como",
            "mas", "pero", "este", "esta", "estos", "estas",
            "ser", "hay", "son", "fue", "han", "puede", "debe",
            "todo", "toda", "todos", "todas", "otro", "otra",
            "cual", "cuando", "donde", "quien", "sobre", "entre",
        }
        return [t for t in tokens if len(t) >= 3 and t not in stopwords]

    def _score_article(self, article: Article, query_terms: list[str]) -> float:
        """
        Score an article based on how many query terms appear in its content.
        
        Scoring:
        - +2.0 for each term found in the title
        - +1.0 for each term found in the content
        - Bonus for articles where ALL terms appear
        """
        title_norm = self._remove_accents(article.title.lower())
        content_norm = self._remove_accents(article.content.lower())
        full_text = title_norm + " " + content_norm

        score = 0.0
        terms_found = 0

        for term in query_terms:
            if term in title_norm:
                score += 2.0
                terms_found += 1
            elif term in content_norm:
                score += 1.0
                terms_found += 1

        # Bonus: all terms present
        if terms_found == len(query_terms) and len(query_terms) > 1:
            score += 3.0

        return score

    @staticmethod
    def _expand_legal_terms(topic: str) -> str:
        """
        Expand common legal topics with related terms to improve search.
        """
        expansions = {
            "contrato": "contrato obligaciones acuerdo convenio partes",
            "matrimonio": "matrimonio cónyuges divorcio separación familia",
            "herencia": "herencia sucesión testamento herederos legatarios",
            "despido": "despido terminación relación laboral trabajador patrono indemnización",
            "arrendamiento": "arrendamiento alquiler arrendatario arrendador renta",
            "propiedad": "propiedad dominio inmueble bienes posesión",
            "delito": "delito pena sanción penal culpable",
            "prescripción": "prescripción plazo caducidad término vencimiento",
            "obligación": "obligación deuda acreedor deudor pago",
            "sociedad": "sociedad mercantil socios capital acciones",
            "salario": "salario remuneración pago jornal compensación sueldo",
            "vacaciones": "vacaciones descanso licencia permiso",
            "aguinaldo": "aguinaldo décimo tercer mes sueldo adicional",
            "homicidio": "homicidio muerte matar vida",
            "robo": "robo hurto sustracción apoderamiento",
            "estafa": "estafa fraude engaño perjuicio patrimonial",
            "divorcio": "divorcio separación disolución vínculo matrimonial",
            "alimentos": "alimentos pensión alimentaria manutención",
            "daños": "daños perjuicios indemnización responsabilidad civil",
            "embargo": "embargo secuestro bienes ejecución",
        }
        topic_lower = topic.lower()
        expanded = topic
        for key, expansion in expansions.items():
            if key in topic_lower:
                expanded = f"{topic} {expansion}"
                break
        return expanded


# ---------------------------------------------------------------------------
# Singleton accessor
# ---------------------------------------------------------------------------

_kb_instance: Optional[LegalKnowledgeBase] = None


def get_knowledge_base(data_dir: Optional[str] = None) -> LegalKnowledgeBase:
    """
    Get (or create) the singleton LegalKnowledgeBase instance.
    Thread-safe for typical Python use (GIL).
    """
    global _kb_instance
    if _kb_instance is None:
        _kb_instance = LegalKnowledgeBase(data_dir=data_dir).load()
    return _kb_instance
