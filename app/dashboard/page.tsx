'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  User, Star, TrendingUp, Building2, Settings, Bell, 
  Activity, BarChart3, Users, MessageCircle, Award,
  PlusCircle, ExternalLink, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Rating } from '@/components/Rating'
import { useAuth } from '@/lib/auth'

// 役職の日本語マッピング
const roleMapping = {
  founder: '創業者',
  investor: '投資家',
  employee: '従業員',
  advisor: 'アドバイザー',
  other: 'その他'
}

// バッジ定義
interface BadgeDefinition {
  id: string
  name: string
  description: string
  requirement: number
  icon: 'award' | 'users' | 'messageCircle' | 'trendingUp' | 'star'
  color: string
  checkFn: (stats: UserStats) => boolean
}

interface UserStats {
  evaluationCount: number    // 評価した企業数
  totalReviews: number       // 総評価件数
  connectionCount: number    // 接続数
  trustScore: number         // 信頼スコア
  monthlyEvaluations: number // 今月の評価数
}

const badgeDefinitions: BadgeDefinition[] = [
  {
    id: 'evaluation-king',
    name: '評価王',
    description: '10社評価',
    requirement: 10,
    icon: 'award',
    color: 'yellow',
    checkFn: (stats) => stats.evaluationCount >= 10
  },
  {
    id: 'networker',
    name: 'ネットワーカー',
    description: '50人接続',
    requirement: 50,
    icon: 'users',
    color: 'blue',
    checkFn: (stats) => stats.connectionCount >= 50
  },
  {
    id: 'reviewer',
    name: 'レビュアー',
    description: '25件投稿',
    requirement: 25,
    icon: 'messageCircle',
    color: 'purple',
    checkFn: (stats) => stats.totalReviews >= 25
  },
  {
    id: 'early-adopter',
    name: '早期発見者',
    description: '初月に5社評価',
    requirement: 5,
    icon: 'trendingUp',
    color: 'green',
    checkFn: (stats) => stats.monthlyEvaluations >= 5
  },
  {
    id: 'trust-master',
    name: '信頼マスター',
    description: '信頼スコア80以上',
    requirement: 80,
    icon: 'star',
    color: 'orange',
    checkFn: (stats) => stats.trustScore >= 80
  }
]

// 最近の活動は動的に生成

// 評価した企業は動的に取得

