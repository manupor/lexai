const fs = require('fs');
const path = require('path');

// Usar pdf-parse solo para este script temporal
const pdf = require('pdf-parse');

const pdfPath = path.join(__dirname, '..', 'data', 'pdfs', 'codigo-comercio.pdf');
const outputPath = path.join(__dirname, '..', 'data', 'text', 'codigo-comercio.txt');

console.log('📄 Extrayendo texto del Código de Comercio...');

const dataBuffer = fs.readFileSync(pdfPath);

pdf(dataBuffer).then(function(data) {
    console.log(`✅ Páginas: ${data.numpages}`);
    console.log(`✅ Texto extraído: ${(data.text.length / 1024).toFixed(2)} KB`);
    
    fs.writeFileSync(outputPath, data.text, 'utf8');
    console.log(`💾 Guardado en: ${outputPath}`);
    console.log('✅ Extracción completa!');
}).catch(function(error) {
    console.error('❌ Error:', error);
    process.exit(1);
});
