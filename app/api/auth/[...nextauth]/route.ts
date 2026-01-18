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
          tokens: user.tokens
        }
      }
    })
  ],

  // Forzar cookies seguras en producción para evitar problemas de SameSite/Secure
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('SignIn Request:', { userId: user.id, provider: account?.provider })
      return true
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string
        session.user.role = (token.role as any) || 'CLIENT'
        session.user.tokens = (token.tokens as number) || 0
      }
      return session
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.tokens = user.tokens
      }

      // Manejar actualizaciones manuales de sesión si es necesario
      if (trigger === 'update' && session) {
        return { ...token, ...session.user }
      }

      return token
    },
  },

  events: {
    async createUser({ user }) {
      // Crear plan FREE para nuevos usuarios (incluyendo OAuth)
      try {
        await prisma.subscription.upsert({
          where: { userId: user.id },
          update: {},
          create: {
            userId: user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            tokens: 100,
          }
        })

        await prisma.user.update({
          where: { id: user.id },
          data: { tokens: 100 }
        })
      } catch (error) {
        console.error('Error in createUser event:', error)
      }
    }
  },

  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/register'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },

  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
