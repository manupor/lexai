# 🚨 URGENTE: Redeploy Manual en Vercel

## 🎯 Problema:
El código está actualizado en GitHub pero Vercel está sirviendo una versión vieja (cacheada).

## ✅ Solución (2 minutos):

### Paso 1: Ve a Vercel Dashboard
```
https://vercel.com/manupors-projects/lexai
```

### Paso 2: Haz Redeploy
1. Click en la pestaña **"Deployments"**
2. Encuentra el deployment más reciente (commit `de89936`)
3. Click en los **3 puntos (...)** al lado derecho
4. Selecciona **"Redeploy"**
5. **IMPORTANTE:** Desmarca "Use existing Build Cache"
6. Click en **"Redeploy"**

### Paso 3: Espera 2-3 minutos
El deployment debería completarse en 2-3 minutos.

### Paso 4: Verifica
Después del redeploy, ejecuta:
```bash
./scripts/test-production.sh
```

Deberías ver:
```
✅ Chat found Article 1
✅ Chat cited correct text
✅ Chat has access to articles
```

## 🔍 Por qué es necesario:

Vercel está usando cache del build anterior que:
- ❌ Tiene CODE_MAP incorrecto (CC, CCOM, CT)
- ❌ No busca en la base de datos correctamente

El código correcto ya está en GitHub:
- ✅ CODE_MAP correcto (codigo-civil, codigo-comercio, codigo-trabajo)
- ✅ Base de datos con 1233 artículos del Código de Comercio
- ✅ Búsqueda funcionando perfectamente

Solo necesita que Vercel haga un build NUEVO sin cache.

## 🧪 Después del Redeploy:

Prueba en el chat:
```
¿Cómo se define al comerciante en el Código de Comercio?
```

**Respuesta esperada:**
```
📚 Código de Comercio de Costa Rica (Ley N° 3284)

Artículo 1:
> Son comerciantes: 1) Las personas que, teniendo capacidad legal 
> para ejercer el comercio, se dedican a él habitualmente; 
> 2) Las sociedades constituidas con arreglo a las leyes mercantiles.

💡 Interpretación:
[Análisis profesional del artículo]
```

## ⚡ Alternativa Rápida:

Si no puedes acceder a Vercel Dashboard, puedes:

1. **Hacer un cambio mínimo y push:**
```bash
echo "# Updated $(date)" >> README.md
git add README.md
git commit -m "chore: Force rebuild"
git push origin main
```

2. **Esperar el auto-deployment** (3-4 minutos)

Pero el redeploy manual es MÁS RÁPIDO y GARANTIZA que no use cache.

## 📊 Estado Actual:

### Local (Funcionando ✅):
- Código de Comercio: 1233 artículos
- CODE_MAP: Correcto
- Búsqueda: Funciona perfectamente

### Producción (Desactualizado ❌):
- Código de Comercio: Base de datos tiene 1233 artículos
- CODE_MAP: Viejo (incorrecto)
- Búsqueda: No funciona por CODE_MAP viejo

### Después del Redeploy (Funcionará ✅):
- Código de Comercio: 1233 artículos
- CODE_MAP: Correcto
- Búsqueda: Funcionará perfectamente

---

**¡IMPORTANTE!** Sin el redeploy, el sistema seguirá diciendo "No tengo acceso" aunque la base de datos tenga todos los artículos. Es solo un problema de cache de Vercel.
