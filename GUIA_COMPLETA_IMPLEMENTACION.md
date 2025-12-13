# 🚀 Guía Completa de Implementación - LexAI

## 📋 Índice

1. [Configurar Login con Google y Facebook](#1-configurar-login-con-google-y-facebook)
2. [Implementar Pagos Reales con Stripe](#2-implementar-pagos-reales-con-stripe)
3. [Preparar para Apps Móviles](#3-preparar-para-apps-móviles)
4. [Despliegue en Producción](#4-despliegue-en-producción)

---

## 1. Configurar Login con Google y Facebook

### Paso 1.1: Crear App en Google Cloud Console

**¿Qué es?** Google Cloud Console es donde creas credenciales para que tu app pueda usar "Iniciar sesión con Google".

**Instrucciones:**

1. **Ve a Google Cloud Console**
   - Abre: https://console.cloud.google.com
   - Inicia sesión con tu cuenta de Google

2. **Crear un Proyecto Nuevo**
   - Haz clic en el menú desplegable de proyectos (arriba a la izquierda)
   - Clic en "Nuevo Proyecto"
   - Nombre: `LexAI Costa Rica`
   - Clic en "Crear"

3. **Habilitar Google+ API**
   - En el menú lateral, ve a "APIs y servicios" > "Biblioteca"
   - Busca "Google+ API"
   - Clic en "Habilitar"

4. **Configurar Pantalla de Consentimiento**
   - Ve a "APIs y servicios" > "Pantalla de consentimiento de OAuth"
   - Selecciona "Externo"
   - Clic en "Crear"
   
   **Completa el formulario:**
   - Nombre de la aplicación: `LexAI Costa Rica`
   - Correo de asistencia: tu email
   - Logo de la aplicación: (opcional por ahora)
   - Dominios autorizados: `localhost` (para desarrollo)
   - Correo del desarrollador: tu email
   - Clic en "Guardar y continuar"
   
   **Ámbitos:**
   - Clic en "Agregar o quitar ámbitos"
   - Selecciona: `email`, `profile`, `openid`
   - Clic en "Guardar y continuar"
   
   **Usuarios de prueba:**
   - Agrega tu email y otros emails que quieras probar
   - Clic en "Guardar y continuar"

5. **Crear Credenciales OAuth**
   - Ve a "APIs y servicios" > "Credenciales"
   - Clic en "Crear credenciales" > "ID de cliente de OAuth 2.0"
   
   **Configuración:**
   - Tipo de aplicación: `Aplicación web`
   - Nombre: `LexAI Web Client`
   
   **Orígenes autorizados de JavaScript:**
   ```
   http://localhost:3000
   https://tu-dominio.com (cuando tengas dominio)
   ```
   
   **URIs de redireccionamiento autorizados:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://tu-dominio.com/api/auth/callback/google (cuando tengas dominio)
   ```
   
   - Clic en "Crear"

6. **Copiar Credenciales**
   - Te aparecerá un modal con:
     - **ID de cliente**: Cópialo (algo como: `123456789-abc.apps.googleusercontent.com`)
     - **Secreto del cliente**: Cópialo (algo como: `GOCSPX-abc123xyz`)
   - Guárdalos en un lugar seguro

### Paso 1.2: Crear App en Facebook Developers

**¿Qué es?** Facebook Developers es donde creas una app para usar "Iniciar sesión con Facebook".

**Instrucciones:**

1. **Ve a Facebook Developers**
   - Abre: https://developers.facebook.com
   - Inicia sesión con tu cuenta de Facebook

2. **Crear una App**
   - Clic en "Mis Apps" (arriba derecha)
   - Clic en "Crear App"
   - Selecciona "Consumidor" (para apps de consumidor)
   - Clic en "Siguiente"

3. **Detalles de la App**
   - Nombre para mostrar: `LexAI Costa Rica`
   - Correo de contacto: tu email
   - Clic en "Crear app"
   - Completa el captcha de seguridad

4. **Agregar Producto: Facebook Login**
   - En el panel de la app, busca "Facebook Login"
   - Clic en "Configurar"
   - Selecciona "Web"
   - URL del sitio: `http://localhost:3000`
   - Clic en "Guardar"

5. **Configurar Facebook Login**
   - En el menú lateral, ve a "Facebook Login" > "Configuración"
   
   **URIs de redireccionamiento de OAuth válidos:**
   ```
   http://localhost:3000/api/auth/callback/facebook
   https://tu-dominio.com/api/auth/callback/facebook (cuando tengas dominio)
   ```
   
   - Clic en "Guardar cambios"

6. **Configuración Básica**
   - En el menú lateral, ve a "Configuración" > "Básica"
   - Aquí verás:
     - **ID de la app**: Cópialo (algo como: `1234567890123456`)
     - **Clave secreta de la app**: Clic en "Mostrar" y cópiala
   - Guárdalos en un lugar seguro

7. **Hacer la App Pública (cuando estés listo)**
   - Por ahora está en "Modo de desarrollo"
   - Para producción, necesitarás completar la revisión de Facebook
   - Esto lo haremos después

### Paso 1.3: Actualizar Variables de Entorno

**¿Qué es?** El archivo `.env` guarda información sensible como contraseñas y claves API.

**Instrucciones:**

1. **Abre el archivo `.env`**
   - Ubicación: `/Users/manu/CascadeProjects/lexai-costarica/.env`

2. **Agrega las credenciales de Google y Facebook**
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID="tu-id-de-cliente-de-google.apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="tu-secreto-de-cliente-de-google"
   
   # Facebook OAuth
   FACEBOOK_CLIENT_ID="tu-id-de-app-de-facebook"
   FACEBOOK_CLIENT_SECRET="tu-clave-secreta-de-facebook"
   ```

3. **Guarda el archivo**

**⚠️ IMPORTANTE:** Nunca compartas este archivo ni lo subas a GitHub público.

### Paso 1.4: Actualizar Base de Datos para OAuth

**¿Qué es?** Necesitamos modificar la base de datos para guardar información de usuarios que se registran con Google/Facebook.

**Instrucciones:**

1. **Actualizar el schema de Prisma**
   - Ya lo haré yo en el siguiente paso

2. **Aplicar los cambios a la base de datos**
   - Ejecutarás un comando que yo te daré

---

## 2. Implementar Pagos Reales con Stripe

### Paso 2.1: Crear Cuenta en Stripe

**¿Qué es?** Stripe es una plataforma para procesar pagos con tarjeta de crédito de forma segura.

**Instrucciones:**

1. **Crear Cuenta**
   - Ve a: https://stripe.com
   - Clic en "Empezar ahora" o "Sign up"
   - Completa el registro con tu email

2. **Activar tu Cuenta**
   - Stripe te pedirá información de tu negocio
   - **Nombre del negocio:** LexAI Costa Rica
   - **Tipo de negocio:** Software/SaaS
   - **País:** Costa Rica
   - **Moneda:** USD (dólares)
   - Completa la información bancaria para recibir pagos

3. **Modo de Prueba vs Modo Real**
   - Stripe tiene dos modos:
     - **Modo de prueba:** Para desarrollo (no cobra dinero real)
     - **Modo real:** Para producción (cobra dinero real)
   - Empezaremos en modo de prueba

### Paso 2.2: Obtener Claves API de Stripe

**Instrucciones:**

1. **Ir al Dashboard de Stripe**
   - Ve a: https://dashboard.stripe.com

2. **Obtener Claves de Prueba**
   - En el menú superior, asegúrate de estar en "Modo de prueba"
   - Ve a "Developers" > "API keys"
   - Verás dos claves:
     - **Publishable key** (empieza con `pk_test_...`)
     - **Secret key** (empieza con `sk_test_...`, clic en "Reveal")
   - Cópialas

3. **Obtener Claves Reales (para producción)**
   - Cambia a "Modo real" (toggle arriba)
   - Ve a "Developers" > "API keys"
   - Verás:
     - **Publishable key** (empieza con `pk_live_...`)
     - **Secret key** (empieza con `sk_live_...`)
   - Cópialas también

### Paso 2.3: Crear Productos y Precios en Stripe

**¿Qué es?** Necesitas crear el producto "Subscripción LexAI" con su precio de $10/mes en Stripe.

**Instrucciones:**

1. **Crear Producto**
   - En Stripe Dashboard, ve a "Products" > "Add product"
   
   **Información del producto:**
   - Name: `Subscripción LexAI Professional`
   - Description: `Acceso completo a LexAI con consultas ilimitadas y análisis de documentos`
   - Image: (opcional, puedes agregar logo después)

2. **Configurar Precio**
   - Pricing model: `Standard pricing`
   - Price: `10.00`
   - Billing period: `Monthly`
   - Currency: `USD`
   - Clic en "Save product"

3. **Copiar Price ID**
   - Después de crear, verás el producto
   - En la sección "Pricing", verás el precio creado
   - Copia el **Price ID** (algo como: `price_1ABC123xyz`)
   - Guárdalo, lo necesitarás

### Paso 2.4: Configurar Webhook de Stripe

**¿Qué es?** Un webhook es una URL donde Stripe enviará notificaciones cuando ocurran eventos (ej: pago exitoso, subscripción cancelada).

**Instrucciones:**

1. **Crear Webhook en Stripe**
   - Ve a "Developers" > "Webhooks"
   - Clic en "Add endpoint"

2. **Configurar Endpoint (para desarrollo)**
   - Endpoint URL: `http://localhost:3000/api/webhooks/stripe`
   - Description: `LexAI Webhook - Development`
   
   **Eventos a escuchar:**
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   
   - Clic en "Add endpoint"

3. **Copiar Signing Secret**
   - Después de crear, verás el webhook
   - Clic en el webhook
   - En "Signing secret", clic en "Reveal"
   - Copia el secreto (algo como: `whsec_abc123xyz`)

4. **Para Producción (después)**
   - Crearás otro webhook con tu dominio real
   - URL: `https://tu-dominio.com/api/webhooks/stripe`

### Paso 2.5: Actualizar Variables de Entorno

**Instrucciones:**

Agrega a tu archivo `.env`:

```env
# Stripe - Modo de Prueba
STRIPE_SECRET_KEY="sk_test_tu_clave_secreta_de_prueba"
STRIPE_PUBLISHABLE_KEY="pk_test_tu_clave_publica_de_prueba"
STRIPE_WEBHOOK_SECRET="whsec_tu_secreto_de_webhook"
STRIPE_PRICE_ID="price_tu_price_id_del_producto"

# Stripe - Modo Real (para producción, comentadas por ahora)
# STRIPE_SECRET_KEY="sk_live_tu_clave_secreta_real"
# STRIPE_PUBLISHABLE_KEY="pk_live_tu_clave_publica_real"
# STRIPE_WEBHOOK_SECRET="whsec_tu_secreto_de_webhook_real"
```

### Paso 2.6: Probar Pagos en Modo de Prueba

**¿Qué es?** Stripe proporciona tarjetas de prueba para simular pagos sin cobrar dinero real.

**Tarjetas de Prueba:**

```
Tarjeta exitosa:
Número: 4242 4242 4242 4242
Fecha: Cualquier fecha futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)
ZIP: Cualquier código postal

Tarjeta que falla:
Número: 4000 0000 0000 0002
```

---

## 3. Preparar para Apps Móviles

### Opción A: Progressive Web App (PWA) - MÁS FÁCIL ⭐

**¿Qué es?** Una PWA es una web que se comporta como app nativa. Se puede instalar en el teléfono sin necesidad de App Store o Google Play.

**Ventajas:**
- ✅ No necesitas App Store ni Google Play
- ✅ Una sola base de código
- ✅ Actualizaciones instantáneas
- ✅ Funciona en iOS y Android
- ✅ Más fácil de mantener

**Desventajas:**
- ❌ No aparece en las tiendas de apps
- ❌ Algunas limitaciones en funcionalidades nativas

**Recomendación:** Empieza con PWA, es mucho más fácil.

### Opción B: React Native - MÁS COMPLEJO

**¿Qué es?** React Native te permite crear apps nativas para iOS y Android.

**Ventajas:**
- ✅ Apps nativas reales
- ✅ Aparecen en App Store y Google Play
- ✅ Acceso completo a funcionalidades del teléfono

**Desventajas:**
- ❌ Más complejo de configurar
- ❌ Necesitas cuenta de desarrollador:
  - Apple Developer: $99/año
  - Google Play: $25 una vez
- ❌ Proceso de revisión en las tiendas
- ❌ Dos bases de código (iOS y Android)

**Recomendación:** Solo si realmente necesitas estar en las tiendas.

### Paso 3.1: Implementar PWA (Recomendado)

**Instrucciones:**

1. **Configurar Next.js como PWA**
   - Yo crearé los archivos necesarios

2. **Características de la PWA:**
   - Se puede instalar en el teléfono
   - Funciona offline (básico)
   - Icono en la pantalla de inicio
   - Pantalla de splash
   - Notificaciones push (opcional)

3. **Cómo instalar la PWA:**
   - **En Android (Chrome):**
     - Abre la web
     - Menú > "Agregar a pantalla de inicio"
   
   - **En iOS (Safari):**
     - Abre la web
     - Botón compartir > "Agregar a inicio"

### Paso 3.2: Si Decides Hacer App Nativa (React Native)

**Requisitos Previos:**

1. **Cuentas de Desarrollador**
   - Apple Developer Program: $99/año
   - Google Play Console: $25 una vez

2. **Software Necesario**
   - Node.js (ya lo tienes)
   - Xcode (para iOS, solo en Mac)
   - Android Studio (para Android)

**Pasos Básicos:**

1. **Crear Proyecto React Native**
   ```bash
   npx react-native init LexAIMobile
   ```

2. **Instalar Dependencias**
   - React Navigation (navegación)
   - Axios (llamadas API)
   - AsyncStorage (almacenamiento local)

3. **Conectar con tu Backend**
   - Tu backend Next.js se convierte en API
   - La app móvil consume esa API

4. **Publicar en Tiendas**
   - **Google Play:** Más fácil, revisión ~1-3 días
   - **App Store:** Más estricto, revisión ~1-7 días

**⚠️ ADVERTENCIA:** Esto es MUCHO más complejo. Te recomiendo empezar con PWA.

---

## 4. Despliegue en Producción

### Paso 4.1: Elegir Hosting

**Opciones Recomendadas:**

**1. Vercel (Recomendado para Next.js) ⭐**
- Gratis para empezar
- Muy fácil de usar
- Optimizado para Next.js
- SSL automático
- Dominio gratis: `tu-app.vercel.app`

**2. Railway**
- Incluye base de datos PostgreSQL
- Fácil de configurar
- $5-20/mes

**3. AWS / Google Cloud**
- Más complejo
- Más control
- Más caro

### Paso 4.2: Desplegar en Vercel (Recomendado)

**Instrucciones:**

1. **Crear Cuenta en Vercel**
   - Ve a: https://vercel.com
   - Clic en "Sign Up"
   - Usa tu cuenta de GitHub

2. **Conectar Repositorio**
   - Clic en "New Project"
   - Importa tu repositorio de GitHub
   - Vercel detectará automáticamente que es Next.js

3. **Configurar Variables de Entorno**
   - En la configuración del proyecto
   - Agrega TODAS las variables de tu `.env`:
     - `DATABASE_URL`
     - `NEXTAUTH_URL` (cambia a tu dominio)
     - `NEXTAUTH_SECRET`
     - `OPENAI_API_KEY`
     - `GOOGLE_CLIENT_ID`
     - `GOOGLE_CLIENT_SECRET`
     - `FACEBOOK_CLIENT_ID`
     - `FACEBOOK_CLIENT_SECRET`
     - `STRIPE_SECRET_KEY` (usa las claves LIVE)
     - `STRIPE_PUBLISHABLE_KEY`
     - `STRIPE_WEBHOOK_SECRET`
     - `STRIPE_PRICE_ID`

4. **Desplegar**
   - Clic en "Deploy"
   - Espera 2-5 minutos
   - ¡Tu app estará en línea!

5. **Configurar Dominio Personalizado**
   - En Vercel, ve a "Settings" > "Domains"
   - Agrega tu dominio (ej: `lexai.cr`)
   - Sigue las instrucciones para configurar DNS

### Paso 4.3: Configurar Base de Datos en Producción

**Opciones:**

**1. Vercel Postgres (Recomendado)**
- Integrado con Vercel
- Fácil de configurar
- Gratis para empezar

**2. Railway**
- PostgreSQL incluido
- $5/mes

**3. Supabase**
- PostgreSQL gratis
- Incluye autenticación

**Instrucciones (Vercel Postgres):**

1. En tu proyecto de Vercel
2. Ve a "Storage" > "Create Database"
3. Selecciona "Postgres"
4. Copia el `DATABASE_URL`
5. Agrégalo a las variables de entorno

### Paso 4.4: Actualizar Configuraciones OAuth

**Google:**
1. Ve a Google Cloud Console
2. Agrega tu dominio de producción a:
   - Orígenes autorizados: `https://tu-dominio.com`
   - URIs de redireccionamiento: `https://tu-dominio.com/api/auth/callback/google`

**Facebook:**
1. Ve a Facebook Developers
2. Agrega tu dominio de producción a:
   - URIs de redireccionamiento: `https://tu-dominio.com/api/auth/callback/facebook`
3. Cambia la app a "Modo real"

**Stripe:**
1. Ve a Stripe Dashboard
2. Cambia a "Modo real"
3. Crea nuevo webhook con tu dominio: `https://tu-dominio.com/api/webhooks/stripe`
4. Actualiza las variables de entorno con claves LIVE

---

## 5. Checklist Final

### Antes de Lanzar:

- [ ] Autenticación con Google funciona
- [ ] Autenticación con Facebook funciona
- [ ] Pagos con Stripe funcionan (modo prueba)
- [ ] Webhooks de Stripe configurados
- [ ] Base de datos en producción
- [ ] Variables de entorno configuradas
- [ ] Dominio personalizado configurado
- [ ] SSL/HTTPS habilitado
- [ ] Pruebas de pago reales (con tarjeta real)
- [ ] Política de privacidad publicada
- [ ] Términos de servicio publicados

### Para Apps Móviles (PWA):

- [ ] Manifest.json configurado
- [ ] Service Worker funcionando
- [ ] Iconos de app creados
- [ ] Pruebas en iOS
- [ ] Pruebas en Android

### Para Apps Móviles (React Native):

- [ ] App de iOS compilada
- [ ] App de Android compilada
- [ ] Cuenta de Apple Developer activa
- [ ] Cuenta de Google Play activa
- [ ] Screenshots para las tiendas
- [ ] Descripción de la app escrita
- [ ] Política de privacidad enlazada
- [ ] App enviada a revisión

---

## 6. Costos Mensuales Estimados

### Servicios Necesarios:

**Desarrollo:**
- Vercel: Gratis - $20/mes
- Base de datos: Gratis - $10/mes
- Dominio: $10-15/año
- **Total:** ~$0-30/mes

**Producción (con usuarios):**
- Vercel Pro: $20/mes
- Base de datos: $10-50/mes
- OpenAI API: Variable según uso
- Stripe: 2.9% + $0.30 por transacción
- **Total:** ~$50-100/mes + costos de API

**Apps Móviles (si decides hacerlas):**
- Apple Developer: $99/año
- Google Play: $25 una vez
- **Total:** ~$100/año adicional

---

## 7. Próximos Pasos

**Orden Recomendado:**

1. ✅ **Semana 1:** Configurar OAuth (Google y Facebook)
2. ✅ **Semana 2:** Implementar pagos con Stripe
3. ✅ **Semana 3:** Probar todo en modo desarrollo
4. ✅ **Semana 4:** Desplegar en producción
5. ✅ **Semana 5:** Configurar PWA
6. ✅ **Semana 6:** Marketing y lanzamiento

**¿Necesitas Apps Nativas?**
- Si sí: Agrega 2-3 meses más
- Si no: Usa PWA (más fácil)

---

## 8. Recursos Útiles

**Documentación:**
- NextAuth: https://next-auth.js.org
- Stripe: https://stripe.com/docs
- Vercel: https://vercel.com/docs
- PWA: https://web.dev/progressive-web-apps

**Videos Tutorial (YouTube):**
- "NextAuth Google Login"
- "Stripe Subscriptions Tutorial"
- "Deploy Next.js to Vercel"
- "Create PWA with Next.js"

**Comunidades:**
- Stack Overflow
- Reddit: r/nextjs, r/webdev
- Discord de Next.js

---

## ¿Necesitas Ayuda?

Si te atoras en algún paso, dime específicamente en qué parte y te ayudo a resolverlo paso a paso.

**Recuerda:**
- No te apresures
- Prueba cada paso antes de continuar
- Usa modo de prueba antes de modo real
- Haz backups de tu base de datos
- Guarda todas tus claves API de forma segura

¡Éxito con tu proyecto! 🚀⚖️🇨🇷
