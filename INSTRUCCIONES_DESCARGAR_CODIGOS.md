# 📥 Instrucciones para Descargar Códigos Completos

## 🎯 Objetivo:
Obtener el texto completo del Código de Comercio y otros códigos legales para cargarlos en la base de datos.

## 🌐 Opción 1: Descargar desde SCIJ (RECOMENDADO)

### Código de Comercio (Ley N° 3284):

1. **Ve a SCIJ:**
   ```
   http://www.pgrweb.go.cr/scij/
   ```

2. **Busca el código:**
   - En el buscador, escribe: "Código de Comercio"
   - O busca por número: "Ley 3284"

3. **Abre el documento:**
   - Click en "Código de Comercio de Costa Rica"
   - Click en "Ver texto completo" o "Texto actualizado"

4. **Copia el texto:**
   - Selecciona TODO el texto (Cmd+A)
   - Copia (Cmd+C)

5. **Pega en el archivo:**
   - Abre: `data/text/codigo-comercio-completo.txt`
   - Pega el texto (Cmd+V)
   - Guarda (Cmd+S)

### Código Civil (Ley N° 63):

Repite el mismo proceso pero busca "Código Civil" o "Ley 63"
Guarda en: `data/text/codigo-civil-completo.txt`

### Código Penal:

Busca "Código Penal"
Guarda en: `data/text/codigo-penal.txt`

### Código de Familia:

Busca "Código de Familia"
Guarda en: `data/text/codigo-familia.txt`

## 📋 Opción 2: Usar el PDF que ya tienes

Si el PDF `data/codigo-comercio.pdf` tiene el código completo:

### En Mac (sin Homebrew):

```bash
# Opción A: Usar Python (viene preinstalado)
python3 -c "
import PyPDF2
with open('data/codigo-comercio.pdf', 'rb') as f:
    reader = PyPDF2.PdfReader(f)
    text = ''
    for page in reader.pages:
        text += page.extract_text()
    with open('data/text/codigo-comercio-completo.txt', 'w') as out:
        out.write(text)
print('✅ Extraído')
"

# Si falla, instala PyPDF2:
pip3 install PyPDF2
```

### Opción B: Abrir PDF y copiar manualmente

1. Abre `data/codigo-comercio.pdf` con Preview
2. Selecciona todo el texto (Cmd+A)
3. Copia (Cmd+C)
4. Pega en `data/text/codigo-comercio-completo.txt`

## 🔄 Después de descargar:

### 1. Verificar el archivo:

```bash
# Ver cuántas líneas tiene
wc -l data/text/codigo-comercio-completo.txt

# Contar artículos
grep -i "artículo" data/text/codigo-comercio-completo.txt | wc -l

# Ver primeros artículos
grep -i "artículo" data/text/codigo-comercio-completo.txt | head -20
```

Deberías ver ~600 artículos para el Código de Comercio.

### 2. Actualizar el parser:

Edita `scripts/parse-articles.ts` y actualiza la configuración:

```typescript
{
  textFile: 'codigo-comercio-completo.txt',  // ← Cambiar nombre
  outputFile: 'codigo-comercio.json',
  lawName: 'Código de Comercio de Costa Rica',
  lawNumber: 'Ley N° 3284',
  expectedMinArticles: 500,  // ← Ajustar
}
```

### 3. Parsear:

```bash
npm run parse:articles
```

### 4. Verificar el JSON:

```bash
jq '.articles | length' data/processed/codigo-comercio.json
# Debería mostrar ~600
```

### 5. Cargar a la base de datos:

```bash
npx tsx scripts/load-all-codes.ts
```

### 6. Verificar:

```bash
npx tsx scripts/verify-all-codes.ts
```

Deberías ver:
```
✅ Código de Comercio de Costa Rica
   Code: codigo-comercio
   Artículos: ~600
```

## 🧪 Probar:

```bash
# En el chat, pregunta:
¿Qué artículos regulan la asamblea general extraordinaria de la sociedad anónima?
```

Ahora SÍ debería responder con los artículos específicos.

## 📚 Códigos Prioritarios:

1. ✅ **Código de Trabajo** - Ya completo (567 artículos)
2. 🔴 **Código de Comercio** - URGENTE (solo 21 de ~600)
3. ⚠️ **Código Civil** - Verificar (solo 50 de ~1000)
4. 📋 **Código Penal** - Agregar
5. 📋 **Código de Familia** - Agregar
6. 📋 **Código Procesal Civil** - Agregar

## 💡 Tip:

Si SCIJ no te deja copiar el texto, prueba:
1. Inspeccionar elemento (F12)
2. Buscar el div con el texto
3. Copiar el HTML
4. Limpiar las etiquetas HTML

O usa la extensión de Chrome "Copy as Plain Text"
