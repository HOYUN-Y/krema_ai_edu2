import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ profile }) {
      const allowed = (process.env.ALLOWED_HOSTED_DOMAINS || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!allowed.length) return true
      const email = profile?.email || ''
      const domain = email.split('@')[1]
      return allowed.includes(domain)
    },
  },
  pages: { signIn: '/login' },
})
