import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Message from '@/models/Message';

const BOND_ADMIN_EMAIL = 'tomura@hackjpn.com';

const WELCOME_MESSAGE_CONTENT = `この度はご登録ありがとうございます。これを機にどうかよろしくお願いします。

AI時代が本格的に始まり、タイムラインは"AIがつくった広告"であふれ返るようになりました。

資本が広告を支配し、アルゴリズムが人の注意を奪い合う世界。
そんな時代だからこそ、私たちはあえて逆張りをします。

「人と人の信頼こそが、商売を強く、美しくする。」

Bondは、その原点を取り戻すために生まれました。

Bondは、あなたの信頼の歴史を読み解き、未来の信用力を予測する"与信評価AIエージェント"です。

従来の数字だけでは測れない「人間の価値」を、静かに可視化し、
恩送りが自然に生まれる世界を共に作りましょう。

戸村光
Bond支配人`;

// Admin check function
async function checkAdmin(request: NextRequest): Promise<boolean> {
  // Check session for admin
  const sessionCookie = request.cookies.get('session')?.value;
  if (!sessionCookie) return false;

  try {
    const session = JSON.parse(sessionCookie);
    if (session?.user?.email === BOND_ADMIN_EMAIL) {
      return true;
    }
  } catch {
    // Continue to other checks
  }

  // Check for admin header (for API calls)
  const adminKey = request.headers.get('x-admin-key');
  if (adminKey === process.env.ADMIN_SECRET_KEY) {
    return true;
  }

  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Admin check
    const isAdmin = await checkAdmin(request);
    if (!isAdmin) {
      return NextResponse.json(
        { error: '管理者権限が必要です' },
        { status: 403 }
      );
    }

    await connectDB();

    // Find Bond admin user
    const bondAdmin = await User.findOne({ email: BOND_ADMIN_EMAIL });
    if (!bondAdmin) {
      return NextResponse.json(
        { error: 'Bond管理者が見つかりません' },
        { status: 404 }
      );
    }

    // Get all users except the admin
    const users = await User.find({
      email: { $ne: BOND_ADMIN_EMAIL }
    }).lean();

    // Get existing welcome messages from admin
    const existingMessages = await Message.find({
      sender: bondAdmin._id,
      subject: 'ご挨拶'
    }).lean();

    const existingRecipientIds = new Set(
      existingMessages.map(m => m.recipient.toString())
    );

    // Filter users who haven't received the welcome message
    const usersToMessage = users.filter(
      user => !existingRecipientIds.has(user._id.toString())
    );

    // Send welcome message to each user
    let sentCount = 0;
    let skippedCount = 0;

    for (const user of usersToMessage) {
      try {
        const welcomeMessage = new Message({
          sender: bondAdmin._id,
          recipient: user._id,
          subject: 'ご挨拶',
          content: WELCOME_MESSAGE_CONTENT,
          read: false
        });
        await welcomeMessage.save();
        sentCount++;
        console.log(`Sent welcome message to: ${user.email}`);
      } catch (err) {
        console.error(`Failed to send message to ${user.email}:`, err);
        skippedCount++;
      }
    }

    const alreadyHadMessage = existingRecipientIds.size;

    return NextResponse.json({
      success: true,
      message: `ウェルカムメッセージを送信しました`,
      stats: {
        totalUsers: users.length,
        sentCount,
        skippedCount,
        alreadyHadMessage
      }
    });

  } catch (error) {
    console.error('Error sending welcome messages:', error);
    return NextResponse.json(
      { error: 'ウェルカムメッセージの送信に失敗しました' },
      { status: 500 }
    );
  }
}
