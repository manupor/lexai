#!/usr/bin/env tsx
/**
 * OFFLINE PDF EXTRACTION PIPELINE
 * 
 * ⚠️ THIS SCRIPT IS NEVER IMPORTED BY NEXT.JS
 * 
 * PURPOSE:
 * Extract text from Costa Rican legal code PDFs using system tools.
 * This runs OFFLINE as part of data preparation, NOT at runtime.
 * 
 * REQUIREMENTS:
 * - Poppler utils must be installed: `brew install poppler` (macOS)
 * - Or: `apt-get install poppler-utils` (Linux)
 * - Provides `pdftotext` command
 * 
 * USAGE:
 *   npm run extract:pdfs
 * 
 * FLOW:
 * 1. Scans /data/pdfs/ for PDF files
 * 2. Converts each PDF to text using `pdftotext -layout`
 * 3. Saves output to /data/text/{filename}.txt
 * 4. Fails fast if pdftotext not available
 * 
 * WHY SYSTEM TOOLS:
 * - pdftotext is battle-tested, fast, and reliable
 * - No Node.js PDF library dependencies
 * - Works in any environment (local, CI/CD)
 * - Deterministic output
 * 
 * ARCHITECTURE:
 * This is part of the OFFLINE data pipeline.
 * API routes read the resulting .txt files, never PDFs.
 */

import { execSync } from 'child_process'
import { readdirSync, existsSync, mkdirSync, statSync } from 'fs'
import { join, basename, extname } from 'path'

// Directories
const PDFS_DIR = join(process.cwd(), 'data', 'pdfs')
const TEXT_DIR = join(process.cwd(), 'data', 'text')

/**
 * Check if pdftotext is available
 */
function checkPdfToText(): void {
  try {
    execSync('pdftotext -v', { stdio: 'pipe' })
    console.log('✅ pdftotext is available')
  } catch (error) {
    console.error('❌ ERROR: pdftotext not found')
    console.error('')
    console.error('Please install Poppler utils:')
    console.error('  macOS:  brew install poppler')
    console.error('  Linux:  apt-get install poppler-utils')
    console.error('  Windows: Download from https://github.com/oschwartz10612/poppler-windows/releases/')
    console.error('')
    process.exit(1)
  }
}

/**
 * Ensure directories exist
 */
function ensureDirectories(): void {
  if (!existsSync(PDFS_DIR)) {
    console.log(`📁 Creating ${PDFS_DIR}`)
    mkdirSync(PDFS_DIR, { recursive: true })
  }
  
  if (!existsSync(TEXT_DIR)) {
    console.log(`📁 Creating ${TEXT_DIR}`)
    mkdirSync(TEXT_DIR, { recursive: true })
  }
}

/**
 * Get all PDF files in directory
 */
function getPdfFiles(): string[] {
  if (!existsSync(PDFS_DIR)) {
    return []
  }
  
  return readdirSync(PDFS_DIR)
    .filter(file => extname(file).toLowerCase() === '.pdf')
    .map(file => join(PDFS_DIR, file))
}

/**
 * Extract text from PDF using pdftotext
 */
function extractPdfText(pdfPath: string, outputPath: string): void {
  const pdfName = basename(pdfPath)
  const fileSize = (statSync(pdfPath).size / 1024 / 1024).toFixed(2)
  
  console.log(`\n📄 Processing: ${pdfName} (${fileSize} MB)`)
  
  try {
    // Use pdftotext with -layout flag to preserve formatting
    // -enc UTF-8 ensures proper encoding
    // -eol unix ensures consistent line endings
    const command = `pdftotext -layout -enc UTF-8 -eol unix "${pdfPath}" "${outputPath}"`
    
    console.log(`   Running: pdftotext -layout -enc UTF-8 -eol unix`)
    execSync(command, { stdio: 'pipe' })
    
    // Check output
    if (!existsSync(outputPath)) {
      throw new Error('Output file was not created')
    }
    
    const outputSize = (statSync(outputPath).size / 1024).toFixed(2)
    console.log(`   ✅ Extracted: ${basename(outputPath)} (${outputSize} KB)`)
    
  } catch (error: any) {
    console.error(`   ❌ Failed to extract ${pdfName}`)
    console.error(`   Error: ${error.message}`)
    throw error
  }
}

/**
 * Main extraction function
 */
function main(): void {
  console.log('🚀 OFFLINE PDF EXTRACTION PIPELINE')
  console.log('=' .repeat(50))
  console.log('')
  
  // Step 1: Check prerequisites
  console.log('Step 1: Checking prerequisites...')
  checkPdfToText()
  console.log('')
  
  // Step 2: Ensure directories
  console.log('Step 2: Ensuring directories exist...')
  ensureDirectories()
  console.log('')
  
  // Step 3: Find PDFs
  console.log('Step 3: Scanning for PDF files...')
  const pdfFiles = getPdfFiles()
  
  if (pdfFiles.length === 0) {
    console.log('⚠️  No PDF files found in /data/pdfs/')
    console.log('')
    console.log('Please add PDF files to extract:')
    console.log(`  ${PDFS_DIR}/codigo-civil.pdf`)
    console.log(`  ${PDFS_DIR}/codigo-comercio.pdf`)
    console.log(`  ${PDFS_DIR}/codigo-trabajo.pdf`)
    console.log('')
    process.exit(0)
  }
  
  console.log(`   Found ${pdfFiles.length} PDF file(s)`)
  console.log('')
  
  // Step 4: Extract each PDF
  console.log('Step 4: Extracting text from PDFs...')
  
  let successCount = 0
  let failCount = 0
  
  for (const pdfPath of pdfFiles) {
    try {
      const pdfBasename = basename(pdfPath, '.pdf')
      const outputPath = join(TEXT_DIR, `${pdfBasename}.txt`)
      
      extractPdfText(pdfPath, outputPath)
      successCount++
      
    } catch (error) {
      failCount++
      console.error(`   Continuing with next file...`)
    }
  }
  
  // Summary
  console.log('')
  console.log('=' .repeat(50))
  console.log('📊 EXTRACTION SUMMARY')
  console.log('=' .repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📁 Output directory: ${TEXT_DIR}`)
  console.log('')
  
  if (successCount > 0) {
    console.log('✅ Extraction complete!')
    console.log('')
    console.log('Next steps:')
    console.log('  1. Review extracted text files in /data/text/')
    console.log('  2. Run: npm run convert:txt-to-json')
    console.log('  3. Processed JSON will be in /data/processed/')
    console.log('')
  }
  
  if (failCount > 0) {
    console.error('⚠️  Some files failed to extract')
    process.exit(1)
  }
}

// Run the pipeline
main()
