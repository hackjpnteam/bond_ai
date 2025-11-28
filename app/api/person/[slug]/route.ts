import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Person from '@/models/Person';
import Evaluation from '@/models/Evaluation';
import User from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    // 二重エンコード対策: デコードを繰り返して最終的な値を取得
    let decodedSlug = slug;
    try {
      // 最初のデコード
      decodedSlug = decodeURIComponent(slug);
      // 二重エンコードの場合、もう一度デコードを試みる
      if (decodedSlug.includes('%')) {
        decodedSlug = decodeURIComponent(decodedSlug);
      }
    } catch {
      // デコードエラーの場合は元の値を使用
    }

    // 人物を検索（slugまたは名前で）
    const person = await Person.findOne({
      $or: [
        { slug: decodedSlug },
        { slug: decodedSlug.toLowerCase() },
        { name: decodedSlug },
        { slug: decodedSlug.toLowerCase().replace(/\s+/g, '-') }
      ]
    }).lean();

    if (!person) {
      return NextResponse.json(
        { error: '人物が見つかりません', slug: decodedSlug },
        { status: 404 }
      );
    }

    // 検索回数を増加
    await Person.updateOne(
      { _id: person._id },
      { $inc: { searchCount: 1 } }
    );

    // 評価データを取得（companySlugまたはcompanyNameで人物名を検索）
    const evaluations = await Evaluation.find({
      $or: [
        { companySlug: person.name },
        { companySlug: person.slug },
        { companyName: person.name }
      ]
    }).sort({ createdAt: -1 }).lean();

    // 評価者の情報を取得
    const evaluatorIds = evaluations
      .filter((e: any) => !e.isAnonymous && mongoose.Types.ObjectId.isValid(e.userId))
      .map((e: any) => new mongoose.Types.ObjectId(e.userId));

    const evaluators = evaluatorIds.length > 0
      ? await User.find({ _id: { $in: evaluatorIds } }).select('_id name image company').lean()
      : [];

    const evaluatorMap = new Map(evaluators.map((u: any) => [u._id.toString(), u]));

    // 評価データをフォーマット
    const formattedEvaluations = evaluations.map((e: any) => {
      const evaluator = e.isAnonymous ? null : evaluatorMap.get(e.userId);
      return {
        id: e._id.toString(),
        rating: e.rating,
        relationshipType: e.relationshipType,
        comment: e.comment,
        categories: e.categories,
        isAnonymous: e.isAnonymous,
        createdAt: e.createdAt,
        userId: e.userId,
        userName: evaluator?.name,
        userImage: evaluator?.image,
        userCompany: evaluator?.company,
        likesCount: e.likes?.length || 0,
        repliesCount: e.replies?.length || 0,
        replies: e.replies || []
      };
    });

    // 平均評価を計算
    const avgRating = evaluations.length > 0
      ? evaluations.reduce((sum: number, e: any) => sum + e.rating, 0) / evaluations.length
      : 0;

    return NextResponse.json({
      id: person._id.toString(),
      name: person.name,
      slug: person.slug,
      nameKana: person.nameKana,
      title: person.title,
      company: person.company,
      companySlug: person.companySlug,
      position: person.position,
      biography: person.biography,
      career: person.career,
      education: person.education,
      achievements: person.achievements,
      expertise: person.expertise,
      socialLinks: person.socialLinks,
      imageUrl: person.imageUrl,
      searchCount: person.searchCount + 1,
      averageRating: avgRating || person.averageRating,
      sources: person.sources,
      editHistory: person.editHistory,
      dataSource: person.dataSource,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt,
      evaluations: formattedEvaluations
    });

  } catch (error) {
    console.error('Error fetching person:', error);
    return NextResponse.json(
      { error: '人物情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const body = await request.json();

    const person = await Person.findOne({
      $or: [
        { slug: decodedSlug.toLowerCase() },
        { name: decodedSlug }
      ]
    });

    if (!person) {
      return NextResponse.json(
        { error: '人物が見つかりません' },
        { status: 404 }
      );
    }

    // 更新可能なフィールド
    const allowedFields = [
      'biography', 'career', 'education', 'achievements',
      'title', 'company', 'position', 'expertise', 'socialLinks', 'imageUrl'
    ];

    const updates: any = {};
    const editHistory: any[] = [];

    for (const field of allowedFields) {
      if (body[field] !== undefined && body[field] !== person[field]) {
        editHistory.push({
          field,
          oldValue: String(person[field] || ''),
          newValue: String(body[field]),
          editor: body.editorId || 'anonymous',
          editedAt: new Date(),
          reason: body.editReason || ''
        });
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length > 0) {
      updates.isUserEdited = true;
      updates.dataSource = 'user_edited';
      updates.lastEditedBy = body.editorId || 'anonymous';
      updates.lastEditedAt = new Date();

      await Person.updateOne(
        { _id: person._id },
        {
          $set: updates,
          $push: { editHistory: { $each: editHistory } }
        }
      );
    }

    const updatedPerson = await Person.findById(person._id).lean();

    return NextResponse.json({
      success: true,
      person: updatedPerson
    });

  } catch (error) {
    console.error('Error updating person:', error);
    return NextResponse.json(
      { error: '人物情報の更新に失敗しました' },
      { status: 500 }
    );
  }
}
