# 🔧 Solución Rápida: Error de API Key

## ❌ Error Actual

Estás viendo este error porque la API key de OpenAI no está configurada correctamente en el proyecto.

## ✅ Solución en 4 Pasos

### 1. Obtener API Key de OpenAI

1. Ve a https://platform.openai.com/api-keys
2. Inicia sesión (o crea una cuenta si no tienes)
3. Click en "Create new secret key"
4. Dale un nombre (ej: "LexAI-Dev")
5. **COPIA LA KEY INMEDIATAMENTE** (empieza con `sk-proj-...`)

**Importante**: Necesitarás agregar créditos ($5 mínimo) en https://platform.openai.com/account/billing

### 2. Editar el Archivo .env

1. Abre el archivo `.env` en la raíz del proyecto:
   ```
   /Users/manu/CascadeProjects/lexai-costarica/.env
   ```

2. Busca esta línea:
   ```env
   OPENAI_API_KEY="your-openai-api-key-here"
   ```

3. Reemplázala con tu key real:
   ```env
   OPENAI_API_KEY="sk-proj-tu-key-real-aqui"
   ```

4. Guarda el archivo

### 3. Reiniciar el Servidor

En la terminal donde está corriendo el servidor:

1. Presiona `Ctrl + C` para detener el servidor
2. Ejecuta nuevamente:
   ```bash
   npm run dev
   ```

### 4. Probar el Chat

1. Recarga la página en el navegador
2. Intenta hacer una consulta en el chat
3. Deberías recibir una respuesta de la IA

## 🎯 Verificación Rápida

Para verificar que todo está bien configurado, prueba con esta consulta:

```
Hola, ¿estás funcionando correctamente?
```

Si recibes una respuesta coherente, ¡todo está configurado! 🎉

## ⚠️ Problemas Comunes

### "Incorrect API key provided"
- Verifica que copiaste la key completa (sin espacios)
- Asegúrate de que la key no haya sido revocada
- Crea una nueva key si es necesario

### "You exceeded your current quota"
- Tu cuenta no tiene créditos
- Agrega créditos en: https://platform.openai.com/account/billing
- Mínimo recomendado: $5

### "Rate limit exceeded"
- Estás haciendo demasiadas consultas muy rápido
- Espera unos segundos entre consultas
- Considera aumentar tu límite en OpenAI

## 💰 Costos Estimados

- **Consulta típica**: ~$0.02
- **100 consultas**: ~$2
- **Desarrollo (1 mes)**: $20-50

## 📚 Más Información

Para una guía completa, consulta:
- `CONFIGURACION_OPENAI.md` - Guía detallada de configuración
- `QUICKSTART.md` - Guía de inicio rápido
- `README.md` - Documentación completa

## 🆘 ¿Aún Tienes Problemas?

1. Revisa los logs del servidor en la terminal
2. Verifica que el archivo `.env` existe y tiene el formato correcto
3. Asegúrate de haber reiniciado el servidor después de cambiar `.env`
4. Consulta la documentación oficial de OpenAI: https://platform.openai.com/docs

---

**Tip**: Guarda tu API key en un lugar seguro. Nunca la compartas ni la subas a GitHub.
