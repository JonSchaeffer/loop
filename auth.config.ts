import type { NextAuthConfig } from 'next-auth'

// Extend the built-in session type to include user.id
declare module 'next-auth' {
  interface Session {
    user: { id: string } & import('next-auth').DefaultSession['user']
  }
}

// Edge-safe config: no bcrypt, no Prisma — used by middleware and spread into the full config
export const authConfig = {
  pages: { signIn: '/login' },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isAuthPage = nextUrl.pathname.startsWith('/login')

      if (!isLoggedIn && !isAuthPage) return false // redirects to signIn page
      if (isLoggedIn && isAuthPage) return Response.redirect(new URL('/today', nextUrl))
      return true
    },
    jwt({ token, user }) {
      if (user?.id) token.id = user.id
      return token
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string
      return session
    },
  },
  providers: [], // filled in by lib/auth.ts
} satisfies NextAuthConfig
