import { NextRequest, NextResponse } from 'next/server';
import { validateSession } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import Company from '@/models/Company';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// POST /api/companies/[slug]/refresh - 企業情報を再検索して更新
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    // 認証チェック
    const user = await validateSession(request);
    if (!user) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    await connectDB();

    const { slug: rawSlug } = await params;
    const decodedSlug = decodeURIComponent(rawSlug);

    // 企業を検索
    const company = await Company.findOne({
      $or: [
        { slug: rawSlug },
        { slug: decodedSlug },
        { name: rawSlug },
        { name: decodedSlug }
      ]
    });

    if (!company) {
      return NextResponse.json(
        { error: '企業が見つかりません' },
        { status: 404 }
      );
    }

    const companyName = company.name;

    // OpenAI APIキーチェック
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API キーが設定されていません' },
        { status: 500 }
      );
    }

    const systemPrompt = `あなたは日本の企業情報に精通した専門家です。企業について詳細な情報を提供してください。
回答は以下のフォーマットで、日本語で提供してください：

## 1. 概要
会社の概要を2-3文で説明

## 2. 基本情報
- 設立: 年月
- 従業員数: 人数
- 本社所在地: 住所
- 業界: 業界名

## 3. 事業内容
主な事業やサービスの説明

## 4. 特徴・強み
会社の特徴や競争優位性

## 5. 最新動向
最近のニュースや動向（わかる範囲で）

情報が見つからない場合は「情報なし」と記載してください。`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `「${companyName}」について詳しく教えてください。` }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });

    const newDescription = response.choices?.[0]?.message?.content;

    if (!newDescription) {
      return NextResponse.json(
        { error: '検索結果が取得できませんでした' },
        { status: 500 }
      );
    }

    // 企業情報を更新
    const currentTime = new Date();

    // 編集履歴を追加
    const editEntry = {
      field: 'description',
      oldValue: company.description || '',
      newValue: newDescription,
      editor: user.id,
      editedAt: currentTime,
      reason: 'AI検索による自動更新'
    };

    await Company.updateOne(
      { _id: company._id },
      {
        $set: {
          description: newDescription,
          lastSearchAt: currentTime,
          updatedAt: currentTime
        },
        $push: { editHistory: editEntry },
        $inc: { searchCount: 1 }
      }
    );

    // 更新後のデータを取得
    const updatedCompany = await Company.findById(company._id).lean();

    return NextResponse.json({
      success: true,
      message: '企業情報を更新しました',
      company: {
        id: updatedCompany._id.toString(),
        name: updatedCompany.name,
        slug: updatedCompany.slug,
        description: updatedCompany.description,
        industry: updatedCompany.industry,
        founded: updatedCompany.founded,
        employees: updatedCompany.employees,
        website: updatedCompany.website,
        searchCount: updatedCompany.searchCount,
        averageRating: updatedCompany.averageRating,
        editHistory: updatedCompany.editHistory,
        lastSearchAt: updatedCompany.lastSearchAt,
        updatedAt: updatedCompany.updatedAt
      }
    });

  } catch (error) {
    console.error('Refresh company error:', error);
    return NextResponse.json(
      { error: '企業情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}
