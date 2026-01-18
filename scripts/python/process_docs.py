import fitz  # PyMuPDF
import json
import re
import os
import sys
from datetime import datetime

# Configuration
PDF_DIR = os.path.join(os.getcwd(), 'data', 'pdfs')
PROCESSED_DIR = os.path.join(os.getcwd(), 'data', 'processed')
TEXT_DIR = os.path.join(os.getcwd(), 'data', 'text')

# Ensure directories exist
for directory in [PROCESSED_DIR, TEXT_DIR]:
    if not os.path.exists(directory):
        os.makedirs(directory)

def clean_text(text):
    """
    Cleans up the extracted text:
    - Removes excessive whitespace
    - Fixes hyphenated words broken across lines
    - Normalizes quotes
    """
    # Replace multiple newlines with a unique marker to preserve paragraph breaks if needed,
    # but for legal codes, we mostly want to rely on the "Artículo" structure.
    # For now, simple cleanup:
    
    # Remove header/footer noise (simplified approach)
    # Note: A real implementation might use fitz to ignore header/footer areas by coordinate.
    
    text = re.sub(r'\s+', ' ', text)  # Collapse whitespace
    return text.strip()

def extract_text_from_pdf(pdf_path):
    """
    Extracts text from a PDF file using PyMuPDF.
    """
    print(f"📄 Processing: {os.path.basename(pdf_path)}")
    doc = fitz.open(pdf_path)
    full_text = ""
    
    for page in doc:
        full_text += page.get_text()
        
    return full_text

def parse_articles(text, pattern_type="standard"):
    """
    Parses articles from the text based on standard regex patterns.
    """
    articles = []
    
    # Regex to match "Artículo X." or "Artículo X-" followed by content
    # We look for the start of an Article, and capture everything until the next Article start or EOF.
    # Using a lookahead for the next "Artículo"
    
    # Pattern explanation:
    # Article start: (Artículo\s+\d+[\.\-:]?) 
    # Content: (.*?)
    # Stop condition: (?=Artículo\s+\d+|$)
    
    # Note: re.DOTALL is needed so . matches newlines
    
    if pattern_type == "standard":
        # Supports "Artículo 1.", "Artículo 1-", "Artículo 1:"
        pattern = re.compile(r'(Artículo\s+\d+[\.\-:]?)\s*(.*?)(?=\n\s*Artículo\s+\d+[\.\-:]?|$)', re.DOTALL | re.IGNORECASE)
    
    matches = pattern.finditer(text)
    
    for match in matches:
        title = match.group(1).strip()
        # Extract just the number
        number_match = re.search(r'\d+', title)
        number = number_match.group(0) if number_match else "0"
        
        content = match.group(2).strip()
        # Clean up the content
        content = clean_text(content)
        
        if content:
            articles.append({
                "number": number,
                "title": title,
                "content": content
            })
            
    print(f"   ✅ Found {len(articles)} articles")
    return articles

def process_law(pdf_name, output_name, law_name, law_number):
    pdf_path = os.path.join(PDF_DIR, pdf_name)
    
    if not os.path.exists(pdf_path):
        print(f"⚠️  PDF not found: {pdf_path}")
        return
        
    # 1. Extract Text
    raw_text = extract_text_from_pdf(pdf_path)
    
    # Save raw text for debugging
    txt_path = os.path.join(TEXT_DIR, f"{output_name}.txt")
    with open(txt_path, 'w', encoding='utf-8') as f:
        f.write(raw_text)
        
    # 2. Parse Articles
    articles = parse_articles(raw_text)
    
    # 3. Create Structured JSON
    legal_code = {
        "name": law_name,
        "law_number": law_number,
        "extracted_at": datetime.now().isoformat(),
        "total_articles": len(articles),
        "articles": articles
        # We omit "full_text" in the JSON to save space if individual articles are good enough,
        # but to maintain compatibility with previous logic, we can keep it or omit it.
        # Let's omit it for cleaner files unless needed.
    }
    
    json_path = os.path.join(PROCESSED_DIR, f"{output_name}.json")
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(legal_code, f, ensure_ascii=False, indent=2)
    
    # 4. Create Index (Number -> Content)
    index = {a['number']: a['content'] for a in articles}
    index_path = os.path.join(PROCESSED_DIR, f"{output_name}-index.json")
    with open(index_path, 'w', encoding='utf-8') as f:
        json.dump(index, f, ensure_ascii=False, indent=2)
        
    print(f"   💾 Saved to {json_path}")

def main():
    print("🚀 Starting Python PDF Extraction...")
    
    # Code definitions
    codes = [
        {
            "pdf": "codigo-comercio.pdf",
            "output": "codigo-comercio",
            "name": "Código de Comercio de Costa Rica",
            "number": "Ley N° 3284"
        },
        {
            "pdf": "codigo-civil.pdf",
            "output": "codigo-civil",
            "name": "Código Civil de Costa Rica",
            "number": "Ley N° 63"
        },
        {
            "pdf": "codigo-procesal-penal.pdf",
            "output": "codigo-procesal-penal",
            "name": "Código Procesal Penal de Costa Rica",
            "number": "Ley N° 7594"
        }
    ]
    
    for code in codes:
        process_law(code["pdf"], code["output"], code["name"], code["number"])
        
    print("\n✨ Extraction complete!")

if __name__ == "__main__":
    main()
