# Transcripción de Voz a Texto - LexAI Costa Rica

## 🎤 Funcionalidad Implementada

LexAI ahora incluye **transcripción de voz a texto** en tiempo real, permitiendo hacer consultas legales hablando en lugar de escribir.

## ✨ Características

### 1. Reconocimiento de Voz en Tiempo Real
- Transcripción instantánea mientras hablas
- Soporte para español de Costa Rica (es-CR)
- Funciona completamente en el navegador (gratis)
- No requiere API externa

### 2. Integración Completa
- ✅ Chat principal
- ✅ Chat de documentos
- ✅ Botón de micrófono visible
- ✅ Indicador visual cuando está grabando

### 3. Tecnología
- **Web Speech API**: API nativa del navegador
- **Gratuita**: No consume tokens ni créditos
- **Privada**: El audio no sale del navegador
- **Rápida**: Transcripción instantánea

## 🎯 Cómo Usar

### En el Chat Principal

**1. Localiza el botón de micrófono**
- Está a la izquierda del campo de texto
- Icono: 🎤

**2. Haz clic en el botón**
- El botón se pone rojo y pulsa
- Indica que está grabando

**3. Habla tu consulta**
```
"¿Cuáles son los requisitos para un divorcio en Costa Rica?"
"Explícame el artículo cuarenta y cinco del Código de Trabajo"
"¿Qué dice la ley sobre accidentes de tránsito?"
```

**4. El texto aparece automáticamente**
- Se transcribe mientras hablas
- Se agrega al campo de texto
- Puedes editarlo antes de enviar

**5. Detén la grabación**
- Haz clic nuevamente en el botón
- O simplemente envía el mensaje

### En Análisis de Documentos

**Mismo proceso:**
1. Analiza un documento
2. Haz clic en el botón de micrófono
3. Habla tu pregunta sobre el documento
4. Envía o edita antes de enviar

## 🌐 Navegadores Compatibles

### ✅ Totalmente Compatible
- **Google Chrome** (Desktop y Android)
- **Microsoft Edge** (Desktop)
- **Safari** (macOS 14.1+, iOS 14.5+)
- **Opera** (Desktop)

### ⚠️ Compatibilidad Limitada
- **Firefox**: Requiere configuración manual
- **Brave**: Funciona pero puede requerir permisos

### ❌ No Compatible
- Internet Explorer
- Navegadores muy antiguos

## 🔒 Privacidad y Permisos

### Primera Vez
Cuando uses la función por primera vez:
1. El navegador pedirá permiso para accesar el micrófono
2. Haz clic en "Permitir"
3. El permiso se guarda para futuras visitas

### Seguridad
- ✅ El audio NO se envía a servidores externos
- ✅ La transcripción ocurre en tu navegador
- ✅ Solo el texto transcrito se envía a la IA
- ✅ Puedes revocar permisos en cualquier momento

### Revocar Permisos
**Chrome/Edge:**
1. Haz clic en el candado 🔒 en la barra de direcciones
2. Busca "Micrófono"
3. Cambia a "Bloquear"

**Safari:**
1. Safari > Configuración > Sitios web
2. Micrófono
3. Cambia permisos para localhost

## 💡 Consejos para Mejor Transcripción

### 1. Ambiente
- 🔇 Lugar tranquilo sin ruido de fondo
- 🎤 Habla cerca del micrófono
- 🔊 Volumen moderado (ni muy bajo ni muy alto)

### 2. Forma de Hablar
- 🗣️ Habla claramente y a velocidad normal
- ⏸️ Haz pausas breves entre frases
- 📝 Dicta puntuación si es necesario ("punto", "coma")

### 3. Términos Legales
Para términos legales complejos:
- Habla despacio y claro
- Puedes deletrear si es necesario
- Edita el texto antes de enviar si hay errores

### 4. Números
- "Artículo cuarenta y cinco" → "Artículo 45"
- "Ley siete mil cuatrocientos setenta y seis" → "Ley 7476"
- Puedes decir los números en palabras o dígitos

## 🎨 Interfaz Visual

### Estados del Botón

**🎤 Inactivo (Gris)**
- Listo para grabar
- Haz clic para empezar

**🔴 Grabando (Rojo pulsante)**
- Está transcribiendo tu voz
- Habla tu consulta
- Haz clic para detener

**⚫ Deshabilitado**
- Mientras se procesa una respuesta
- No se puede usar temporalmente

### Placeholder del Input
- **Antes**: "Escribe tu consulta legal..."
- **Ahora**: "Escribe o habla tu consulta legal..."

## 📊 Ejemplos de Uso

