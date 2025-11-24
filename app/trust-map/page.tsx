"use client";
import { useState, useEffect, useMemo } from 'react';
import ShareableTrustMap from '@/components/trust-map/ShareableTrustMap';
import { LockedFeature } from '@/components/OnboardingBanner';

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

// 企業名の正規化関数（異なる形式の同一企業名を統一）
const normalizeCompanyName = (name: string): string => {
  return name.replace(/^株式会社/, '').trim();
};

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
        setData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, []);

  // グラフデータを計算（dataが存在する場合のみ）
  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    // 企業表示フィルタリング
    const filteredCompanies = showCompanies ? data.companies : [];
    const filteredConnectedUsersCompanies = showCompanies ? (data.connectedUsersCompanies || []) : [];

    // 重複企業を統合（同じIDの企業は1つにまとめ、評価者情報を統合）
    const companyMap = new Map();

    // 現在のユーザーの企業を追加
    filteredCompanies.forEach((company: any) => {
      const normalizedId = normalizeCompanyName(company.id);
      companyMap.set(normalizedId, {
        ...company,
        id: normalizedId,
        reviewedBy: [company.reviewedBy || data.me.id],
        reviewers: [{ name: company.reviewedBy || data.me.id, strength: company.strength }]
      });
    });

    // 接続ユーザーの企業を追加（重複の場合は統合）
    filteredConnectedUsersCompanies.forEach((company: any) => {
      const normalizedId = normalizeCompanyName(company.id);
      if (companyMap.has(normalizedId)) {
        const existing = companyMap.get(normalizedId);
        if (!existing.reviewedBy.includes(company.reviewedBy)) {
          existing.reviewedBy.push(company.reviewedBy);
          existing.reviewers.push({ name: company.reviewedBy, strength: company.strength });
        }
      } else {
        companyMap.set(normalizedId, {
          ...company,
          id: normalizedId,
          reviewedBy: [company.reviewedBy],
          reviewers: [{ name: company.reviewedBy, strength: company.strength }]
        });
      }
    });

    const unifiedCompanies = Array.from(companyMap.values());

    // ノードを作成
    const nodes = [
      data.me,
      ...unifiedCompanies,
      ...(data.users || [])
    ];

    // リンクを作成
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
      ...companyLinks,
      ...(data.users || []).map((u: any) => ({
        source: data.me.id,
        target: u.id,
        strength: u.strength || 1
      }))
    ];

    return { nodes, links };
  }, [data, showCompanies]);

  return (
    <LockedFeature featureName="信頼ネットワーク" requiredEvaluations={1}>
      {error ? (
        <div className="p-6 text-red-600">{error}</div>
      ) : isLoading ? (
        <div className="p-6">読み込み中...</div>
      ) : !data ? (
        <div className="p-6 text-gray-600">データがありません</div>
      ) : (
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
        <ShareableTrustMap
          data={graphData}
          centerMode="avatar"
          width={1200}
          height={640}
          identifier={data.me?.id}
        />
      </div>
      )}
    </LockedFeature>
  );
}