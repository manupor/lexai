# Conversación por Voz - LexAI Costa Rica

## 🎙️ Modo Conversación Completa por Voz

LexAI ahora incluye un **modo de conversación por voz completo**: hablas tu consulta y la IA te responde hablando, como una conversación real con un abogado.

## ✨ Características

### Conversación Natural
- 🎤 **Hablas** tu consulta legal
- 🤖 **IA escucha** y procesa
- 🔊 **IA responde** con voz natural
- 🔄 **Continúas** la conversación

### Tecnología
- **Whisper API**: Transcripción de voz a texto (OpenAI)
- **GPT-4**: Análisis jurídico profesional
- **TTS (Text-to-Speech)**: Respuestas por voz (OpenAI)
- **Voz Nova**: Voz femenina natural en español

## 🎯 Cómo Usar

### Activar Modo de Voz

**1. Ve al Chat**
- Dashboard → Pestaña "Chat"

**2. Activa el modo de voz**
- Busca el botón 🔊 (al lado del micrófono)
- Haz clic para activar
- Se pone verde cuando está activo
- Verás: "🎤 Modo conversación por voz activado"

**3. Haz tu consulta por voz**
- Haz clic en el botón de micrófono 🎤
- Habla tu consulta (10-30 segundos)
- Haz clic de nuevo para detener
- Espera 1-2 segundos mientras transcribe

**4. Envía la consulta**
- Revisa el texto transcrito
- Haz clic en Enviar ➤

**5. Escucha la respuesta**
- La IA procesará tu consulta
- Generará la respuesta escrita
- Automáticamente la leerá en voz alta
- Escucha la respuesta completa

**6. Continúa la conversación**
- Cuando termine de hablar
- Haz otra pregunta por voz
- Repite el proceso

### Desactivar Modo de Voz

- Haz clic en el botón 🔊 de nuevo
- Se desactiva (vuelve a gris)
- Las respuestas serán solo texto

## 🎨 Interfaz

### Botones

**🎤 Micrófono (Gris/Rojo)**
- Gris: Listo para grabar
- Rojo pulsante: Grabando
- Loader: Transcribiendo

**🔊 Modo Voz (Gris/Verde)**
- Gris: Respuestas solo texto
- Verde: Respuestas por voz
- Tooltip explicativo

**➤ Enviar**
- Envía tu consulta
- Se deshabilita mientras habla la IA

### Indicadores

**Texto verde debajo del input:**
```
🎤 Modo conversación por voz activado - La IA responderá hablando
```

**Placeholder del input:**
- Modo normal: "Escribe o habla tu consulta legal..."
- Modo voz: "Modo conversación por voz activado..."

**Estados:**
- 🎤 Grabando tu voz
- ⏳ Transcribiendo
- 💬 Procesando respuesta
- 🔊 IA hablando
- ✅ Listo para siguiente pregunta

## 💡 Ejemplo de Conversación

### Conversación Completa

**Usuario:**
```
🎤 [Habla] "Hola, necesito saber cuáles son los requisitos 
              para un divorcio en Costa Rica"
```

**Sistema:**
```
⏳ Transcribiendo...
📝 "Hola, necesito saber cuáles son los requisitos para 
    un divorcio en Costa Rica"
💬 Procesando...
```

**IA (por voz):**
```
🔊 [Habla] "Buenos días. Con gusto le explico los requisitos 
            para el divorcio en Costa Rica según el Código de 
            Familia. Existen dos modalidades principales..."
            
📝 [Muestra el texto completo en pantalla también]
```

**Usuario continúa:**
```
🎤 [Habla] "¿Y cuánto tiempo tarda el proceso?"
```

**IA responde:**
```
🔊 [Habla] "El tiempo del proceso depende de la modalidad. 
            El divorcio por mutuo consentimiento notarial 
            tarda entre uno y dos meses..."
```

## 🎧 Voces Disponibles

### Voz Actual: Nova
- **Tipo**: Femenina
- **Idioma**: Español
- **Estilo**: Natural, profesional
- **Velocidad**: Normal (1.0x)

### Características de la Voz
- ✅ Pronunciación clara
- ✅ Entonación natural
- ✅ Términos legales correctos
- ✅ Pausas apropiadas

## 💰 Costos

### Por Consulta Completa

**1. Transcripción (Whisper)**
- ~$0.006 por minuto de audio
- Ejemplo: 20 segundos = ~$0.002

**2. Análisis (GPT-4o-mini)**
- ~$0.001-0.003 por respuesta
- Depende de la complejidad

**3. Respuesta por Voz (TTS)**
- ~$0.015 por 1000 caracteres
- Respuesta típica (500 chars) = ~$0.008

**Total por conversación:**
- ~$0.011-0.013 por pregunta/respuesta
- Aproximadamente 1 centavo por intercambio

**Ejemplo de uso:**
- 10 preguntas/respuestas = ~$0.12
- 50 consultas al mes = ~$0.60
- Muy económico para el valor que proporciona

## 🔧 Configuración

### Ajustes Disponibles

**Velocidad de Voz** (futuro)
- Lenta: 0.75x
- Normal: 1.0x (actual)
- Rápida: 1.25x

