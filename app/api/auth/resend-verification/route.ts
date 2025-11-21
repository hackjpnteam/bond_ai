import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ResendRequest {
  email: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ResendRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'メールアドレスが提供されていません' },
        { status: 400 }
      );
    }

    // 実際の実装では、データベースからユーザー情報を取得
    // ここでは簡易的にユーザーが存在すると仮定

    // 新しい認証トークンを生成
    const verificationToken = generateVerificationToken();
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${verificationToken}&email=${encodeURIComponent(email)}`;

    // 認証メールを再送信
    await sendVerificationEmail(email, verificationUrl);

    return NextResponse.json({
      success: true,
      message: '認証メールを再送信しました。メールをご確認ください。'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'メール再送信に失敗しました' },
      { status: 500 }
    );
  }
}

function generateVerificationToken(): string {
  return Math.random().toString(36).substring(2) + '_' + Date.now().toString(36);
}

function createVerificationEmailHtml(email: string, verificationUrl: string, isResend: boolean = false): string {
  const resendText = isResend ? '[再送] ' : '';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${resendText}Bondアカウント認証</title>
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
          background: linear-gradient(135deg, #2563eb, #3b82f6);
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
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .resend-notice {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Bond</div>
        <p>スタートアップエコシステムプラットフォーム</p>
      </div>

      <div class="content">
        ${isResend ? `
        <div class="resend-notice">
          <strong>認証メール再送信</strong><br>
          このメールは認証リンクの再送信です。前回のメールは無効になりました。
        </div>
        ` : ''}

        <h2>メールアドレスの認証</h2>
        
        <p>Bondアカウント（${email}）の認証を完了するために、以下のボタンをクリックしてください。</p>

        <div style="text-align: center;">
          <a href="${verificationUrl}" class="button">
            メールアドレスを認証する
          </a>
        </div>

        <p>ボタンが機能しない場合は、以下のリンクをコピーしてブラウザに貼り付けてください：</p>
        <p style="word-break: break-all; color: #2563eb; font-size: 14px;">
          ${verificationUrl}
        </p>

        <p><strong>重要事項：</strong></p>
        <ul>
          <li>この認証リンクは24時間有効です</li>
          <li>セキュリティのため、このメールを他の人と共有しないでください</li>
          <li>このメールに心当たりがない場合は無視してください</li>
        </ul>
      </div>

      <div class="footer">
        <p>このメールは自動送信されています。返信はできません。</p>
        <p>ご不明な点がございましたら、<a href="mailto:support@bond.ai" style="color: #2563eb;">support@bond.ai</a>までお問い合わせください。</p>
        <p style="margin-top: 20px;">
          © 2025 Bond. All rights reserved.
        </p>
      </div>
    </body>
    </html>
  `;
}

async function sendVerificationEmail(email: string, verificationUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn('RESEND_API_KEY is not set. Skipping verification email.');
    return;
  }
  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: 'Bond <noreply@bond.ai>',
    to: [email],
    subject: '[再送] Bondアカウントの認証をお願いします',
    html: createVerificationEmailHtml(email, verificationUrl, true),
  });
}
