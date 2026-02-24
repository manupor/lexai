#!/usr/bin/env python3
"""
🇨🇷 LexAI Costa Rica — Agent Launcher
======================================

Launch either the Repository Search Agent or the Document Analysis Agent.

Usage:
    python run_agents.py search        # Start the legal search chatbot
    python run_agents.py analyze       # Start the document analyzer
    python run_agents.py analyze doc.pdf  # Analyze a specific file
    python run_agents.py test          # Run a quick test of the knowledge base
"""

import sys
import os

# Ensure project root is in path
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, PROJECT_ROOT)


def show_help():
    print("""
🇨🇷 LexAI Costa Rica — Agent Launcher
======================================

Usage:
    python run_agents.py search              Start the legal repository search chatbot
    python run_agents.py analyze             Start the document analysis agent
    python run_agents.py analyze <file>      Analyze a specific document
    python run_agents.py test                Test the knowledge base loading

Examples:
    python run_agents.py search
    python run_agents.py analyze data/pdfs/codigo-civil.pdf
    python run_agents.py analyze "ejemplo-contrato.txt"
    python run_agents.py test
""")


def run_test():
    """Quick test of the knowledge base."""
    print("🧪 Testing Legal Knowledge Base...\n")
    
    from agents.legal_knowledge_base import get_knowledge_base
    
    kb = get_knowledge_base()
    
    print(f"\n📊 Statistics:")
    stats = kb.get_stats()
    print(f"   Total codes: {stats['total_codes']}")
    print(f"   Total articles: {stats['total_articles']}")
    for code_id, count in stats['codes'].items():
        print(f"   • {code_id}: {count} articles")
    
    print(f"\n🔍 Test: Exact search for Article 1 of Código Civil...")
    results = kb.find_article("codigo-civil", 1)
    if results:
        for art in results:
            print(f"   ✅ Found: {art.citation()}")
            print(f"   Content: {art.content[:150]}...")
    else:
        print("   ❌ Not found")
    
    print(f"\n🔍 Test: Keyword search for 'contrato'...")
    results = kb.search_by_keywords("contrato", max_results=3)
    for art in results:
        print(f"   ✅ {art.citation()}")
        print(f"      {art.content[:100]}...")
    
    print(f"\n🔍 Test: Topic search for 'despido'...")
    results = kb.search_by_topic("despido", max_results=3)
    for art in results:
        print(f"   ✅ {art.citation()}")
        print(f"      {art.content[:100]}...")
    
    print("\n✨ All tests passed!")


def main():
    if len(sys.argv) < 2:
        show_help()
        sys.exit(0)
    
    command = sys.argv[1].lower()
    
    if command in ("search", "buscar", "1"):
        from agents.repository_search_agent import main as search_main
        search_main()
    
    elif command in ("analyze", "analizar", "2"):
        # Pass remaining args to the document agent
        sys.argv = [sys.argv[0]] + sys.argv[2:]
        from agents.document_analysis_agent import main as analyze_main
        analyze_main()
    
    elif command == "test":
        run_test()
    
    elif command in ("help", "--help", "-h"):
        show_help()
    
    else:
        print(f"❌ Unknown command: {command}")
        show_help()
        sys.exit(1)


if __name__ == "__main__":
    main()
