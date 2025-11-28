import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import connectDB from '@/lib/mongodb';
import SearchResult from '@/models/SearchResult';
import Company from '@/models/Company';
import Person from '@/models/Person';

// GET /api/search-results - 検索結果を取得
export const GET = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();
    
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const company = url.searchParams.get('company');
    
    let query: any = { userId: user.id };
    if (company) {
      query.company = { $regex: company, $options: 'i' };
    }
    
    const searchResults = await SearchResult.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();
    
    return new Response(
      JSON.stringify({
        success: true,
        searchResults: searchResults.map(result => ({
          id: result._id.toString(),
          query: result.query,
          company: result.company,
          answer: result.answer,
          metadata: result.metadata,
          createdAt: result.createdAt
        }))
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Get search results error:', error);
    return new Response(
      JSON.stringify({ error: '検索結果の取得に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});

// POST /api/search-results - 検索結果を保存
export const POST = requireAuth(async (request: NextRequest, user) => {
  try {
    await connectDB();

    const body = await request.json();
    const { query, company, answer, metadata, searchType } = body;
    // searchType: 'company' | 'person' - デフォルトは 'company'
    const type = searchType || 'company';
    const targetName = company; // 検索対象名（企業名または人物名）

    if (!query || !targetName || !answer) {
      return new Response(
        JSON.stringify({ error: '必須項目を入力してください' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // 新しい検索結果を作成
    const searchResult = new SearchResult({
      userId: user.id,
      query: query.trim(),
      company: targetName.trim(), // 後方互換性のためcompanyフィールドを使用
      answer,
      metadata: { ...metadata, searchType: type }
    });

    await searchResult.save();

    const slug = targetName.trim().toLowerCase().replace(/\s+/g, '-');

    if (type === 'person') {
      // 人物コレクションに保存/更新
      try {
        const existingPerson = await Person.findOne({
          $or: [
            { slug: slug },
            { name: targetName.trim() }
          ]
        });

        if (existingPerson) {
          const isPlaceholder = !existingPerson.biography ||
            existingPerson.biography === '情報収集中...' ||
            existingPerson.biography.length < 50;

          const answerIsSignificantlyLonger = answer.length > existingPerson.biography.length * 2 &&
            answer.length - existingPerson.biography.length > 500;

          if (isPlaceholder || answerIsSignificantlyLonger) {
            await Person.updateOne(
              { _id: existingPerson._id },
              {
                $set: {
                  biography: answer,
                  sources: metadata?.sources || [],
                  lastSearchAt: new Date(),
                  company: metadata?.facts?.find((f: any) => f.label?.includes('所属') || f.label?.includes('会社'))?.value || existingPerson.company,
                  position: metadata?.facts?.find((f: any) => f.label?.includes('役職') || f.label?.includes('肩書'))?.value || existingPerson.position,
                  title: metadata?.facts?.find((f: any) => f.label?.includes('肩書'))?.value || existingPerson.title,
                },
                $inc: { searchCount: 1 }
              }
            );
            console.log(`Updated person biography for: ${targetName.trim()}`);
          } else {
            await Person.updateOne(
              { _id: existingPerson._id },
              {
                $inc: { searchCount: 1 },
                $set: { lastSearchAt: new Date() }
              }
            );
          }
        } else {
          // 新しい人物を作成
          const newPerson = new Person({
            name: targetName.trim(),
            slug: slug,
            biography: answer,
            company: metadata?.facts?.find((f: any) => f.label?.includes('所属') || f.label?.includes('会社'))?.value || '',
            position: metadata?.facts?.find((f: any) => f.label?.includes('役職'))?.value || '',
            title: metadata?.facts?.find((f: any) => f.label?.includes('肩書'))?.value || '',
            sources: metadata?.sources || [],
            searchCount: 1,
            averageRating: 0,
            dataSource: 'ai_search',
            lastSearchAt: new Date()
          });
          await newPerson.save();
          console.log(`Created new person: ${targetName.trim()}`);
        }
      } catch (personError) {
        console.error('Error updating person:', personError);
      }
    } else {
      // 会社コレクションに保存/更新（既存の処理）
      try {
        const existingCompany = await Company.findOne({
          $or: [
            { slug: slug },
            { name: targetName.trim() }
          ]
        });

        if (existingCompany) {
          const isPlaceholder = !existingCompany.description ||
            existingCompany.description === '情報収集中...' ||
            existingCompany.description.length < 50;

          const answerIsSignificantlyLonger = answer.length > existingCompany.description.length * 2 &&
            answer.length - existingCompany.description.length > 500;

          if (isPlaceholder || answerIsSignificantlyLonger) {
            await Company.updateOne(
              { _id: existingCompany._id },
              {
                $set: {
                  description: answer,
                  sources: metadata?.sources || [],
                  lastSearchAt: new Date()
                },
                $inc: { searchCount: 1 }
              }
            );
            console.log(`Updated company description for: ${targetName.trim()}`);
          } else {
            await Company.updateOne(
              { _id: existingCompany._id },
              {
                $inc: { searchCount: 1 },
                $set: { lastSearchAt: new Date() }
              }
            );
          }
        } else {
          const newCompany = new Company({
            name: targetName.trim(),
            slug: slug,
            description: answer,
            industry: metadata?.facts?.find((f: any) => f.label?.includes('業界'))?.value || '情報収集中...',
            founded: metadata?.facts?.find((f: any) => f.label?.includes('設立'))?.value || '情報収集中',
            employees: metadata?.facts?.find((f: any) => f.label?.includes('従業員'))?.value || '情報収集中',
            website: metadata?.facts?.find((f: any) => f.label?.includes('ウェブサイト'))?.value || '',
            sources: metadata?.sources || [],
            searchCount: 1,
            averageRating: 0,
            dataSource: 'ai_search',
            lastSearchAt: new Date()
          });
          await newCompany.save();
          console.log(`Created new company: ${targetName.trim()}`);
        }
      } catch (companyError) {
        console.error('Error updating company:', companyError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: '検索結果を保存しました',
        searchResult: {
          id: searchResult._id.toString(),
          query: searchResult.query,
          company: searchResult.company,
          answer: searchResult.answer,
          metadata: searchResult.metadata,
          createdAt: searchResult.createdAt
        },
        searchType: type,
        slug: slug
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Save search result error:', error);
    return new Response(
      JSON.stringify({ error: '検索結果の保存に失敗しました' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
});