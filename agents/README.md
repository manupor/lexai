# 🇨🇷 LexAI Agents — Python AI Legal Assistants

Two specialized Python AI agents powered by **GPT-4o-mini** that provide accurate legal analysis based on Costa Rica's legal codes.

## 📚 Architecture

Both agents use **RAG (Retrieval-Augmented Generation)** to ensure accuracy:

```
User Query → Article/Topic Extraction → Knowledge Base Search → Context Building → GPT-4o-mini → Grounded Response
```

The key principle: **GPT-4o-mini NEVER fabricates legal content** — it only analyzes and explains articles that are actually found in the database.

### Knowledge Base Stats
| Code | Law | Articles |
|------|-----|----------|
| Código Civil | Ley N° 63 | 1,180 |
| Código de Comercio | Ley N° 3284 | 1,001 |
| Código Penal | Ley N° 4573 | 482 |
| Código Procesal Penal | Ley N° 7594 | 504 |
| Código de Trabajo | Ley N° 2 | 567 |
| **Total** | | **3,734** |

## 🔍 Agent 1: Repository Search Agent

An interactive chatbot that searches through the legal code repository to find specific articles and answer legal questions.

### Features
- **Exact article search**: Ask for specific articles by number (e.g., "Artículo 45 del Código Civil")
- **Topic search**: Ask about legal topics (e.g., "¿Qué dice la ley sobre despido?")
- **Multi-code search**: Searches across all 5 legal codes simultaneously
- **Textual citations**: Always quotes the exact article text, never paraphrases
- **Conversation memory**: Maintains context for follow-up questions
- **40+ legal topic patterns**: Built-in detection for common legal queries

### Usage
```bash
python run_agents.py search
```

### Example Queries
```
👤 Usted: ¿Qué dice el artículo 85 del Código de Trabajo sobre despido?
👤 Usted: ¿Cuáles son las causas justas de despido en Costa Rica?
👤 Usted: Artículos 1020 al 1025 del Código Civil
👤 Usted: ¿Qué requisitos tiene un contrato de arrendamiento?
👤 Usted: ¿Cuál es la pena por estafa en Costa Rica?
```

### Special Commands
| Command | Description |
|---------|-------------|
| `/codigos` | Show available legal codes |
| `/stats` | Show database statistics |
| `/reset` | Reset conversation |
| `/salir` | Exit |

## 📄 Agent 2: Document Analysis Agent

Analyzes uploaded legal documents (contracts, complaints, legal briefs, etc.) against the legal code repository.

### Features
- **PDF extraction**: Reads text from PDF files using PyMuPDF
- **RTF/TXT support**: Also supports plain text and RTF files
- **Auto document type detection**: Identifies 20+ document types
- **In-document reference extraction**: Finds article citations within the document
- **Topic-based article matching**: Finds relevant legal articles for the document's content
- **Professional analysis**: Identifies risks, illegal clauses, and omissions
- **Follow-up questions**: Ask questions about the loaded document

### Usage
```bash
# Interactive mode
python run_agents.py analyze

# Analyze a specific file
python run_agents.py analyze path/to/contract.pdf

# Examples with existing files
python run_agents.py analyze "ejemplo-contrato.txt"
python run_agents.py analyze "data/pdfs/codigo-civil.pdf"
```

### Interactive Commands
| Command | Description |
|---------|-------------|
| `/cargar <path>` | Load and analyze a document |
| `/texto` | Paste text to analyze |
| `/codigos` | Show available codes |
| `/reset` | Reset (new document) |
| `/salir` | Exit |

### Analysis Structure
1. **Document Identification**: Type, parties, object, dates
2. **Clause Analysis**: Review of main clauses and obligations
3. **Legal Framework**: Relevant articles cited textually
4. **Risks & Problems**: Abusive clauses, legal inconsistencies, omissions
5. **Recommendations**: Suggested modifications and next steps
6. **Conclusion**: Executive summary

## 🧪 Testing

```bash
# Test the knowledge base loading and search
python run_agents.py test
```

## 🛠️ Setup

### Prerequisites
- Python 3.9+
- OpenAI API key set in `.env` file as `OPENAI_API_KEY`

### Install Dependencies
```bash
pip install -r agents/requirements.txt
```

### Quick Start
```bash
# 1. Ensure your .env has OPENAI_API_KEY set
# 2. Test the knowledge base
python run_agents.py test

# 3. Start the search agent
python run_agents.py search

# 4. Or analyze a document
python run_agents.py analyze ejemplo-contrato.txt
```

## 📁 File Structure

```
agents/
├── __init__.py                    # Package init
├── requirements.txt               # Python dependencies
├── legal_knowledge_base.py        # Core: loads JSONs, search engine
├── repository_search_agent.py     # Agent 1: Legal search chatbot
└── document_analysis_agent.py     # Agent 2: Document analyzer

run_agents.py                      # Launcher script
```

## 🔧 API Usage (Programmatic)

### Search Agent
```python
from agents.repository_search_agent import RepositorySearchAgent

agent = RepositorySearchAgent()
response = agent.search_and_respond("¿Qué dice el artículo 85 del Código de Trabajo?")
print(response)
```

### Document Analysis Agent
```python
from agents.document_analysis_agent import DocumentAnalysisAgent

agent = DocumentAnalysisAgent()
analysis = agent.analyze_document("contract.pdf")
print(analysis)

# Follow-up
followup = agent.ask_followup("¿La cláusula 3 es legal?")
print(followup)
```

### Knowledge Base Direct Access
```python
from agents.legal_knowledge_base import get_knowledge_base

kb = get_knowledge_base()

# Exact article search
articles = kb.find_article("codigo-civil", 45)

# Keyword search
articles = kb.search_by_keywords("despido injustificado")

# Topic search with legal term expansion
articles = kb.search_by_topic("contrato de arrendamiento")

# Stats
print(kb.get_stats())
```
