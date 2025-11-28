'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, Building2, User, Search, Trash2, ExternalLink, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LockedFeature } from '@/components/OnboardingBanner';

interface SavedItem {
  id: string;
  itemType: 'company' | 'person' | 'search_result';
  itemData: {
    name: string;
    slug?: string;
    description?: string;
    metadata?: any;
  };
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface RatedItem {
  id: string;
  type: 'company' | 'user';
  name: string;
  rating: number;
  comment?: string;
  createdAt: string;
  slug?: string;
  isAnonymous?: boolean;
  relationship: string;
}

export default function ListsPage() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [ratedItems, setRatedItems] = useState<RatedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'rated'>('rated');
  const [filter, setFilter] = useState<'all' | 'company' | 'person' | 'search_result'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingEvaluationId, setUpdatingEvaluationId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSavedItems();
      fetchRatedItems();
    }
  }, [user]);

  const fetchSavedItems = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/saved-items', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSavedItems(data.savedItems);
        }
      } else if (response.status === 401) {
        // User not authenticated
        setSavedItems([]);
      }
    } catch (error) {
      console.error('Error fetching saved items:', error);
      toast.error('保存済みアイテムの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 企業名を正規化する関数
  const normalizeCompanyName = (name: string): string => {
    return name.replace(/^株式会社/, '').trim().toLowerCase();
  };

  const fetchRatedItems = async () => {
    try {
      setLoading(true);
      const ratedList: RatedItem[] = [];
      const seenCompanies = new Set<string>(); // 正規化された企業名で重複チェック

      // まずAPIから評価データを取得
      try {
        const evaluationsRes = await fetch('/api/evaluations', { credentials: 'include' });
        
        if (evaluationsRes.ok) {
          const evaluationsData = await evaluationsRes.json();
          if (evaluationsData.success) {
            evaluationsData.evaluations.forEach((evaluation: any) => {
              const normalizedName = normalizeCompanyName(evaluation.companyName);
              const uniqueKey = `${normalizedName}_${evaluation.rating}_${evaluation.comment?.substring(0, 50)}`;
              
              if (!seenCompanies.has(uniqueKey)) {
                seenCompanies.add(uniqueKey);
                ratedList.push({
                  id: evaluation.id,
                  type: 'company',
                  name: evaluation.companyName,
                  rating: evaluation.rating,
                  comment: evaluation.comment,
                  createdAt: evaluation.createdAt,
                  slug: evaluation.companySlug,
                  isAnonymous: evaluation.isAnonymous,
                  relationship: evaluation.relationship || 'other'
                });
              }
            });
          }
        }
      } catch (apiError) {
        console.log('API評価取得エラー、ローカルデータを使用:', apiError);
      }

      // ローカルストレージは使用しない（APIデータで統一）
      // ローカルストレージのデータは、既にAPIに移行済みのため不要

      setRatedItems(ratedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error fetching rated items:', error);
      toast.error('評価済みアイテムの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('この評価を削除しますか？削除すると取り消せません。')) {
      return;
    }

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const text = await response.text();
        let message = '評価の削除に失敗しました';
        if (text) {
          try {
            const data = JSON.parse(text);
            message = data.error || message;
          } catch {
            message = text;
          }
        }
        throw new Error(message);
      }

      setRatedItems((prev) => prev.filter((item) => item.id !== evaluationId));
      toast.success('評価を削除しました');
    } catch (error) {
      console.error('Error deleting evaluation:', error);
      toast.error(error instanceof Error ? error.message : '削除中にエラーが発生しました');
    }
  };

  const relationshipOptions = [
    { value: 'shareholder', label: '株主' },
    { value: 'executive', label: '役員' },
    { value: 'employee', label: '従業員' },
    { value: 'partner', label: 'パートナー' },
    { value: 'customer', label: '顧客' },
    { value: 'other', label: 'その他' }
  ];

  const handleUpdateEvaluationRelationship = async (evaluationId: string, newRelationship: string) => {
    if (!newRelationship) return;
    setUpdatingEvaluationId(evaluationId);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          relationship: newRelationship
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let message = '関係性の更新に失敗しました';
        if (text) {
          try {
            const data = JSON.parse(text);
            message = data.error || message;
          } catch {
            message = text;
          }
        }
        throw new Error(message);
      }

      setRatedItems(prev => prev.map(item => 
        item.id === evaluationId ? { ...item, relationship: newRelationship } : item
      ));
      toast.success('関係性を更新しました');
    } catch (error) {
      console.error('Error updating evaluation relationship:', error);
      toast.error(error instanceof Error ? error.message : '更新中にエラーが発生しました');
    } finally {
      setUpdatingEvaluationId(null);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('このアイテムを削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/saved-items/${itemId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSavedItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('アイテムを削除しました');
      } else {
        const text = await response.text();
        let message = 'アイテムの削除に失敗しました';
        if (text) {
          try {
            const data = JSON.parse(text);
            message = data.error || message;
          } catch {
            message = text;
          }
        }
        toast.error(message);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('削除中にエラーが発生しました');
    }
  };

  const filteredSavedItems = savedItems.filter(item => {
    const matchesType = filter === 'all' || item.itemType === filter;
    const matchesSearch = searchQuery === '' ||
      item.itemData.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemData.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredRatedItems = ratedItems.filter(item => {
    const matchesType = filter === 'all' || item.type === filter;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comment?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'person':
        return <User className="w-4 h-4" />;
      case 'search_result':
        return <Search className="w-4 h-4" />;
      default:
        return <BookmarkPlus className="w-4 h-4" />;
    }
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'company':
        return '企業';
      case 'person':
        return '人物';
      case 'search_result':
        return '検索結果';
      default:
        return 'その他';
    }
  };

  const getItemTypeColor = (type: string) => {
    switch (type) {
      case 'company':
        return 'bg-blue-100 text-blue-700';
      case 'person':
        return 'bg-green-100 text-green-700';
      case 'search_result':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <LockedFeature featureName="マイリスト">
    {!user ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BookmarkPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-4">マイリストを表示するにはログインしてください</p>
          <Link href="/login">
            <Button>ログインする</Button>
          </Link>
        </div>
      </div>
    ) : loading ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    ) : (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">マイリスト</h1>
                <p className="text-gray-600 mt-2">
                  評価した企業・人物と保存したアイテムを管理
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {activeTab === 'rated' ? ratedItems.length : savedItems.length} 件
                </Badge>
              </div>
            </div>
            
            {/* タブ */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
              <button
                onClick={() => setActiveTab('rated')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'rated'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                評価済み ({ratedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'saved'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                保存済み ({savedItems.length})
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={filter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('all')}
                >
                  すべて
                </Button>
                <Button
                  variant={filter === 'company' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('company')}
                >
                  企業
                </Button>
                <Button
                  variant={filter === 'person' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('person')}
                >
                  人物
                </Button>
                <Button
                  variant={filter === 'search_result' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilter('search_result')}
                >
                  検索結果
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          {activeTab === 'rated' ? (
            // 評価済みリスト
            filteredRatedItems.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filter !== 'all'
                    ? '該当する評価が見つかりません'
                    : 'まだ評価していません'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filter !== 'all'
                    ? '検索条件を変更してみてください'
                    : '企業や人物を評価すると、ここに表示されます'}
                </p>
                {!searchQuery && filter === 'all' && (
                  <Link href="/search">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      企業を探す
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRatedItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${item.type === 'company' ? 'bg-blue-100' : 'bg-green-100'}`}>
                            {item.type === 'company' ? (
                              <img
                                src={`/api/company-logo/${encodeURIComponent(item.slug || item.name.toLowerCase())}`}
                                alt={`${item.name} ロゴ`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : (
                              <User className="w-5 h-5 text-green-700" />
                            )}
                            {item.type === 'company' && (
                              <div className="w-full h-full items-center justify-center hidden text-blue-700">
                                <Building2 className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                              {item.name}
                            </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {item.type === 'company' ? '企業' : '人物'}
                        </Badge>
                        <div className="flex items-center gap-1">
                                {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                                <span className="text-xs text-gray-500 ml-1">{item.rating}</span>
                              </div>
                              {item.isAnonymous && (
                                <Badge variant="secondary" className="text-xs">匿名</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEvaluation(item.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {item.comment && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                          {item.comment}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>
                        {item.type === 'company' && item.slug && (
                          <Link 
                            href={`/company/${item.slug}`}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            詳細を見る
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : (
            // 保存済みリスト
            filteredSavedItems.length === 0 ? (
              <div className="text-center py-12">
                <BookmarkPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || filter !== 'all' 
                    ? '該当するアイテムが見つかりません' 
                    : 'まだアイテムが保存されていません'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery || filter !== 'all'
                    ? '検索条件を変更してみてください'
                    : '企業や人物を検索して、気になるものを保存しましょう'}
                </p>
                {!searchQuery && filter === 'all' && (
                  <Link href="/search">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      検索を開始
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSavedItems.map((item) => (
                <Card key={item.id} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${getItemTypeColor(item.itemType)}`}>
                          {item.itemType === 'company' ? (
                            <>
                              <img
                                src={`/api/company-logo/${encodeURIComponent(item.itemData.slug || item.itemData.name.toLowerCase())}`}
                                alt={`${item.itemData.name} ロゴ`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full items-center justify-center hidden">
                                <Building2 className="w-5 h-5" />
                              </div>
                            </>
                          ) : item.itemType === 'person' ? (
                            <User className="w-5 h-5" />
                          ) : (
                            getItemIcon(item.itemType)
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {item.itemData.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getItemTypeLabel(item.itemType)}
                            </Badge>
                            {item.tags && item.tags.length > 0 && (
                              item.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.itemData.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                        {item.itemData.description}
                      </p>
                    )}
                    
                    {item.notes && (
                      <div className="mb-3 p-2 bg-gray-50 rounded">
                        <p className="text-xs text-gray-500 mb-1">メモ:</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {item.notes}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      {item.itemType === 'company' && (
                        <Link 
                          href={`/company/${item.itemData.slug || item.itemData.name.toLowerCase()}`}
                          className="text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                          詳細を見る
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            )
          )}
        </div>
      </div>
    </div>
    )}
    </LockedFeature>
  );
}
