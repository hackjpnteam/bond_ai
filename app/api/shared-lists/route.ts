import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import SharedListView from '@/models/SharedListView';
import SavedItem from '@/models/SavedItem';
import User from '@/models/User';

// GET /api/shared-lists - 自分の共有リスト一覧を取得（作成したもの + 閲覧したもの）
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    // 自分が作成した共有リスト
    const ownedLists = await SharedList.find({ ownerId: user.id })
      .sort({ createdAt: -1 })
      .populate('sharedWith', 'name email image')
      .populate('ownerId', 'name image')
      .lean();

    // 自分が閲覧した共有リスト（自分が作成したものは除く）
    const viewedListRecords = await SharedListView.find({ userId: user.id })
      .sort({ viewedAt: -1 })
      .lean();

    const viewedListIds = viewedListRecords.map(v => v.sharedListId);
    const viewedLists = await SharedList.find({
      _id: { $in: viewedListIds },
      ownerId: { $ne: user.id } // 自分が作成したものは除外
    })
      .populate('sharedWith', 'name email image')
      .populate('ownerId', 'name image')
      .lean();

    // viewedAtの順番を保持するためのマップ
    const viewedAtMap = new Map(
      viewedListRecords.map(v => [v.sharedListId.toString(), v.viewedAt])
    );

    // 閲覧リストをviewedAt順にソート
    viewedLists.sort((a, b) => {
      const aTime = viewedAtMap.get(a._id.toString())?.getTime() || 0;
      const bTime = viewedAtMap.get(b._id.toString())?.getTime() || 0;
      return bTime - aTime;
    });

    const formatList = (list: any, isOwned: boolean, viewedAt?: Date) => ({
      id: list._id.toString(),
      shareId: list.shareId,
      title: list.title,
      description: list.description,
      tags: list.tags,
      isPublic: list.isPublic,
      visibility: list.visibility || (list.isPublic ? 'public' : 'invited_only'),
      isOwned,
      owner: list.ownerId ? {
        id: list.ownerId._id?.toString() || list.ownerId.toString(),
        name: list.ownerId.name || 'Unknown',
        image: list.ownerId.image
      } : null,
      sharedWith: (list.sharedWith || []).map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        image: u.image
      })),
      viewCount: list.viewCount,
      viewedAt: viewedAt,
      createdAt: list.createdAt,
      updatedAt: list.updatedAt
    });

    const formattedOwnedLists = ownedLists.map(list => formatList(list, true));
    const formattedViewedLists = viewedLists.map(list =>
      formatList(list, false, viewedAtMap.get(list._id.toString()))
    );

    return new Response(
      JSON.stringify({
        success: true,
        sharedLists: formattedOwnedLists,
        viewedLists: formattedViewedLists
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get shared lists error:', error);
    return new Response(
      JSON.stringify({ error: '共有リストの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/shared-lists - 新しい共有リストを作成
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { title, description, tags, isPublic, sharedWith } = body;

    if (!title || !tags || tags.length === 0) {
      return new Response(
        JSON.stringify({ error: 'タイトルとタグを指定してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 指定されたタグに該当するアイテムがあるか確認
    const matchingItems = await SavedItem.find({
      userId: user.id,
      tags: { $in: tags }
    }).lean();

    if (matchingItems.length === 0) {
      return new Response(
        JSON.stringify({ error: '指定されたタグに該当するアイテムがありません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const sharedList = new SharedList({
      ownerId: user.id,
      title,
      description: description || '',
      tags,
      isPublic: isPublic !== false, // デフォルトtrue
      sharedWith: sharedWith || []
    });

    await sharedList.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: '共有リストを作成しました',
        sharedList: {
          id: sharedList._id.toString(),
          shareId: sharedList.shareId,
          title: sharedList.title,
          description: sharedList.description,
          tags: sharedList.tags,
          isPublic: sharedList.isPublic,
          sharedWith: sharedList.sharedWith.map(id => id.toString()),
          viewCount: sharedList.viewCount,
          createdAt: sharedList.createdAt
        },
        itemCount: matchingItems.length
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Create shared list error:', error);
    return new Response(
      JSON.stringify({ error: '共有リストの作成に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
