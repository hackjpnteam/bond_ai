import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// GET /api/search/bond - Bond内の企業・人物・サービスを検索
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const db = mongoose.connection.db;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'company';

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const searchRegex = { $regex: query, $options: 'i' };
    let results: any[] = [];

    if (type === 'company') {
      // companiesコレクションから検索
      const companies = await db.collection('companies').find({
        $or: [
          { name: searchRegex },
          { 'basicInfo.name': searchRegex },
          { slug: searchRegex }
        ]
      }).limit(10).toArray();

      results = companies.map(company => ({
        type: 'company',
        name: company.basicInfo?.name || company.name,
        slug: company.slug,
        description: company.basicInfo?.description || company.description,
        logo: company.basicInfo?.logo || company.logo,
        industry: company.basicInfo?.industry
      }));
    } else if (type === 'person') {
      // peopleコレクションから検索
      const people = await db.collection('people').find({
        $or: [
          { name: searchRegex },
          { 'basicInfo.name': searchRegex },
          { slug: searchRegex }
        ]
      }).limit(10).toArray();

      results = people.map(person => ({
        type: 'person',
        name: person.basicInfo?.name || person.name,
        slug: person.slug,
        description: person.basicInfo?.title || person.title,
        image: person.basicInfo?.image || person.image
      }));
    } else if (type === 'service') {
      // servicesコレクションから検索
      const services = await db.collection('services').find({
        $or: [
          { name: searchRegex },
          { 'basicInfo.name': searchRegex },
          { slug: searchRegex }
        ]
      }).limit(10).toArray();

      results = services.map(service => ({
        type: 'service',
        name: service.basicInfo?.name || service.name,
        slug: service.slug,
        description: service.basicInfo?.description || service.description,
        logo: service.basicInfo?.logo || service.logo
      }));
    }

    return NextResponse.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error searching bond:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
