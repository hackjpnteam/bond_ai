import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Person from '@/models/Person';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();

    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);

    // 人物を検索（slugまたは名前で）
    const person = await Person.findOne({
      $or: [
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
      averageRating: person.averageRating,
      sources: person.sources,
      editHistory: person.editHistory,
      dataSource: person.dataSource,
      createdAt: person.createdAt,
      updatedAt: person.updatedAt
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
