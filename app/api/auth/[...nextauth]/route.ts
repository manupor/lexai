import NextAuth, { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code'
        }
      }
    }),
    
    // Facebook OAuth
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
    }),
    
    // Credentials (email/password tradicional) - Deshabilitado por ahora
    // CredentialsProvider({
    //   name: 'Credentials',
    //   credentials: {
    //     email: { label: 'Email', type: 'email' },
    //     password: { label: 'Password', type: 'password' }
    //   },
    //   async authorize(credentials) {
    //     // Por implementar con base de datos
    //     return null
    //   }
    // })
  ],
  
  callbacks: {
    async signIn({ user, account, profile }) {
      // Por ahora, simplemente permitir el login
      return true
    },
    
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.sub || ''
        session.user.role = 'CLIENT'
        session.user.tokens = 100 // Tokens por defecto
        session.user.subscription = {
          id: '1',
          plan: 'FREE',
          status: 'ACTIVE',
          tokens: 100,
          currentPeriodEnd: null
        }
      }
      return session
    },
    
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    }
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
