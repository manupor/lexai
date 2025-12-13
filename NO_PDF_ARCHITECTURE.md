# 🚫 NO PDF PROCESSING AT RUNTIME - Architecture Decision

## Critical Design Decision

**This application does NOT process PDFs at runtime in API routes.**

This is a **deliberate architectural choice** for stability, performance, and determinism.

---

## Why NO PDF Processing?

### 1. **Performance**
- PDF parsing takes 10-30 seconds per document
- Serverless functions have strict timeout limits
- Users expect responses in < 2 seconds

### 2. **Stability**
- `pdfjs-dist` requires browser APIs (breaks in Node.js/serverless)
- `pdf2json` has inconsistent parsing results
- `pdf-parse` works but is slow and memory-intensive
- Worker threads complicate deployment

### 3. **Determinism**
- Legal AI requires **exact** article citations
- PDF parsing can introduce errors or inconsistencies
- Pre-processed JSON ensures **identical** results every time

### 4. **Scalability**
- Parsing PDFs on every request doesn't scale
- Pre-processing once = infinite fast reads
- Lower costs, better user experience

---

## Our Solution: Pre-Processing

### Offline PDF Extraction Pipeline

**Step 1: Extract PDFs to Text**
```bash
npm run extract:pdfs
```

This script (in `/scripts/extract-pdfs.ts`):
1. Reads PDFs from `/data/pdfs/`
2. Extracts text using `pdftotext` (Poppler system tool)
3. Saves raw text to `/data/text/`
4. Fast, reliable, battle-tested

**Step 2: Convert Text to JSON**
```bash
npm run convert:txt-to-json
```

This script (in `/scripts/convert-txt-to-json.js`):
1. Reads text files from `/data/text/`
2. Parses articles into structured JSON
3. Saves to `/data/processed/`

See `DATA_PIPELINE.md` for complete documentation.

### Runtime: JSON Only
All API routes read from `/data/processed/*.json`:
- `/api/chat` → reads `codigo-civil.json`, `codigo-comercio.json`
- `/api/chat-document` → reads pre-processed JSON
- `/api/analyze-document` → receives plain TEXT (not PDF)

**Result:** Responses in < 2 seconds, 100% deterministic

---

## What Users Can Do

### ✅ Supported Workflows

1. **Legal Code Queries** (Main Chat)
   - Ask about Código Civil
   - Ask about Código de Comercio
   - Get instant, exact article citations
   - **No PDF upload needed** - codes are pre-loaded

2. **Document Upload** (Documents Tab)
   - Upload `.txt` files
   - Upload `.docx` files
   - Get AI analysis
   - Ask questions about the document

### ❌ NOT Supported

- Uploading `.pdf` files for analysis
- Runtime PDF parsing in any API route

### 💡 Alternative for PDFs

If users have PDFs:
1. Convert to `.txt` or `.docx` (many free tools exist)
2. Upload the converted file
3. Get full AI analysis

For legal codes specifically, they should use the main chat (no upload needed).

---

## Code Locations

### No PDF Processing
These files explicitly REJECT PDFs:
- `/app/api/parse-document/route.ts` - Returns 400 error for PDFs
- `/components/document-upload.tsx` - Shows warning, blocks PDF selection

### Pre-Processing (Offline Only)
These scripts run OFFLINE, not in API routes:
- `/scripts/extract-pdfs.ts` - Extracts PDFs to text using pdftotext
- `/scripts/convert-txt-to-json.js` - Converts text to structured JSON

### Runtime (JSON Only)
These files read pre-processed JSON:
- `/lib/legal-loader.ts` - Loads JSON files, searches articles
- `/app/api/chat/route.ts` - Uses legal-loader for instant lookups
- `/app/api/chat-document/route.ts` - Uses legal-loader for context

---

## Dependencies

### ✅ Kept (Safe)
- `mammoth` - DOCX parsing (fast, stable)
- No PDF libraries in production dependencies

### ❌ Removed
- `pdfjs-dist` - Removed (browser-only)
- `pdf2json` - Removed (unreliable)
- `pdf-parse` - Removed from production (only in dev for offline scripts)
- `@types/pdf-parse` - Removed

---

## Testing the Architecture

### Verify No PDF Processing
```bash
# These should return 400 errors
curl -X POST http://localhost:3000/api/parse-document \
  -F "file=@test.pdf"
```

### Verify Fast Legal Queries
```bash
# Should respond in < 2 seconds
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Artículo 1 del Código Civil"}'
```

---

## Future Considerations

If PDF support is ever needed:
1. Use a dedicated PDF processing service (external API)
2. Process PDFs asynchronously (queue system)
3. Store extracted text, never re-parse
4. **Never** parse PDFs in synchronous API routes

---

## Summary

| Aspect | Decision |
|--------|----------|
| **PDF in API routes** | ❌ NO - By design |
| **PDF offline scripts** | ✅ YES - For pre-processing |
| **Legal codes** | ✅ Pre-processed JSON |
| **Document upload** | ✅ TXT, DOCX only |
| **Response time** | ✅ < 2 seconds |
| **Determinism** | ✅ 100% consistent |

**This architecture is intentional, tested, and production-ready.**
