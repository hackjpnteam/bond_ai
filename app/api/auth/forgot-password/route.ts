import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ForgotPasswordRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '有効なメールアドレスを入力してください' },
        { status: 400 }
      );
    }

    // 実際の実装では、データベースでユーザーの存在確認
    // ここでは簡易的にテストユーザーをチェック
    const testUsers = ['test@bond.ai', 'tanaka@example.com'];
    const userExists = testUsers.includes(email.toLowerCase());

    // セキュリティ上、ユーザーが存在しない場合でも成功レスポンスを返す
    // （アカウント列挙攻撃を防ぐため）

    // パスワードリセットトークンを生成
    const resetToken = generateResetToken();
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    if (userExists) {
      await sendPasswordResetEmail(email, resetUrl);
      console.log(`Password reset token for ${email}: ${resetToken}`);
    }

    // 常に成功レスポンスを返す
    return NextResponse.json({
      success: true,
      message: 'パスワードリセット用のメールを送信しました。メールをご確認ください。'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'メール送信中にエラーが発生しました' },
      { status: 500 }
    );
  }
}

function generateResetToken(): string {
  return 'reset_' + Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
}

function createPasswordResetEmailHtml(email: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bondパスワードリセット</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .content {
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .button:hover {
          background: linear-gradient(135deg, #b91c1c, #dc2626);
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
        .security-info {
          background: #f3f4f6;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Bond</div>
        <p>スタートアップエコシステムプラットフォーム</p>
      </div>

      <div class="content">
        <h2>パスワードリセットのご案内</h2>
        
        <p>こんにちは、</p>
        
        <p>Bondアカウント（${email}）のパスワードリセットが要求されました。</p>

        <div class="warning">
          <strong>セキュリティ通知</strong><br>
          もしこのリクエストに心当たりがない場合は、このメールを無視してください。第三者があなたのメールアドレスでパスワードリセットを試行した可能性があります。
        </div>

        <p>パスワードをリセットするには、以下のボタンをクリックしてください：</p>

        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">
            パスワードをリセット
          </a>
        </div>

        <p>ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 14px;">
          ${resetUrl}
        </p>

        <div class="security-info">
          <p><strong>セキュリティのために：</strong></p>
          <ul>
            <li>このリンクは24時間で有効期限が切れます</li>
            <li>リンクは一度のみ使用可能です</li>
            <li>パスワードは他人と共有しないでください</li>
            <li>定期的にパスワードを変更することをお勧めします</li>
          </ul>
        </div>

        <p><strong>このメールに心当たりがない場合</strong></p>
        <p>パスワードリセットを要求していない場合は、アカウントの安全性を確保するため、すぐにサポートまでご連絡ください。</p>
      </div>

      <div class="footer">
        <p>このメールは自動送信されています。返信はできません。</p>
        <p>ご不明な点がございましたら、<a href="mailto:support@bond.ai" style="color: #2563eb;">support@bond.ai</a>までお問い合わせください。</p>
        <p style="margin-top: 20px;">
          © 2025 Bond. All rights reserved.<br>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color: #6b7280;">プライバシーポリシー</a> | 
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/terms" style="color: #6b7280;">利用規約</a>
        </p>
      </div>
    </body>
    </html>
  `;
}

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping password reset email.');
    return;
  }

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'Bond <noreply@bond.ai>',
    to: [email],
    subject: 'Bondパスワードリセットのご案内',
    html: createPasswordResetEmailHtml(email, resetUrl),
  });
}
