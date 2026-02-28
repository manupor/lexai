import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // Credentials (email/password)
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email y contraseña requeridos')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          throw new Error('Usuario no encontrado o contraseña incorrecta')
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)

        if (!isValid) {
          throw new Error('Contraseña incorrecta')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          tokens: user.tokens,
          organizationId: user.organizationId
        }
      }
    })
  ],

  // Cookies managed automatically by NextAuth (defaults are secure in production)

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn Request:', { email: user.email, provider: account?.provider })
      return true
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = (token.role as any) || 'CLIENT'
        session.user.tokens = (token.tokens as number) || 0
        session.user.organizationId = (token.organizationId as string) || null
      }
      return session
    },

    async jwt({ token, user, trigger, session }) {
      // Al iniciar sesión, el objeto 'user' está disponible
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tokens = user.tokens
        token.organizationId = (user as any).organizationId
      } else if (token.email) {
        // Si no hay user (es una recarga), pero hay email, buscamos datos frescos si faltan
        if (!token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email },
            select: { id: true, role: true, tokens: true, organizationId: true }
          })
          if (dbUser) {
            token.id = dbUser.id
            token.role = dbUser.role
            token.tokens = dbUser.tokens
            token.organizationId = dbUser.organizationId
          }
        }
      }

      // Manejar actualizaciones manuales de sesión (ej. tras onboarding)
      if (trigger === 'update' && session?.user) {
        return { ...token, ...session.user }
      }

      return token
    },
  },

  events: {
    async signIn({ user, account, profile, isNewUser }) {
      console.log('✨ SignIn Event:', { email: user.email, isNewUser })
    },
    async createUser({ user }) {
      console.log('👤 Nuevo usuario creado en DB:', user.email)
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
