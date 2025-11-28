"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ShareableTrustMap from '@/components/trust-map/ShareableTrustMap';
import { LockedFeature } from '@/components/OnboardingBanner';

interface ApiResponse {
  me: {
    id: string;
    odlId?: string;
    name: string;
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
    relationshipType?: number;
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
    relationshipType?: number;
    reviewedBy: string;
    reviewedByName?: string;
  }>;
  users?: Array<{
    id: string;
    name: string;
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

// 関係性フィルターのオプション
const RELATIONSHIP_FILTERS = [
  { value: 'all', label: 'すべて' },
  { value: 5, label: '株主' },
  { value: 4, label: '投資先' },
  { value: 3, label: '協業先' },
  { value: 2, label: '取引先' },
  { value: 1, label: '知人' },
  { value: 6, label: '友達' },
  { value: 0, label: '未設定' },
];

// ウィンドウサイズに応じたグラフサイズを計算するhook
function useResponsiveSize() {
  const [size, setSize] = useState({ width: 1200, height: 640 });

  const calculateSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // パディングを考慮（左右24pxずつ）
    const availableWidth = windowWidth - 48;
    // ヘッダー、タイトル、フィルターエリアを考慮
    const availableHeight = windowHeight - 300;

    // モバイル: 画面幅に合わせる（最小300px）
    // デスクトップ: 最大1200px
    const width = Math.min(Math.max(availableWidth, 300), 1200);

    // 高さは幅に対して約53%の比率を維持（640/1200）
    // ただしモバイルでは少し縦長に
    const aspectRatio = windowWidth < 640 ? 0.75 : 0.53;
    const height = Math.min(Math.max(Math.round(width * aspectRatio), 300), availableHeight);

    setSize({ width, height });
  }, []);

  useEffect(() => {
    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [calculateSize]);

  return size;
}

export default function UserTrustMapPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const { width, height } = useResponsiveSize();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [showCompanies, setShowCompanies] = useState(true);
  const [relationshipFilter, setRelationshipFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    if (!userId) return;

    // まず自分のトラストマップデータを取得してオーナーかどうか確認
    fetch('/api/trust-map')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load trust-map data');
        return res.json();
      })
      .then(myData => {
        // URLのuserIdが自分のIDと一致するか確認
        if (myData.me?.odlId === userId || myData.me?.id === userId) {
          // 自分のトラストマップ
          setIsOwner(true);
          setData(myData);
          setIsLoading(false);
        } else {
          // 他人のトラストマップ → シェアページにリダイレクト
          router.replace(`/trust-map/share/${userId}`);
        }
      })
      .catch((err) => {
        // 認証エラーの場合はシェアページにリダイレクト
        console.error('Error loading trust map:', err);
        router.replace(`/trust-map/share/${userId}`);
      });
  }, [userId, router]);

  // グラフデータを計算（dataが存在する場合のみ）
  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    // 企業表示フィルタリング
    let filteredCompanies = showCompanies ? data.companies : [];
    let filteredConnectedUsersCompanies = showCompanies ? (data.connectedUsersCompanies || []) : [];

    // 関係性フィルタリング
    if (relationshipFilter !== 'all') {
      filteredCompanies = filteredCompanies.filter(
        (c) => c.relationshipType === relationshipFilter
      );
      filteredConnectedUsersCompanies = filteredConnectedUsersCompanies.filter(
        (c) => c.relationshipType === relationshipFilter
      );
    }

    // 重複企業を統合（同じIDの企業は1つにまとめ、評価者情報を統合）
    const companyMap = new Map();

    // 現在のユーザーの企業を追加
    filteredCompanies.forEach((company: any) => {
      const normalizedId = normalizeCompanyName(company.id);
      companyMap.set(normalizedId, {
        ...company,
        id: normalizedId,
        reviewedBy: [company.reviewedBy || data.me.id],
        reviewers: [{ name: company.reviewedBy || data.me.id, displayName: company.reviewedByName || data.me.name, strength: company.strength }]
      });
    });

    // 接続ユーザーの企業を追加（重複の場合は統合）
    filteredConnectedUsersCompanies.forEach((company: any) => {
      const normalizedId = normalizeCompanyName(company.id);
      if (companyMap.has(normalizedId)) {
        const existing = companyMap.get(normalizedId);
        if (!existing.reviewedBy.includes(company.reviewedBy)) {
          existing.reviewedBy.push(company.reviewedBy);
          existing.reviewers.push({ name: company.reviewedBy, displayName: company.reviewedByName, strength: company.strength });
        }
      } else {
        companyMap.set(normalizedId, {
          ...company,
          id: normalizedId,
          reviewedBy: [company.reviewedBy],
          reviewers: [{ name: company.reviewedBy, displayName: company.reviewedByName, strength: company.strength }]
        });
      }
    });

    const unifiedCompanies = Array.from(companyMap.values());

    // ノードを作成（人物ノードにnameを追加）
    const nodes = [
      { ...data.me, displayName: data.me.name },
      ...unifiedCompanies,
      ...(data.users || []).map((u: any) => ({ ...u, displayName: u.name }))
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
  }, [data, showCompanies, relationshipFilter]);

  return (
    <div className="min-h-screen bg-bond-cream">
    <LockedFeature featureName="信頼ネットワーク" requiredEvaluations={1}>
      {error ? (
        <div className="p-6 text-red-600">エラー: {error}</div>
      ) : isLoading ? (
        <div className="p-6">読み込み中...</div>
      ) : !data ? (
        <div className="p-6 text-gray-600">データがありません</div>
      ) : (
      <div className="p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
          <h1 className="text-lg sm:text-xl font-semibold">信頼ネットワーク</h1>
        </div>

        {/* フィルターコントロール（オーナーのみ表示） */}
        {isOwner && (
          <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
            {/* 企業表示トグル */}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-600">企業:</span>
              <button
                onClick={() => setShowCompanies(!showCompanies)}
                className={`px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors ${
                  showCompanies
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {showCompanies ? '表示中' : '非表示'}
              </button>
            </div>

            {/* 関係性フィルター */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm text-gray-600">関係性:</span>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {RELATIONSHIP_FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setRelationshipFilter(filter.value as number | 'all')}
                    className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === filter.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <ShareableTrustMap
          data={graphData}
          centerMode="avatar"
          width={width}
          height={height}
          identifier={data.me?.odlId || data.me?.id}
        />
      </div>
      )}
    </LockedFeature>
    </div>
  );
}
