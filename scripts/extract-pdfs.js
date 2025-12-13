const fs = require('fs');
const path = require('path');
const PDFParser = require('pdf2json');

async function extractPDF(pdfPath, outputPath) {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on('pdfParser_dataError', errData => {
      console.error(`Error parsing ${pdfPath}:`, errData.parserError);
      reject(errData.parserError);
    });

    pdfParser.on('pdfParser_dataReady', pdfData => {
      try {
        // Extraer texto de todas las páginas
        let fullText = '';
        
        if (pdfData.Pages) {
          pdfData.Pages.forEach(page => {
            if (page.Texts) {
              page.Texts.forEach(text => {
                if (text.R) {
                  text.R.forEach(r => {
                    if (r.T) {
                      // Decodificar texto URI
                      const decoded = decodeURIComponent(r.T);
                      fullText += decoded + ' ';
                    }
                  });
                }
              });
              fullText += '\n';
            }
          });
        }

        // Guardar texto extraído
        fs.writeFileSync(outputPath, fullText, 'utf8');
        console.log(`✅ Texto extraído de ${path.basename(pdfPath)} → ${path.basename(outputPath)}`);
        console.log(`   Tamaño: ${(fullText.length / 1024).toFixed(2)} KB`);
        resolve(fullText);
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.loadPDF(pdfPath);
  });
}

async function main() {
  console.log('🔄 Extrayendo texto de PDFs...\n');

  const dataDir = path.join(__dirname, '..', 'data');
  
  // Crear directorio si no existe
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const pdfs = [
    {
      input: path.join(__dirname, '..', '..', '..', 'Downloads', 'Código de Comercio.pdf'),
      output: path.join(dataDir, 'codigo-comercio.txt')
    },
    {
      input: path.join(__dirname, '..', '..', '..', 'Downloads', 'Código Civil.pdf'),
      output: path.join(dataDir, 'codigo-civil.txt')
    }
  ];

  for (const pdf of pdfs) {
    try {
      if (fs.existsSync(pdf.input)) {
        await extractPDF(pdf.input, pdf.output);
      } else {
        console.log(`⚠️  No se encontró: ${pdf.input}`);
      }
    } catch (error) {
      console.error(`❌ Error procesando ${pdf.input}:`, error.message);
    }
  }

  console.log('\n✅ Extracción completada!');
}

main().catch(console.error);
