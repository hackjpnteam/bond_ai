import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import SharedListItem from '@/models/SharedListItem';

// 編集権限チェック
async function checkEditPermission(sharedListId: string, userId: string): Promise<{ allowed: boolean; sharedList: any }> {
  const sharedList = await SharedList.findById(sharedListId);
  if (!sharedList) {
    return { allowed: false, sharedList: null };
  }

  // オーナーは常に編集可能
  if (sharedList.ownerId.toString() === userId) {
    return { allowed: true, sharedList };
  }

  // 共有されたユーザーも編集可能
  if (sharedList.sharedWith.some((id: any) => id.toString() === userId)) {
    return { allowed: true, sharedList };
  }

  return { allowed: false, sharedList };
}

// GET /api/shared-lists/[id]/items - 共有リストのアイテム取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // /api/shared-lists/[id]/items

    const { allowed, sharedList } = await checkEditPermission(id, user.id);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: '共有リストが見つからないか、権限がありません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const items = await SharedListItem.find({ sharedListId: id })
      .populate('addedBy', 'name email image')
      .sort({ createdAt: -1 })
      .lean();

    return new Response(
      JSON.stringify({
        success: true,
        items: items.map((item: any) => ({
          id: item._id.toString(),
          itemType: item.itemType,
          itemData: item.itemData,
          tags: item.tags,
          notes: item.notes,
          addedBy: item.addedBy ? {
            id: item.addedBy._id.toString(),
            name: item.addedBy.name,
            image: item.addedBy.image
          } : null,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Get shared list items error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/shared-lists/[id]/items - 共有リストにアイテムを追加
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];

    const { allowed, sharedList } = await checkEditPermission(id, user.id);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: '編集権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { itemType, itemData, notes, tags } = body;

    if (!itemType || !itemData?.name) {
      return new Response(
        JSON.stringify({ error: 'アイテムタイプと名前は必須です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const newItem = new SharedListItem({
      sharedListId: id,
      addedBy: user.id,
      itemType,
      itemData: {
        name: itemData.name,
        slug: itemData.slug,
        description: itemData.description,
        logoUrl: itemData.logoUrl,
        metadata: itemData.metadata
      },
      tags: tags || [],
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
          tags: newItem.tags,
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
    console.error('Add shared list item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの追加に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// PATCH /api/shared-lists/[id]/items - アイテムを更新（itemIdをクエリパラメータで指定）
export const PATCH = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'アイテムIDが必要です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { allowed } = await checkEditPermission(id, user.id);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: '編集権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { notes, tags, itemData } = body;

    const item = await SharedListItem.findOne({ _id: itemId, sharedListId: id });

    if (!item) {
      return new Response(
        JSON.stringify({ error: 'アイテムが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 更新
    if (notes !== undefined) item.notes = notes;
    if (tags !== undefined) item.tags = tags;
    if (itemData) {
      if (itemData.description !== undefined) item.itemData.description = itemData.description;
      if (itemData.logoUrl !== undefined) item.itemData.logoUrl = itemData.logoUrl;
    }

    await item.save();

    return new Response(
      JSON.stringify({
        success: true,
        message: 'アイテムを更新しました',
        item: {
          id: item._id.toString(),
          itemData: item.itemData,
          tags: item.tags,
          notes: item.notes
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update shared list item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの更新に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// DELETE /api/shared-lists/[id]/items - アイテムを削除（itemIdをクエリパラメータで指定）
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2];
    const itemId = url.searchParams.get('itemId');

    if (!itemId) {
      return new Response(
        JSON.stringify({ error: 'アイテムIDが必要です' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const { allowed } = await checkEditPermission(id, user.id);

    if (!allowed) {
      return new Response(
        JSON.stringify({ error: '削除権限がありません' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const item = await SharedListItem.findOneAndDelete({ _id: itemId, sharedListId: id });

    if (!item) {
      return new Response(
        JSON.stringify({ error: 'アイテムが見つかりません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'アイテムを削除しました'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Delete shared list item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの削除に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});
