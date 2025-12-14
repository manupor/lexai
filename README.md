# LexAI Costa Rica 🇨🇷⚖️

Plataforma de asistencia legal con Inteligencia Artificial especializada en el sistema jurídico de Costa Rica.

## 🌟 Características

- **Chat Legal Inteligente**: Consulta leyes y obtén respuestas precisas con referencias a artículos específicos
- **Análisis de Documentos**: Sube contratos, demandas o cualquier documento legal para análisis detallado
- **Generación de Documentos**: Crea apelaciones y opiniones legales fundamentadas en la legislación vigente
- **Base Legal Completa**: Acceso a todas las leyes de Costa Rica (Civil, Penal, Tránsito, Laboral, etc.)
- **Sistema de Tokens**: Planes flexibles con tokens para acceder a las funcionalidades
- **Para Abogados y Clientes**: Interfaz adaptada para profesionales y usuarios generales

## 🚀 Tecnologías

- **Frontend**: Next.js 15, React 19, TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de Datos**: PostgreSQL
- **IA**: OpenAI GPT-4
- **Autenticación**: NextAuth.js
- **Pagos**: Stripe

## 📋 Requisitos Previos

- Node.js 18+ 
- PostgreSQL
- Cuenta de OpenAI con API key
- (Opcional) Cuenta de Stripe para pagos

## 🛠️ Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd lexai-costarica
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/lexai_costarica"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="genera-un-secret-aleatorio-aqui"

# OpenAI (REQUERIDO)
OPENAI_API_KEY="tu-api-key-de-openai"

# Stripe (opcional, para pagos)
STRIPE_SECRET_KEY="tu-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="tu-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="tu-stripe-webhook-secret"
```

4. **Configurar la base de datos**

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar las migraciones
npx prisma migrate dev --name init

# (Opcional) Poblar la base de datos con leyes de ejemplo
npm run seed
```

5. **Iniciar el servidor de desarrollo**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
lexai-costarica/
├── app/                      # App Router de Next.js
│   ├── api/                 # API Routes
│   │   └── chat/           # Endpoint del chat
│   ├── dashboard/          # Dashboard principal
│   └── page.tsx            # Página de inicio
├── components/              # Componentes React
│   ├── chat/               # Componentes del chat
│   └── ui/                 # Componentes UI (shadcn)
├── lib/                     # Utilidades y configuración
│   ├── prisma.ts           # Cliente de Prisma
│   └── openai.ts           # Cliente de OpenAI
├── prisma/                  # Esquema de base de datos
│   └── schema.prisma       # Modelos de datos
└── public/                  # Archivos estáticos
```

## 🗄️ Esquema de Base de Datos

### Modelos Principales

- **User**: Usuarios (clientes y abogados)
- **Subscription**: Suscripciones y planes
- **Conversation**: Conversaciones de chat
- **Message**: Mensajes individuales
- **Document**: Documentos analizados
- **LegalCode**: Códigos legales de Costa Rica
- **Article**: Artículos de las leyes

## 🔑 Obtener API Key de OpenAI

1. Crea una cuenta en [OpenAI](https://platform.openai.com/)
2. Ve a [API Keys](https://platform.openai.com/api-keys)
3. Crea una nueva API key
4. Copia la key y agrégala a tu archivo `.env`

**Importante**: Necesitarás créditos en tu cuenta de OpenAI para usar la API.

## 💳 Planes y Precios

- **Gratis**: 100 tokens/mes
- **Profesional**: $49/mes - 5,000 tokens
- **Empresa**: $199/mes - 25,000 tokens

## 🚧 Próximas Funcionalidades

- [ ] Sistema de autenticación completo con NextAuth
- [ ] Integración con Stripe para pagos
- [ ] Carga de documentos PDF/DOCX
- [ ] Exportación de análisis y documentos generados
- [ ] Base de datos de leyes costarricenses completa
- [ ] Búsqueda semántica en leyes con embeddings
- [ ] Historial de conversaciones
- [ ] Panel de administración
- [ ] API pública para integraciones

## 📝 Uso

### Chat Legal

1. Accede al dashboard después de iniciar sesión
2. Escribe tu consulta legal en el chat
3. Recibe respuestas fundamentadas con referencias a leyes

### Análisis de Documentos

1. Ve a la sección "Documentos"
2. Sube tu documento legal (PDF, DOCX, TXT)
3. Recibe un análisis detallado con recomendaciones

### Generación de Documentos

1. Solicita en el chat la generación de un documento
2. Especifica el tipo (apelación, opinión, etc.)
3. Proporciona los detalles necesarios
4. Descarga el documento generado

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📧 Contacto

Para preguntas o soporte, contacta a: [tu-email@ejemplo.com]

## ⚠️ Disclaimer Legal

Esta herramienta es un asistente y no reemplaza la consulta con un abogado profesional. Las respuestas generadas deben ser verificadas por un profesional del derecho antes de ser utilizadas en casos reales.
# Last updated: Sat Dec 13 18:21:41 CST 2025
