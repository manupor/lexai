# 📊 OFFLINE Data Pipeline

## Overview

This document describes the **OFFLINE** data processing pipeline for Costa Rican legal codes.

**Key Principle:** PDFs are processed ONCE offline, then read MANY times at runtime.

---

## Pipeline Architecture

```
┌─────────────┐
│   PDFs      │  /data/pdfs/*.pdf
│ (Source)    │  
└──────┬──────┘
       │
       │ npm run extract:pdfs (pdftotext)
       ▼
┌─────────────┐
│  Raw Text   │  /data/text/*.txt
│             │
└──────┬──────┘
       │
       │ npm run convert:txt-to-json
       ▼
┌─────────────┐
│ Structured  │  /data/processed/*.json
│    JSON     │  (Articles indexed)
└──────┬──────┘
       │
       │ Runtime: API routes read JSON
       ▼
┌─────────────┐
│  Fast API   │  < 2 second responses
│  Responses  │  100% deterministic
└─────────────┘
```

---

## Step 1: Extract PDFs to Text

### Prerequisites

Install Poppler utils (provides `pdftotext`):

```bash
# macOS
brew install poppler

# Ubuntu/Debian
sudo apt-get install poppler-utils

# Windows
# Download from: https://github.com/oschwartz10612/poppler-windows/releases/
```

### Add PDFs

Place PDF files in `/data/pdfs/`:

```
/data/pdfs/
  ├── codigo-civil.pdf
  ├── codigo-comercio.pdf
  └── codigo-trabajo.pdf
```

### Run Extraction

```bash
npm run extract:pdfs
```

**What it does:**
- Scans `/data/pdfs/` for PDF files
- Converts each PDF to text using `pdftotext -layout`
- Saves output to `/data/text/{filename}.txt`
- Preserves formatting with `-layout` flag
- Uses UTF-8 encoding

**Output:**
```
/data/text/
  ├── codigo-civil.txt
  ├── codigo-comercio.txt
  └── codigo-trabajo.txt
```

---

## Step 2: Convert Text to JSON

### Run Conversion

```bash
npm run convert:txt-to-json
```

**What it does:**
- Reads text files from `/data/text/`
- Parses articles using regex patterns
- Creates structured JSON with:
  - Article number
  - Article title
  - Article content
  - Full text
  - Metadata

**Output:**
```
/data/processed/
  ├── codigo-civil.json
  ├── codigo-comercio.json
  └── codigo-trabajo.json
```

**JSON Structure:**
```json
{
  "name": "Código Civil de Costa Rica",
  "law_number": "Ley N° 63",
  "articles": [
    {
      "number": "1",
      "title": "Artículo 1",
      "content": "La personalidad civil del hombre..."
    }
  ],
  "extracted_at": "2024-01-15T10:30:00.000Z"
}
```

---

## Runtime Usage

### API Routes

API routes read the pre-processed JSON files:

```typescript
// /lib/legal-loader.ts
import codigoCivil from '@/data/processed/codigo-civil.json'

export function searchArticle(number: string) {
  return codigoCivil.articles.find(a => a.number === number)
}
```

**Benefits:**
- ⚡ Fast: < 2 second responses
- 🎯 Deterministic: Same input = same output
- 💪 Stable: No PDF library issues
- 📈 Scalable: No processing overhead

---

## File Locations

### Scripts (OFFLINE only)
- `/scripts/extract-pdfs.ts` - PDF to text extraction
- `/scripts/convert-txt-to-json.js` - Text to JSON conversion

### Data Directories
- `/data/pdfs/` - Source PDFs (not in git)
- `/data/text/` - Extracted text (not in git)
- `/data/processed/` - Structured JSON (committed to git)

### Runtime Code
- `/lib/legal-loader.ts` - Loads and searches JSON files
- `/app/api/chat/route.ts` - Uses legal-loader
- `/app/api/chat-document/route.ts` - Uses legal-loader

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Update Legal Codes

on:
  workflow_dispatch:  # Manual trigger
  schedule:
    - cron: '0 0 1 * *'  # Monthly

jobs:
  extract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Poppler
        run: sudo apt-get install -y poppler-utils
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Extract PDFs
        run: npm run extract:pdfs
      
      - name: Convert to JSON
        run: npm run convert:txt-to-json
      
      - name: Commit changes
        run: |
          git config user.name "Bot"
          git config user.email "bot@example.com"
          git add data/processed/
          git commit -m "Update legal codes"
          git push
```

---

## Troubleshooting

### pdftotext not found

**Error:**
```
❌ ERROR: pdftotext not found
```

**Solution:**
Install Poppler utils (see Prerequisites above)

### No PDFs found

**Error:**
```
⚠️  No PDF files found in /data/pdfs/
```

**Solution:**
Add PDF files to `/data/pdfs/` directory

### Extraction failed

**Error:**
```
❌ Failed to extract codigo-civil.pdf
```

**Solution:**
- Check PDF is not corrupted
- Verify PDF is not password-protected
- Try opening PDF manually to confirm it's valid

---

## Best Practices

### 1. Version Control
- ✅ Commit `/data/processed/*.json` to git
- ❌ Do NOT commit `/data/pdfs/` (large files)
- ❌ Do NOT commit `/data/text/` (intermediate files)

### 2. Updates
- Run pipeline when legal codes are updated
- Test JSON files before deploying
- Keep old versions for rollback

### 3. Validation
- Verify article count matches expected
- Check for parsing errors
- Spot-check random articles

---

## Summary

| Stage | Tool | Input | Output | Frequency |
|-------|------|-------|--------|-----------|
| Extract | `pdftotext` | PDFs | Text files | When codes update |
| Convert | Node.js | Text | JSON | After extraction |
| Runtime | Next.js | JSON | API responses | Every request |

**This pipeline ensures fast, stable, deterministic legal code lookups.**
