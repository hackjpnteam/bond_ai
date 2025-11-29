import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import UserProfile from '@/models/UserProfile';
import Notification from '@/models/Notification';
import Message from '@/models/Message';
import mongoose from 'mongoose';
import { getRelationshipLabel } from '@/lib/relationship';

const BOND_ADMIN_EMAIL = 'tomura@hackjpn.com';

const TWO_EVALUATIONS_MESSAGE = `あなたが2件の評価を贈ってくれたこと、
まずは心からありがとう。

AIがあらゆる文章や広告をつくり出す時代に、
あなたが「誰かの価値」を自分の言葉で讃えた行為は、
それ自体が大きな信頼の灯火です。

Bondは、江戸の村で人と人が支え合っていた頃のように、
行いと人間性が"信用"になる世界を取り戻すことが使命です。

あなたの評価は、その世界を一歩前に進めてくれました。
誰かの挑戦を支え、誰かの未来の信用をつくっています。

AIの時代だからこそ、
人間にしか生み出せない価値があります。

Bondは、それを可視化するために生まれました。
あなたがその最初の担い手になってくれて、本当に嬉しいです。

これからも一緒に、
恩送りが自然にめぐる世界をつくっていきましょう。

戸村 光
CEO, hackjpn / Bond Founder`;

// GET /api/evaluations - ユーザーの評価一覧を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const companySlug = url.searchParams.get('company');

    const userId = user.id;

    const query: Record<string, unknown> = {};
    if (companySlug) {
      const decodedCompanySlug = decodeURIComponent(companySlug);
      query.$or = [
        { companySlug: companySlug },
        { companySlug: decodedCompanySlug },
        { companyName: companySlug },
        { companyName: decodedCompanySlug }
      ];
    } else {
      query.userId = userId;
    }

    const evaluations = await Evaluation.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const validUserIds = evaluations
      .map((evaluation) => evaluation.userId)
      .filter((id): id is string => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id));

    const objectIds = Array.from(new Set(validUserIds)).map((id) => new mongoose.Types.ObjectId(id));

    const [users, profiles] = objectIds.length
      ? await Promise.all([
          User.find({ _id: { $in: objectIds } })
            .select('name company role image')
            .lean(),
          UserProfile.find({ userId: { $in: objectIds } })
            .select('userId profileImage')
            .lean()
        ])
      : [[], []];

    const userDetailsMap = new Map<string, { id: string; name?: string; company?: string; role?: string; image?: string }>();

    users.forEach((userDoc) => {
      userDetailsMap.set(userDoc._id.toString(), {
        id: userDoc._id.toString(),
        name: userDoc.name,
        company: userDoc.company,
        role: userDoc.role,
        image: userDoc.image || undefined
      });
    });

    profiles.forEach((profileDoc) => {
      const key = profileDoc.userId.toString();
      const existing = userDetailsMap.get(key) || { id: key };
      userDetailsMap.set(key, {
        ...existing,
        image: profileDoc.profileImage || existing.image
      });
    });

    // リプライのユーザー情報も取得
    const replyUserIds = evaluations.flatMap(evaluation =>
      (evaluation.replies || [])
        .filter((r: any) => !r.isAnonymous)
        .map((r: any) => r.userId)
        .filter((id: any) => typeof id === 'string' && mongoose.Types.ObjectId.isValid(id))
    );

    const replyUserObjectIds = Array.from(new Set(replyUserIds)).map((id) => new mongoose.Types.ObjectId(id as string));
    const replyUsers = replyUserObjectIds.length
      ? await User.find({ _id: { $in: replyUserObjectIds } })
          .select('_id name image')
          .lean()
      : [];

    const replyUserMap = new Map(replyUsers.map(u => [u._id.toString(), u]));

    return new Response(
      JSON.stringify({
        success: true,
        evaluations: evaluations.map(evaluation => {
          const userDetails = evaluation.userId ? userDetailsMap.get(evaluation.userId.toString()) : null;
          const relationshipType = evaluation.relationshipType ?? 0;
          const likes = evaluation.likes || [];
          const replies = evaluation.replies || [];

          // リプライにユーザー情報を付加
          const repliesWithUsers = replies.map((reply: any) => ({
            userId: reply.userId,
            content: reply.content,
            isAnonymous: reply.isAnonymous,
            createdAt: reply.createdAt,
            user: reply.isAnonymous ? null : replyUserMap.get(reply.userId) || null
          }));

          return {
            id: evaluation._id.toString(),
            companyName: evaluation.companyName,
            companySlug: evaluation.companySlug,
            rating: evaluation.rating,
            relationshipType: relationshipType,
            relationshipLabel: getRelationshipLabel(relationshipType),
            comment: evaluation.comment,
            categories: evaluation.categories,
            editHistory: evaluation.editHistory,
            isAnonymous: evaluation.isAnonymous,
            createdAt: evaluation.createdAt,
            updatedAt: evaluation.updatedAt,
            userId: evaluation.userId,
            user: userDetails,
            likesCount: likes.length,
            hasLiked: likes.includes(userId),
            repliesCount: replies.length,
            replies: repliesWithUsers
          };
        })
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get evaluations error:', error);
    return new Response(
      JSON.stringify({ error: '評価データの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/evaluations - 新しい評価を作成
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { companyName, companySlug, rating, comment, categories, isAnonymous, relationshipType } = body;

    // バリデーション
    if (!companyName || !companySlug || !rating || !comment || !categories) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (relationshipType === null || relationshipType === undefined) {
      return new Response(
        JSON.stringify({ error: '関係性を選択してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const relationshipTypeNum = Number(relationshipType);
    if (isNaN(relationshipTypeNum) || relationshipTypeNum < 0 || relationshipTypeNum > 6) {
      return new Response(
        JSON.stringify({ error: '関係性の値が不正です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const userId = user.id;

    // 既存の評価をチェック
    const existingEvaluation = await Evaluation.findOne({
      userId,
      companySlug
    });

    if (existingEvaluation) {
      return new Response(
        JSON.stringify({ error: 'この企業は既に評価済みです' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 新しい評価を作成
    const evaluation = new Evaluation({
      userId,
      companyName,
      companySlug,
      rating,
      comment,
      categories,
      relationshipType: relationshipTypeNum,
      isPublic: true,
      isAnonymous: isAnonymous || false
    });

    await evaluation.save();

    // ユーザーの評価カウントを更新
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { evaluationCount: 1 } },
      { new: true }
    );

    // 1件達成時にトラストマップ開放通知
    let trustMapJustUnlocked = false;
    if (updatedUser && updatedUser.evaluationCount === 1) {
      trustMapJustUnlocked = true;

      const trustMapNotification = new Notification({
        recipient: userId,
        type: 'system',
        title: '信頼ネットワークが開放されました！',
        message: '1件目の評価を投稿しました。信頼ネットワーク機能が使えるようになりました！あと1件評価すると、全ての機能が開放されます。',
        data: {
          type: 'trust_map_unlocked',
          evaluationCount: 1
        }
      });
      await trustMapNotification.save();
    }

    // 2件達成時にオンボーディング完了 & 全機能開放通知
    let onboardingJustCompleted = false;
    if (updatedUser && updatedUser.evaluationCount >= 2 && !updatedUser.onboardingCompleted) {
      await User.findByIdAndUpdate(userId, { onboardingCompleted: true });
      onboardingJustCompleted = true;

      // 全機能開放通知を送信
      const unlockNotification = new Notification({
        recipient: userId,
        type: 'system',
        title: '全機能が開放されました！',
        message: '2件の評価を完了しました。これで全ての機能をご利用いただけます。紹介リクエスト、接続管理、メッセージなど、Bondの機能を存分にお楽しみください。',
        data: {
          type: 'onboarding_complete',
          evaluationCount: updatedUser.evaluationCount
        }
      });
      await unlockNotification.save();
    }

    if (updatedUser && updatedUser.evaluationCount === 2) {
      const bondAdmin = await User.findOne({ email: BOND_ADMIN_EMAIL });

      if (bondAdmin) {
        await Message.create({
          sender: bondAdmin._id,
          recipient: userId,
          subject: 'ご挨拶',
          content: TWO_EVALUATIONS_MESSAGE,
          read: false
        });

        const thankYouNotification = new Notification({
          recipient: userId,
          type: 'message',
          title: 'hikaru tomuraからのメッセージ',
          message: '2件の評価ありがとうございます。戸村からのメッセージが届いています。',
          data: {
            senderId: bondAdmin._id,
            messageSubject: 'ご挨拶'
          }
        });
        await thankYouNotification.save();
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: onboardingJustCompleted
          ? '評価を投稿しました。全機能が開放されました！'
          : '評価を投稿しました',
        evaluation: {
          id: evaluation._id.toString(),
          companyName: evaluation.companyName,
          companySlug: evaluation.companySlug,
          rating: evaluation.rating,
          relationshipType: evaluation.relationshipType,
          relationshipLabel: getRelationshipLabel(evaluation.relationshipType),
          comment: evaluation.comment,
          categories: evaluation.categories,
          isAnonymous: evaluation.isAnonymous,
          createdAt: evaluation.createdAt
        },
        onboardingCompleted: onboardingJustCompleted || (updatedUser?.onboardingCompleted ?? false),
        evaluationCount: updatedUser?.evaluationCount ?? 1
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create evaluation error:', error);
    return new Response(
      JSON.stringify({ error: '評価の投稿に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
