
const message = "Dime el artículo 41 del Código Penal";
const lowerQuery = message.toLowerCase();
const artRegex = /(?:art[íi]culo|art[íi]culos|artícu|art[s\.]?)\.?\s*(\d+)(?:\s*(?:a|al|y|hasta\s*el)\s*(\d+))?/gi;

const articleRefs: number[] = [];
let match;
while ((match = artRegex.exec(message)) !== null) {
    console.log('Match found:', match[0], 'Group 1:', match[1], 'Group 2:', match[2]);
    const start = parseInt(match[1]);
    articleRefs.push(start);
    if (match[2]) {
        const end = parseInt(match[2]);
        for (let i = start + 1; i <= Math.min(end, start + 10); i++) {
            articleRefs.push(i);
        }
    }
}

console.log('Article Refs:', articleRefs);

let targetCodeName: string | null = null;
if (/(procesal\s*penal|procesal\s*pp|cpp)/i.test(lowerQuery)) {
    targetCodeName = 'codigo-procesal-penal'
} else if (/(penal|c[oó]digo\s*penal|cp\b)/i.test(lowerQuery)) {
    targetCodeName = 'codigo-penal'
}

console.log('Target Code Name:', targetCodeName);
