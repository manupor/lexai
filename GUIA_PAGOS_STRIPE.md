# 💳 Guía de Implementación de Pagos con Stripe

## 🎯 Objetivo

Implementar un sistema de pagos real con Stripe para subscripciones de $10/mes.

## 📋 Requisitos Previos

- Cuenta de Stripe creada
- Claves API de Stripe (test y live)
- Producto y precio creados en Stripe

---

## Paso 1: Crear Producto en Stripe

### 1.1 Ir al Dashboard de Stripe

1. Ve a: https://dashboard.stripe.com
2. Asegúrate de estar en **Modo de prueba** (toggle arriba)

### 1.2 Crear el Producto

1. En el menú lateral, ve a **Products**
2. Clic en **Add product**

**Configuración del Producto:**
```
Name: Subscripción LexAI Professional
Description: Acceso completo a consultas legales con IA, análisis de documentos y conversación por voz
```

**Configuración del Precio:**
```
Pricing model: Standard pricing
Price: 10.00
Billing period: Monthly
Currency: USD
```

3. Clic en **Save product**

### 1.3 Copiar el Price ID

Después de crear el producto:
1. Verás el producto en la lista
2. Clic en el producto
3. En la sección **Pricing**, verás el precio
4. Copia el **Price ID** (algo como: `price_1ABC123xyz`)
5. Guárdalo, lo necesitarás en el `.env`

---

## Paso 2: Configurar Webhooks

### 2.1 ¿Qué son los Webhooks?

Los webhooks son notificaciones que Stripe envía a tu servidor cuando ocurren eventos (ej: pago exitoso, subscripción cancelada).

### 2.2 Crear Webhook para Desarrollo

1. Ve a **Developers** > **Webhooks**
2. Clic en **Add endpoint**

**Configuración:**
```
Endpoint URL: http://localhost:3000/api/webhooks/stripe
Description: LexAI Webhook - Development
```

**Eventos a escuchar:**
Selecciona estos eventos:
- ✅ `checkout.session.completed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.payment_succeeded`
- ✅ `invoice.payment_failed`

3. Clic en **Add endpoint**

### 2.3 Copiar el Signing Secret

1. Clic en el webhook que acabas de crear
2. En **Signing secret**, clic en **Reveal**
3. Copia el secreto (algo como: `whsec_abc123xyz`)
4. Guárdalo para el `.env`

### 2.4 Probar Webhooks Localmente

Para que Stripe pueda enviar webhooks a tu localhost, necesitas usar Stripe CLI:

```bash
# Instalar Stripe CLI (Mac)
brew install stripe/stripe-cli/stripe

# Login a Stripe
stripe login

# Escuchar webhooks
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Esto te dará un **webhook signing secret** temporal para desarrollo.

---

## Paso 3: Configurar Variables de Entorno

Edita tu archivo `.env`:

```env
# Stripe - Modo de Prueba (para desarrollo)
STRIPE_SECRET_KEY="sk_test_51ABC...xyz"
STRIPE_PUBLISHABLE_KEY="pk_test_51ABC...xyz"
STRIPE_WEBHOOK_SECRET="whsec_abc123xyz"
STRIPE_PRICE_ID="price_1ABC123xyz"

