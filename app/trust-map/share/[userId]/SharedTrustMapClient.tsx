"use client";
import { useState, useEffect, useMemo, useCallback } from 'react';
import ShareableTrustMap from '@/components/trust-map/ShareableTrustMap';

// ウィンドウサイズに応じたグラフサイズを計算するhook
function useResponsiveSize() {
  const [size, setSize] = useState({ width: 800, height: 500 });

  const calculateSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // パディングを考慮（左右24pxずつ）
    const availableWidth = windowWidth - 48;
    // ヘッダー、タイトル、ボタンエリアを考慮
    const availableHeight = windowHeight - 250;

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

interface ApiResponse {
  me: {
    id: string;
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
  }>;
  users?: Array<{
    id: string;
    name: string;
    type: 'person';
    imageUrl: string;
    strength: number;
  }>;
}

interface SharedTrustMapClientProps {
  userId: string;
}

export default function SharedTrustMapClient({ userId }: SharedTrustMapClientProps) {
  const { width, height } = useResponsiveSize();

  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    fetch(`/api/trust-map/share/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load trust-map data');
        return res.json();
      })
      .then(data => {
        setData(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false));
  }, [userId]);

  const graphData = useMemo(() => {
    if (!data) return { nodes: [], links: [] };

    // 各ノードにdisplayNameを設定
    const meNode = {
      ...data.me,
      displayName: data.me.name,
    };

    const companyNodes = data.companies.map(c => ({
      ...c,
      displayName: c.id, // idは既に表示用の短い名前
    }));

    const userNodes = (data.users || []).map(u => ({
      ...u,
      displayName: u.name,
    }));

    const nodes = [
      meNode,
      ...companyNodes,
      ...userNodes,
    ];

    const links = [
      ...data.companies.map((c: any) => ({
        source: data.me.id,
        target: c.id,
        strength: c.strength || 1
      })),
      ...(data.users || []).map((u: any) => ({
        source: data.me.id,
        target: u.id,
        strength: u.strength || 1
      }))
    ];

    return { nodes, links };
  }, [data]);

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <p className="text-gray-600">このトラストマップは存在しないか、非公開です。</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-6 text-center">読み込み中...</div>;
  }

  if (!data) {
    return <div className="p-6 text-center text-gray-600">データがありません</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-semibold">{data.me.name}さんの信頼ネットワーク</h1>
          <p className="text-sm text-gray-500">Trust Network</p>
        </div>
      </div>
      <ShareableTrustMap
        data={graphData}
        centerMode="avatar"
        width={width}
        height={height}
        identifier={userId}
      />
    </div>
  );
}
