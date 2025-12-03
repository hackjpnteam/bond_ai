import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import CredentialsProvider from 'next-auth/providers/credentials';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

// ==========================================
// 環境変数の厳密チェック
// ==========================================
// 正しい形式:
// - GOOGLE_CLIENT_ID: 数字-文字列.apps.googleusercontent.com
// - GOOGLE_CLIENT_SECRET: GOCSPX-文字列
// ==========================================

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

console.log('🔍 NextAuth Environment Check:');
console.log('  GOOGLE_CLIENT_ID:', GOOGLE_CLIENT_ID);
console.log('  GOOGLE_CLIENT_ID length:', GOOGLE_CLIENT_ID.length);
console.log('  GOOGLE_CLIENT_ID starts with GOCSPX?:', GOOGLE_CLIENT_ID.startsWith('GOCSPX-'));
console.log('  GOOGLE_CLIENT_ID ends with .com?:', GOOGLE_CLIENT_ID.endsWith('.com'));
console.log('');
console.log('  GOOGLE_CLIENT_SECRET:', GOOGLE_CLIENT_SECRET ? 'SET (length: ' + GOOGLE_CLIENT_SECRET.length + ')' : 'NOT SET');
console.log('  GOOGLE_CLIENT_SECRET starts with GOCSPX?:', GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-'));
console.log('');
console.log('  NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
console.log('  NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET');
console.log('==========================================');

// 警告: clientId に secret が入っていないかチェック
if (GOOGLE_CLIENT_ID.startsWith('GOCSPX-')) {
  console.error('❌ ERROR: GOOGLE_CLIENT_ID contains a secret! This should be the client ID, not the secret!');
  console.error('   Expected format: 770946554968-xxx.apps.googleusercontent.com');
  console.error('   Got:', GOOGLE_CLIENT_ID);
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: GITHUB_CLIENT_ID,
      clientSecret: GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('メールアドレスとパスワードを入力してください');
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });

        if (!user || !user.password) {
          throw new Error('ユーザーが見つかりません');
        }

        if (!user.verified) {
          throw new Error('メールアドレスが未認証です');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('パスワードが正しくありません');
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image
        };
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      console.log('🔍 [NextAuth signIn] Provider:', account?.provider);
      console.log('🔍 [NextAuth signIn] User:', user.email);

      if (account?.provider === 'google' || account?.provider === 'github') {
        try {
          await connectDB();

          // Check if user exists
          let existingUser = await User.findOne({ email: user.email });

          if (!existingUser) {
            console.log(`⚠️ [NextAuth signIn] User not found, creating new user via ${account.provider}...`);
            // Create new user
            existingUser = await User.create({
              email: user.email,
              name: user.name,
              image: user.image,
              verified: true, // OAuth users are auto-verified
              provider: account.provider,
              providerId: account.providerAccountId
            });
            console.log('✅ [NextAuth signIn] New user created:', existingUser.email);
          } else {
            console.log('✅ [NextAuth signIn] Existing user found:', existingUser.email);
            // Update user with OAuth info if needed
            if (!existingUser.provider) {
              existingUser.provider = account.provider;
              existingUser.providerId = account.providerAccountId;
              existingUser.verified = true;
              await existingUser.save();
              console.log(`✅ [NextAuth signIn] User updated with ${account.provider} info`);
            }
          }

          return true;
        } catch (error) {
          console.error(`❌ [NextAuth signIn] Error during ${account?.provider} sign in:`, error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      console.log('🔍 [NextAuth jwt] Token email:', token.email);
      if (user) {
        token.id = user.id;
        console.log('✅ [NextAuth jwt] User ID added to token:', user.id);
      }
      return token;
    },
    async session({ session, token }) {
      console.log('🔍 [NextAuth session] Creating session for:', token.email);
      if (session.user) {
        session.user.id = token.id as string;
        console.log('✅ [NextAuth session] Session created with user ID:', session.user.id);
      }
      console.log('📦 [NextAuth session] Full session:', JSON.stringify(session, null, 2));
      return session;
    }
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };