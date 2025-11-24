'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Building2, User } from 'lucide-react';
import Link from 'next/link';
import { getRelationshipLabel } from '@/lib/relationship';
import { getCompanyLogoPath } from '@/lib/utils';
import { LockedFeature } from '@/components/OnboardingBanner';

interface Evaluation {
  id: string;
  rating: number;
  relationshipType: number;
  relationshipLabel: string;
  comment: string;
  timestamp: number;
  userId: string;
  userName: string;
  userImage: string;
  company: string;
  isAnonymous: boolean;
}

export default function TimelinePage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [relationshipFilter, setRelationshipFilter] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/timeline', {
        credentials: 'include'
      });

      if (response.ok) {
        const timelineData = await response.json();

        const formattedEvaluations = timelineData.map((item: any) => ({
          id: item._id,
          rating: item.rating,
          relationshipType: item.relationshipType,
          relationshipLabel: item.relationshipLabel,
          comment: item.comment,
          timestamp: new Date(item.createdAt).getTime(),
          userId: item.user?._id || item.userId || 'anonymous',
          userName: item.user?.name || 'Anonymous User',
          userImage: item.user?.image || '/avatar5.png',
          company: item.company?.name || 'Unknown Company',
          isAnonymous: item.isAnonymous || false
        }));

        setEvaluations(formattedEvaluations);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= count ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // フィルター済みの評価リスト
  const filteredEvaluations = relationshipFilter === 'all'
    ? evaluations
    : evaluations.filter(e => e.relationshipType === relationshipFilter);

  return (
    <LockedFeature featureName="タイムライン">
    {loading ? (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    ) : (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* ヘッダー */}
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Clock className="w-6 h-6 text-primary" />
                タイムライン
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                コミュニティの最新評価をチェック
                {evaluations.length > 0 && (
                  <span className="ml-2">
                    ({filteredEvaluations.length} / {evaluations.length}件)
                  </span>
                )}
              </p>
            </CardHeader>
          </Card>

          {/* フィルターボタン */}
          {evaluations.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setRelationshipFilter('all')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 'all'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    すべて
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(5)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 5
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100'
                    }`}
                  >
                    株主
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(4)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 4
                        ? 'bg-orange-600 text-white'
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                    }`}
                  >
                    投資先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(3)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 3
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                    }`}
                  >
                    協業先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(2)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 2
                        ? 'bg-green-600 text-white'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    取引先
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(1)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                    }`}
                  >
                    知人
                  </button>
                  <button
                    onClick={() => setRelationshipFilter(0)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      relationshipFilter === 0
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    未設定
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 評価一覧 */}
          {filteredEvaluations.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-500">まだ評価がありません</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* アバター */}
                      <div className="flex-shrink-0">
                        {!evaluation.isAnonymous && evaluation.userImage ? (
                          <img
                            src={evaluation.userImage}
                            alt={evaluation.userName}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/avatar5.png';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-500" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="font-medium text-gray-900">
                            {evaluation.isAnonymous ? '匿名ユーザー' : (evaluation.userName || 'Anonymous User')}
                          </span>
                          <Badge variant="outline">
                            {evaluation.relationshipLabel}
                          </Badge>
                          <span className="text-gray-600 text-sm">が</span>
                          <Link
                            href={`/company/${encodeURIComponent(evaluation.company)}`}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/10 hover:bg-primary/20 text-primary rounded-md text-sm font-medium transition-colors"
                          >
                            <img
                              src={getCompanyLogoPath(evaluation.company)}
                              alt={evaluation.company}
                              className="w-4 h-4 rounded object-contain flex-shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = '/logos/bond.png';
                                e.currentTarget.onerror = null;
                              }}
                            />
                            {evaluation.company}
                          </Link>
                          <span className="text-gray-600 text-sm">を評価</span>
                        </div>

                        {/* 評価と星 */}
                        <div className="flex items-center gap-3 mb-3">
                          {renderStars(evaluation.rating)}
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(evaluation.timestamp)}
                          </span>
                        </div>

                        {/* コメント */}
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {evaluation.comment}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Load More */}
          {evaluations.length >= 20 && (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="py-8 text-center">
                <Link
                  href="/timeline?limit=50"
                  className="text-primary hover:text-primary/80 font-medium"
                >
                  さらに読み込む
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    )}
    </LockedFeature>
  );
}
