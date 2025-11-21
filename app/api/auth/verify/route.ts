import { NextRequest, NextResponse } from 'next/server';

interface VerifyRequest {
  token: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyRequest = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: 'トークンまたはメールアドレスが提供されていません' },
        { status: 400 }
      );
    }

    // 実際の実装では、データベースからユーザー情報とトークンを検証
    // ここでは簡易的な検証を行う
    
    // トークンの有効期限チェック（24時間）
    const tokenParts = token.split('_');
    if (tokenParts.length < 2) {
      return NextResponse.json(
        { error: '無効なトークンです' },
        { status: 400 }
      );
    }

    // トークン生成時刻を取得（簡易実装）
    const tokenTimestamp = parseInt(tokenParts[1]);
    const currentTime = Date.now();
    const expirationTime = 24 * 60 * 60 * 1000; // 24時間

    if (currentTime - tokenTimestamp > expirationTime) {
      return NextResponse.json(
        { error: 'expired' },
        { status: 400 }
      );
    }

    // 実際の実装では、ユーザーのverified状態をtrueに更新
    // ここでは認証成功として処理

    // ユーザーセッションを作成（実際の実装ではJWTトークンなどを使用）
    const userSession = {
      email,
      verified: true,
      verifiedAt: new Date().toISOString()
    };

    // 認証成功レスポンス
    return NextResponse.json({
      success: true,
      message: 'メールアドレスが正常に認証されました！Bondへようこそ！',
      user: {
        email,
        verified: true
      }
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: '認証処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}