# Stripe - Modo Real (para producción, comentadas por ahora)
# STRIPE_SECRET_KEY="sk_live_51ABC...xyz"
# STRIPE_PUBLISHABLE_KEY="pk_live_51ABC...xyz"
# STRIPE_WEBHOOK_SECRET="whsec_abc123xyz_live"
# STRIPE_PRICE_ID="price_1ABC123xyz_live"
```

---

## Paso 4: Flujo de Pago

### 4.1 Cómo Funciona

1. **Usuario hace clic en "Suscribirse"**
   - Se crea una sesión de Checkout en Stripe
   - Usuario es redirigido a la página de pago de Stripe

2. **Usuario ingresa su tarjeta**
   - Stripe procesa el pago de forma segura
   - Tu app NUNCA ve los datos de la tarjeta

3. **Pago exitoso**
   - Stripe envía webhook a tu servidor
   - Tu servidor actualiza la subscripción del usuario
   - Usuario es redirigido de vuelta a tu app

4. **Pagos recurrentes**
   - Stripe cobra automáticamente cada mes
   - Envía webhooks cuando hay pagos o fallos

### 4.2 Endpoints Necesarios

Ya están implementados en el código que te proporcioné:

**1. Crear sesión de Checkout:**
```
POST /api/stripe/create-checkout-session
```

**2. Recibir webhooks:**
```
POST /api/webhooks/stripe
```

**3. Portal del cliente:**
```
POST /api/stripe/create-portal-session
```

---

## Paso 5: Probar Pagos

### 5.1 Tarjetas de Prueba

Stripe proporciona tarjetas de prueba que NO cobran dinero real:

**Tarjeta Exitosa:**
```
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)
ZIP: Cualquier código postal
```

**Tarjeta que Falla:**
```
Número: 4000 0000 0000 0002
Fecha: Cualquier fecha futura
CVC: Cualquier 3 dígitos
```

**Tarjeta que Requiere Autenticación 3D Secure:**
```
Número: 4000 0025 0000 3155
```

### 5.2 Proceso de Prueba

1. **Iniciar servidor:**
   ```bash
   npm run dev
   ```

2. **Iniciar Stripe CLI (en otra terminal):**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

3. **Ir a la app:**
   - Abre: http://localhost:3000/dashboard
   - Clic en "Suscribirse" o "Upgrade"

4. **Completar pago:**
   - Usa la tarjeta de prueba: `4242 4242 4242 4242`
   - Completa el formulario
   - Clic en "Pagar"

5. **Verificar:**
   - Deberías ser redirigido de vuelta
   - Tu subscripción debería estar activa
   - Revisa los logs del Stripe CLI
   - Revisa Stripe Dashboard > Payments

---

## Paso 6: Portal del Cliente

### 6.1 ¿Qué es?

El Portal del Cliente de Stripe permite a los usuarios:
- Ver su subscripción actual
- Actualizar método de pago
- Ver historial de pagos
- Cancelar subscripción
- Descargar facturas

### 6.2 Configurar Portal

1. Ve a **Settings** > **Billing** > **Customer portal**
2. Clic en **Activate test link**
3. Configura:
   - ✅ Permitir cancelar subscripciones
   - ✅ Permitir actualizar métodos de pago
   - ✅ Permitir ver historial de pagos

### 6.3 Usar en tu App

Ya está implementado. El usuario puede:
1. Ir a Dashboard > Configuración
2. Clic en "Gestionar Subscripción"
3. Es redirigido al Portal de Stripe
4. Puede gestionar su subscripción
5. Al terminar, vuelve a tu app

---

## Paso 7: Pasar a Producción

### 7.1 Activar Modo Real en Stripe

1. **Completar información de la cuenta:**
   - Ve a **Settings** > **Account details**
   - Completa toda la información requerida
   - Agrega información bancaria para recibir pagos

2. **Activar cuenta:**
   - Stripe revisará tu información
   - Puede tomar 1-2 días hábiles

### 7.2 Crear Producto en Modo Real

1. Cambia a **Modo real** (toggle arriba)
2. Crea el mismo producto de nuevo:
   - Nombre: Subscripción LexAI Professional
   - Precio: $10/mes
3. Copia el nuevo **Price ID** (live)

### 7.3 Crear Webhook en Modo Real

1. Ve a **Developers** > **Webhooks**
2. Clic en **Add endpoint**
3. URL: `https://tu-dominio.com/api/webhooks/stripe`
4. Selecciona los mismos eventos
5. Copia el nuevo **Signing secret** (live)

### 7.4 Actualizar Variables de Entorno

En tu servidor de producción (Vercel, etc.):

```env
# Stripe - Modo Real
STRIPE_SECRET_KEY="sk_live_51ABC...xyz"
STRIPE_PUBLISHABLE_KEY="pk_live_51ABC...xyz"
STRIPE_WEBHOOK_SECRET="whsec_abc123xyz_live"
STRIPE_PRICE_ID="price_1ABC123xyz_live"
```

### 7.5 Probar con Tarjeta Real

⚠️ **IMPORTANTE:** Ahora sí se cobrará dinero real.

1. Usa tu propia tarjeta para probar
2. Verifica que el pago se procese
3. Verifica que la subscripción se active
4. Cancela la subscripción de prueba

---

## Paso 8: Gestión de Subscripciones

### 8.1 Estados de Subscripción

**ACTIVE:**
- Usuario tiene acceso completo
- Pago al día

**CANCELED:**
- Usuario canceló
- Tiene acceso hasta el final del período pagado

**EXPIRED:**
- Período terminó
- No tiene acceso

### 8.2 Webhooks Importantes

