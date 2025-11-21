import { NextRequest, NextResponse } from 'next/server';

interface VerifyResetTokenRequest {
  token: string;
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyResetTokenRequest = await request.json();
    const { token, email } = body;

    if (!token || !email) {
      return NextResponse.json(
        { error: 'トークンとメールアドレスが必要です' },
        { status: 400 }
      );
    }

    // トークンの形式チェック
    if (!token.startsWith('reset_')) {
      return NextResponse.json(
        { error: '無効なトークン形式です' },
        { status: 400 }
      );
    }

    // 実際の実装では、データベースでトークンの有効性をチェック
    // ここでは簡易的にテストユーザーとトークンの基本チェック
    const testUsers = ['test@bond.ai', 'tanaka@example.com'];
    const userExists = testUsers.includes(email.toLowerCase());

    if (!userExists) {
      return NextResponse.json(
        { error: 'ユーザーが見つかりません' },
        { status: 404 }
      );
    }

    // トークンの有効期限チェック（24時間）
    const tokenParts = token.split('_');
    if (tokenParts.length < 3) {
      return NextResponse.json(
        { error: 'トークンの形式が正しくありません' },
        { status: 400 }
      );
    }

    const tokenTimestamp = parseInt(tokenParts[tokenParts.length - 1], 36);
    const currentTime = Date.now();
    const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

    if (currentTime - tokenTimestamp > twentyFourHoursInMs) {
      return NextResponse.json(
        { error: 'リセットトークンの有効期限が切れています' },
        { status: 400 }
      );
    }

    // 実際の実装では、トークンが使用済みかどうかもチェック
    // ここでは簡易的に有効とする

    return NextResponse.json({
      success: true,
      message: 'トークンが有効です'
    });

  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: 'トークン検証中にエラーが発生しました' },
      { status: 500 }
    );
  }
}