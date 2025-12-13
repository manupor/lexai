# Implementación del Código de Trabajo de Costa Rica

## ✅ Resumen de la Implementación

Se ha implementado exitosamente el **Código de Trabajo de Costa Rica (Ley N° 2)** en la base de datos y sistema de consultas de LexAI.

---

## 📊 Estadísticas

- **Artículos procesados:** 567 artículos en total
- **Artículos únicos:** 444 artículos (123 duplicados por reformas/versiones)
- **Categoría:** LABORAL
- **Código en BD:** CT
- **Archivo fuente:** `Codigo de trabajo.rtf` (2.1 MB)

---

## 🔄 Proceso Realizado

### 1. Conversión del Archivo RTF a TXT
```bash
textutil -convert txt "Codigo de trabajo.rtf" -output data/text/codigo-trabajo.txt
```
- **Resultado:** `data/text/codigo-trabajo.txt` (762 KB)

### 2. Parsing de Artículos
```bash
npm run parse:articles
```
- **Parser utilizado:** `scripts/parse-articles.ts`
- **Salida:** `data/processed/codigo-trabajo.json` (806 KB)
- **Artículos detectados:** 567 (con duplicados por reformas)

### 3. Carga a la Base de Datos
```bash
npx tsx scripts/load-codigo-trabajo.ts
```
- **Script creado:** `scripts/load-codigo-trabajo.ts`
- **Configuración:** Usa adaptador Neon para PostgreSQL
- **Artículos cargados:** 444 artículos únicos
- **Manejo de duplicados:** Combina versiones/reformas en un solo artículo

### 4. Integración con el Sistema de Chat

#### Archivos Modificados:

**`app/api/chat/route.ts`**
- ✅ Agregada búsqueda por número de artículo en Código de Trabajo
- ✅ Agregada búsqueda por palabras clave en Código de Trabajo
- Ahora busca en 3 códigos: Civil, Comercio y **Trabajo**

**`lib/legal-loader.ts`**
- ✅ Actualizada función `formatArticleForChat()` para incluir Código de Trabajo
- ✅ Formato de cita: "Código de Trabajo de Costa Rica (Ley N° 2)"

---

## 🎯 Funcionalidades Implementadas

### Búsqueda por Número de Artículo
Cuando un usuario pregunta por un artículo específico (ej: "¿Qué dice el artículo 45?"), el sistema:
1. Busca en Código Civil
2. Busca en Código de Comercio
3. **Busca en Código de Trabajo** ✨
4. Retorna todos los artículos encontrados con citas textuales

### Búsqueda por Palabras Clave
Cuando un usuario hace una consulta general (ej: "jornada laboral", "despido", "vacaciones"), el sistema:
1. Extrae palabras clave (>4 caracteres)
2. Busca en los 3 códigos legales
3. **Incluye resultados del Código de Trabajo** ✨
4. Retorna hasta 2 artículos relevantes por código

---

## 📝 Ejemplos de Uso

### Consulta Específica
**Usuario:** "¿Qué dice el artículo 45 del Código de Trabajo?"

**Sistema:** Buscará y citará textualmente el artículo 45 sobre jornada de trabajo.

### Consulta General
**Usuario:** "¿Cuántas horas puede trabajar un empleado?"

**Sistema:** Buscará palabras clave como "horas", "trabajar", "empleado" y retornará artículos relevantes del Código de Trabajo (ej: Art. 45 sobre jornada laboral).

### Consulta Temática
**Usuario:** "¿Cuáles son las causas justas de despido?"

**Sistema:** Buscará "despido" y retornará artículos como el Art. 162 sobre causas justas de despido.

---

## 🗄️ Estructura en Base de Datos

### Tabla: `LegalCode`
```sql
{
  id: "cmj4thh6t00009cpbz2md83e0",
  code: "CT",
  title: "Código de Trabajo de Costa Rica",
  category: "LABORAL",
  content: "Código de Trabajo de Costa Rica - Ley N° 2. Total de artículos: 567",
  lastUpdated: "2024-12-13T21:34:XX.XXX"
}
```

### Tabla: `Article`
- **444 artículos** vinculados al LegalCode con `legalCodeId`
- Cada artículo contiene:
  - `number`: Número del artículo
  - `title`: Título del artículo
  - `content`: Texto completo y exacto del artículo
  - Artículos con múltiples versiones/reformas están combinados

---

## 🔍 Verificación

Para verificar que el Código de Trabajo está funcionando:

1. **Iniciar el servidor:**
   ```bash
   npm run dev
   ```

2. **Hacer una consulta de prueba:**
   - "¿Qué dice el artículo 1 del Código de Trabajo?"
   - "¿Cuántas horas es la jornada laboral en Costa Rica?"
   - "¿Qué es un patrono según el Código de Trabajo?"

3. **Verificar en la base de datos:**
   ```bash
   npx prisma studio
   ```
   - Navegar a `LegalCode` → Buscar código "CT"
   - Navegar a `Article` → Filtrar por `legalCodeId` del Código de Trabajo

---

## 📚 Archivos Generados/Modificados

### Nuevos Archivos:
- ✅ `data/text/codigo-trabajo.txt` - Texto extraído del RTF
- ✅ `data/processed/codigo-trabajo.json` - Artículos parseados
- ✅ `scripts/load-codigo-trabajo.ts` - Script de carga a BD

### Archivos Modificados:
- ✅ `app/api/chat/route.ts` - Integración con búsquedas
- ✅ `lib/legal-loader.ts` - Formato de citas

### Archivos de Configuración:
- ✅ `lib/legal-search.ts` - Ya incluía soporte para `codigo-trabajo`
- ✅ `scripts/parse-articles.ts` - Ya incluía configuración para Código de Trabajo

---

## 🚀 Próximos Pasos (Opcional)

1. **Mejorar búsqueda semántica:**
   - Implementar embeddings con OpenAI para búsquedas más inteligentes
   - Usar vectores para encontrar artículos relacionados

2. **Agregar más códigos:**
   - Código Penal
   - Código de Familia
   - Ley de Tránsito

3. **Optimizar respuestas:**
   - Priorizar Código de Trabajo para consultas laborales
   - Detectar contexto de la consulta (laboral vs civil vs comercial)

4. **Interfaz de usuario:**
   - Mostrar de qué código proviene cada artículo
   - Permitir filtrar por código específico

---

## ✅ Estado Final

**IMPLEMENTACIÓN COMPLETA Y FUNCIONAL** 🎉

El Código de Trabajo de Costa Rica está ahora:
- ✅ Convertido a formato procesable
- ✅ Parseado en artículos individuales
- ✅ Cargado en la base de datos (444 artículos)
- ✅ Integrado en el sistema de búsqueda
- ✅ Disponible para consultas de usuarios
- ✅ Utilizado por OpenAI para generar respuestas fundamentadas

Los usuarios ahora pueden hacer consultas sobre temas laborales y el sistema responderá con citas textuales del Código de Trabajo oficial de Costa Rica.
