import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SavedItem from '@/models/SavedItem';

// PUT/PATCH /api/saved-items/[id] - 保存済みアイテムを更新（タグなど）
const updateHandler = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    // URLから id を取得
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!id || id === 'saved-items') {
      return new Response(
        JSON.stringify({ error: 'アイテムIDが指定されていません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();
    const { tags, notes, itemData } = body;

    // 更新データを準備
    const updateData: { tags?: string[]; notes?: string; 'itemData.description'?: string } = {};
    if (tags !== undefined) {
      updateData.tags = tags;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    // itemData.descriptionの更新をサポート
    if (itemData?.description !== undefined) {
      updateData['itemData.description'] = itemData.description;
    }

    // 更新実行（ユーザーIDとアイテムIDの両方で制限）
    const result = await SavedItem.findOneAndUpdate(
      {
        _id: id,
        userId: user.id
      },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      return new Response(
        JSON.stringify({ error: 'アイテムが見つからないか、更新権限がありません' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        savedItem: {
          id: result._id.toString(),
          itemType: result.itemType,
          itemData: result.itemData,
          tags: result.tags,
          notes: result.notes,
          createdAt: result.createdAt,
          updatedAt: result.updatedAt
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Update saved item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの更新に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

export const PUT = updateHandler;
export const PATCH = updateHandler;

// DELETE /api/saved-items/[id] - 保存済みアイテムを削除
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    // URLから id を取得
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    if (!id || id === 'saved-items') {
      return new Response(
        JSON.stringify({ error: 'アイテムIDが指定されていません' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 削除実行（ユーザーIDとアイテムIDの両方で制限）
    const result = await SavedItem.deleteOne({
      _id: id,
      userId: user.id
    });
    
    if (result.deletedCount === 0) {
      return new Response(
        JSON.stringify({ error: 'アイテムが見つからないか、削除権限がありません' }),
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
    console.error('Delete saved item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの削除に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});