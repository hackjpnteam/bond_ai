import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import UserSession from '@/models/UserSession';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import { getToken } from 'next-auth/jwt';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  company?: string;
  image?: string;
  username?: string;
  createdAt?: string;
}

export async function validateSession(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    await connectDB();

    // Ensure models are registered
    User; // This forces the model to be registered
    UserSession; // This forces the model to be registered
    UserProfile; // This forces the model to be registered

    console.log('🔍 [validateSession] Starting session validation...');

    // 【優先1】NextAuth JWTトークンをチェック
    try {
      console.log('🔍 [validateSession] NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET);
      const token = await getToken({
        req: request as any,
        secret: process.env.NEXTAUTH_SECRET
      });
      console.log('🔍 [validateSession] Token result:', token ? 'found' : 'not found');

      if (token && token.email) {
        console.log('✅ [validateSession] NextAuth token found:', token.email);

        // NextAuthトークンからユーザー情報を取得
        const user = await User.findOne({ email: token.email });

        if (user) {
          console.log('✅ [validateSession] User found in DB:', user.email, 'username:', user.username);

          // UserProfileから画像を取得
          let profileImage = user.image || token.picture;
          if (!profileImage) {
            const userProfile = await UserProfile.findOne({ userId: user._id });
            if (userProfile && userProfile.profileImage) {
              profileImage = userProfile.profileImage;
            }
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || token.name as string,
            username: user.username || user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
            role: user.role || 'other',
            company: user.company,
            image: profileImage,
            createdAt: user.createdAt?.toISOString()
          };
        } else {
          console.log('⚠️ [validateSession] User not found in DB, creating new user...');
          // NextAuth経由のGoogleログインで新規ユーザーを作成
          const newUser = await User.create({
            email: token.email,
            name: token.name,
            image: token.picture,
            verified: true,
            provider: 'google',
            providerId: token.sub
          });

          console.log('✅ [validateSession] New user created:', newUser.email);

          return {
            id: newUser._id.toString(),
            email: newUser.email,
            name: newUser.name,
            username: newUser.username || newUser.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
            role: newUser.role || 'other',
            company: newUser.company,
            image: newUser.image,
            createdAt: newUser.createdAt?.toISOString()
          };
        }
      }
    } catch (error) {
      console.log('ℹ️ [validateSession] No NextAuth token found, checking custom session...');
    }

    // 【優先2】カスタムセッショントークンをチェック
    const authHeader = request.headers.get('authorization');
    let customToken = authHeader?.replace('Bearer ', '');

    if (!customToken) {
      const cookieHeader = request.headers.get('cookie');
      const cookies = cookieHeader?.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      customToken = cookies?.['bond_session_token'];
    }

    if (!customToken) {
      console.log('❌ [validateSession] No session token found (neither NextAuth nor custom)');
      return null;
    }

    console.log('🔍 [validateSession] Checking custom session token...');

    // Find active session
    const session = await UserSession.findOne({
      sessionToken: customToken,
      isActive: true,
      expiresAt: { $gt: new Date() }
    }).populate('userId');

    if (!session || !session.userId) {
      console.log('❌ [validateSession] Custom session not found or expired');
      return null;
    }

    const user = session.userId as any;
    console.log('✅ [validateSession] Custom session found:', user.email);

    // UserProfileから画像を取得
    let profileImage = user.image;
    if (!profileImage) {
      const userProfile = await UserProfile.findOne({ userId: user._id });
      if (userProfile && userProfile.profileImage) {
        profileImage = userProfile.profileImage;
      }
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username || user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
      role: user.role,
      company: user.company,
      image: profileImage,
      createdAt: user.createdAt?.toISOString()
    };

  } catch (error) {
    console.error('❌ [validateSession] Session validation error:', error);
    return null;
  }
}

export function requireAuth(
  handler: (request: NextRequest, user: AuthenticatedUser, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any) => {
    const user = await validateSession(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ error: '認証が必要です' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    return handler(request, user, context);
  };
}
