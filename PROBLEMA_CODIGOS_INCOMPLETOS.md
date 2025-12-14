# 🚨 PROBLEMA CRÍTICO: Códigos Legales Incompletos

## Diagnóstico:

### ❌ Código de Comercio: INCOMPLETO
- **Actual:** 21 artículos (Art. 1-21)
- **Esperado:** ~600 artículos
- **Faltantes:** Artículos sobre sociedades, títulos valores, etc.
- **Impacto:** NO puede responder sobre:
  - Sociedades anónimas (Art. 100+)
  - Asambleas generales
  - Juntas directivas
  - Títulos valores
  - Etc.

### ⚠️ Código Civil: POSIBLEMENTE INCOMPLETO
- **Actual:** 50 artículos
- **Esperado:** ~1000 artículos
- **Necesita verificación**

### ✅ Código de Trabajo: COMPLETO
- **Actual:** 567 artículos
- **Estado:** ✅ Completo y funcionando

## Causa Raíz:

El archivo `data/codigo-comercio.txt` solo contiene 80 líneas con 21 artículos.
El PDF original (`data/codigo-comercio.pdf`) tiene el código completo pero no se extrajo correctamente.

## Solución Inmediata:

### Opción 1: Extraer del PDF (RECOMENDADO)

```bash
# Instalar herramientas
brew install poppler  # Para pdftotext en Mac

# Extraer texto completo
pdftotext -layout data/codigo-comercio.pdf data/text/codigo-comercio-completo.txt

# Verificar
wc -l data/text/codigo-comercio-completo.txt
grep -i "artículo" data/text/codigo-comercio-completo.txt | wc -l
```

### Opción 2: Descargar de SCIJ

1. Ve a: http://www.pgrweb.go.cr/scij/
2. Busca "Código de Comercio"
3. Descarga el texto completo
4. Guarda en `data/text/codigo-comercio-completo.txt`

### Opción 3: Usar API de SCIJ (si existe)

Investigar si SCIJ tiene una API para obtener el texto completo.

## Pasos para Cargar el Código Completo:

```bash
# 1. Obtener el texto completo (Opción 1 o 2)

# 2. Actualizar el parser si es necesario
# Editar: scripts/parse-articles.ts

# 3. Parsear el código completo
npm run parse:articles

# 4. Verificar el JSON generado
jq '.articles | length' data/processed/codigo-comercio.json
# Debería mostrar ~600 artículos

# 5. Cargar a la base de datos
npx tsx scripts/load-all-codes.ts

# 6. Verificar
npx tsx scripts/verify-all-codes.ts
```

## Verificación:

Después de cargar el código completo, prueba:

```
¿Qué artículos regulan la asamblea general extraordinaria de la sociedad anónima?
```

Debería responder con los artículos específicos (probablemente Art. 140-160).

## Estado Actual del Sistema:

| Código | Artículos | Estado | Acción |
|--------|-----------|--------|--------|
| Código de Trabajo | 567 | ✅ Completo | Ninguna |
| Código de Comercio | 21 | ❌ Incompleto | **URGENTE: Extraer completo** |
| Código Civil | 50 | ⚠️ Verificar | Verificar si está completo |

## Prioridad:

🔴 **ALTA PRIORIDAD:** El Código de Comercio es fundamental para consultas empresariales.

Sin el código completo, el sistema NO puede dar asesoría sobre:
- Sociedades mercantiles
- Contratos comerciales complejos
- Títulos valores
- Procedimientos mercantiles
- Etc.

## Siguiente Paso:

1. **Extraer el Código de Comercio completo del PDF**
2. **Parsear y cargar a la base de datos**
3. **Verificar el Código Civil**
4. **Agregar más códigos:**
   - Código Penal
   - Código de Familia
   - Código Procesal Civil
   - Etc.
