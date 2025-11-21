"use client";
import { useState, useEffect } from 'react';
import BondHeartGraph from '@/components/BondHeartGraph';

interface ApiResponse {
  me: {
    id: string;
    type: 'person';
    isCenter: boolean;
    imageUrl: string;
    reviewCount: number;
  };
  companies: Array<{
    id: string;
    fullName?: string;
    type: 'org';
    imageUrl: string;
    reviewCount: number;
    strength: number;
    industry?: string;
    description?: string;
    founded?: string;
    employees?: string;
    website?: string;
    searchCount?: number;
    averageRating?: number;
  }>;
  connectedUsersCompanies?: Array<{
    id: string;
    fullName?: string;
    type: 'org';
    imageUrl: string;
    reviewCount: number;
    strength: number;
    reviewedBy: string;
  }>;
  users?: Array<{
    id: string;
    type: 'person';
    imageUrl: string;
    company?: string;
    position?: string;
    strength: number;
  }>;
}

export default function TrustMapPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompanies, setShowCompanies] = useState(true);

  useEffect(() => {
    fetch('/api/trust-map')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load trust-map data');
        return res.json();
      })
      .then(data => {
        console.log('=== Trust Map API Response ===');
        console.log('Me:', data.me);
        console.log('My companies count:', data.companies?.length || 0);
        console.log('Connected users companies count:', data.connectedUsersCompanies?.length || 0);
        console.log('Users (connected):', data.users);
        console.log('Users count:', data.users?.length || 0);
        if (data.users && data.users.length > 0) {
          data.users.forEach((user, index) => {
            console.log(`User ${index}:`, { id: user.id, type: user.type, imageUrl: user.imageUrl });
          });
        }
        if (data.connectedUsersCompanies && data.connectedUsersCompanies.length > 0) {
          data.connectedUsersCompanies.forEach((company, index) => {
            console.log(`Connected user company ${index}:`, { id: company.id, reviewedBy: company.reviewedBy });
          });
        }
        setData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }
  
  if (isLoading) {
    return <div className="p-6">読み込み中...</div>;
  }

  if (!data) {
    return <div className="p-6 text-gray-600">データがありません</div>;
  }

  console.log('=== Building Graph Data ===');
  console.log('Me node:', data.me);
  console.log('My companies:', data.companies?.length || 0);
  console.log('Connected users companies:', data.connectedUsersCompanies?.length || 0);
  console.log('Users:', data.users?.length || 0);
  
  // 企業表示フィルタリング
  const filteredCompanies = showCompanies ? data.companies : [];
  const filteredConnectedUsersCompanies = showCompanies ? (data.connectedUsersCompanies || []) : [];

  // 重複企業を統合（同じIDの企業は1つにまとめ、評価者情報を統合）
  const mergedCompanies: any[] = [];
  const companyMap = new Map();
  
  // 企業名の正規化関数（異なる形式の同一企業名を統一）
  const normalizeCompanyName = (name: string): string => {
    return name.replace(/^株式会社/, '').trim();
  };

  // 現在のユーザーの企業を追加
  filteredCompanies.forEach((company: any) => {
    const normalizedId = normalizeCompanyName(company.id);
    companyMap.set(normalizedId, {
      ...company,
      id: normalizedId, // 正規化されたIDを使用
      reviewedBy: [company.reviewedBy || data.me.id],
      reviewers: [{ name: company.reviewedBy || data.me.id, strength: company.strength }]
    });
  });
  
  // 接続ユーザーの企業を追加（重複の場合は統合）
  filteredConnectedUsersCompanies.forEach((company: any) => {
    const normalizedId = normalizeCompanyName(company.id);
    if (companyMap.has(normalizedId)) {
      // 既存の企業に評価者を追加
      const existing = companyMap.get(normalizedId);
      if (!existing.reviewedBy.includes(company.reviewedBy)) {
        existing.reviewedBy.push(company.reviewedBy);
        existing.reviewers.push({ name: company.reviewedBy, strength: company.strength });
      }
    } else {
      // 新しい企業として追加
      companyMap.set(normalizedId, {
        ...company,
        id: normalizedId, // 正規化されたIDを使用
        reviewedBy: [company.reviewedBy],
        reviewers: [{ name: company.reviewedBy, strength: company.strength }]
      });
    }
  });
  
  // 統合された企業配列を作成
  const unifiedCompanies = Array.from(companyMap.values());

  // すべてのノードを結合（自分、統合された企業、接続ユーザー）
  const nodes = [
    data.me, 
    ...unifiedCompanies,
    ...(data.users || [])
  ];
  console.log('Total nodes for graph:', nodes.length);
  
  // 統合された企業から各評価者へのリンクを生成
  const companyLinks: any[] = [];
  
  unifiedCompanies.forEach((company: any) => {
    company.reviewers.forEach((reviewer: any) => {
      companyLinks.push({
        source: reviewer.name,
        target: company.id,
        strength: reviewer.strength || 1
      });
    });
  });

  const links = [
    // 統合された企業への評価者からのリンク
    ...companyLinks,
    // 接続ユーザーとの人間関係リンク
    ...(data.users || []).map((u: any) => ({
      source: data.me.id,
      target: u.id,
      strength: u.strength || 1
    }))
  ];
  
  console.log('=== Link Generation Debug ===');
  console.log('Total links for graph:', links.length);
  console.log('Links breakdown:');
  console.log('- Company evaluation links:', companyLinks.length);
  console.log('- User connection links:', data.users?.length || 0);
  console.log('- Total unified companies:', unifiedCompanies.length);
  
  console.log('\n=== Unified Companies ===');
  unifiedCompanies.forEach((company: any) => {
    console.log(`Company: ${company.id}, Reviewers: [${company.reviewedBy.join(', ')}]`);
  });
  
  console.log('\n=== Detailed Links ===');
  links.forEach((link, index) => {
    console.log(`Link ${index}: ${link.source} → ${link.target} (strength: ${link.strength})`);
  });
  
  console.log('\n=== Node IDs Check ===');
  console.log('Me ID:', data.me.id);
  data.users?.forEach((user: any) => console.log('User ID:', user.id));
  console.log('Unified company IDs:', unifiedCompanies.map((c: any) => c.id));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">信頼ネットワーク</h1>
        <button
          onClick={() => setShowCompanies(!showCompanies)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showCompanies 
              ? 'bg-blue-500 text-white hover:bg-blue-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {showCompanies ? '企業を非表示' : '企業を表示'}
        </button>
      </div>
      <BondHeartGraph
        data={{ nodes, links }}
        centerMode="avatar"
        width={1200}
        height={640}
      />
    </div>
  );
}