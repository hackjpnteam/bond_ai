import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SavedItem from '@/models/SavedItem';

// GET /api/saved-items - 保存済みアイテムを取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const itemType = url.searchParams.get('type');
    
    let query: any = { userId: user.id };
    if (itemType) {
      query.itemType = itemType;
    }
    
    const savedItems = await SavedItem.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return new Response(
      JSON.stringify({
        success: true,
        savedItems: savedItems.map(item => ({
          id: item._id.toString(),
          itemType: item.itemType,
          itemData: item.itemData,
          tags: item.tags,
          notes: item.notes,
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
    console.error('Get saved items error:', error);
    return new Response(
      JSON.stringify({ error: '保存済みアイテムの取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/saved-items - アイテムを保存
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const body = await request.json();
    const { itemType, itemData, tags, notes } = body;
    
    if (!itemType || !itemData || !itemData.name) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Truncate description if it exceeds the maxlength
    if (itemData.description && itemData.description.length > 1000) {
      itemData.description = itemData.description.substring(0, 997) + '...';
    }

    // 重複チェック
    const existingItem = await SavedItem.findOne({
      userId: user.id,
      itemType,
      'itemData.name': itemData.name
    });
    
    if (existingItem) {
      return new Response(
        JSON.stringify({ error: 'このアイテムは既に保存済みです' }),
        {
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // 新しい保存アイテムを作成
    const savedItem = new SavedItem({
      userId: user.id,
      itemType,
      itemData,
      tags: tags || [],
      notes: notes || ''
    });
    
    await savedItem.save();
    
    return new Response(
      JSON.stringify({
        success: true,
        message: 'アイテムを保存しました',
        savedItem: {
          id: savedItem._id.toString(),
          itemType: savedItem.itemType,
          itemData: savedItem.itemData,
          tags: savedItem.tags,
          notes: savedItem.notes,
          createdAt: savedItem.createdAt
        }
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Save item error:', error);
    return new Response(
      JSON.stringify({ error: 'アイテムの保存に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// DELETE /api/saved-items/[id] - 保存済みアイテムを削除
export const DELETE = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];
    
    const result = await SavedItem.deleteOne({
      _id: id,
      userId: user.id
    });
    
    if (result.deletedCount === 0) {
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