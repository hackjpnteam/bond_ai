import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SavedItem from '@/models/SavedItem';

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