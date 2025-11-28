import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://bond.giving';
const FROM_EMAIL = 'Bond <noreply@bond.giving>';

type NotificationType = 'connection_request' | 'connection_accepted' | 'evaluation' | 'message' | 'system';

interface EmailNotificationData {
  recipientEmail: string;
  recipientName: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: {
    senderName?: string;
    senderImage?: string;
    actionUrl?: string;
    [key: string]: any;
  };
}

function getNotificationSubject(type: NotificationType, title: string): string {
  const prefix = '[Bond]';
  switch (type) {
    case 'connection_request':
      return `${prefix} 新しい接続リクエストが届きました`;
    case 'connection_accepted':
      return `${prefix} 接続リクエストが承認されました`;
    case 'message':
      return `${prefix} 新しいメッセージが届きました`;
    case 'evaluation':
      return `${prefix} 新しい評価が投稿されました`;
    case 'system':
    default:
      return `${prefix} ${title}`;
  }
}

function getActionUrl(type: NotificationType, data?: EmailNotificationData['data']): string {
  if (data?.actionUrl) return data.actionUrl;

  switch (type) {
    case 'connection_request':
      return `${APP_URL}/connections?tab=pending`;
    case 'connection_accepted':
      return `${APP_URL}/connections`;
    case 'message':
      return `${APP_URL}/messages`;
    case 'evaluation':
      return `${APP_URL}/evaluations`;
    case 'system':
    default:
      return `${APP_URL}/notifications`;
  }
}

function getActionButtonText(type: NotificationType): string {
  switch (type) {
    case 'connection_request':
      return 'リクエストを確認する';
    case 'connection_accepted':
      return '接続を確認する';
    case 'message':
      return 'メッセージを読む';
    case 'evaluation':
      return '評価を確認する';
    case 'system':
    default:
      return '詳細を確認する';
  }
}

function createNotificationEmailHtml(data: EmailNotificationData): string {
  const actionUrl = getActionUrl(data.type, data.data);
  const actionButtonText = getActionButtonText(data.type);

  const typeColors: Record<NotificationType, { bg: string; border: string }> = {
    connection_request: { bg: '#EFF6FF', border: '#3B82F6' },
    connection_accepted: { bg: '#F0FDF4', border: '#22C55E' },
    message: { bg: '#FFF7ED', border: '#F97316' },
    evaluation: { bg: '#FDF4FF', border: '#A855F7' },
    system: { bg: '#F5F5F5', border: '#6B7280' },
  };

  const colors = typeColors[data.type] || typeColors.system;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${data.title}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 30px 40px 20px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                  <img src="${APP_URL}/bond-logo.png" alt="Bond" style="height: 40px; width: auto;" />
                  <h1 style="margin: 15px 0 0; font-size: 20px; font-weight: 600; color: #111827;">Bond</h1>
                </td>
              </tr>

              <!-- Notification Badge -->
              <tr>
                <td style="padding: 30px 40px 0;">
                  <div style="background-color: ${colors.bg}; border-left: 4px solid ${colors.border}; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; font-size: 14px; font-weight: 600; color: ${colors.border};">${data.title}</p>
                  </div>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 25px 40px;">
                  <p style="margin: 0 0 10px; font-size: 16px; color: #374151;">
                    ${data.recipientName}さん
                  </p>
                  <p style="margin: 0; font-size: 16px; line-height: 1.6; color: #4b5563;">
                    ${data.message}
                  </p>
                </td>
              </tr>

              <!-- Action Button -->
              <tr>
                <td style="padding: 10px 40px 30px;">
                  <table role="presentation" style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td align="center">
                        <a href="${actionUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #FF5E9E, #FF8BB8); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 8px;">
                          ${actionButtonText}
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Link fallback -->
              <tr>
                <td style="padding: 0 40px 30px;">
                  <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                    ボタンが機能しない場合は、以下のURLをコピーしてブラウザに貼り付けてください：<br>
                    <a href="${actionUrl}" style="color: #3b82f6; word-break: break-all;">${actionUrl}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 40px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; border-radius: 0 0 12px 12px;">
                  <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; text-align: center;">
                    このメールはBondから自動送信されています。
                  </p>
                  <p style="margin: 0 0 10px; font-size: 12px; color: #6b7280; text-align: center;">
                    メール通知の設定は<a href="${APP_URL}/settings/notifications" style="color: #3b82f6;">こちら</a>から変更できます。
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                    &copy; 2025 Bond. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export async function sendNotificationEmail(data: EmailNotificationData): Promise<boolean> {
  if (!resend) {
    console.warn('RESEND_API_KEY is not set. Skipping notification email.');
    return false;
  }

  try {
    const subject = getNotificationSubject(data.type, data.title);
    const html = createNotificationEmailHtml(data);

    const result = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.recipientEmail],
      subject,
      html,
    });

    console.log(`Notification email sent to ${data.recipientEmail}:`, result);
    return true;
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return false;
  }
}

// Helper to create notification and optionally send email
export async function createNotificationWithEmail(
  Notification: any,
  User: any,
  notificationData: {
    recipient: string;
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
  },
  sendEmail: boolean = true
): Promise<any> {
  // Create the notification in DB
  const notification = await Notification.create(notificationData);

  // Optionally send email
  if (sendEmail) {
    try {
      const user = await User.findById(notificationData.recipient);
      if (user && user.email) {
        // Check if user has email notifications enabled (default: true)
        const emailEnabled = user.emailNotifications?.enabled !== false;
        const typeEnabled = user.emailNotifications?.[notificationData.type] !== false;

        if (emailEnabled && typeEnabled) {
          await sendNotificationEmail({
            recipientEmail: user.email,
            recipientName: user.name,
            type: notificationData.type,
            title: notificationData.title,
            message: notificationData.message,
            data: notificationData.data,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send notification email:', error);
      // Don't throw - notification was still created
    }
  }

  return notification;
}
