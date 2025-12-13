# Sistema RAG - Códigos Legales de Costa Rica

## 📚 Descripción

LexAI ahora incluye un sistema de **Retrieval-Augmented Generation (RAG)** que permite consultar los códigos legales de Costa Rica directamente desde el chat:

- **Código de Comercio** (Ley N° 3284)
- **Código Civil** (Ley N° 63)

## 🎯 Cómo Funciona

### 1. Detección Automática

El sistema detecta automáticamente cuando haces preguntas relacionadas con:

**Código de Comercio:**
- Derecho Comercial
- Comerciantes
- Sociedades Mercantiles
- Contratos Mercantiles

**Código Civil:**
- Derecho Civil
- Contratos
- Obligaciones
- Propiedad
- Matrimonio y Divorcio
- Familia
- Sucesiones y Herencias
- Testamentos
- Personas y Capacidad
- Bienes

### 2. Búsqueda Inteligente

Cuando detecta una consulta relevante:
1. **Extrae palabras clave** de tu pregunta
2. **Busca en los PDFs** de los códigos relevantes
3. **Selecciona los 3 fragmentos más relevantes** de cada código
4. **Los incluye en el contexto** para la IA

### 3. Respuesta Fundamentada

La IA responde basándose en:
- Tu pregunta
- El contenido real de los códigos legales
- Las leyes vigentes de Costa Rica
- Puede combinar información de múltiples códigos

## 💬 Ejemplos de Uso

### Ejemplo 1: Pregunta General
```
Usuario: "¿Qué dice el Código de Comercio sobre las sociedades anónimas?"

Sistema:
1. Detecta "Código de Comercio" y "sociedades"
2. Busca en el PDF fragmentos relevantes
3. La IA responde con artículos específicos del Código
```

### Ejemplo 2: Pregunta Específica
```
Usuario: "¿Cuáles son los requisitos para ser comerciante en Costa Rica?"

Sistema:
1. Detecta "comerciante"
2. Encuentra artículos sobre requisitos
3. Responde con base legal específica
```

### Ejemplo 3: Contratos Mercantiles
```
Usuario: "¿Qué tipos de contratos mercantiles existen?"

Sistema:
1. Detecta "contratos mercantiles"
2. Busca clasificación en el Código
3. Lista los tipos con referencias legales
```

### Ejemplo 4: Código Civil - Divorcio
```
Usuario: "¿Cuáles son las causales de divorcio según el Código Civil?"

Sistema:
1. Detecta "divorcio" y "Código Civil"
2. Busca en el Código Civil
3. Responde con artículos específicos sobre causales
```

### Ejemplo 5: Código Civil - Contratos
```
Usuario: "¿Qué dice el Código Civil sobre la nulidad de contratos?"

Sistema:
1. Detecta "contratos" y "nulidad"
2. Busca en el Código Civil
3. Explica causales de nulidad con base legal
```

### Ejemplo 6: Múltiples Códigos
```
Usuario: "¿Cuál es la diferencia entre un contrato civil y uno mercantil?"

Sistema:
1. Detecta "contrato civil" y "mercantil"
2. Busca en AMBOS códigos
3. Compara y explica diferencias con artículos de ambos
```

## 🔍 Palabras Clave que Activan la Búsqueda

**Código de Comercio:**
- "código de comercio"
- "comercial"
- "comerciante"
- "sociedad mercantil"
- "contrato mercantil"

**Código Civil:**
- "código civil"
- "civil"
- "contrato"
- "obligación"
- "propiedad"
- "matrimonio"
- "divorcio"
- "familia"
- "sucesión"
- "herencia"
- "testamento"
- "persona"
- "capacidad"
- "bienes"

## 📊 Ventajas del Sistema

### ✅ Precisión
- Respuestas basadas en el texto real del Código
- No inventa información
- Cita fuentes específicas

### ✅ Actualizado
- Usa el PDF oficial del Código de Comercio
- Información vigente y confiable

### ✅ Contextual
- Entiende tu pregunta
- Encuentra información relevante
- Responde de forma comprensible

### ✅ Eficiente
- Búsqueda rápida (< 1 segundo)
- No requiere leer todo el documento
- Selecciona solo lo relevante

