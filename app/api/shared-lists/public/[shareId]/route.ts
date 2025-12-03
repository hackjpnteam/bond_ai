import { NextRequest } from 'next/server';
import { validateSession } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import SavedItem from '@/models/SavedItem';
import SharedListItem from '@/models/SharedListItem';
import User from '@/models/User';
import Notification from '@/models/Notification';
import Evaluation from '@/models/Evaluation';
import mongoose from 'mongoose';

// 閲覧権限をチェック
// visibility: 'public' = ネット公開（誰でも閲覧可能）
// visibility: 'link_only' = リンクを知っている人限定（リンクがあれば誰でも閲覧可能）
// visibility: 'invited_only' = 招待者限定（オーナーまたは sharedWith に含まれるユーザーのみ）
async function checkViewPermission(sharedList: any, authUser: any): Promise<{ allowed: boolean; requireLogin?: boolean }> {
  const visibility = sharedList.visibility || (sharedList.isPublic ? 'public' : 'invited_only');

  // ネット公開またはリンク限定は誰でも閲覧可能
  if (visibility === 'public' || visibility === 'link_only') {
    return { allowed: true };
  }

  // 招待者限定の場合はログインが必要
  if (!authUser?.id) {
    return { allowed: false, requireLogin: true };
  }

  const userId = authUser.id;
  const isOwner = sharedList.ownerId.toString() === userId;
  const isSharedWith = sharedList.sharedWith.some(
    (id: any) => id.toString() === userId
  );

  return { allowed: isOwner || isSharedWith };
}

// 編集権限をチェック
async function checkEditPermission(sharedList: any, authUser: any): Promise<boolean> {
  const editPermission = sharedList.editPermission || 'owner_only';

  // Wikiモード（誰でも編集可能）の場合
  if (editPermission === 'anyone') {
    return true;
  }

  // オーナーのみ編集可能の場合はログインが必要
  if (!authUser?.id) {
    return false;
  }

  // オーナーのみ編集可能
  const isOwner = sharedList.ownerId.toString() === authUser.id;
  return isOwner;
}

