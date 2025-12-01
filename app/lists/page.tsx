'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, Building2, User, Search, Trash2, ExternalLink, Calendar, MapPin, Package, History, Clock, Tag, Plus, X, Pencil, MessageSquare, Check } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { LockedFeature } from '@/components/OnboardingBanner';

interface SavedItem {
  id: string;
  itemType: 'company' | 'person' | 'service' | 'search_result';
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

interface SearchHistoryItem {
  id: string;
  query: string;
  mode: string;
  results?: number;
  createdAt: string;
  date: string;
}

export default function ListsPage() {
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [ratedItems, setRatedItems] = useState<RatedItem[]>([]);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'saved' | 'rated' | 'history'>('saved');
  const [filter, setFilter] = useState<'all' | 'company' | 'person' | 'service' | 'search_result'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingEvaluationId, setUpdatingEvaluationId] = useState<string | null>(null);
  const [editingTagsItemId, setEditingTagsItemId] = useState<string | null>(null);
  const [newTag, setNewTag] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [editingNotesItemId, setEditingNotesItemId] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState('');
  const [editingEvaluationId, setEditingEvaluationId] = useState<string | null>(null);
  const [editingEvaluationRating, setEditingEvaluationRating] = useState(0);
  const [editingEvaluationComment, setEditingEvaluationComment] = useState('');
  const [editingEvaluationAnonymous, setEditingEvaluationAnonymous] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSavedItems();
      fetchRatedItems();
      fetchSearchHistory();
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
          // まず保存アイテムをすぐに表示
          setSavedItems(data.savedItems);
          setLoading(false);

