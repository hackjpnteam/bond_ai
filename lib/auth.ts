import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import EmailProvider from 'next-auth/providers/email'
import clientPromise from './db'
import { getCollection } from './db'
import { UserDoc } from './models'
import MongoDBAdapter from './mongodb-adapter'

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: 'bond-launch'
  }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }),
    EmailProvider({
      server: process.env.EMAIL_SERVER!,
      from: process.env.EMAIL_FROM!
    })
  ],
  callbacks: {
    async session({ session }) {
      if (session?.user?.email) {
        const users = await getCollection<UserDoc>('users')
        const user = await users.findOne({ email: session.user.email })
        if (user) {
          session.user.id = user._id.toString()
          const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
          session.user.isAdmin = adminEmails.includes(session.user.email)
        }
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request'
  },
  session: {
    strategy: 'jwt'
  }
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || []
  return adminEmails.includes(email)
}
