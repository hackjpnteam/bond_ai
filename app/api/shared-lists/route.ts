import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import SavedItem from '@/models/SavedItem';
import User from '@/models/User';

// GET /api/shared-lists - 自分の共有リスト一覧を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const sharedLists = await SharedList.find({ ownerId: user.id })
      .sort({ createdAt: -1 })
      .populate('sharedWith', 'name email image')
      .lean();

    return new Response(
      JSON.stringify({
        success: true,
        sharedLists: sharedLists.map(list => ({
          id: list._id.toString(),
          shareId: list.shareId,
          title: list.title,
          description: list.description,
          tags: list.tags,
          isPublic: list.isPublic,
          sharedWith: list.sharedWith.map((u: any) => ({
            id: u._id.toString(),
            name: u.name,
            email: u.email,
            image: u.image
          })),
          viewCount: list.viewCount,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt
        }))
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
