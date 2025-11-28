import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Company from '@/models/Company';
import Evaluation from '@/models/Evaluation';
import SearchHistory from '@/models/SearchHistory';
import SearchResult from '@/models/SearchResult';
import { validateSession } from '@/lib/auth-middleware';

// アドミン権限チェック
async function checkAdmin(request: NextRequest) {
  const sessionUser = await validateSession(request);
  if (!sessionUser?.email) {
    return null;
  }

  await connectDB();
  const user = await User.findOne({ email: sessionUser.email }).lean();
  if (!user?.isAdmin) {
    return null;
  }

  return user;
}

// GET - 会社詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { slug } = await params;
    await connectDB();

    const company = await Company.findOne({ slug }).lean();
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }

    // 関連する評価数を取得
    const evaluationCount = await Evaluation.countDocuments({ companySlug: slug });

    // 関連する検索結果数を取得
    const searchResultCount = await SearchResult.countDocuments({ company: company.name });

    return NextResponse.json({
      company: {
        ...company,
        _id: company._id.toString()
      },
      relatedCounts: {
        evaluations: evaluationCount,
        searchResults: searchResultCount
      }
    });

  } catch (error) {
    console.error('Admin get company error:', error);
    return NextResponse.json({ error: '会社情報の取得に失敗しました' }, { status: 500 });
  }
}

// DELETE - 会社を削除（関連する評価・検索結果も削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const admin = await checkAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const { slug } = await params;
    const { deleteRelated = false } = await request.json().catch(() => ({}));

    await connectDB();

    const company = await Company.findOne({ slug });
    if (!company) {
      return NextResponse.json({ error: '会社が見つかりません' }, { status: 404 });
    }

    const companyName = company.name;
    const results = {
      company: false,
      evaluations: 0,
      searchResults: 0,
      searchHistory: 0
    };

    // 関連データを削除（オプション）
    if (deleteRelated) {
      // 評価を削除
      const evalResult = await Evaluation.deleteMany({ companySlug: slug });
      results.evaluations = evalResult.deletedCount;

      // 検索結果を削除
      const searchResultsResult = await SearchResult.deleteMany({ company: companyName });
      results.searchResults = searchResultsResult.deletedCount;

      // 検索履歴を削除（会社名での検索）
      const searchHistoryResult = await SearchHistory.deleteMany({
        query: { $regex: new RegExp(companyName, 'i') },
        mode: 'company'
      });
      results.searchHistory = searchHistoryResult.deletedCount;
    }

    // 会社を削除
    await Company.deleteOne({ slug });
    results.company = true;

    return NextResponse.json({
      success: true,
      message: `${companyName}を削除しました`,
      results
    });

  } catch (error) {
    console.error('Admin delete company error:', error);
    return NextResponse.json({ error: '会社の削除に失敗しました' }, { status: 500 });
  }
}
