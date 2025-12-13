# 📦 Instrucciones de Instalación - OAuth y Pagos

## Paso 1: Instalar Dependencias Faltantes

Abre la terminal en la carpeta del proyecto y ejecuta:

```bash
cd /Users/manu/CascadeProjects/lexai-costarica

# Instalar el adaptador de Prisma para NextAuth
npm install @next-auth/prisma-adapter

# Instalar tipos de Stripe
npm install @stripe/react-stripe-js

# Verificar que todo esté instalado
npm install
```

## Paso 2: Aplicar Migraciones de Base de Datos

Esto actualizará tu base de datos con las nuevas tablas para OAuth:

```bash
# Generar el cliente de Prisma
npx prisma generate

# Crear y aplicar la migración
npx prisma migrate dev --name add-oauth-support

# Verificar que funcionó
npx prisma studio
```

**¿Qué hace esto?**
- Crea las tablas: `Account`, `Session`, `VerificationToken`
- Modifica la tabla `User` para agregar campos de OAuth
- Genera el cliente de Prisma actualizado

## Paso 3: Configurar Variables de Entorno

Edita el archivo `.env` y agrega:

```env
# Google OAuth
GOOGLE_CLIENT_ID="TU_GOOGLE_CLIENT_ID_AQUI"
GOOGLE_CLIENT_SECRET="TU_GOOGLE_CLIENT_SECRET_AQUI"

# Facebook OAuth
FACEBOOK_CLIENT_ID="TU_FACEBOOK_CLIENT_ID_AQUI"
FACEBOOK_CLIENT_SECRET="TU_FACEBOOK_CLIENT_SECRET_AQUI"

# Stripe (Modo de Prueba)
STRIPE_SECRET_KEY="sk_test_TU_CLAVE_SECRETA_DE_PRUEBA"
STRIPE_PUBLISHABLE_KEY="pk_test_TU_CLAVE_PUBLICA_DE_PRUEBA"
STRIPE_WEBHOOK_SECRET="whsec_TU_SECRETO_DE_WEBHOOK"
STRIPE_PRICE_ID="price_TU_PRICE_ID_DEL_PRODUCTO"
```

**Importante:** Reemplaza los valores con tus claves reales de Google, Facebook y Stripe.

## Paso 4: Reiniciar el Servidor

```bash
# Detener el servidor actual (Ctrl+C)

# Iniciar de nuevo
npm run dev
```

## Paso 5: Probar el Login

1. Abre: http://localhost:3000/login
2. Deberías ver botones para:
   - Iniciar sesión con Google
   - Iniciar sesión con Facebook
   - Iniciar sesión con Email/Password

## Verificar que Todo Funciona

### Base de Datos:
```bash
npx prisma studio
```
- Verifica que existan las tablas: `User`, `Account`, `Session`

### Logs:
- Revisa la consola del servidor
- No deberían haber errores de módulos faltantes

## Problemas Comunes

### Error: "Cannot find module '@next-auth/prisma-adapter'"
**Solución:**
```bash
npm install @next-auth/prisma-adapter
```

### Error: "PrismaClient is not a constructor"
**Solución:**
```bash
npx prisma generate
```

### Error: "Table 'Account' doesn't exist"
**Solución:**
```bash
npx prisma migrate dev --name add-oauth-support
```

### Error: "GOOGLE_CLIENT_ID is not defined"
**Solución:**
- Verifica que el archivo `.env` tenga las variables
- Reinicia el servidor después de editar `.env`

## Siguiente Paso

Una vez que todo funcione localmente, sigue la guía:
- `GUIA_COMPLETA_IMPLEMENTACION.md` - Para configurar Google, Facebook y Stripe
- `GUIA_PAGOS_STRIPE.md` - Para implementar los pagos