          // バックグラウンドで各アイテムの最新データを取得して更新
          const updateItemsInBackground = async () => {
            for (const item of data.savedItems) {
              try {
                if (item.itemType === 'company' || item.itemType === 'service') {
                  const slug = item.itemData.slug || item.itemData.name.toLowerCase();
                  const endpoint = item.itemType === 'company'
                    ? `/api/companies/${encodeURIComponent(slug)}`
                    : `/api/services/${encodeURIComponent(slug)}`;

                  const detailRes = await fetch(endpoint, { credentials: 'include' });
                  if (detailRes.ok) {
                    const detailData = await detailRes.json();
                    const entityData = detailData.company || detailData.service || detailData;

                    if (entityData?.description) {
                      let summaryDescription = '';
                      const overviewMatch = entityData.description.match(/##\s*1\.\s*概要\s*\n([\s\S]*?)(?=\n##\s*2\.|$)/i);
                      if (overviewMatch) {
                        summaryDescription = overviewMatch[1]
                          .replace(/\*\*(.*?)\*\*/g, '$1')
                          .replace(/\n+/g, ' ')
                          .trim()
                          .substring(0, 500);
                      } else {
                        summaryDescription = entityData.description
                          .split('\n')
                          .filter((line: string) => line.trim().length > 20 && !line.startsWith('#') && !line.startsWith('*'))
                          .slice(0, 2)
                          .join(' ')
                          .substring(0, 500);
                      }

                      if (summaryDescription) {
                        setSavedItems(prev => prev.map(i =>
                          i.id === item.id
                            ? { ...i, itemData: { ...i.itemData, description: summaryDescription } }
                            : i
                        ));
                      }
                    }
                  }
                }
              } catch (err) {
                console.log(`Failed to fetch latest data for ${item.itemData.name}:`, err);
              }
            }
          };

          updateItemsInBackground();
          return;
        }
      } else if (response.status === 401) {
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

  const fetchSearchHistory = async () => {
    try {
      const response = await fetch('/api/search-history?limit=100', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchHistory(data.searchHistory);
        }
      } else if (response.status === 401) {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error('Error fetching search history:', error);
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

  const handleUpdateEvaluation = async (evaluationId: string) => {
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: editingEvaluationRating,
          comment: editingEvaluationComment,
          isAnonymous: editingEvaluationAnonymous
        })
      });

      if (!response.ok) {
        const text = await response.text();
        let message = '評価の更新に失敗しました';
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
        item.id === evaluationId
          ? { ...item, rating: editingEvaluationRating, comment: editingEvaluationComment, isAnonymous: editingEvaluationAnonymous }
          : item
      ));
      setEditingEvaluationId(null);
      setEditingEvaluationRating(0);
      setEditingEvaluationComment('');
      setEditingEvaluationAnonymous(false);
      toast.success('評価を更新しました');
    } catch (error) {
      console.error('Error updating evaluation:', error);
      toast.error(error instanceof Error ? error.message : '更新中にエラーが発生しました');
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

  // タグの追加
  const handleAddTag = async (itemId: string, tag: string) => {
    if (!tag.trim()) return;

    const item = savedItems.find(i => i.id === itemId);
    if (!item) return;

    const currentTags = item.tags || [];
    if (currentTags.includes(tag.trim())) {
      toast.error('このタグは既に追加されています');
      return;
    }

    const newTags = [...currentTags, tag.trim()];

    try {
      const response = await fetch(`/api/saved-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags: newTags })
      });

      if (response.ok) {
        setSavedItems(prev => prev.map(i =>
          i.id === itemId ? { ...i, tags: newTags } : i
        ));
        setNewTag('');
        toast.success('タグを追加しました');
      } else {
        throw new Error('タグの追加に失敗しました');
      }
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error('タグの追加に失敗しました');
    }
  };

  // タグの削除
  const handleRemoveTag = async (itemId: string, tagToRemove: string) => {
    const item = savedItems.find(i => i.id === itemId);
    if (!item) return;

    const newTags = (item.tags || []).filter(t => t !== tagToRemove);

    try {
      const response = await fetch(`/api/saved-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tags: newTags })
      });

      if (response.ok) {
        const updatedItems = savedItems.map(i =>
          i.id === itemId ? { ...i, tags: newTags } : i
        );
        setSavedItems(updatedItems);

        // 削除したタグでフィルタリング中で、そのタグが他のアイテムにも存在しない場合はフィルターをリセット
        if (tagFilter === tagToRemove) {
          const remainingTags = updatedItems.flatMap(i => i.tags || []);
          if (!remainingTags.includes(tagToRemove)) {
            setTagFilter(null);
          }
        }

        toast.success('タグを削除しました');
      } else {
        throw new Error('タグの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error('タグの削除に失敗しました');
    }
  };

  // メモの更新
  const handleUpdateNotes = async (itemId: string, notes: string) => {
    try {
      const response = await fetch(`/api/saved-items/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes })
      });

      if (response.ok) {
        setSavedItems(prev => prev.map(i =>
          i.id === itemId ? { ...i, notes } : i
        ));
        setEditingNotesItemId(null);
        setEditingNotes('');
        toast.success('メモを保存しました');
      } else {
        throw new Error('メモの保存に失敗しました');
      }
    } catch (error) {
      console.error('Error updating notes:', error);
      toast.error('メモの保存に失敗しました');
    }
  };

  // 全タグを取得（空文字をフィルタリング）
  const allTags = Array.from(new Set(savedItems.flatMap(item => item.tags || []))).filter(tag => tag && tag.trim());

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
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = searchQuery === '' ||
      item.itemData.name.toLowerCase().includes(searchLower) ||
      item.itemData.description?.toLowerCase().includes(searchLower) ||
      item.notes?.toLowerCase().includes(searchLower) ||
      (item.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
    const matchesTag = tagFilter === null || (item.tags || []).includes(tagFilter);
    return matchesType && matchesSearch && matchesTag;
  });

  const filteredRatedItems = ratedItems.filter(item => {
    const matchesType = filter === 'all' || item.type === filter;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.comment?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredSearchHistory = searchHistory.filter(item => {
    const matchesSearch = searchQuery === '' ||
      item.query.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getModeLabel = (mode: string) => {
    switch (mode) {
      case 'company':
        return '企業検索';
      case 'person':
        return '人物検索';
      case 'service':
        return 'サービス検索';
      case 'ai':
        return 'AI検索';
      default:
        return '検索';
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'company':
        return 'bg-blue-100 text-blue-700';
      case 'person':
        return 'bg-green-100 text-green-700';
      case 'service':
        return 'bg-orange-100 text-orange-700';
      case 'ai':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // 説明文からMarkdownを除去して要約を生成
  const getSummary = (description: string | undefined, maxLength: number = 300): string => {
    if (!description) return '';

    // Markdownの見出し、リスト、強調などを除去
    let text = description
      .replace(/^#+\s+.*$/gm, '') // 見出し除去
      .replace(/^\*\*.*\*\*$/gm, '') // 強調行除去
      .replace(/^\*.*$/gm, '') // リスト項目の先頭行除去
      .replace(/^-\s+\*\*.*\*\*:.*/gm, '') // リスト項目除去
      .replace(/^-\s+.*/gm, '') // ダッシュリスト除去
      .replace(/\*\*(.*?)\*\*/g, '$1') // 強調を解除
      .replace(/\*(.*?)\*/g, '$1') // イタリック解除
      .replace(/^---+$/gm, '') // 水平線除去
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // リンクをテキストに
      .replace(/`([^`]+)`/g, '$1') // コード除去
      .replace(/\n{2,}/g, '\n') // 連続改行を1つに
      .trim();

    // 「概要」セクションを探して抽出
    const overviewMatch = text.match(/概要[：:]\s*\n?([\s\S]*?)(?=\n\n|$)/i) ||
                         text.match(/1\.\s*概要\s*\n?([\s\S]*?)(?=\n\n2\.|$)/i);
    if (overviewMatch) {
      text = overviewMatch[1].trim();
    }

    // 最初の意味のある文章を取得
    const lines = text.split('\n').filter(line => line.trim().length > 10);
    text = lines.slice(0, 3).join(' ').trim();

    // 長さ制限
    if (text.length > maxLength) {
      text = text.substring(0, maxLength - 3) + '...';
    }

    return text || description.substring(0, maxLength);
  };

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'company':
        return <Building2 className="w-4 h-4" />;
      case 'person':
        return <User className="w-4 h-4" />;
      case 'service':
        return <Package className="w-4 h-4" />;
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
      case 'service':
        return 'サービス';
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
      case 'service':
        return 'bg-orange-100 text-orange-700';
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
                  {activeTab === 'rated' ? ratedItems.length : activeTab === 'saved' ? savedItems.length : searchHistory.length} 件
                </Badge>
              </div>
            </div>

            {/* タブ */}
            <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
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
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                検索履歴 ({searchHistory.length})
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
              {activeTab !== 'history' && (
                <div className="flex gap-2 flex-wrap">
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
                    variant={filter === 'service' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('service')}
                  >
                    サービス
                  </Button>
                  <Button
                    variant={filter === 'search_result' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('search_result')}
                  >
                    検索結果
                  </Button>
                </div>
              )}
            </div>

            {/* タグフィルター（保存済みタブのみ） */}
            {activeTab === 'saved' && allTags.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">タグ:</span>
                  <button
                    onClick={() => setTagFilter(null)}
                    className={`px-2 py-1 text-xs rounded-full transition-colors ${
                      tagFilter === null
                        ? 'bg-bond-pink text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    すべて
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
                      className={`px-2 py-1 text-xs rounded-full transition-colors ${
                        tagFilter === tag
                          ? 'bg-bond-pink text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          {activeTab === 'history' ? (
            // 検索履歴リスト
            filteredSearchHistory.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery
                    ? '該当する検索履歴が見つかりません'
                    : 'まだ検索履歴がありません'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchQuery
                    ? '検索条件を変更してみてください'
                    : '検索を行うと、ここに履歴が表示されます'}
                </p>
                {!searchQuery && (
                  <Link href="/search">
                    <Button>
                      <Search className="w-4 h-4 mr-2" />
                      検索を開始
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredSearchHistory.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-all duration-300">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getModeColor(item.mode)}`}>
                            <Search className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-gray-900 truncate">
                                {item.query}
                              </p>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {getModeLabel(item.mode)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.date}</span>
                              </div>
                              {item.results !== undefined && (
                                <span>{item.results}件の結果</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Link
                          href={
                            item.mode === 'person'
                              ? `/person/${encodeURIComponent(item.query)}`
                              : item.mode === 'company'
                              ? `/company/${encodeURIComponent(item.query.toLowerCase().replace(/\s+/g, '-'))}`
                              : item.mode === 'service'
                              ? `/service/${encodeURIComponent(item.query.toLowerCase().replace(/\s+/g, '-'))}`
                              : `/search?q=${encodeURIComponent(item.query)}&mode=${item.mode}`
                          }
                          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 ml-4"
                        >
                          詳細を見る
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          ) : activeTab === 'rated' ? (
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
                                src={`/api/company-logo/${encodeURIComponent(item.slug || normalizeCompanyName(item.name))}`}
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingEvaluationId(item.id);
                              setEditingEvaluationRating(item.rating);
                              setEditingEvaluationComment(item.comment || '');
                              setEditingEvaluationAnonymous(item.isAnonymous || false);
                            }}
                            className="text-gray-500 hover:text-bond-pink hover:bg-pink-50"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEvaluation(item.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {editingEvaluationId === item.id ? (
                        <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                          {/* 評価編集UI - 改善版 */}
                          <div className="text-sm font-medium text-gray-700 mb-2">評価を編集</div>

                          {/* 星評価 */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">評価</label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => setEditingEvaluationRating(star)}
                                  className={`text-2xl transition-colors ${star <= editingEvaluationRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                                >
                                  ★
                                </button>
                              ))}
                              <span className="ml-2 text-sm text-gray-500">{editingEvaluationRating}/5</span>
                            </div>
                          </div>

                          {/* コメント */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">評価コメント</label>
                            <textarea
                              value={editingEvaluationComment}
                              onChange={(e) => setEditingEvaluationComment(e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink focus:border-transparent resize-y min-h-[120px]"
                              rows={5}
                              placeholder="この企業・人物についての評価コメントを入力してください..."
                            />
                            <p className="text-xs text-gray-400 mt-1">{editingEvaluationComment.length} 文字</p>
                          </div>

                          {/* 匿名/実名切り替え */}
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">公開設定</label>
                            <div className="flex items-center gap-4">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`anonymous-${item.id}`}
                                  checked={!editingEvaluationAnonymous}
                                  onChange={() => setEditingEvaluationAnonymous(false)}
                                  className="w-4 h-4 text-bond-pink focus:ring-bond-pink"
                                />
                                <span className="text-sm text-gray-700">実名で投稿</span>
                              </label>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="radio"
                                  name={`anonymous-${item.id}`}
                                  checked={editingEvaluationAnonymous}
                                  onChange={() => setEditingEvaluationAnonymous(true)}
                                  className="w-4 h-4 text-bond-pink focus:ring-bond-pink"
                                />
                                <span className="text-sm text-gray-700">匿名で投稿</span>
                              </label>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                              {editingEvaluationAnonymous
                                ? '名前は公開されません'
                                : 'あなたの名前が表示されます'}
                            </p>
                          </div>

                          {/* ボタン */}
                          <div className="flex items-center gap-3 pt-2">
                            <button
                              onClick={() => handleUpdateEvaluation(item.id)}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium bg-bond-pink text-white rounded-lg hover:bg-pink-600 transition-colors"
                            >
                              <Check className="w-4 h-4" />
                              変更を保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingEvaluationId(null);
                                setEditingEvaluationRating(0);
                                setEditingEvaluationComment('');
                                setEditingEvaluationAnonymous(false);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {item.comment && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-3 whitespace-pre-wrap">
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
                        </>
                      )}
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
                          {item.itemType === 'company' || item.itemType === 'service' ? (
                            <>
                              <img
                                src={`/api/company-logo/${encodeURIComponent(item.itemData.slug || normalizeCompanyName(item.itemData.name))}`}
                                alt={`${item.itemData.name} ロゴ`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full items-center justify-center hidden">
                                {item.itemType === 'service' ? <Package className="w-5 h-5" /> : <Building2 className="w-5 h-5" />}
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
                      <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                        {getSummary(item.itemData.description, 300)}
                      </p>
                    )}

                    {/* タグセクション */}
                    <div className="mb-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {(item.tags || []).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded-full group hover:bg-gray-200"
                          >
                            {tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveTag(item.id, tag);
                              }}
                              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {editingTagsItemId === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddTag(item.id, newTag);
                                }
                              }}
                              placeholder="タグを入力..."
                              className="w-24 px-2 py-0.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-bond-pink"
                            />
                            <button
                              onClick={() => handleAddTag(item.id, newTag)}
                              className="p-0.5 text-bond-pink hover:bg-pink-50 rounded"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingTagsItemId(null);
                                setNewTag('');
                              }}
                              className="p-0.5 text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingTagsItemId(item.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-gray-400 hover:text-bond-pink hover:bg-pink-50 rounded-full border border-dashed border-gray-300"
                          >
                            <Tag className="w-3 h-3" />
                            タグ追加
                          </button>
                        )}
                      </div>
                    </div>

                    {/* メモセクション */}
                    <div className="mb-3">
                      {editingNotesItemId === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNotes}
                            onChange={(e) => setEditingNotes(e.target.value)}
                            placeholder="メモを入力..."
                            className="w-full px-2 py-1.5 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-bond-pink resize-none"
                            rows={3}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleUpdateNotes(item.id, editingNotes)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-bond-pink text-white rounded hover:bg-pink-600"
                            >
                              <Check className="w-3 h-3" />
                              保存
                            </button>
                            <button
                              onClick={() => {
                                setEditingNotesItemId(null);
                                setEditingNotes('');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
                            >
                              キャンセル
                            </button>
                          </div>
                        </div>
                      ) : item.notes ? (
                        <div
                          className="p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 group"
                          onClick={() => {
                            setEditingNotesItemId(item.id);
                            setEditingNotes(item.notes || '');
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-xs text-gray-500">メモ:</p>
                            <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
                          </div>
                          <p className="text-sm text-gray-700 line-clamp-4 whitespace-pre-wrap">
                            {item.notes}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingNotesItemId(item.id);
                            setEditingNotes('');
                          }}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-bond-pink hover:bg-pink-50 rounded border border-dashed border-gray-300"
                        >
                          <MessageSquare className="w-3 h-3" />
                          メモを追加
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                      {(item.itemType === 'company' || item.itemType === 'service' || item.itemType === 'person') && (
                        <Link
                          href={
                            item.itemType === 'person'
                              ? `/person/${encodeURIComponent(item.itemData.slug || item.itemData.name)}`
                              : item.itemType === 'service'
                              ? `/service/${item.itemData.slug || item.itemData.name.toLowerCase()}`
                              : `/company/${item.itemData.slug || item.itemData.name.toLowerCase()}`
                          }
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
