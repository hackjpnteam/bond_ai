import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: string;
  company?: string;
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body: SignupData = await request.json();
    const { name, email, password, role, company } = body;

    // バリデーション
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: '必須項目を入力してください' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'パスワードは6文字以上で入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの重複チェック
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    // ユーザーをMongoDBに保存
    const user = new User({
      name,
      email: email.toLowerCase(),
      password, // モデルで自動的にハッシュ化される
      role,
      company,
      verified: true // デモ用に自動認証
    });

    await user.save();

    // レスポンス用のユーザーデータ（パスワードを除外）
    const userResponse = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      company: user.company,
      verified: user.verified,
      createdAt: user.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'アカウントが作成されました。',
      user: userResponse
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: errors.join(', ') },
        { status: 400 }
      );
    }

    // MongoDB duplicate key error
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'アカウント作成に失敗しました' },
      { status: 500 }
    );
  }
}

