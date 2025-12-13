# 🔑 Configuración de OpenAI - Guía Completa

## 📋 Requisitos Previos

- Cuenta de OpenAI (https://platform.openai.com)
- Método de pago configurado
- Créditos en la cuenta (mínimo $5 recomendado)

## 🚀 Paso a Paso

### 1. Crear Cuenta en OpenAI

1. Ve a https://platform.openai.com/signup
2. Regístrate con tu email
3. Verifica tu email
4. Completa tu perfil

### 2. Agregar Método de Pago

1. Ve a https://platform.openai.com/account/billing/overview
2. Click en "Add payment method"
3. Ingresa los datos de tu tarjeta
4. Agrega créditos iniciales (mínimo $5)

**Importante**: OpenAI requiere un método de pago válido incluso para usar la API en desarrollo.

### 3. Obtener API Key

1. Ve a https://platform.openai.com/api-keys
2. Click en "Create new secret key"
3. Dale un nombre descriptivo (ej: "LexAI-Development")
4. **COPIA LA KEY INMEDIATAMENTE** (solo se muestra una vez)
5. Guárdala en un lugar seguro

**Formato de la key**: `sk-proj-...` (empieza con sk-proj o sk-)

### 4. Configurar en el Proyecto

Edita el archivo `.env` en la raíz del proyecto:

```env
OPENAI_API_KEY="sk-proj-tu-key-aqui"
```

**⚠️ NUNCA** compartas tu API key o la subas a GitHub.

### 5. Verificar Configuración

Reinicia el servidor de desarrollo:

```bash
# Detener el servidor (Ctrl+C)
# Iniciar nuevamente
npm run dev
```

Ve a http://localhost:3000/dashboard y prueba hacer una consulta en el chat.

## 💰 Gestión de Costos

### Precios Actuales (Diciembre 2024)

| Modelo | Input (por 1K tokens) | Output (por 1K tokens) |
|--------|----------------------|------------------------|
| GPT-4o | $0.0025 | $0.01 |
| GPT-4o-mini | $0.00015 | $0.0006 |
| GPT-3.5 Turbo | $0.0005 | $0.0015 |

**Nota**: LexAI usa `gpt-4o-mini` por defecto (más económico y rápido)

### Estimación de Costos

**Consulta típica con gpt-4o-mini**:
- Prompt del sistema: ~200 tokens
- Pregunta del usuario: ~50 tokens
- Respuesta: ~300 tokens
- **Total**: ~550 tokens
- **Costo**: ~$0.0004 por consulta (¡muy económico!)

**100 consultas/día**:
- Tokens: 55,000
- Costo: ~$0.04/día = $1.20/mes (¡50x más barato!)

### Configurar Límites de Gasto

1. Ve a https://platform.openai.com/account/limits
2. Configura "Hard limit" (ej: $100/mes)
3. Configura "Soft limit" para recibir alertas (ej: $50/mes)

**Recomendado para desarrollo**: $20-50/mes

## 🔧 Optimización de Costos

### 1. Usar Modelo Más Barato para Desarrollo

Edita `/lib/openai.ts`:

```typescript
// Para desarrollo, usar GPT-3.5 Turbo (más barato)
const model = process.env.NODE_ENV === 'production' 
  ? 'gpt-4-turbo-preview'
  : 'gpt-3.5-turbo'
```

### 2. Limitar Tokens de Respuesta

En `/app/api/chat/route.ts`:

```typescript
const completion = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: chatMessages,
  temperature: 0.7,
  max_tokens: 1000, // Reducir de 2000 a 1000
})
```

### 3. Implementar Caché

```typescript
// Cachear respuestas comunes
const cacheKey = `query:${hash(message)}`
const cached = await redis.get(cacheKey)

if (cached) {
  return NextResponse.json({
    message: cached,
    tokensUsed: 0,
    fromCache: true
  })
}
```

### 4. Rate Limiting por Usuario

```typescript
// Limitar consultas por usuario
const userQueries = await prisma.message.count({
  where: {
    conversation: {
      userId: user.id
    },
    createdAt: {
      gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // últimas 24h
    }
  }
})

if (userQueries >= 50) {
  return NextResponse.json(
    { error: 'Límite de consultas diarias alcanzado' },
    { status: 429 }
  )
}
```

## 📊 Monitoreo de Uso

### Ver Uso en OpenAI Dashboard

1. Ve a https://platform.openai.com/usage
2. Revisa:
   - Tokens usados por día
   - Costo por día
   - Requests por modelo
   - Errores

### Configurar Alertas

1. Ve a https://platform.openai.com/account/billing/overview
2. Configura email alerts:
   - 50% del límite
   - 75% del límite
   - 90% del límite

### Implementar Logging Local

En `/app/api/chat/route.ts`:

```typescript
// Loggear cada consulta
console.log({
  timestamp: new Date().toISOString(),
  userId: user.id,
  model: 'gpt-4-turbo-preview',
  tokensUsed: completion.usage?.total_tokens,
  cost: (completion.usage?.total_tokens || 0) * 0.00002, // estimado
  message: message.substring(0, 50) + '...'
})
```

## 🔐 Seguridad de la API Key

### ✅ Buenas Prácticas

- ✅ Guardar en archivo `.env` (nunca en código)
- ✅ Agregar `.env` a `.gitignore`
- ✅ Usar diferentes keys para dev/prod
- ✅ Rotar keys periódicamente
- ✅ Configurar límites de gasto

### ❌ Nunca Hacer

- ❌ Compartir tu API key
- ❌ Subir `.env` a GitHub
- ❌ Exponer la key en el frontend
- ❌ Usar la misma key en múltiples proyectos
- ❌ Dejar keys sin límites de gasto

### Si Tu Key Se Compromete

1. Ve inmediatamente a https://platform.openai.com/api-keys
2. Click en "Revoke" en la key comprometida
3. Crea una nueva key
4. Actualiza tu `.env`
5. Revisa el uso reciente por actividad sospechosa

## 🧪 Testing

### Probar la Configuración

Crea un archivo de test: `test-openai.js`

```javascript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function test() {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'user', content: 'Hola, ¿funcionas?' }
      ],
      max_tokens: 50
    })
    
    console.log('✅ OpenAI configurado correctamente')
    console.log('Respuesta:', completion.choices[0].message.content)
    console.log('Tokens usados:', completion.usage?.total_tokens)
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

test()
```

Ejecutar:
```bash
node test-openai.js
```

## 🆘 Solución de Problemas

### Error: "Incorrect API key provided"

**Causa**: La API key es inválida o está mal copiada

**Solución**:
1. Verifica que copiaste la key completa
2. Asegúrate de que no hay espacios extra
3. Verifica que la key no haya sido revocada
4. Crea una nueva key si es necesario

### Error: "You exceeded your current quota"

**Causa**: No tienes créditos en tu cuenta

**Solución**:
1. Ve a https://platform.openai.com/account/billing/overview
2. Agrega créditos ($5 mínimo)
3. Espera unos minutos para que se procese

### Error: "Rate limit exceeded"

**Causa**: Demasiadas requests en poco tiempo

**Solución**:
1. Implementa rate limiting en tu código
2. Agrega delays entre requests
3. Considera aumentar tu tier en OpenAI

### Error: "Model not found"

**Causa**: El modelo especificado no existe o no tienes acceso

**Solución**:
1. Verifica el nombre del modelo
2. Usa `gpt-3.5-turbo` o `gpt-4-turbo-preview`
3. Verifica que tu cuenta tiene acceso al modelo

## 📚 Recursos Adicionales

- **Documentación oficial**: https://platform.openai.com/docs
- **Pricing**: https://openai.com/pricing
- **API Reference**: https://platform.openai.com/docs/api-reference
- **Community**: https://community.openai.com
- **Status**: https://status.openai.com

## 🎓 Mejores Prácticas

### 1. Optimizar Prompts

```typescript
// ❌ Prompt largo e ineficiente
const prompt = `Eres un asistente legal muy inteligente y conocedor...
[500 palabras de instrucciones]`

// ✅ Prompt conciso y efectivo
const prompt = `Asistente legal especializado en Costa Rica. 
Responde con referencias a artículos específicos.`
```

### 2. Usar Temperature Apropiada

```typescript
// Para respuestas legales (precisión)
temperature: 0.3

// Para generación creativa de documentos
temperature: 0.7
```

### 3. Implementar Streaming (Opcional)

```typescript
const stream = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: chatMessages,
  stream: true,
})

for await (const chunk of stream) {
  // Enviar chunks al frontend en tiempo real
  process.stdout.write(chunk.choices[0]?.delta?.content || '')
}
```

## ✅ Checklist de Configuración

- [ ] Cuenta de OpenAI creada
- [ ] Método de pago agregado
- [ ] Créditos cargados ($5 mínimo)
- [ ] API key generada
- [ ] API key guardada en `.env`
- [ ] `.env` en `.gitignore`
- [ ] Límites de gasto configurados
- [ ] Servidor reiniciado
- [ ] Prueba de chat exitosa
- [ ] Monitoreo de uso configurado

## 🎯 Próximos Pasos

Una vez configurado OpenAI:

1. Prueba el chat en http://localhost:3000/dashboard
2. Monitorea el uso en el dashboard de OpenAI
3. Ajusta los límites según tu presupuesto
4. Considera implementar caché para reducir costos
5. Optimiza prompts para mejor rendimiento

---

**¿Necesitas ayuda?** Revisa la documentación oficial o contacta al soporte de OpenAI.