### Ejemplo 1: Consulta Simple
```
🎤 Usuario habla: "Qué dice la ley sobre pensión alimentaria"
📝 Transcripción: "Qué dice la ley sobre pensión alimentaria"
✏️ Usuario edita: "¿Qué dice la ley sobre pensión alimentaria?"
📤 Envía
```

### Ejemplo 2: Consulta Compleja
```
🎤 Usuario habla: "Necesito saber cuáles son los requisitos para 
                   constituir una sociedad anónima en Costa Rica 
                   según el Código de Comercio"
📝 Transcripción: "Necesito saber cuáles son los requisitos para 
                   constituir una sociedad anónima en Costa Rica 
                   según el Código de Comercio"
📤 Envía directamente
```

### Ejemplo 3: Pregunta sobre Documento
```
📄 Documento analizado: contrato-arrendamiento.txt
🎤 Usuario habla: "Este contrato cumple con la ley de arrendamientos"
📝 Transcripción: "Este contrato cumple con la ley de arrendamientos"
✏️ Usuario edita: "¿Este contrato cumple con la ley de arrendamientos?"
📤 Envía
```

## 🔧 Solución de Problemas

### Problema: El botón no aparece
**Causa**: Navegador no compatible
**Solución**: Usa Chrome, Edge o Safari actualizado

### Problema: No transcribe nada
**Causas posibles**:
1. Permisos de micrófono denegados
2. Micrófono no conectado
3. Micrófono usado por otra aplicación

**Soluciones**:
1. Verifica permisos en el navegador
2. Conecta un micrófono
3. Cierra otras apps que usen el micrófono

### Problema: Transcripción incorrecta
**Causas**:
- Ruido de fondo
- Hablar muy rápido
- Términos muy técnicos

**Soluciones**:
- Busca lugar más tranquilo
- Habla más despacio
- Edita el texto antes de enviar

### Problema: Se detiene solo
**Causa**: Silencio prolongado
**Solución**: Continúa hablando o vuelve a activar

## 🚀 Ventajas

### Para Usuarios
- ✅ **Más rápido**: Hablar es más rápido que escribir
- ✅ **Más cómodo**: Ideal para consultas largas
- ✅ **Manos libres**: Puedes hacer otras cosas
- ✅ **Accesibilidad**: Ayuda a personas con dificultades para escribir

### Para Abogados
- ✅ **Eficiencia**: Dicta consultas mientras revisas documentos
- ✅ **Multitarea**: Habla mientras haces otras cosas
- ✅ **Natural**: Como hablar con un colega

### Para Clientes
- ✅ **Fácil de usar**: No necesita habilidades técnicas
- ✅ **Natural**: Explica tu caso como lo harías en persona
- ✅ **Cómodo**: No te preocupes por ortografía

## 💰 Costos

- **Transcripción de voz**: GRATIS (navegador)
- **Respuesta de IA**: ~$0.001-0.003 (igual que siempre)
- **Total**: Sin costo adicional

## 🔮 Mejoras Futuras

### Fase 2 (Próximamente)
- [ ] Soporte para Whisper API de OpenAI (mayor precisión)
- [ ] Transcripción de archivos de audio
- [ ] Detección automática de idioma
- [ ] Comandos de voz ("enviar", "borrar", etc.)

### Fase 3
- [ ] Respuestas por voz (text-to-speech)
- [ ] Conversación completamente por voz
- [ ] Grabación de consultas para historial
- [ ] Transcripción de audiencias o reuniones

## 📱 Uso en Móviles

### Android (Chrome)
- ✅ Funciona perfectamente
- Usa el micrófono del teléfono
- Puede usar teclado de voz del sistema

### iOS (Safari)
- ✅ Funciona en iOS 14.5+
- Requiere iOS actualizado
- Pide permisos la primera vez

### Consejos Móviles
- Asegúrate de tener buena conexión
- Usa auriculares con micrófono para mejor calidad
- Habla cerca del micrófono

## ✅ Resumen

**Características principales:**
- 🎤 Transcripción de voz en tiempo real
- 🆓 Completamente gratis
- 🔒 Privado y seguro
- ⚡ Rápido e instantáneo
- 🌐 Funciona en navegadores modernos
- 🇨🇷 Optimizado para español de Costa Rica

**Dónde está disponible:**
- ✅ Chat principal
- ✅ Chat de documentos

**Cómo activar:**
- Haz clic en el botón 🎤
- Habla tu consulta
- Envía o edita

¡Ahora puedes hacer tus consultas legales hablando! 🎤⚖️🇨🇷
