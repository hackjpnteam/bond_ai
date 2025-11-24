import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Connection from '@/models/Connection';
import Notification from '@/models/Notification';

interface SignupData {
  name: string;
  email: string;
  password: string;
  role: string;
  company?: string;
}

// Bond管理者のメールアドレス（新規ユーザーと自動的に繋がる）
const BOND_ADMIN_EMAIL = 'tomura@hackjpn.com';

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

    // Bond管理者（hikaru tomura）と自動的にコネクションを作成
    try {
      const bondAdmin = await User.findOne({ email: BOND_ADMIN_EMAIL });

      if (bondAdmin && bondAdmin._id.toString() !== user._id.toString()) {
        // コネクション作成
        const connection = new Connection({
          users: [user._id, bondAdmin._id],
          initiator: bondAdmin._id, // 管理者が招待した形式
          status: 'active',
          strength: 3, // 初期繋がり強度
          tags: ['welcome', 'auto-connect']
        });
        await connection.save();

        // 創業者からの手紙への案内（最初の通知）
        const letterNotification = new Notification({
          recipient: user._id,
          type: 'system',
          title: '創業者からの手紙',
          message: 'Bondを始める前に、創業者からのメッセージをお読みください。',
          data: {
            type: 'letter',
            url: '/letter'
          }
        });
        await letterNotification.save();

        // 新規ユーザーへのウェルカム通知
        const welcomeNotification = new Notification({
          recipient: user._id,
          type: 'system',
          title: 'Bondへようこそ！',
          message: `${bondAdmin.name}さんと自動的に繋がりました。Bondでは人脈を通じて信頼できる企業・人物の情報を共有できます。`,
          data: {
            connectionId: connection._id,
            userId: bondAdmin._id,
            userName: bondAdmin.name
          }
        });
        await welcomeNotification.save();

        // オンボーディング通知（評価を促す）
        const onboardingNotification = new Notification({
          recipient: user._id,
          type: 'system',
          title: '最初のステップ',
          message: 'まずは、２件、周りの企業の評価をいれましょう。検索機能で、会社を検索。そこから評価を投稿できます。２件完了したら、他の機能も開放します。',
          data: {
            type: 'onboarding',
            requiredEvaluations: 2,
            completedEvaluations: 0
          }
        });
        await onboardingNotification.save();

        // Bond管理者への通知
        const adminNotification = new Notification({
          recipient: bondAdmin._id,
          type: 'connection_accepted',
          title: '新しいユーザーが参加しました',
          message: `${name}さん（${role}）がBondに参加し、あなたと繋がりました。`,
          data: {
            connectionId: connection._id,
            userId: user._id,
            userName: name,
            userRole: role,
            userCompany: company
          }
        });
        await adminNotification.save();

        console.log(`Auto-connected new user ${email} with Bond admin ${BOND_ADMIN_EMAIL}`);
      }
    } catch (connectionError) {
      // コネクション作成に失敗してもユーザー登録は成功させる
      console.error('Failed to create auto-connection:', connectionError);
    }

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
