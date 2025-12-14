# 🚨 INSTRUCCIONES URGENTES - Deployment Vercel

## Problema Actual:
El código con el fix crítico (CODE_MAP) está en GitHub pero Vercel no lo ha deployado correctamente.

## ✅ Solución - Hacer Redeploy Manual en Vercel:

### Opción 1: Desde Vercel Dashboard (RECOMENDADO)
1. Ve a: https://vercel.com/manupors-projects/lexai
2. Click en la pestaña "Deployments"
3. Encuentra el deployment más reciente (commit `389485d`)
4. Click en los 3 puntos (...) → "Redeploy"
5. Selecciona "Redeploy" (sin usar cache)
6. Espera 2-3 minutos

### Opción 2: Desde CLI
```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Force redeploy
vercel --prod --force
```

### Opción 3: Invalidar Cache (Más rápido)
1. Ve a: https://vercel.com/manupors-projects/lexai/settings
2. Click en "Functions"
3. Click en "Purge All" para limpiar el cache
4. Espera 1-2 minutos

## 🧪 Verificación:

Después del redeploy, ejecuta:
```bash
./scripts/test-production.sh
```

Deberías ver:
- ✅ Chat found Article 1
- ✅ Chat cited correct text  
- ✅ Chat has access to articles

## 📝 Respuesta Esperada:

**Pregunta:** "¿Cómo se define al comerciante?"

**Respuesta Correcta:**
```
📚 Código de Comercio de Costa Rica (Ley N° 3284)

Artículo 1:
> Son comerciantes: 1) Las personas que, teniendo capacidad legal 
> para ejercer el comercio, se dedican a él habitualmente; 
> 2) Las sociedades constituidas con arreglo a las leyes mercantiles.

💡 Interpretación:
[Análisis profesional del artículo]
```

## 🔍 Debug:

Si sigue sin funcionar después del redeploy:

1. Verifica que el commit `ca0e395` esté deployado:
   - Ve a Vercel Dashboard
   - Mira el commit hash del deployment activo
   - Debe ser `ca0e395` o posterior

2. Verifica los logs de Vercel:
   - Ve a "Deployments" → Click en el deployment
   - Ve a "Functions" → Click en `/api/chat`
   - Busca logs de "Buscando artículo" o "Búsqueda keyword"

3. Si ves "Código no encontrado" en los logs:
   - El CODE_MAP aún no está actualizado
   - Necesitas hacer un redeploy forzado

## ⚡ Fix Temporal (Mientras se redeploya):

Puedes probar localmente:
```bash
npm run dev
# Ve a http://localhost:3000/dashboard
# Pregunta: "¿Cómo se define al comerciante?"
```

Esto debería funcionar perfectamente y mostrar el Artículo 1.
