# 🎯 Plan de Mejora: Precisión Legal

## ❌ Problema Actual

1. **Resultados inconsistentes** - GPT da respuestas diferentes cada vez
2. **Búsqueda imprecisa** - La búsqueda semántica no encuentra los artículos correctos
3. **Falta de fuentes oficiales** - Solo tenemos 2 códigos (Civil y Comercio)
4. **No hay verificación** - No validamos que las citas sean correctas

## ✅ Solución Propuesta

### Fase 1: Mejorar Búsqueda Actual (2-3 horas)

#### 1.1 Implementar Búsqueda Híbrida
- **Búsqueda por número de artículo** (exacta)
- **Búsqueda semántica** (por contenido)
- **Búsqueda por palabras clave** (términos legales)

```typescript
// Ejemplo:
if (message.includes("artículo 45")) {
  // Búsqueda exacta por número
  return findArticleByNumber(45)
} else {
  // Búsqueda semántica
  return semanticSearch(message)
}
```

#### 1.2 Mejorar Embeddings
- Usar `text-embedding-3-large` (mejor que el actual)
- Re-procesar PDFs con chunks más pequeños (200 tokens en lugar de 500)
- Incluir contexto (artículos anteriores y siguientes)

#### 1.3 Agregar Validación
- Verificar que los artículos citados existan
- Mostrar advertencia si no se encuentra el artículo
- Incluir enlace a fuente oficial

### Fase 2: Integrar Fuentes Oficiales (3-4 horas)

#### 2.1 Scraping del Poder Judicial
**URL:** http://www.pgrweb.go.cr/scij/

Códigos a integrar:
- ✅ Código Civil (ya tenemos)
- ✅ Código de Comercio (ya tenemos)
- 🔄 Código Penal
- 🔄 Código de Trabajo
- 🔄 Código de Familia
- 🔄 Ley de Tránsito
- 🔄 Constitución Política

#### 2.2 Estructura de Base de Datos

```prisma
model LegalCode {
  id       String @id
  name     String
  number   String // Ley N° 63
  url      String // URL oficial
  articles Article[]
}

model Article {
  id          String @id
  codeId      String
  number      String // "45"
  title       String?
  content     String @db.Text
  embedding   Float[] // Vector para búsqueda
  nextArticle String? // Para contexto
  prevArticle String? // Para contexto
}
```

#### 2.3 API de Scraping

```typescript
// /app/api/admin/scrape-laws/route.ts
async function scrapePGR(lawNumber: string) {
  // 1. Descargar HTML del SCIJ
  // 2. Parsear artículos
  // 3. Generar embeddings
  // 4. Guardar en DB
}
```

### Fase 3: Sistema de Verificación (2 horas)

#### 3.1 Validar Citas
```typescript
async function validateCitation(article: string, code: string) {
  const exists = await prisma.article.findFirst({
    where: { number: article, code: { name: code } }
  })
  
  if (!exists) {
    return {
      valid: false,
      message: "⚠️ No se encontró este artículo en la base de datos"
    }
  }
  
  return { valid: true, article: exists }
}
```

#### 3.2 Mostrar Fuentes
```typescript
// En cada respuesta, agregar:
**Fuentes consultadas:**
- Código Civil, Artículo 45 [Ver en SCIJ](http://...)
- Código de Comercio, Artículo 123 [Ver en SCIJ](http://...)
```

### Fase 4: Mejorar Prompt (30 min)

```typescript
const IMPROVED_PROMPT = `
INSTRUCCIONES CRÍTICAS SOBRE PRECISIÓN:

1. SOLO cita artículos que estén en el contexto proporcionado
2. Si no tienes el artículo exacto, di "No tengo acceso al artículo X"
3. NUNCA inventes números de artículos
4. Si no estás seguro, di "Necesito verificar esta información"
5. Siempre indica la fuente: "Según el Código Civil, Artículo 45..."

PROHIBIDO:
- Inventar artículos
- Citar de memoria
- Usar leyes de otros países
- Dar respuestas sin fundamento legal
`
```

## 📊 Comparación de Enfoques

### Opción A: Mejorar lo actual (Rápido - 2-3 horas)
**Pros:**
- ✅ Rápido de implementar
- ✅ No requiere scraping
- ✅ Usa lo que ya tenemos

**Contras:**
- ❌ Solo 2 códigos
- ❌ Puede seguir siendo impreciso
- ❌ No es la fuente oficial

### Opción B: Integrar SCIJ (Completo - 1 semana)
**Pros:**
- ✅ Fuente oficial del gobierno
- ✅ Todos los códigos
- ✅ Siempre actualizado
- ✅ Máxima precisión

**Contras:**
- ❌ Requiere scraping complejo
- ❌ Mantenimiento continuo
- ❌ Más tiempo de desarrollo

### Opción C: Híbrido (Recomendado - 3-4 días)
**Pros:**
- ✅ Mejora inmediata (Opción A)
- ✅ Integración gradual de SCIJ
- ✅ Balance tiempo/calidad

**Contras:**
- ❌ Requiere trabajo en fases

## 🚀 Recomendación Inmediata (Esta Noche/Mañana)

### 1. Agregar Búsqueda Exacta por Artículo (30 min)
```typescript
// Si el usuario pregunta por un artículo específico
if (message.match(/artículo\s+(\d+)/i)) {
  const articleNumber = message.match(/artículo\s+(\d+)/i)[1]
  // Buscar exactamente ese artículo
}
```

### 2. Mejorar el Prompt (15 min)
- Agregar más advertencias
- Ser más estricto con las citas
- Pedir que siempre indique cuando NO tiene información

### 3. Agregar Disclaimer (10 min)
```typescript
⚠️ IMPORTANTE: Esta es una herramienta de asistencia legal. 
Siempre verifica la información con un abogado o en las 
fuentes oficiales del Poder Judicial de Costa Rica.
```

### 4. Reducir Temperatura a 0.1 (5 min)
```typescript
temperature: 0.1 // Más determinístico, menos creativo
```

## 📝 Próximos Pasos

### Mañana (Viernes):
1. ✅ Implementar búsqueda exacta por artículo
2. ✅ Mejorar prompt con más restricciones
3. ✅ Reducir temperatura
4. ✅ Agregar disclaimer
5. ✅ Probar con casos reales

### Próxima Semana:
1. 🔄 Scraper para SCIJ
2. 🔄 Integrar más códigos
3. 🔄 Sistema de validación
4. 🔄 Embeddings mejorados

## 💡 Alternativa: API Oficial

**Investigar si existe API oficial del Poder Judicial:**
- http://www.pgrweb.go.cr/scij/
- Contactar con SCIJ para acceso a API
- Verificar si tienen servicio web

## 🎯 Meta Final

**Sistema de 3 capas:**
1. **Capa 1:** Búsqueda exacta (artículos específicos)
2. **Capa 2:** Búsqueda semántica (temas generales)
3. **Capa 3:** GPT para análisis (solo con contexto verificado)

---

**Estado Actual:** Fase 0 (Búsqueda básica con 2 códigos)
**Meta Corto Plazo:** Fase 1 (Búsqueda mejorada + validación)
**Meta Largo Plazo:** Fase 2 (Integración completa SCIJ)

**Tiempo estimado para mejora significativa:** 3-4 días
**Tiempo para sistema completo:** 1-2 semanas
