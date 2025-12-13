# 💬 Sistema de Historial de Conversaciones

## ✅ Implementado

### 1. **Base de Datos**
- ✅ Tablas `Conversation` y `Message` ya existen en el schema
- ✅ Relación con `User` para asociar conversaciones
- ✅ Campo `tokensUsed` en mensajes para tracking
- ✅ Cascade delete (al eliminar conversación, se eliminan mensajes)

### 2. **API Endpoints**

#### `/api/chat` (POST) - Mejorado
- ✅ Guarda mensajes del usuario y del asistente
- ✅ Crea nueva conversación o usa existente
- ✅ Actualiza tokens del usuario (resta los usados)
- ✅ Título automático basado en primer mensaje

#### `/api/conversations` (GET)
- ✅ Lista las últimas 50 conversaciones del usuario
- ✅ Ordenadas por fecha (más recientes primero)
- ✅ Incluye primer mensaje para preview

#### `/api/conversations/[id]` (GET)
- ✅ Obtiene conversación específica con todos los mensajes
- ✅ Verifica que pertenezca al usuario autenticado

#### `/api/conversations/[id]` (DELETE)
- ✅ Elimina conversación y todos sus mensajes
- ✅ Verifica permisos del usuario

### 3. **Tracking de Tokens**
- ✅ Cada mensaje guarda cuántos tokens usó
- ✅ Se resta del balance del usuario automáticamente
- ✅ Nunca puede quedar negativo (Math.max(0, ...))

## 🔄 Pendiente

### 1. **Crear Usuarios en OAuth**
Cuando un usuario se loguea con Google/Facebook, necesitamos:
- Crear registro en tabla `User`
- Crear `Subscription` FREE con tokens iniciales
- Asociar con `Account` de OAuth

### 2. **UI del Sidebar**
- Mostrar lista de conversaciones
- Botón para eliminar conversaciones
- Indicador de conversación activa
- Botón "Nueva conversación"

### 3. **Integración en ChatInterface**
- Cargar conversación al hacer clic
- Enviar `conversationId` en requests
- Actualizar lista al crear nueva

## 📋 Próximos Pasos

### Paso 1: Crear Usuarios en OAuth (15 min)
Actualizar `/app/api/auth/[...nextauth]/route.ts`:
```typescript
callbacks: {
  async signIn({ user, account }) {
    // Crear usuario y subscription si no existe
  }
}
```

### Paso 2: Actualizar Dashboard Sidebar (20 min)
Agregar en `/app/dashboard/page.tsx`:
- Fetch de conversaciones
- Lista con scroll
- Botón eliminar
- Click para cargar

### Paso 3: Integrar con ChatInterface (15 min)
Actualizar `/components/chat/chat-interface.tsx`:
- Prop `conversationId`
- Cargar mensajes existentes
- Enviar ID en requests

## 🎯 Flujo Completo

### Usuario Nuevo (OAuth)
1. Login con Google/Facebook
2. Se crea User + Subscription FREE (100 tokens)
3. Redirige a dashboard
4. Sidebar muestra "Sin conversaciones"

### Primera Consulta
1. Usuario escribe mensaje
2. API crea Conversation
3. Guarda Message (user + assistant)
4. Resta tokens usados
5. Retorna conversationId
6. Sidebar se actualiza con nueva conversación

### Consultas Siguientes
1. Usuario hace clic en conversación del sidebar
2. Se cargan todos los mensajes
3. Usuario continúa conversación
4. Mensajes se agregan a la misma conversación

### Eliminar Conversación
1. Usuario hace clic en icono de eliminar
2. Confirmación
3. DELETE a `/api/conversations/[id]`
4. Se elimina de sidebar

## 💾 Estructura de Datos

### Conversation
```typescript
{
  id: string
  userId: string
  title: string // "¿Cuáles son los requisitos para..."
  messages: Message[]
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Message
```typescript
{
  id: string
  conversationId: string
  role: 'USER' | 'ASSISTANT' | 'SYSTEM'
  content: string
  tokensUsed: number
  createdAt: DateTime
}
```

## 🔒 Seguridad

- ✅ Todas las APIs verifican autenticación
- ✅ Solo se pueden ver/eliminar conversaciones propias
- ✅ Tokens nunca quedan negativos
- ✅ Cascade delete previene mensajes huérfanos

---

**Estado:** Backend completo, falta UI y OAuth user creation
**Próximo:** Implementar creación de usuarios en OAuth
