# 🚀 Inicio Rápido - LexAI Costa Rica

## Pasos para Ejecutar el Proyecto

### 1. Configurar Variables de Entorno

Edita el archivo `.env` y configura tu API key de OpenAI:

```env
OPENAI_API_KEY="tu-api-key-aqui"
```

**Obtener API Key de OpenAI:**
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Cópiala y pégala en el archivo `.env`

### 2. Configurar Base de Datos (Opcional)

Si tienes PostgreSQL instalado localmente:

```bash
# Crear la base de datos
createdb lexai_costarica

# Ejecutar migraciones
npm run db:migrate

# Poblar con datos de ejemplo
npm run db:seed
```

**Sin PostgreSQL:** La aplicación puede funcionar sin base de datos para probar el chat. Solo necesitas configurar la API key de OpenAI.

### 3. Iniciar el Servidor

```bash
npm run dev
```

### 4. Abrir en el Navegador

Abre http://localhost:3000

## 🎯 Funcionalidades Disponibles

### Página Principal (/)
- Información sobre la plataforma
- Características principales
- Planes y precios

### Dashboard (/dashboard)
- **Chat Legal Inteligente**: Consulta leyes costarricenses
- **Análisis de Documentos**: Sube y analiza documentos legales
- **Historial**: Conversaciones anteriores

## 💡 Ejemplos de Consultas

Prueba estas consultas en el chat:

1. **Derecho Civil**
   - "¿Cuáles son los requisitos para un divorcio en Costa Rica?"
   - "Explícame qué es la capacidad jurídica"

2. **Derecho Laboral**
   - "¿Cuántas horas máximo puedo trabajar al día?"
   - "¿Cuáles son las causas justas de despido?"

3. **Derecho Penal**
   - "¿Qué dice la ley sobre el homicidio?"
   - "¿Cuáles son las penas por robo?"

4. **Generación de Documentos**
   - "Genera una apelación para un caso de despido injustificado"
   - "Crea una opinión legal sobre un contrato de arrendamiento"

## 🔧 Comandos Útiles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Base de Datos
npm run db:generate      # Generar cliente de Prisma
npm run db:migrate       # Ejecutar migraciones
npm run db:seed          # Poblar con datos de ejemplo
npm run db:studio        # Abrir Prisma Studio (GUI)

# Producción
npm run build            # Construir para producción
npm start                # Iniciar servidor de producción
```

## 📝 Notas Importantes

1. **API Key de OpenAI es REQUERIDA** para que el chat funcione
2. La base de datos es opcional para desarrollo inicial
3. Los tokens se consumen con cada consulta (aproximadamente 100-500 tokens por consulta)
4. El modelo usado es `gpt-4-turbo-preview` (puedes cambiarlo en `/lib/openai.ts`)

## 🐛 Solución de Problemas

### Error: "OPENAI_API_KEY no está configurada"
- Verifica que el archivo `.env` existe
- Verifica que la variable `OPENAI_API_KEY` está configurada
- Reinicia el servidor después de cambiar `.env`

### Error: "insufficient_quota"
- Tu cuenta de OpenAI no tiene créditos
- Agrega créditos en https://platform.openai.com/account/billing

### Error de Base de Datos
- Si no tienes PostgreSQL, puedes comentar el código que usa Prisma
- O instala PostgreSQL: https://www.postgresql.org/download/

## 📚 Próximos Pasos

1. **Agregar Autenticación**: Implementar NextAuth.js
2. **Conectar Stripe**: Para pagos y suscripciones
3. **Cargar Leyes Reales**: Poblar la base de datos con leyes de Costa Rica
4. **Implementar RAG**: Usar embeddings para búsqueda semántica en leyes
5. **Análisis de Documentos**: Permitir subir PDFs y analizarlos

## 🤝 Soporte

Si tienes problemas, revisa:
- README.md para documentación completa
- Logs de la consola para errores específicos
- Documentación de OpenAI: https://platform.openai.com/docs
