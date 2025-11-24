"use client";
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import ShareableTrustMap from '@/components/trust-map/ShareableTrustMap';

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
    type: 'person';
    imageUrl: string;
    strength: number;
  }>;
}

export default function SharedTrustMapPage() {
  const params = useParams();
  const userId = params.userId as string;

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

    const nodes = [
      data.me,
      ...data.companies,
      ...(data.users || [])
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
        width={1200}
        height={640}
        identifier={userId}
      />
    </div>
  );
}