**Voces Alternativas** (futuro)
- Nova (femenina) - actual
- Alloy (neutral)
- Onyx (masculina)

## 💡 Consejos de Uso

### Para Mejor Experiencia

**1. Ambiente**
- Lugar tranquilo para grabar
- Sin ruido de fondo
- Buenos altavoces o audífonos

**2. Forma de Hablar**
- Habla claramente
- Velocidad normal
- Pausas entre frases

**3. Consultas**
- Preguntas concisas (15-30 segundos)
- Una pregunta a la vez
- Espera la respuesta completa

**4. Escucha Activa**
- Presta atención a la respuesta
- Puedes leer el texto mientras escuchas
- Toma notas si es necesario

## 🎯 Casos de Uso

### Para Abogados

**Consulta Rápida:**
```
🎤 "¿Qué dice el artículo 45 del Código de Trabajo?"
🔊 [IA explica el artículo]
```

**Análisis de Caso:**
```
🎤 "Tengo un cliente que fue despedido sin justa causa, 
     ¿qué derechos tiene?"
🔊 [IA analiza la situación]
```

**Investigación:**
```
🎤 "¿Cuál es la jurisprudencia reciente sobre pensiones 
     alimentarias?"
🔊 [IA proporciona información]
```

### Para Clientes

**Consulta General:**
```
🎤 "¿Cómo puedo hacer un testamento en Costa Rica?"
🔊 [IA explica el proceso]
```

**Duda Específica:**
```
🎤 "¿Tengo que pagar pensión si mi hijo ya tiene 18 años?"
🔊 [IA responde con base legal]
```

### Para Estudiantes

**Estudio:**
```
🎤 "Explícame la diferencia entre dolo y culpa en derecho penal"
🔊 [IA explica didácticamente]
```

**Preparación de Examen:**
```
🎤 "¿Cuáles son los elementos del contrato según el Código Civil?"
🔊 [IA enumera y explica]
```

## 🔒 Privacidad

### Datos de Audio

**Tu voz:**
- Se envía a OpenAI para transcripción
- No se almacena permanentemente
- Se elimina después de transcribir

**Respuestas:**
- Se generan en tiempo real
- No se almacenan los archivos de audio
- Solo el texto queda en el historial

### Seguridad
- ✅ Conexión HTTPS encriptada
- ✅ API de OpenAI certificada
- ✅ No se comparten con terceros
- ✅ Cumple con políticas de privacidad

## 🚀 Ventajas

### Vs. Chat Escrito

**Más Natural:**
- ✅ Como hablar con un abogado real
- ✅ No necesitas escribir
- ✅ Multitarea (escucha mientras haces otras cosas)

**Más Rápido:**
- ✅ Hablar es más rápido que escribir
- ✅ Escuchar es más rápido que leer
- ✅ Conversación fluida

**Más Accesible:**
- ✅ Para personas con dificultades para escribir
- ✅ Para personas con problemas de visión
- ✅ Para quienes prefieren comunicación oral

**Más Profesional:**
- ✅ Simula consulta presencial
- ✅ Voz profesional y clara
- ✅ Experiencia premium

## 🔧 Solución de Problemas

### No se escucha la respuesta

**Causas:**
1. Modo de voz desactivado
2. Volumen del sistema bajo
3. Audio bloqueado por navegador

**Soluciones:**
1. Verifica que el botón 🔊 esté verde
2. Sube el volumen
3. Permite reproducción de audio en el navegador

### La voz se corta

**Causas:**
- Conexión lenta
- Respuesta muy larga

**Soluciones:**
- Verifica tu conexión a internet
- Haz preguntas más específicas

### No transcribe bien

**Causas:**
- Ruido de fondo
- Micrófono de baja calidad
- Hablar muy rápido

**Soluciones:**
- Busca lugar más tranquilo
- Usa micrófono externo
- Habla más despacio

## 📱 Compatibilidad

### Desktop
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge

### Móvil
- ✅ Chrome (Android)
- ✅ Safari (iOS)
- ⚠️ Requiere audífonos para mejor experiencia

## 🔮 Mejoras Futuras

### Fase 2
- [ ] Selección de voz (masculina/femenina/neutral)
- [ ] Control de velocidad de lectura
- [ ] Pausar/reanudar respuesta
- [ ] Saltar a siguiente respuesta

### Fase 3
- [ ] Conversación continua automática
- [ ] Detección de "siguiente pregunta"
- [ ] Resumen de conversación por voz
- [ ] Exportar conversación como audio

### Fase 4
- [ ] Múltiples idiomas
- [ ] Voces personalizadas
- [ ] Emociones en la voz
- [ ] Conversación grupal

## ✅ Resumen

**Modo Conversación por Voz:**
- 🎤 Hablas tu consulta
- 🤖 IA procesa y analiza
- 🔊 IA responde hablando
- 🔄 Conversación natural

**Activación:**
- Botón 🔊 en el chat
- Verde = activado
- Gris = desactivado

**Costo:**
- ~$0.01 por pregunta/respuesta
- Muy económico

**Beneficios:**
- Natural y profesional
- Rápido y eficiente
- Accesible para todos
- Experiencia premium

¡Ahora puedes conversar con LexAI como si hablaras con un abogado experto en persona! 🎤🔊⚖️🇨🇷