**checkout.session.completed:**
- Se ejecuta cuando el pago inicial es exitoso
- Activa la subscripción del usuario

**customer.subscription.updated:**
- Se ejecuta cuando cambia la subscripción
- Ej: usuario actualiza método de pago

**customer.subscription.deleted:**
- Se ejecuta cuando se cancela la subscripción
- Desactiva el acceso del usuario

**invoice.payment_succeeded:**
- Se ejecuta cada mes cuando se cobra
- Renueva el acceso del usuario

**invoice.payment_failed:**
- Se ejecuta cuando falla un pago
- Notifica al usuario

---

## Paso 9: Costos y Comisiones

### 9.1 Comisiones de Stripe

**Por transacción:**
- 2.9% + $0.30 USD

**Ejemplo con $10:**
- Precio: $10.00
- Comisión Stripe: $0.59
- Recibes: $9.41

### 9.2 Cálculo de Ingresos

**Por usuario al mes:**
- Cobra: $10.00
- Stripe: -$0.59
- Neto: $9.41

**Con 100 usuarios:**
- Ingresos brutos: $1,000
- Comisiones Stripe: -$59
- Ingresos netos: $941

### 9.3 Otros Costos

- Sin costo mensual de Stripe
- Sin costo de setup
- Solo pagas por transacción

---

## Paso 10: Seguridad

### 10.1 Buenas Prácticas

✅ **NUNCA guardes datos de tarjetas**
- Stripe maneja todo
- Tu servidor nunca ve los datos

✅ **Verifica webhooks**
- Usa el signing secret
- Valida cada webhook

✅ **Usa HTTPS en producción**
- Obligatorio para Stripe
- Protege los datos

✅ **Guarda claves de forma segura**
- Usa variables de entorno
- Nunca en el código

### 10.2 Verificación de Webhooks

Ya está implementado en el código:

```typescript
const signature = headers.get('stripe-signature')
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
)
```

Esto garantiza que el webhook viene de Stripe.

---

## Paso 11: Monitoreo

### 11.1 Dashboard de Stripe

Revisa regularmente:
- **Payments:** Todos los pagos
- **Customers:** Lista de clientes
- **Subscriptions:** Subscripciones activas
- **Disputes:** Disputas/chargebacks

### 11.2 Notificaciones

Configura notificaciones por email:
1. Ve a **Settings** > **Notifications**
2. Activa:
   - Pagos fallidos
   - Disputas
   - Subscripciones canceladas

### 11.3 Logs

Revisa los logs de webhooks:
1. Ve a **Developers** > **Webhooks**
2. Clic en tu webhook
3. Ve la pestaña **Logs**
4. Verifica que todos los eventos se procesen correctamente

---

## Checklist Final

Antes de lanzar en producción:

- [ ] Producto creado en Stripe (modo real)
- [ ] Precio configurado ($10/mes)
- [ ] Webhook configurado con tu dominio
- [ ] Variables de entorno actualizadas (live keys)
- [ ] Cuenta de Stripe activada
- [ ] Información bancaria agregada
- [ ] Portal del cliente configurado
- [ ] Prueba con tarjeta real exitosa
- [ ] Webhooks funcionando correctamente
- [ ] Logs sin errores
- [ ] Política de reembolsos definida
- [ ] Términos de servicio actualizados

---

## Recursos Útiles

**Documentación:**
- Stripe Checkout: https://stripe.com/docs/payments/checkout
- Webhooks: https://stripe.com/docs/webhooks
- Testing: https://stripe.com/docs/testing

**Soporte:**
- Stripe Support: https://support.stripe.com
- Documentación en español: https://stripe.com/es

**Comunidad:**
- Stack Overflow: [stripe] tag
- Reddit: r/stripe

---

## ¿Problemas?

### Webhook no se recibe

**Solución:**
1. Verifica que Stripe CLI esté corriendo
2. Verifica la URL del webhook
3. Revisa los logs en Stripe Dashboard

### Pago se procesa pero subscripción no se activa

**Solución:**
1. Revisa los logs del webhook
2. Verifica que el evento `checkout.session.completed` se procese
3. Revisa la base de datos

### Error "Invalid API Key"

**Solución:**
1. Verifica que la clave sea correcta
2. Verifica que estés en el modo correcto (test/live)
3. Reinicia el servidor después de cambiar `.env`

---

¡Listo! Ahora tienes un sistema de pagos completo y profesional con Stripe. 💳✨
