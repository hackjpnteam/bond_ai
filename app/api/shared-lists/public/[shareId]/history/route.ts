import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import SharedList from '@/models/SharedList';
import SharedListEditHistory from '@/models/SharedListEditHistory';

// GET /api/shared-lists/public/[shareId]/history - 編集履歴を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  try {
    await connectDB();

    const { shareId } = await params;

    // 共有リストを取得
    const sharedList = await SharedList.findOne({ shareId }).lean();

    if (!sharedList) {
      return NextResponse.json(
        { error: '共有リストが見つかりません' },
        { status: 404 }
      );
    }

    // 編集履歴を取得（最新100件）
    const history = await SharedListEditHistory.find({ sharedListId: sharedList._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name image')
      .lean();

    return NextResponse.json({
      success: true,
      history: history.map((h: any) => ({
        id: h._id.toString(),
        action: h.action,
        itemId: h.itemId,
        itemName: h.itemName,
        field: h.field,
        oldValue: h.oldValue,
        newValue: h.newValue,
        user: h.userId ? {
          id: h.userId._id?.toString(),
          name: h.userId.name || '匿名ユーザー',
          image: h.userId.image
        } : { name: '匿名ユーザー' },
        createdAt: h.createdAt
      }))
    });

  } catch (error) {
    console.error('Get edit history error:', error);
    return NextResponse.json(
      { error: '編集履歴の取得に失敗しました' },
      { status: 500 }
    );
  }
}