export default function DashboardPage() {
  const { user } = useAuth()
  const [evaluatedCompanies, setEvaluatedCompanies] = useState<any[]>([])
  const [searchHistory, setSearchHistory] = useState<any[]>([])
  const [connectionCount, setConnectionCount] = useState(0)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ユーザーデータの取得
  const userData = user ? {
    name: user.name || 'ユーザー',
    email: user.email || '',
    role: roleMapping[user.role as keyof typeof roleMapping] || user.role || 'ユーザー',
    avatar: user.image || null,
    memberSince: user.createdAt ? new Date(user.createdAt).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }) : new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' }),
    company: user.company || ''
  } : null
  const publicProfilePath = user?.username
    ? `/users/${encodeURIComponent(user.username)}`
    : user?.email
      ? `/users/${encodeURIComponent(user.email)}`
      : null

  useEffect(() => {
    // データベースから評価履歴を取得
    const loadEvaluationHistory = async () => {
      try {
        const response = await fetch('/api/evaluations', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // 企業別にグループ化して統計を計算
            const companiesMap = new Map();
            data.evaluations.forEach((evaluation: any) => {
              if (!companiesMap.has(evaluation.companySlug)) {
                companiesMap.set(evaluation.companySlug, {
                  name: evaluation.companyName,
                  evaluations: [],
                  averageRating: 0,
                  lastEvaluated: new Date(evaluation.createdAt)
                });
              }
              const company = companiesMap.get(evaluation.companySlug);
              company.evaluations.push({
                id: evaluation.id,
                rating: evaluation.rating,
                comment: evaluation.comment,
                timestamp: new Date(evaluation.createdAt).getTime()
              });
              if (new Date(evaluation.createdAt) > company.lastEvaluated) {
                company.lastEvaluated = new Date(evaluation.createdAt);
              }
            });

            // 平均評価を計算
            const history = Array.from(companiesMap.values()).map(company => {
              company.averageRating = company.evaluations.reduce((sum: number, e: any) => sum + e.rating, 0) / company.evaluations.length;
              return company;
            });

            history.sort((a, b) => b.lastEvaluated.getTime() - a.lastEvaluated.getTime());
            setEvaluatedCompanies(history);
          }
        }
      } catch (e) {
        console.error('Error loading evaluation history:', e);
        setError('評価履歴の読み込みに失敗しました');
      }
    };

    // データベースから検索履歴を取得
    const loadSearchHistory = async () => {
      try {
        const response = await fetch('/api/search-history?limit=10', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setSearchHistory(data.searchHistory);
          }
        }
      } catch (e) {
        console.error('Error loading search history:', e);
        setError('検索履歴の読み込みに失敗しました');
      }
    };

    // 接続数を取得
    const loadConnectionCount = async () => {
      try {
        const response = await fetch('/api/connections?status=accepted', {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setConnectionCount(data.stats?.accepted || 0);
        }
      } catch (e) {
        console.error('Error loading connection count:', e);
      }
    };

    const loadData = async () => {
      if (user) {
        setIsLoadingData(true);
        setError(null);
        try {
          await Promise.all([loadEvaluationHistory(), loadSearchHistory(), loadConnectionCount()]);
        } catch (e) {
          console.error('Error loading dashboard data:', e);
          setError('データの読み込みに失敗しました');
        } finally {
          setIsLoadingData(false);
        }
      } else {
        setIsLoadingData(false);
      }
    };

    loadData();
  }, [user])

  // ローディング中の表示
  if (isLoadingData && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // ユーザーが認証されていない場合のリダイレクト処理
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-ash-surface/30">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <CardTitle>ログインが必要です</CardTitle>
            <CardDescription>
              マイページを表示するにはログインしてください
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/login" className="block">
              <Button className="w-full">ログインする</Button>
            </Link>
            <Link href="/signup" className="block">
              <Button variant="outline" className="w-full">新規登録</Button>
            </Link>
            <Link href="/" className="block text-center text-sm text-ash-muted hover:text-ash-text">
              ← ホームに戻る
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>再読み込み</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-ash-surface/30">
      {/* Header */}
      <div className="bg-white border-b border-ash-line">
        <div className="container-narrow mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-ash-text">マイページ</h1>
              <p className="text-sm text-ash-muted hidden md:block">あなたのアクティビティと評価</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/notifications">
                <Button variant="ghost" size="sm">
                  <Bell className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">通知</span>
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm">
                  <Settings className="w-4 h-4" />
                  <span className="ml-2 hidden md:inline">設定</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-narrow mx-auto px-4 py-8">
        {/* ユーザープロフィール */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row items-start gap-4 md:gap-6">
                {userData.avatar ? (
                  <img
                    src={userData.avatar}
                    alt={userData.name}
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center text-white text-xl md:text-2xl font-bold">
                    {userData.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3 mb-2">
                    <h2 className="text-xl md:text-2xl font-bold text-ash-text">{userData.name}</h2>
                    <Badge variant="outline">{userData.role}</Badge>
                  </div>
                  <p className="text-sm text-ash-muted mb-1">{userData.email}</p>
                  {userData.company && (
                    <p className="text-sm text-ash-muted mb-4">{userData.company}</p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm mt-4">
                    <div className="text-center md:text-left">
                      <div className="font-semibold text-lg text-ash-text">
                        {evaluatedCompanies.length > 0 ?
                          (evaluatedCompanies.reduce((sum, company) => sum + company.averageRating, 0) / evaluatedCompanies.length).toFixed(1)
                          : '0.0'}
                      </div>
                      <div className="text-xs text-ash-muted">平均評価</div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="font-semibold text-lg text-ash-text">
                        {evaluatedCompanies.reduce((sum, company) => sum + company.evaluations.length, 0)}
                      </div>
                      <div className="text-xs text-ash-muted">レビュー数</div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="font-semibold text-lg text-ash-text">{evaluatedCompanies.length}</div>
                      <div className="text-xs text-ash-muted">評価企業数</div>
                    </div>
                    <div className="text-center md:text-left">
                      <div className="font-semibold text-lg text-ash-text">{searchHistory.length}</div>
                      <div className="text-xs text-ash-muted">検索回数</div>
                    </div>
                  </div>
                </div>
                <div className="flex md:flex-col gap-2 w-full md:w-auto">
                  <Link href="/settings" className="flex-1 md:flex-none">
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">プロフィール編集</span>
                    </Button>
                  </Link>
                  <Link href="/trust-map" className="flex-1 md:flex-none">
                    <Button variant="outline" size="sm" className="w-full">
                      <Users className="w-4 h-4 md:mr-2" />
                      <span className="hidden md:inline">Trust Map</span>
                    </Button>
                  </Link>
                  {publicProfilePath && (
                    <Link href={publicProfilePath} className="flex-1 md:flex-none" target="_blank">
                      <Button size="sm" className="w-full">
                        <ExternalLink className="w-4 h-4 md:mr-2" />
                        <span className="hidden md:inline">公開プロフィール</span>
                      </Button>
                    </Link>
                  )}
                  <div className="hidden md:block text-right mt-2">
                    <p className="text-xs text-ash-muted">メンバー歴</p>
                    <p className="text-xs font-medium">{userData.memberSince}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 獲得バッジ */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                獲得バッジ
              </CardTitle>
              <CardDescription>
                <Link href="/features#badges" className="text-blue-600 hover:text-blue-700 hover:underline">
                  バッジ獲得条件を見る →
                </Link>
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // ユーザー統計を計算
                const totalReviews = evaluatedCompanies.reduce(
                  (sum, company) => sum + company.evaluations.length,
                  0
                );
                const thisMonth = new Date().getMonth();
                const thisYear = new Date().getFullYear();
                const monthlyEvaluations = evaluatedCompanies.reduce((count, company) => {
                  return count + company.evaluations.filter((e: any) => {
                    const evalDate = new Date(e.timestamp);
                    return evalDate.getMonth() === thisMonth && evalDate.getFullYear() === thisYear;
                  }).length;
                }, 0);

                const userStats: UserStats = {
                  evaluationCount: evaluatedCompanies.length,
                  totalReviews,
                  connectionCount,
                  trustScore: 0, // TODO: 信頼スコアAPIから取得
                  monthlyEvaluations
                };

                const getIconComponent = (iconType: string, isEarned: boolean) => {
                  const colorClass = isEarned ? '' : 'text-gray-400';
                  switch (iconType) {
                    case 'award':
                      return <Award className={`w-8 h-8 ${isEarned ? 'text-yellow-600' : colorClass}`} />;
                    case 'users':
                      return <Users className={`w-8 h-8 ${isEarned ? 'text-blue-600' : colorClass}`} />;
                    case 'messageCircle':
                      return <MessageCircle className={`w-8 h-8 ${isEarned ? 'text-purple-600' : colorClass}`} />;
                    case 'trendingUp':
                      return <TrendingUp className={`w-8 h-8 ${isEarned ? 'text-green-600' : colorClass}`} />;
                    case 'star':
                      return <Star className={`w-8 h-8 ${isEarned ? 'text-orange-600' : colorClass}`} />;
                    default:
                      return <Award className={`w-8 h-8 ${colorClass}`} />;
                  }
                };

                const getBgColor = (color: string, isEarned: boolean) => {
                  if (!isEarned) return 'bg-gray-100';
                  switch (color) {
                    case 'yellow': return 'bg-yellow-100';
                    case 'blue': return 'bg-blue-100';
                    case 'purple': return 'bg-purple-100';
                    case 'green': return 'bg-green-100';
                    case 'orange': return 'bg-orange-100';
                    default: return 'bg-gray-100';
                  }
                };

                const earnedBadges = badgeDefinitions.filter(badge => badge.checkFn(userStats));

                if (earnedBadges.length === 0) {
                  return (
                    <div className="text-center py-8 text-gray-500">
                      <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>まだ獲得したバッジはありません</p>
                      <Link href="/features#badges" className="text-sm mt-2 text-blue-600 hover:text-blue-700 hover:underline inline-block">
                        バッジ獲得条件を確認する →
                      </Link>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                    {earnedBadges.map((badge) => (
                      <div key={badge.id} className="text-center">
                        <div className={`w-16 h-16 ${getBgColor(badge.color, true)} rounded-full flex items-center justify-center mx-auto mb-2 relative`}>
                          {getIconComponent(badge.icon, true)}
                          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            ✓
                          </div>
                        </div>
                        <p className="text-xs font-medium">{badge.name}</p>
                        <p className="text-xs text-gray-500">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>

        {/* 統計情報カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ash-muted mb-1">今月の評価</p>
                  <p className="text-2xl font-bold text-ash-text">
                    {(() => {
                      const thisMonth = new Date().getMonth();
                      const thisYear = new Date().getFullYear();
                      return evaluatedCompanies.reduce((count, company) => {
                        return count + company.evaluations.filter((e: any) => {
                          const evalDate = new Date(e.timestamp);
                          return evalDate.getMonth() === thisMonth && evalDate.getFullYear() === thisYear;
                        }).length;
                      }, 0);
                    })()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ash-muted mb-1">平均評価スコア</p>
                  <p className="text-2xl font-bold text-ash-text">
                    {evaluatedCompanies.length > 0
                      ? (evaluatedCompanies.reduce((sum, company) => sum + company.averageRating, 0) / evaluatedCompanies.length).toFixed(1)
                      : '0.0'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-ash-muted mb-1">評価企業数</p>
                  <p className="text-2xl font-bold text-ash-text">{evaluatedCompanies.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* 最近の活動 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  最近の活動
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    // 評価とサーチ履歴を合わせて最近の活動を作成
                    const activities: any[] = []
                    
                    // 評価履歴から活動を追加
                    evaluatedCompanies.forEach(company => {
                      company.evaluations.forEach((evaluation: any) => {
                        activities.push({
                          id: `eval-${evaluation.id}`,
                          type: 'evaluation',
                          action: `${company.name}を評価しました`,
                          rating: evaluation.rating,
                          timestamp: evaluation.timestamp,
                          date: new Date(evaluation.timestamp).toLocaleDateString('ja-JP'),
                          icon: Star
                        })
                      })
                    })
                    
                    // 検索履歴から活動を追加
                    searchHistory.forEach((search, index) => {
                      activities.push({
                        id: `search-${index}`,
                        type: 'search',
                        action: `${search.query}を検索しました`,
                        timestamp: new Date(search.createdAt).getTime(),
                        date: search.date,
                        icon: Activity
                      })
                    })
                    
                    // タイムスタンプでソートして最新5件を取得
                    const recentActivities = activities
                      .sort((a, b) => b.timestamp - a.timestamp)
                      .slice(0, 5)
                    
                    if (recentActivities.length === 0) {
                      return (
                        <div className="text-center py-8 text-ash-muted">
                          <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>まだ活動がありません</p>
                          <Link href="/search">
                            <Button className="mt-4">
                              検索を開始する
                            </Button>
                          </Link>
                        </div>
                      )
                    }
                    
                    return recentActivities.map((activity) => {
                      const IconComponent = activity.icon
                      return (
                        <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg bg-ash-surface/30">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-ash-text">{activity.action}</p>
                            <div className="flex items-center gap-2">
                              {activity.rating && (
                                <Rating value={activity.rating} readonly size="sm" />
                              )}
                              <span className="text-sm text-ash-muted">{activity.date}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </CardContent>
            </Card>

            {/* 評価した企業 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    評価した企業
                  </CardTitle>
                  <Link href="/search">
                    <Button variant="outline" size="sm">
                      <PlusCircle className="w-4 h-4 mr-2" />
                      新しく評価
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {evaluatedCompanies.length > 0 ? (
                  <div className="space-y-4">
                    {evaluatedCompanies.map((company) => (
                      <div key={company.name} className="flex items-center justify-between p-4 rounded-lg border border-ash-line">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-ash-text capitalize">{company.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {company.evaluations.length}件の評価
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3">
                            <Rating value={company.averageRating} readonly size="sm" />
                            <span className="text-sm text-ash-muted">
                              {company.lastEvaluated.toLocaleDateString('ja-JP')}
                            </span>
                          </div>
                          <div className="mt-2">
                            <p className="text-xs text-ash-muted">
                              最新の評価: {company.evaluations[company.evaluations.length - 1]?.comment.substring(0, 50)}...
                            </p>
                          </div>
                        </div>
                        <Link 
                          href={`/search?q=${encodeURIComponent(company.name)}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-ash-muted">
                    <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>まだ評価した企業がありません</p>
                    <Link href="/search">
                      <Button className="mt-4">
                        企業を検索して評価する
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 検索履歴 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  検索履歴
                </CardTitle>
              </CardHeader>
              <CardContent>
                {searchHistory.length > 0 ? (
                  <div className="space-y-3">
                    {searchHistory.map((search, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-ash-surface/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-ash-text">{search.query}</span>
                            <Badge variant="outline" className="text-xs">
                              {search.mode === 'company' ? '企業' : '人物'}
                            </Badge>
                          </div>
                          <span className="text-sm text-ash-muted">{search.date}</span>
                        </div>
                        <Link 
                          href={`/search?q=${encodeURIComponent(search.query)}&mode=${search.mode}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-ash-muted">
                    <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>検索履歴がありません</p>
                    <Link href="/search">
                      <Button className="mt-4">
                        検索を開始する
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PlusCircle className="w-5 h-5" />
                  クイックアクション
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/search" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Building2 className="w-4 h-4 mr-2" />
                    企業を評価する
                  </Button>
                </Link>
                <Link href="/trust-map" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Trust Mapを見る
                  </Button>
                </Link>
                <Link href="/connections" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    つながりを管理
                  </Button>
                </Link>
                <Link href="/messages" className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    メッセージ
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 統計カード */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  あなたの統計
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-ash-muted">今月のレビュー</span>
                    <span className="font-semibold">
                      {(() => {
                        const thisMonth = new Date();
                        thisMonth.setDate(1);
                        return evaluatedCompanies.reduce((count, company) => {
                          return count + company.evaluations.filter((evaluation: any) => {
                            const evalDate = new Date(evaluation.timestamp);
                            return evalDate >= thisMonth;
                          }).length;
                        }, 0);
                      })()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ash-muted">平均評価</span>
                    <span className="font-semibold">
                      {evaluatedCompanies.length > 0 ? 
                        (evaluatedCompanies.reduce((sum, company) => sum + company.averageRating, 0) / evaluatedCompanies.length).toFixed(1) 
                        : '0.0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ash-muted">企業評価数</span>
                    <span className="font-semibold">{evaluatedCompanies.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* おすすめ企業 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  おすすめ企業
                </CardTitle>
                <CardDescription>
                  あなたの評価傾向に基づく
                </CardDescription>
              </CardHeader>
              <CardContent>
                {evaluatedCompanies.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-center py-4 text-ash-muted">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">評価傾向を分析中...</p>
                      <p className="text-xs">より多くの企業を評価するとおすすめが表示されます</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-ash-muted">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">まだおすすめできる企業がありません</p>
                    <Link href="/search">
                      <Button size="sm" className="mt-2">
                        企業を評価する
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 実績バッジ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  獲得バッジ
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  // ユーザー統計を計算
                  const totalReviews = evaluatedCompanies.reduce(
                    (sum, company) => sum + company.evaluations.length,
                    0
                  );
                  const thisMonth = new Date().getMonth();
                  const thisYear = new Date().getFullYear();
                  const monthlyEvaluations = evaluatedCompanies.reduce((count, company) => {
                    return count + company.evaluations.filter((e: any) => {
                      const evalDate = new Date(e.timestamp);
                      return evalDate.getMonth() === thisMonth && evalDate.getFullYear() === thisYear;
                    }).length;
                  }, 0);

                  const userStats: UserStats = {
                    evaluationCount: evaluatedCompanies.length,
                    totalReviews,
                    connectionCount,
                    trustScore: 0,
                    monthlyEvaluations
                  };

                  const earnedBadges = badgeDefinitions.filter(badge => badge.checkFn(userStats));

                  const getBadgeStyle = (color: string) => {
                    switch (color) {
                      case 'yellow': return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', icon: 'text-yellow-600' };
                      case 'blue': return { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' };
                      case 'purple': return { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', icon: 'text-purple-600' };
                      case 'green': return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' };
                      case 'orange': return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' };
                      default: return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-800', icon: 'text-gray-600' };
                    }
                  };

                  const getIcon = (iconType: string, iconClass: string) => {
                    switch (iconType) {
                      case 'award': return <Award className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                      case 'users': return <Users className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                      case 'messageCircle': return <MessageCircle className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                      case 'trendingUp': return <TrendingUp className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                      case 'star': return <Star className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                      default: return <Award className={`w-6 h-6 ${iconClass} mx-auto mb-1`} />;
                    }
                  };

                  if (earnedBadges.length === 0) {
                    return (
                      <div className="text-center py-4 text-gray-500">
                        <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">まだバッジがありません</p>
                        <Link href="/features#badges" className="text-xs text-blue-600 hover:text-blue-700 hover:underline mt-1 inline-block">
                          獲得条件を見る
                        </Link>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 gap-3">
                      {earnedBadges.slice(0, 4).map((badge) => {
                        const style = getBadgeStyle(badge.color);
                        return (
                          <div key={badge.id} className={`text-center p-3 rounded-lg ${style.bg} border ${style.border}`}>
                            {getIcon(badge.icon, style.icon)}
                            <p className={`text-xs font-medium ${style.text}`}>{badge.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* クイックアクション */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/register-company">
                  <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700">
                    <Building2 className="w-5 h-5 mr-2" />
                    会社を登録
                  </Button>
                </Link>
                <Link href="/ranking">
                  <Button variant="outline" className="w-full h-16">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    ランキングを見る
                  </Button>
                </Link>
                <Link href="/timeline">
                  <Button variant="outline" className="w-full h-16">
                    <Calendar className="w-5 h-5 mr-2" />
                    タイムラインを見る
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