// GET /api/shared-lists/public/[shareId] - 公開共有リストを取得（認証不要だが、権限チェックあり）
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const shareId = pathParts[pathParts.length - 1];

    const sharedList = await SharedList.findOne({ shareId }).lean();

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // カスタムセッション認証を使用
    const authUser = await validateSession(request);

    // デバッグ用ログ
    const visibility = sharedList.visibility || (sharedList.isPublic ? 'public' : 'invited_only');
    console.log('SharedList public API - AuthUser:', authUser?.id, 'visibility:', visibility, 'ownerId:', sharedList.ownerId?.toString());

    // 閲覧権限チェック
    const viewPermission = await checkViewPermission(sharedList, authUser);
    if (!viewPermission.allowed) {
      if (viewPermission.requireLogin) {
        console.log('SharedList public API - No session, redirecting to login');
        return new Response(
          JSON.stringify({ error: 'ログインが必要です', requireLogin: true }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
      return new Response(
        JSON.stringify({ error: 'このリストを閲覧する権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // オーナー情報を取得
    const owner = await User.findById(sharedList.ownerId).select('name image company').lean();

    // 招待者情報を取得
    let sharedWithUsers: any[] = [];
    if (sharedList.sharedWith && sharedList.sharedWith.length > 0) {
      sharedWithUsers = await User.find({ _id: { $in: sharedList.sharedWith } })
        .select('_id name image company')
        .lean();
    }

    // タグベースのアイテムを取得
    const savedItems = await SavedItem.find({
      userId: sharedList.ownerId,
      tags: { $in: sharedList.tags }
    })
      .sort({ createdAt: -1 })
      .lean();

    // 直接追加されたアイテムを取得
    const sharedListItems = await SharedListItem.find({
      sharedListId: sharedList._id
    })
      .populate('addedBy', 'name image')
      .sort({ createdAt: -1 })
      .lean();

    // 編集権限をチェック
    const canEdit = await checkEditPermission(sharedList, authUser);

    // 閲覧回数を更新（オーナー以外の閲覧のみカウント）
    const isOwner = authUser?.id && sharedList.ownerId.toString() === authUser.id;
    if (!isOwner) {
      SharedList.updateOne(
        { _id: sharedList._id },
        { $inc: { viewCount: 1 } }
      ).exec();
    }

    // 企業のロゴを取得するためのslugリストを収集
    const db = mongoose.connection.db;
    const companySlugs = [
      ...savedItems.filter(item => item.itemType === 'company' || item.itemType === 'search_result')
        .map(item => item.itemData.slug || item.itemData.name),
      ...sharedListItems.filter((item: any) => item.itemType === 'company' || item.itemType === 'search_result')
        .map((item: any) => item.itemData.slug || item.itemData.name)
    ].filter(Boolean);

    // companiesコレクションからロゴ情報、評価、創業年、最新のdescriptionを取得
    let companyData: Record<string, { logo?: string; averageRating?: number; founded?: string; description?: string }> = {};
    if (companySlugs.length > 0) {
      const companies = await db.collection('companies').find({
        $or: [
          { slug: { $in: companySlugs } },
          { name: { $in: companySlugs } },
          { 'basicInfo.name': { $in: companySlugs } }
        ]
      }).project({
        slug: 1,
        name: 1,
        'basicInfo.name': 1,
        'basicInfo.logo': 1,
        'basicInfo.founded': 1,
        'basicInfo.description': 1,
        logo: 1,
        averageRating: 1,
        founded: 1,
        description: 1
      }).toArray();

      companies.forEach((company: any) => {
        const logo = company.basicInfo?.logo || company.logo;
        const averageRating = company.averageRating;
        const founded = company.basicInfo?.founded || company.founded;
        const description = company.description || company.basicInfo?.description;

        const data = { logo, averageRating, founded, description };
        if (company.slug) companyData[company.slug] = data;
        if (company.name) companyData[company.name] = data;
        if (company.basicInfo?.name) companyData[company.basicInfo.name] = data;
      });
    }

    // 各企業の評価データを取得
    let evaluationsData: Record<string, any[]> = {};
    if (companySlugs.length > 0) {
      // slugを小文字に正規化
      const normalizedSlugs = companySlugs.map((s: string) => s.toLowerCase());

      const evaluations = await Evaluation.find({
        companySlug: { $in: normalizedSlugs },
        isPublic: true
      })
        .select('companySlug userId rating relationshipType comment categories isAnonymous createdAt likesCount')
        .sort({ createdAt: -1 })
        .lean();

      // ユーザー情報を取得
      const userIds = [...new Set(evaluations.map(e => e.userId))];
      const users = await User.find({ _id: { $in: userIds } })
        .select('_id name image company')
        .lean();
      const userMap = new Map(users.map(u => [u._id.toString(), u]));

      // 評価をslugごとにグループ化
      evaluations.forEach((evaluation: any) => {
        const slug = evaluation.companySlug;
        if (!evaluationsData[slug]) {
          evaluationsData[slug] = [];
        }
        const user = userMap.get(evaluation.userId);
        evaluationsData[slug].push({
          id: evaluation._id.toString(),
          rating: evaluation.rating,
          relationshipType: evaluation.relationshipType,
          comment: evaluation.comment,
          categories: evaluation.categories,
          isAnonymous: evaluation.isAnonymous,
          likesCount: evaluation.likesCount || 0,
          createdAt: evaluation.createdAt,
          user: evaluation.isAnonymous ? null : (user ? {
            id: user._id.toString(),
            name: user.name,
            image: user.image,
            company: user.company
          } : null)
        });
      });

      // 元のslugでもアクセスできるようにマッピング
      companySlugs.forEach((originalSlug: string) => {
        const normalizedSlug = originalSlug.toLowerCase();
        if (evaluationsData[normalizedSlug] && originalSlug !== normalizedSlug) {
          evaluationsData[originalSlug] = evaluationsData[normalizedSlug];
        }
      });
    }

    // アイテムにロゴ情報、評価、創業年、評価リスト、最新descriptionを追加
    const enrichItemWithData = (item: any) => {
      const slug = item.itemData.slug || item.itemData.name;
      const name = item.itemData.name;
      const data = companyData[slug] || companyData[name] || companyData[slug?.toLowerCase()] || companyData[name?.toLowerCase()] || {};
      const logoUrl = item.itemData.logoUrl || item.itemData.metadata?.logo || data.logo;
      const founded = item.itemData.founded || item.itemData.metadata?.founded || data.founded;
      // 最新のdescriptionを優先（Companyモデルから）、なければ保存されたdescriptionを使用
      const description = data.description || item.itemData.description || item.itemData.metadata?.description;
      // 評価データを取得（slug、小文字slug、nameのいずれかでマッチ）
      const evaluations = evaluationsData[slug] || evaluationsData[slug?.toLowerCase()] || evaluationsData[name] || evaluationsData[name?.toLowerCase()] || [];

      // averageRatingを計算: evaluationsがあればそこから計算（最新データ）、なければ既存のデータを使用
      let averageRating: number | undefined;
      if (evaluations.length > 0) {
        // 評価データがある場合は、そこから計算（最も正確）
        const sum = evaluations.reduce((acc: number, e: any) => acc + (e.rating || 0), 0);
        averageRating = sum / evaluations.length;
      } else {
        // 評価データがない場合は、既存のaverageRatingを使用
        averageRating = item.itemData.averageRating ?? item.itemData.metadata?.averageRating ?? data.averageRating;
      }

      return {
        ...item.itemData,
        logoUrl,
        averageRating,
        founded,
        description,
        evaluations
      };
    };

    // オーナーかどうかを判定
    const isOwnerUser = authUser?.id && sharedList.ownerId.toString() === authUser.id;

    return new Response(
      JSON.stringify({
        success: true,
        sharedList: {
          id: sharedList._id.toString(),
          shareId: sharedList.shareId,
          title: sharedList.title,
          description: sharedList.description,
          tags: sharedList.tags,
          isPublic: sharedList.isPublic,
          visibility: sharedList.visibility || (sharedList.isPublic ? 'public' : 'invited_only'),
          editPermission: sharedList.editPermission || 'owner_only',
          viewCount: sharedList.viewCount,
          createdAt: sharedList.createdAt,
          canEdit,
          isOwner: isOwnerUser,
          owner: owner ? {
            name: owner.name,
            image: owner.image,
            company: owner.company
          } : null,
          sharedWith: sharedWithUsers.map((user: any) => ({
            id: user._id.toString(),
            name: user.name,
            image: user.image,
            company: user.company
          }))
        },
        items: savedItems.map(item => ({
          id: item._id.toString(),
          source: 'saved', // タグベースのアイテム
          itemType: item.itemType,
          itemData: enrichItemWithData(item),
          tags: item.tags,
          notes: item.notes,
          createdAt: item.createdAt
        })),
        sharedListItems: sharedListItems.map((item: any) => ({
          id: item._id.toString(),
          source: 'shared', // 直接追加されたアイテム
          itemType: item.itemType,
          itemData: enrichItemWithData(item),
          tags: item.tags,
          notes: item.notes,
          addedBy: item.addedBy ? {
            id: item.addedBy._id.toString(),
            name: item.addedBy.name,
            image: item.addedBy.image
          } : null,
          createdAt: item.createdAt
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get public shared list error:', error);
    return new Response(
      JSON.stringify({ error: '共有リストの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// PATCH /api/shared-lists/public/[shareId] - 共有リストを編集
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const shareId = pathParts[pathParts.length - 1];

    const sharedList = await SharedList.findOne({ shareId });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const authUser = await validateSession(request);
    const canEdit = await checkEditPermission(sharedList, authUser);
    const isOwner = authUser?.id && sharedList.ownerId.toString() === authUser.id;

    if (!canEdit) {
      return new Response(
        JSON.stringify({ error: '編集権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { title, description, visibility, editPermission, addUserId, removeUserId } = body;

    // 更新
    if (title !== undefined) sharedList.title = title;
    if (description !== undefined) sharedList.description = description;

    // visibility はオーナーのみが変更可能
    if (visibility !== undefined && isOwner) {
      if (['public', 'link_only', 'invited_only'].includes(visibility)) {
        sharedList.visibility = visibility;
        // isPublic も連動して更新（後方互換性）
        sharedList.isPublic = visibility !== 'invited_only';
      }
    }

    // editPermission はオーナーのみが変更可能
    if (editPermission !== undefined && isOwner) {
      if (['owner_only', 'anyone'].includes(editPermission)) {
        sharedList.editPermission = editPermission;
      }
    }

    // 招待者の追加（オーナーのみ）
    if (addUserId && isOwner) {
      // ユーザーが存在するか確認
      const userToAdd = await User.findById(addUserId).select('_id name image company').lean();
      if (userToAdd) {
        // 重複追加を防ぐ
        const alreadyShared = sharedList.sharedWith.some(
          (id: any) => id.toString() === addUserId
        );
        if (!alreadyShared) {
          sharedList.sharedWith.push(new mongoose.Types.ObjectId(addUserId));

          // オーナー情報を取得
          const owner = await User.findById(sharedList.ownerId).select('name').lean();
          const ownerName = owner?.name || '誰か';

          // 招待通知を作成
          await Notification.create({
            recipient: new mongoose.Types.ObjectId(addUserId),
            type: 'shared_list_invite',
            title: '共有リストへの招待',
            message: `${ownerName}さんがあなたを「${sharedList.title}」に招待しました`,
            data: {
              sharedListId: sharedList._id.toString(),
              shareId: sharedList.shareId,
              listTitle: sharedList.title,
              invitedBy: {
                id: sharedList.ownerId.toString(),
                name: ownerName
              }
            }
          });
        }
      }
    }

    // 招待者の削除（オーナーのみ）
    if (removeUserId && isOwner) {
      sharedList.sharedWith = sharedList.sharedWith.filter(
        (id: any) => id.toString() !== removeUserId
      );
    }

    await sharedList.save();

    // 更新後の招待者リストを取得
    let updatedSharedWithUsers: any[] = [];
    if (sharedList.sharedWith && sharedList.sharedWith.length > 0) {
      updatedSharedWithUsers = await User.find({ _id: { $in: sharedList.sharedWith } })
        .select('_id name image company')
        .lean();
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '共有リストを更新しました',
        sharedList: {
          id: sharedList._id.toString(),
          title: sharedList.title,
          description: sharedList.description,
          visibility: sharedList.visibility || 'public',
          sharedWith: updatedSharedWithUsers.map((user: any) => ({
            id: user._id.toString(),
            name: user.name,
            image: user.image,
            company: user.company
          }))
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update public shared list error:', error);
    return new Response(
      JSON.stringify({ error: '共有リストの更新に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// POST /api/shared-lists/public/[shareId] - 共有リストにアイテムを追加
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const shareId = pathParts[pathParts.length - 1];

    const sharedList = await SharedList.findOne({ shareId });

    if (!sharedList) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const authUser = await validateSession(request);
    const canEdit = await checkEditPermission(sharedList, authUser);

    if (!canEdit) {
      return new Response(
        JSON.stringify({ error: '編集権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { itemType, itemData, notes } = body;

    if (!itemType || !itemData?.name) {
      return new Response(
        JSON.stringify({ error: 'アイテムタイプと名前は必須です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // descriptionが1000文字を超える場合は切り詰め
    const truncatedDescription = itemData.description
      ? itemData.description.substring(0, 1000)
      : undefined;

    const newItem = new SharedListItem({
      sharedListId: sharedList._id,
      addedBy: authUser?.id || null,
      itemType,
      itemData: {
        name: itemData.name,
        slug: itemData.slug,
        description: truncatedDescription,
        logoUrl: itemData.logoUrl,
        metadata: itemData.metadata
      },
      notes
    });

    await newItem.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'アイテムを追加しました',
        item: {
          id: newItem._id.toString(),
          itemType: newItem.itemType,
          itemData: newItem.itemData,
          notes: newItem.notes,
          createdAt: newItem.createdAt
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Add item to public shared list error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの追加に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