## 🎨 Dónde Funciona

El sistema RAG está integrado en:

### 1. Chat Principal
- Ve a la pestaña "Chat"
- Haz cualquier pregunta sobre comercio
- El sistema busca automáticamente

### 2. Chat de Documentos
- Analiza un documento
- Haz preguntas que mencionen el Código de Comercio
- Obtén respuestas con contexto legal adicional

## 💰 Costos

- **Búsqueda en PDF**: Gratis (procesamiento local)
- **Respuesta de IA**: ~$0.001-0.003 por consulta
- **Total**: Muy económico

## 🔧 Arquitectura Técnica

### Componentes

1. **`lib/codigo-comercio.ts`**
   - Carga el PDF al inicio
   - Extrae todo el texto
   - Divide en chunks de ~2000 caracteres
   - Implementa búsqueda por palabras clave

2. **`app/api/chat/route.ts`**
   - Detecta menciones al Código de Comercio
   - Llama a la función de búsqueda
   - Incluye contexto en el prompt

3. **`app/api/chat-document/route.ts`**
   - Igual funcionalidad para chat de documentos

### Algoritmo de Búsqueda

```typescript
1. Extraer palabras clave de la pregunta
2. Filtrar stop words (el, la, de, etc.)
3. Buscar en cada chunk del PDF
4. Calcular score por:
   - Número de coincidencias de palabras clave
   - Presencia de "artículo"
5. Ordenar por relevancia
6. Retornar top 3 chunks
```

## 📈 Mejoras Futuras

### Fase 2 (Próximamente)
- [ ] Embeddings con OpenAI para búsqueda semántica
- [ ] Base de datos vectorial (Pinecone/Chroma)
- [ ] Búsqueda más precisa por similitud

### Fase 3
- [ ] Agregar más códigos legales:
  - Código Civil
  - Código Penal
  - Ley de Tránsito
  - Código Laboral
- [ ] Búsqueda multi-código

### Fase 4
- [ ] Caché de búsquedas frecuentes
- [ ] Análisis de jurisprudencia
- [ ] Actualización automática de códigos

## 🎯 Casos de Uso

### Para Abogados
```
"¿Qué dice el Código sobre la fusión de sociedades?"
"¿Cuáles son las obligaciones de los comerciantes?"
"¿Cómo se regula la quiebra en el Código de Comercio?"
```

### Para Estudiantes
```
"Explícame las sociedades mercantiles según el Código"
"¿Qué tipos de títulos valores existen?"
"¿Cuál es la diferencia entre acto de comercio y acto civil?"
```

### Para Empresarios
```
"¿Qué necesito para constituir una sociedad anónima?"
"¿Cuáles son mis obligaciones como comerciante?"
"¿Qué contratos mercantiles puedo usar?"
```

## 🚀 Cómo Probar

### Prueba 1: Chat Simple
1. Ve al Dashboard
2. Pestaña "Chat"
3. Pregunta: "¿Qué dice el Código de Comercio sobre los comerciantes?"
4. Observa la respuesta con referencias específicas

### Prueba 2: Con Documento
1. Sube un contrato mercantil
2. Espera el análisis
3. Pregunta: "¿Este contrato cumple con el Código de Comercio?"
4. La IA consultará el Código para responder

### Prueba 3: Pregunta Compleja
1. Chat principal
2. Pregunta: "Compara las sociedades anónimas y las de responsabilidad limitada según el Código de Comercio"
3. Obtén respuesta detallada con artículos específicos

## 📝 Notas Importantes

- El PDF se carga la primera vez que se hace una consulta
- La carga toma ~5-10 segundos
- Después, las búsquedas son instantáneas
- El sistema mantiene el PDF en memoria

## ✨ Resumen

**Antes:**
- IA respondía basándose solo en su entrenamiento
- Podía inventar o generalizar
- Sin referencias específicas

**Ahora:**
- IA consulta el Código de Comercio real
- Respuestas fundamentadas en el texto legal
- Referencias específicas a artículos
- Mayor precisión y confiabilidad

¡El sistema está listo para usar! 🎉🇨🇷⚖️
