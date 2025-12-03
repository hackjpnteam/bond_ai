'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookmarkPlus, Building2, User, Search, Trash2, ExternalLink, Calendar, MapPin, Package, History, Clock, Tag, Plus, X, Pencil, MessageSquare, Check, Share2, Copy, Link2, Users, Globe, Lock, Loader2, Mail, UserPlus, ChevronDown, ChevronUp, Eye } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'saved' | 'rated' | 'history' | 'shared'>('saved');
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
  // 共有機能
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [selectedShareTags, setSelectedShareTags] = useState<string[]>([]);
  const [shareIsPublic, setShareIsPublic] = useState(true);
  const [creatingShare, setCreatingShare] = useState(false);
  const [sharedLists, setSharedLists] = useState<any[]>([]);
  const [viewedLists, setViewedLists] = useState<any[]>([]);
  const [showSharedListsModal, setShowSharedListsModal] = useState(false);
  // 招待機能
  const [inviteListId, setInviteListId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  // 検索履歴から保存
  const [savingHistoryId, setSavingHistoryId] = useState<string | null>(null);
  const [historyTagInputId, setHistoryTagInputId] = useState<string | null>(null);
  const [historyNewTag, setHistoryNewTag] = useState('');

  useEffect(() => {
    if (user) {
      fetchSavedItems();
      fetchRatedItems();
      fetchSearchHistory();
      fetchSharedLists();
    }
  }, [user]);

  const fetchSharedLists = async () => {
    try {
      const response = await fetch('/api/shared-lists', {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSharedLists(data.sharedLists);
          setViewedLists(data.viewedLists || []);
        }
      }
    } catch (error) {
      console.error('Error fetching shared lists:', error);
    }
  };

  const handleCreateSharedList = async () => {
    if (!shareTitle.trim() || selectedShareTags.length === 0) {
      toast.error('タイトルとタグを選択してください');
      return;
    }

    setCreatingShare(true);
    try {
      const response = await fetch('/api/shared-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: shareTitle,
          description: shareDescription,
          tags: selectedShareTags,
          isPublic: shareIsPublic
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(`共有リストを作成しました（${data.itemCount}件のアイテム）`);
        setSharedLists(prev => [data.sharedList, ...prev]);
        setShowShareModal(false);
        setShareTitle('');
        setShareDescription('');
        setSelectedShareTags([]);
        setShareIsPublic(true);

        // 共有URLをクリップボードにコピー
        const shareUrl = `${window.location.origin}/lists/share/${data.sharedList.shareId}`;
        await navigator.clipboard.writeText(shareUrl);
        toast.success('共有URLをコピーしました');
      } else {
        toast.error(data.error || '共有リストの作成に失敗しました');
      }
    } catch (error) {
      console.error('Error creating shared list:', error);
      toast.error('共有リストの作成に失敗しました');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleDeleteSharedList = async (listId: string) => {
    if (!confirm('この共有リストを削除しますか？')) return;

    try {
      const response = await fetch(`/api/shared-lists/${listId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setSharedLists(prev => prev.filter(list => list.id !== listId));
        toast.success('共有リストを削除しました');
      } else {
        toast.error('共有リストの削除に失敗しました');
      }
    } catch (error) {
      console.error('Error deleting shared list:', error);
      toast.error('共有リストの削除に失敗しました');
    }
  };

  const copyShareUrl = async (shareId: string) => {
    const shareUrl = `${window.location.origin}/lists/share/${shareId}`;
    await navigator.clipboard.writeText(shareUrl);
    toast.success('共有URLをコピーしました');
  };

  // 名前でユーザーを検索
  const handleSearchUsers = async (query: string) => {
    setInviteSearchQuery(query);
    if (query.length < 2) {
      setInviteSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });
      const data = await response.json();
      if (data.success) {
        setInviteSearchResults(data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // ユーザーIDで招待
  const handleInviteUserById = async (listId: string, userId: string, userName: string) => {
    setInviting(true);
    try {
      const response = await fetch(`/api/shared-lists/${listId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setInviteSearchQuery('');
        setInviteSearchResults([]);
        fetchSharedLists();
      } else {
        toast.error(data.error || '招待に失敗しました');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('招待に失敗しました');
    } finally {
      setInviting(false);
    }
  };

  // メールアドレスでユーザーを招待
  const handleInviteUser = async (listId: string, email: string) => {
    if (!email.trim()) {
      toast.error('メールアドレスを入力してください');
      return;
    }

    setInviting(true);
    try {
      const response = await fetch(`/api/shared-lists/${listId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
        setInviteEmail('');
        // 共有リストを更新して招待済みユーザーを反映
        fetchSharedLists();
      } else {
        toast.error(data.error || '招待に失敗しました');
      }
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('招待に失敗しました');
    } finally {
      setInviting(false);
    }
  };

  // 招待を取り消し
  const handleRemoveInvite = async (listId: string, userId: string) => {
    try {
      const response = await fetch(`/api/shared-lists/${listId}/invite?userId=${userId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('招待を取り消しました');
        fetchSharedLists();
      } else {
        toast.error('招待の取り消しに失敗しました');
      }
    } catch (error) {
      console.error('Error removing invite:', error);
      toast.error('招待の取り消しに失敗しました');
    }
  };

  // 検索履歴をマイリストに保存
  const handleSaveSearchHistory = async (historyItem: SearchHistoryItem, tags: string[] = []) => {
    setSavingHistoryId(historyItem.id);
    try {
      // 既に保存済みかチェック
      const existingItem = savedItems.find(
        item => item.itemType === 'search_result' && item.itemData.name === historyItem.query
      );

      if (existingItem) {
        toast.error('この検索結果は既に保存済みです');
        setSavingHistoryId(null);
        return;
      }

      // 企業/サービスの場合は概要を取得
      let description = `${getModeLabel(historyItem.mode)}で検索`;
      let slug = historyItem.query.toLowerCase().replace(/\s+/g, '-');

      if (historyItem.mode === 'company' || historyItem.mode === 'service') {
        try {
          // 検索クエリ（企業名）をそのままAPIに渡す（APIはname/slugどちらでも検索可能）
          const searchName = encodeURIComponent(historyItem.query.trim());
          const endpoint = historyItem.mode === 'company'
            ? `/api/companies/${searchName}`
            : `/api/companies/${searchName}`; // サービスもcompanies APIで検索

          const detailRes = await fetch(endpoint, { credentials: 'include' });
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            const entityData = detailData.company || detailData.service || detailData;

            if (entityData?.description) {
              // 概要セクションを抽出（## 1. 概要 形式の場合）
              const overviewMatch = entityData.description.match(/##\s*1\.\s*概要\s*\n([\s\S]*?)(?=\n##\s*2\.|$)/i);
              if (overviewMatch) {
                description = overviewMatch[1]
                  .replace(/\*\*(.*?)\*\*/g, '$1')
                  .replace(/\n+/g, ' ')
                  .trim()
                  .substring(0, 500);
              } else {
                // 他の形式の場合は最初の意味のある行を取得
                const lines = entityData.description.split('\n');
                const meaningfulLines = lines.filter((line: string) => {
                  const trimmed = line.trim();
                  return trimmed.length > 20 &&
                         !trimmed.startsWith('#') &&
                         !trimmed.startsWith('*') &&
                         !trimmed.startsWith('-') &&
                         !trimmed.startsWith('|');
                });
                if (meaningfulLines.length > 0) {
                  description = meaningfulLines.slice(0, 2).join(' ').substring(0, 500);
                } else {
                  // 最初の100文字以上の行を探す
                  const firstSubstantialLine = lines.find((line: string) => line.trim().length > 100);
                  if (firstSubstantialLine) {
                    description = firstSubstantialLine.trim().substring(0, 500);
                  }
                }
              }
            }

            // slugも更新
            if (entityData?.slug) {
              slug = entityData.slug;
            }
            // 企業名も取得
            if (entityData?.name) {
              // itemDataのnameには正式な企業名を使用
            }
          }
        } catch (err) {
          console.log('Failed to fetch entity details:', err);
        }
      }

      const response = await fetch('/api/saved-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          itemType: 'search_result',
          itemData: {
            name: historyItem.query,
            slug: slug,
            description: description,
            metadata: {
              mode: historyItem.mode,
              results: historyItem.results,
              originalDate: historyItem.date
            }
          },
          tags: tags.length > 0 ? tags : [],
          notes: ''
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('マイリストに保存しました');
        setSavedItems(prev => [data.savedItem, ...prev]);
        setHistoryTagInputId(null);
        setHistoryNewTag('');
      } else {
        toast.error(data.error || '保存に失敗しました');
      }
    } catch (error) {
      console.error('Error saving search history:', error);
      toast.error('保存に失敗しました');
    } finally {
      setSavingHistoryId(null);
    }
  };

  // 検索履歴が保存済みかチェック
  const isHistorySaved = (query: string) => {
    return savedItems.some(
      item => item.itemType === 'search_result' && item.itemData.name === query
    );
  };

  // 検索履歴に対応する保存済みアイテムを取得
  const getSavedItemForHistory = (query: string): SavedItem | undefined => {
    return savedItems.find(
      item => item.itemType === 'search_result' && item.itemData.name === query
    );
  };

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
      case 'search_result': // 検索結果も企業として表示
        return '企業';
      case 'person':
        return '人物';
      case 'service':
        return 'サービス';
      default:
        return '企業';
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
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-4 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div>
                <h1 className="text-xl sm:text-3xl font-bold text-gray-900">マイリスト</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  評価した企業・人物と保存したアイテムを管理
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeTab === 'saved' && allTags.length > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowShareModal(true)}
                      className="gap-1.5 text-xs sm:text-sm"
                    >
                      <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">リストを</span>共有
                    </Button>
                    {sharedLists.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowSharedListsModal(true)}
                        className="gap-1.5 text-xs sm:text-sm"
                      >
                        <Link2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        共有中 ({sharedLists.length})
                      </Button>
                    )}
                  </>
                )}
                <Badge variant="outline" className="text-xs">
                  {activeTab === 'rated' ? ratedItems.length : activeTab === 'saved' ? savedItems.length : activeTab === 'shared' ? (sharedLists.length + viewedLists.length) : searchHistory.length} 件
                </Badge>
              </div>
            </div>

            {/* タブ */}
            <div className="flex gap-1 mb-4 sm:mb-6 bg-gray-100 p-1 rounded-lg overflow-x-auto">
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'saved'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                保存済み ({savedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('rated')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'rated'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                評価済み ({ratedItems.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'history'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                検索履歴 ({searchHistory.length})
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === 'shared'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-1">
                  <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  共有中 ({sharedLists.length + viewedLists.length})
                </span>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {activeTab !== 'history' && (
                <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                  <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    すべて
                  </Button>
                  <Button
                    variant={filter === 'company' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('company')}
                    className="text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    企業
                  </Button>
                  <Button
                    variant={filter === 'person' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('person')}
                    className="text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    人物
                  </Button>
                  <Button
                    variant={filter === 'service' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('service')}
                    className="text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    サービス
                  </Button>
                  <Button
                    variant={filter === 'search_result' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('search_result')}
                    className="text-xs sm:text-sm px-2.5 sm:px-3"
                  >
                    検索結果
                  </Button>
                </div>
              )}
            </div>

            {/* タグフィルター（保存済みタブのみ） */}
            {activeTab === 'saved' && allTags.length > 0 && (
              <div className="mt-3 sm:mt-4">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <Tag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-500">タグ:</span>
                  <button
                    onClick={() => setTagFilter(null)}
                    className={`px-2 py-0.5 sm:py-1 text-xs rounded-full transition-colors ${
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
              <div className="space-y-3 sm:space-y-4">
                {filteredSearchHistory.map((item) => {
                  const isSaved = isHistorySaved(item.query);
                  const savedItem = getSavedItemForHistory(item.query);
                  const savedTags = savedItem?.tags || [];
                  return (
                  <Card key={item.id} className="hover:shadow-md transition-all duration-300">
                    <CardContent className="py-3 sm:py-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getModeColor(item.mode)}`}>
                            <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
                              <p className="font-medium text-gray-900 text-sm sm:text-base truncate">
                                {item.query}
                              </p>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {getModeLabel(item.mode)}
                              </Badge>
                              {isSaved && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0 bg-green-100 text-green-700">
                                  <Check className="w-3 h-3 mr-1" />
                                  保存済み
                                </Badge>
                              )}
                            </div>
                            {/* 保存済みアイテムのタグを表示 */}
                            {savedTags.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap mb-1">
                                <Tag className="w-3 h-3 text-gray-400" />
                                {savedTags.map(tag => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs bg-bond-pink/10 text-bond-pink hover:bg-bond-pink/20 cursor-pointer"
                                    onClick={() => setTagFilter(tag)}
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{item.date}</span>
                              </div>
                              {item.results !== undefined && (
                                <span>{item.results}件の結果</span>
                              )}
                            </div>

                            {/* タグ入力エリア（展開時） */}
                            {historyTagInputId === item.id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600 mb-2">タグを入力して保存（任意）</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <input
                                    type="text"
                                    value={historyNewTag}
                                    onChange={(e) => setHistoryNewTag(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter' && historyNewTag.trim()) {
                                        handleSaveSearchHistory(item, [historyNewTag.trim()]);
                                      }
                                    }}
                                    placeholder="タグを入力..."
                                    className="flex-1 min-w-[120px] px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-bond-pink"
                                  />
                                  {/* 既存タグから選択 */}
                                  {allTags.length > 0 && (
                                    <div className="flex gap-1 flex-wrap">
                                      {allTags.slice(0, 5).map(tag => (
                                        <button
                                          key={tag}
                                          onClick={() => handleSaveSearchHistory(item, [tag])}
                                          className="px-2 py-0.5 text-xs bg-gray-200 hover:bg-bond-pink hover:text-white rounded-full transition-colors"
                                        >
                                          {tag}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveSearchHistory(item, historyNewTag.trim() ? [historyNewTag.trim()] : [])}
                                    disabled={savingHistoryId === item.id}
                                    className="bg-bond-pink hover:bg-pink-600"
                                  >
                                    {savingHistoryId === item.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <>
                                        <BookmarkPlus className="w-3 h-3 mr-1" />
                                        保存
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      setHistoryTagInputId(null);
                                      setHistoryNewTag('');
                                    }}
                                  >
                                    キャンセル
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 sm:ml-4 self-end sm:self-auto">
                          {!isSaved && historyTagInputId !== item.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setHistoryTagInputId(item.id)}
                              className="text-gray-500 hover:text-bond-pink"
                              title="マイリストに保存"
                            >
                              <BookmarkPlus className="w-4 h-4" />
                            </Button>
                          )}
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
                            className="flex items-center gap-1 text-xs sm:text-sm text-blue-600 hover:text-blue-700"
                          >
                            詳細を見る
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  );
                })}
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
          ) : activeTab === 'shared' ? (
            // 共有リスト
            (sharedLists.length === 0 && viewedLists.length === 0) ? (
              <div className="text-center py-12">
                <Share2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  共有リストがありません
                </h3>
                <p className="text-gray-600 mb-4">
                  タグで絞り込んだアイテムを共有リストとして公開できます
                </p>
                <Button onClick={() => setShowShareModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  共有リストを作成
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 自分が作成したリスト */}
                {sharedLists.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Share2 className="w-4 h-4" />
                      作成したリスト ({sharedLists.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {sharedLists.map((list) => (
                        <Link key={list.id} href={`/lists/share/${list.shareId}`}>
                          <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg truncate flex items-center gap-2">
                                    {list.title}
                                    {list.editPermission === 'anyone' && (
                                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Wiki</Badge>
                                    )}
                                  </CardTitle>
                                  {list.description && (
                                    <CardDescription className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {list.description}
                                    </CardDescription>
                                  )}
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  {list.visibility === 'public' && (
                                    <Globe className="w-4 h-4 text-green-600" />
                                  )}
                                  {list.visibility === 'link_only' && (
                                    <Link2 className="w-4 h-4 text-blue-600" />
                                  )}
                                  {list.visibility === 'invited_only' && (
                                    <Lock className="w-4 h-4 text-orange-600" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              <div className="flex flex-wrap gap-1 mb-3">
                                {list.tags?.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs bg-pink-50 text-pink-600">
                                    {tag}
                                  </Badge>
                                ))}
                                {list.tags?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{list.tags.length - 3}</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {list.viewCount || 0}
                                  </span>
                                  {list.sharedWith?.length > 0 && (
                                    <span className="flex items-center gap-1">
                                      <Users className="w-3 h-3" />
                                      {list.sharedWith.length}
                                    </span>
                                  )}
                                </div>
                                <span>{new Date(list.createdAt).toLocaleDateString('ja-JP')}</span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 閲覧したリスト */}
                {viewedLists.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      閲覧したリスト ({viewedLists.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                      {viewedLists.map((list) => (
                        <Link key={list.id} href={`/lists/share/${list.shareId}`}>
                          <Card className="hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-full border-blue-100">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-lg truncate flex items-center gap-2">
                                    {list.title}
                                    {list.editPermission === 'anyone' && (
                                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700">Wiki</Badge>
                                    )}
                                  </CardTitle>
                                  {list.description && (
                                    <CardDescription className="text-sm text-gray-500 mt-1 line-clamp-2">
                                      {list.description}
                                    </CardDescription>
                                  )}
                                </div>
                                <div className="flex-shrink-0 ml-2">
                                  {list.visibility === 'public' && (
                                    <Globe className="w-4 h-4 text-green-600" />
                                  )}
                                  {list.visibility === 'link_only' && (
                                    <Link2 className="w-4 h-4 text-blue-600" />
                                  )}
                                  {list.visibility === 'invited_only' && (
                                    <Lock className="w-4 h-4 text-orange-600" />
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                              {/* オーナー情報 */}
                              {list.owner && (
                                <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                                  {list.owner.image ? (
                                    <img src={list.owner.image} alt={list.owner.name} className="w-4 h-4 rounded-full" />
                                  ) : (
                                    <User className="w-4 h-4" />
                                  )}
                                  <span>{list.owner.name}</span>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mb-3">
                                {list.tags?.slice(0, 3).map((tag: string) => (
                                  <Badge key={tag} variant="secondary" className="text-xs bg-pink-50 text-pink-600">
                                    {tag}
                                  </Badge>
                                ))}
                                {list.tags?.length > 3 && (
                                  <Badge variant="outline" className="text-xs">+{list.tags.length - 3}</Badge>
                                )}
                              </div>
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-3">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {list.viewCount || 0}
                                  </span>
                                </div>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {list.viewedAt ? new Date(list.viewedAt).toLocaleDateString('ja-JP') : ''}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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

    {/* 共有モーダル */}
    {showShareModal && (
      <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-xl sm:rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">リストを共有</h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* タイトル */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  共有リストのタイトル <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={shareTitle}
                  onChange={(e) => setShareTitle(e.target.value)}
                  placeholder="例: 注目のスタートアップ"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink"
                />
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  説明（任意）
                </label>
                <textarea
                  value={shareDescription}
                  onChange={(e) => setShareDescription(e.target.value)}
                  placeholder="このリストについての説明..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink resize-none"
                />
              </div>

              {/* タグ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  共有するタグを選択 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        if (selectedShareTags.includes(tag)) {
                          setSelectedShareTags(prev => prev.filter(t => t !== tag));
                        } else {
                          setSelectedShareTags(prev => [...prev, tag]);
                        }
                      }}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        selectedShareTags.includes(tag)
                          ? 'bg-bond-pink text-white'
                          : 'bg-white text-gray-700 border hover:border-bond-pink'
                      }`}
                    >
                      <Tag className="w-3 h-3 inline-block mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
                {selectedShareTags.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedShareTags.length}個のタグを選択中
                    （{savedItems.filter(item => (item.tags || []).some(t => selectedShareTags.includes(t))).length}件のアイテム）
                  </p>
                )}
              </div>

              {/* 公開設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  公開設定
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="radio"
                      checked={shareIsPublic}
                      onChange={() => setShareIsPublic(true)}
                      className="w-4 h-4 text-bond-pink focus:ring-bond-pink"
                    />
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">公開</p>
                        <p className="text-xs text-gray-500">URLを知っている人は誰でも閲覧可能</p>
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100">
                    <input
                      type="radio"
                      checked={!shareIsPublic}
                      onChange={() => setShareIsPublic(false)}
                      className="w-4 h-4 text-bond-pink focus:ring-bond-pink"
                    />
                    <div className="flex items-center gap-2">
                      <Lock className="w-5 h-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-gray-900">限定公開</p>
                        <p className="text-xs text-gray-500">指定したユーザーのみ閲覧可能</p>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* アクション */}
            <div className="flex flex-col-reverse sm:flex-row items-center gap-2 sm:gap-3 mt-4 sm:mt-6 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowShareModal(false)}
                className="w-full sm:w-auto"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleCreateSharedList}
                disabled={creatingShare || !shareTitle.trim() || selectedShareTags.length === 0}
                className="w-full sm:w-auto sm:flex-1 bg-bond-pink hover:bg-pink-600"
              >
                {creatingShare ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    作成中...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    共有リストを作成
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* 共有リスト一覧モーダル */}
    {showSharedListsModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
        <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-2xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden shadow-2xl">
          {/* ヘッダー */}
          <div className="bg-gradient-to-r from-bond-pink to-pink-400 px-4 sm:px-6 py-4 sm:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">共有中のリスト</h2>
                  <p className="text-white/80 text-xs sm:text-sm">{sharedLists.length}件のリスト</p>
                </div>
              </div>
              <button
                onClick={() => setShowSharedListsModal(false)}
                className="p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg sm:rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* コンテンツ */}
          <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-180px)] sm:max-h-[calc(85vh-180px)]">
            {sharedLists.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-10 h-10 text-pink-300" />
                </div>
                <p className="text-gray-600 font-medium">まだ共有リストがありません</p>
                <p className="text-gray-400 text-sm mt-1">タグを選択してリストを共有しましょう</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sharedLists.map(list => (
                  <div
                    key={list.id}
                    className="group bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-xl sm:rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
                  >
                    <div className="p-3 sm:p-5">
                      <div className="flex items-start gap-2 sm:gap-4">
                        {/* アイコン */}
                        <div className={`flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center ${
                          list.isPublic
                            ? 'bg-gradient-to-br from-green-100 to-emerald-50'
                            : 'bg-gradient-to-br from-amber-100 to-yellow-50'
                        }`}>
                          {list.isPublic ? (
                            <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
                          ) : (
                            <Lock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
                          )}
                        </div>

                        {/* メインコンテンツ */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 text-base sm:text-lg truncate group-hover:text-bond-pink transition-colors">
                                {list.title}
                              </h3>
                              {list.description && (
                                <p className="text-gray-500 text-xs sm:text-sm mt-1 line-clamp-2">{list.description}</p>
                              )}
                            </div>
                          </div>

                          {/* タグ */}
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 flex-wrap">
                            {list.tags.slice(0, 3).map((tag: string) => (
                              <span
                                key={tag}
                                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-pink-50 to-pink-100 text-pink-600 text-xs font-medium rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {list.tags.length > 3 && (
                              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
                                +{list.tags.length - 3}
                              </span>
                            )}
                          </div>

                          {/* ステータス */}
                          <div className="flex items-center gap-2 sm:gap-4 mt-2 sm:mt-3 flex-wrap">
                            <span className={`inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full ${
                              list.isPublic
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {list.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                              {list.isPublic ? '公開中' : '限定公開'}
                            </span>
                            {list.sharedWith?.length > 0 && (
                              <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs font-medium text-blue-600 bg-blue-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                                <Users className="w-3 h-3" />
                                {list.sharedWith.length}人
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              {list.viewCount}回
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex items-center justify-end gap-1 sm:gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100 flex-wrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInviteListId(inviteListId === list.id ? null : list.id)}
                          className={`gap-1 sm:gap-2 rounded-lg sm:rounded-xl transition-all text-xs sm:text-sm px-2 sm:px-3 ${
                            inviteListId === list.id
                              ? 'bg-bond-pink text-white hover:bg-pink-600'
                              : 'text-gray-600 hover:text-bond-pink hover:bg-pink-50'
                          }`}
                        >
                          <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          招待
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyShareUrl(list.shareId)}
                          className="gap-1 sm:gap-2 text-gray-600 hover:text-bond-pink hover:bg-pink-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-2 sm:px-3"
                        >
                          <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          <span className="hidden sm:inline">URLを</span>コピー
                        </Button>
                        <Link href={`/lists/share/${list.shareId}`} target="_blank">
                          <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg sm:rounded-xl text-xs sm:text-sm px-2 sm:px-3">
                            <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            開く
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSharedList(list.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg sm:rounded-xl px-2 sm:px-3"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* 招待パネル（展開時） */}
                    {inviteListId === list.id && (
                      <div className="border-t border-gray-100 bg-gradient-to-br from-pink-50/50 to-white p-3 sm:p-5">
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2 sm:mb-3">
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-bond-pink" />
                            <p className="text-xs sm:text-sm font-semibold text-gray-800">メールアドレスで招待</p>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <div className="flex-1 relative">
                              <input
                                type="email"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && inviteEmail.trim()) {
                                    handleInviteUser(list.id, inviteEmail);
                                  }
                                }}
                                placeholder="user@example.com"
                                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink transition-all shadow-sm"
                              />
                            </div>
                            <Button
                              onClick={() => handleInviteUser(list.id, inviteEmail)}
                              disabled={inviting || !inviteEmail.trim()}
                              className="bg-gradient-to-r from-bond-pink to-pink-500 hover:from-pink-600 hover:to-pink-600 text-white px-4 sm:px-6 py-2.5 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all"
                            >
                              {inviting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <span className="flex items-center gap-2">
                                  <UserPlus className="w-4 h-4" />
                                  招待
                                </span>
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-400 mt-2 ml-1">
                            Bondに登録済みのユーザーのみ招待できます
                          </p>
                        </div>

                        {/* 招待済みユーザー一覧 */}
                        {list.sharedWith?.length > 0 && (
                          <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
                              <p className="text-xs sm:text-sm font-semibold text-gray-800">招待済みユーザー</p>
                              <span className="text-xs text-gray-400">({list.sharedWith.length}人)</span>
                            </div>
                            <div className="grid gap-2">
                              {list.sharedWith.map((user: any) => (
                                <div
                                  key={user.id}
                                  className="flex items-center justify-between bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    {user.image ? (
                                      <img src={user.image} alt={user.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full ring-2 ring-gray-100 flex-shrink-0" />
                                    ) : (
                                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                                        <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user.name || '名前未設定'}</p>
                                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                                    </div>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveInvite(list.id, user.id)}
                                    className="text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0 p-1.5 sm:p-2"
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* フッター */}
          <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              onClick={() => {
                setShowSharedListsModal(false);
                setShowShareModal(true);
              }}
              className="w-full bg-gradient-to-r from-bond-pink to-pink-500 hover:from-pink-600 hover:to-pink-600 text-white py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all font-medium text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              新しい共有リストを作成
            </Button>
          </div>
        </div>
      </div>
    )}
    </LockedFeature>
  );
}
