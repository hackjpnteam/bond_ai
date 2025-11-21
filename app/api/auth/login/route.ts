import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import UserSession from '@/models/UserSession';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: LoginRequest = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'メールアドレスとパスワードを入力してください' },
        { status: 400 }
      );
    }

    // MongoDBからユーザーを検索
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが間違っています' },
        { status: 401 }
      );
    }

    // パスワード検証
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'メールアドレスまたはパスワードが間違っています' },
        { status: 401 }
      );
    }

    // アカウント認証チェック
    if (!user.verified) {
      return NextResponse.json(
        { error: 'アカウントが認証されていません' },
        { status: 401 }
      );
    }

    // 既存のセッションを無効化
    await UserSession.updateMany(
      { userId: user._id, isActive: true },
      { isActive: false }
    );

    // 新しいセッションを作成
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24時間後

    const session = new UserSession({
      userId: user._id,
      sessionToken,
      expiresAt,
      isActive: true
    });

    await session.save();

    // レスポンス作成
    const response = NextResponse.json({
      success: true,
      message: 'ログインに成功しました',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        company: user.company
      },
      sessionToken,
      expiresAt: expiresAt.toISOString()
    });

    // セッショントークンをHTTPOnlyCookieに設定
    response.cookies.set('bond_session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'ログイン処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function generateSessionToken(): string {
  return 'session_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
}

function generateUserId(email: string): string {
  // 簡易的なユーザーID生成（実際の実装では適切なUUIDなど）
  return 'user_' + Buffer.from(email).toString('base64').replace(/[+=\/]/g, '').substring(0, 8);
}