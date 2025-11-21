import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb-client";
import connectDB from '@/lib/mongodb';
import Evaluation from '@/models/Evaluation';
import Company from '@/models/Company';
import { existsSync } from 'fs';
import { join } from 'path';

// ロゴ画像のパスを取得（存在しない場合はデフォルト画像を返す）
function getCompanyLogoUrl(companySlug: string): string {
  const logoPath = `/logos/${companySlug}.png`;
  const fullPath = join(process.cwd(), 'public', logoPath);

  if (existsSync(fullPath)) {
    return logoPath;
  }

  return '/default-company.png';
}

// 会社名から「株式会社」などの法人格を除去する関数
function getDisplayCompanyName(companyName: string): string {
  return companyName
    .replace(/^株式会社/, '')
    .replace(/株式会社$/, '')
    .replace(/^有限会社/, '')
    .replace(/有限会社$/, '')
    .replace(/^合同会社/, '')
    .replace(/合同会社$/, '')
    .replace(/^一般社団法人/, '')
    .replace(/一般社団法人$/, '')
    .replace(/^公益社団法人/, '')
    .replace(/公益社団法人$/, '')
    .trim();
}

export async function GET(req: NextRequest) {
  const entity = req.nextUrl.searchParams.get("entity") ?? "u_hikaru";

  try {
    await connectDB();

    // 指定ユーザーの評価データを取得
    const evaluations = await Evaluation.find({ userId: entity })
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    console.log(`Found ${evaluations.length} evaluations for user ${entity}`);
    
    if (evaluations.length > 0) {
      console.log('Sample evaluation:', evaluations[0]);
    }

    // ユーザーの基本情報を定義（実際の実装では認証システムから取得）
    const userProfiles: Record<string, any> = {
      'u_hikaru': {
        id: 'u_hikaru',
        label: 'Hikaru Tomura',
        type: 'user',
        score: 4.5,
        img: '/avatars/hikaru.jpg'
      },
      'u_akira': {
        id: 'u_akira', 
        label: 'Akira Sato',
        type: 'user',
        score: 4.7,
        img: '/avatars/akira.jpg'
      },
      'u_mika': {
        id: 'u_mika',
        label: 'Mika Tanaka', 
        type: 'user',
        score: 4.3,
        img: '/avatars/mika.jpg'
      }
    };

    const nodes = [];
    const edges = [];
    const processedCompanies = new Set<string>();

    // 中心ユーザーを追加
    const centerUser = userProfiles[entity];
    if (centerUser) {
      nodes.push(centerUser);
    }

    // 評価データから企業ノードとエッジを作成
    for (const evaluation of evaluations) {
      const companySlug = evaluation.companySlug;
      const companyId = `c_${companySlug}`;

      // まだ処理していない企業の場合
      if (!processedCompanies.has(companyId)) {
        // MongoDBから企業データを取得
        let company = await Company.findOne({ slug: companySlug }).lean();
        
        // 企業が見つからない場合は評価データから作成
        if (!company) {
          company = {
            name: evaluation.companyName,
            slug: companySlug,
            industry: '未分類',
            description: `${evaluation.companyName}の評価情報`,
            founded: '不明',
            employees: '不明',
            averageRating: evaluation.rating,
            searchCount: 1,
            isUserEdited: false,
            dataSource: 'auto'
          };
          
          // 新しい企業をデータベースに保存
          try {
            const newCompany = new Company(company);
            await newCompany.save();
            console.log(`Created new company: ${company.name}`);
          } catch (saveError) {
            console.log('Error saving company:', saveError);
          }
        }

        // 企業ノードを追加
        nodes.push({
          id: companyId,
          label: getDisplayCompanyName(company.name),
          type: 'company',
          score: company.averageRating || evaluation.rating,
          img: getCompanyLogoUrl(companySlug)
        });

        processedCompanies.add(companyId);
      }

      // エッジを追加（ユーザー → 企業の評価関係）
      edges.push({
        id: evaluation._id.toString(),
        source: evaluation.userId,
        target: companyId,
        weight: evaluation.rating / 5, // 5段階評価を0-1に正規化
        sentiment: evaluation.rating >= 4 ? 1 : evaluation.rating <= 2 ? -1 : 0,
        confidence: 0.9, // 実際の評価なので高い信頼度
        tags: ['evaluation'],
        metadata: {
          rating: evaluation.rating,
          comment: evaluation.comment,
          createdAt: evaluation.createdAt
        }
      });
    }

    // 評価がない場合のフォールバック（テストデータ）
    if (evaluations.length === 0) {
      console.log('No evaluations found, returning test data');
      
      // テスト用の企業データ
      const testCompanies = [
        { id: 'c_test1', label: 'TestCompany1', type: 'company', score: 4.0, img: '/default-company.png' },
        { id: 'c_test2', label: 'TestCompany2', type: 'company', score: 3.5, img: '/default-company.png' }
      ];
      
      nodes.push(...testCompanies);
      
      // テスト用のエッジ
      testCompanies.forEach((company, index) => {
        edges.push({
          id: `test_edge_${index}`,
          source: entity,
          target: company.id,
          weight: 0.8,
          sentiment: 1,
          confidence: 0.5,
          tags: ['test']
        });
      });
    }

    console.log(`Returning ${nodes.length} nodes and ${edges.length} edges`);
    return NextResponse.json({ nodes, edges });

  } catch (error) {
    console.error('Trust graph error:', error);
    return NextResponse.json({ 
      error: 'Failed to load trust graph',
      details: error.message 
    }, { status: 500 });
  }
}