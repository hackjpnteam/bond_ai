'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, User, Package, Search, ExternalLink, Calendar, Tag, MessageSquare, Eye, ArrowLeft, Loader2, Edit2, Edit3, Plus, X, Save, Trash2, Globe, Link as LinkIcon, Lock, UserPlus, Users, ArrowUpDown, Star, SortAsc, Hash, ChevronDown, ChevronUp, Heart, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { toast } from 'sonner';

interface ReplyData {
  id: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    image?: string;
  };
}

interface EvaluationData {
  id: string;
  rating: number;
  relationshipType: number;
  comment?: string;
  categories?: {
    culture: number;
    growth: number;
    workLifeBalance: number;
    compensation: number;
    leadership: number;
  };
  isAnonymous: boolean;
  likesCount: number;
  repliesCount?: number;
  replies?: ReplyData[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    image?: string;
    company?: string;
  } | null;
}

interface SharedItem {
  id: string;
  source: 'saved' | 'shared';
  itemType: 'company' | 'person' | 'service' | 'search_result';
  itemData: {
    name: string;
    slug?: string;
    description?: string;
    logoUrl?: string;
    metadata?: any;
    averageRating?: number;
    founded?: string;
    evaluations?: EvaluationData[];
  };
  tags?: string[];
  notes?: string;
  addedBy?: {
    id: string;
    name: string;
    image?: string;
  } | null;
  createdAt: string;
}

type SortType = 'bondScore' | 'name' | 'founded';

type VisibilityType = 'public' | 'link_only' | 'invited_only';

interface SharedUser {
  id: string;
  name: string;
  image?: string;
  company?: string;
}

interface SharedListData {
  id: string;
  shareId: string;
  title: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  visibility: VisibilityType;
  viewCount: number;
  createdAt: string;
  canEdit: boolean;
  isOwner: boolean;
  owner: {
    name: string;
    image?: string;
    company?: string;
  } | null;
  sharedWith?: SharedUser[];
}

interface Props {
  shareId: string;
}

export default function SharedListClient({ shareId }: Props) {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [sharedList, setSharedList] = useState<SharedListData | null>(null);
  const [items, setItems] = useState<SharedItem[]>([]);
  const [sharedListItems, setSharedListItems] = useState<SharedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集モード
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // 閲覧範囲設定
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [showVisibilityOptions, setShowVisibilityOptions] = useState(false);

  // 編集権限設定
  const [savingEditPermission, setSavingEditPermission] = useState(false);

  // アイテム追加モーダル
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'search' | 'manual'>('search');
  const [newItemType, setNewItemType] = useState<'company' | 'person' | 'service'>('company');
  const [newItemName, setNewItemName] = useState('');
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemNotes, setNewItemNotes] = useState('');
  const [newItemLogoUrl, setNewItemLogoUrl] = useState('');
  const [addingItem, setAddingItem] = useState(false);

  // Bond内検索
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  // メモ編集
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState('');

  // タグ編集
  const [editingTagsId, setEditingTagsId] = useState<string | null>(null);
  const [editTagsText, setEditTagsText] = useState('');
  const [savingItemEdit, setSavingItemEdit] = useState(false);

  // 説明（概要）編集
  const [editingDescriptionId, setEditingDescriptionId] = useState<string | null>(null);
  const [editDescriptionText, setEditDescriptionText] = useState('');

  // 招待者管理
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteSearchQuery, setInviteSearchQuery] = useState('');
  const [inviteSearchResults, setInviteSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [addingInvitee, setAddingInvitee] = useState(false);

  // 並び替え
  const [sortType, setSortType] = useState<SortType>('bondScore');

  // 評価の展開状態を管理
  const [expandedEvaluations, setExpandedEvaluations] = useState<Set<string>>(new Set());

  // 現在のユーザー情報
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; image?: string; company?: string } | null>(null);

  // 評価投稿モーダル
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [evaluationTargetItem, setEvaluationTargetItem] = useState<SharedItem | null>(null);
  const [evaluationRating, setEvaluationRating] = useState(0);
  const [evaluationComment, setEvaluationComment] = useState('');
  const [evaluationRelationshipType, setEvaluationRelationshipType] = useState<number | ''>('');
  const [evaluationIsAnonymous, setEvaluationIsAnonymous] = useState(false);
  const [submittingEvaluation, setSubmittingEvaluation] = useState(false);

  // いいね機能
  const [likingId, setLikingId] = useState<string | null>(null);
  const [animatingLikes, setAnimatingLikes] = useState<Set<string>>(new Set());

  // リプライ機能
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);

  // 関係性オプション
  const RELATIONSHIP_OPTIONS = [
    { value: 1, label: '現職' },
    { value: 2, label: '元従業員' },
    { value: 3, label: '取引先' },
    { value: 4, label: '投資先' },
    { value: 5, label: '経営者' },
    { value: 6, label: 'その他' }
  ];

  const toggleEvaluations = (itemId: string) => {
    setExpandedEvaluations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  useEffect(() => {
    fetchSharedList();
    checkLoginStatus();
  }, [shareId]);

  // ログイン状態をチェック
  const checkLoginStatus = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      setIsLoggedIn(response.ok && data.user);
      if (response.ok && data.user) {
        setCurrentUser({
          id: data.user.id,
          name: data.user.name,
          image: data.user.image,
          company: data.user.company
        });
      }
    } catch {
      setIsLoggedIn(false);
    }
  };

  const fetchSharedList = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`);
      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList(data.sharedList);
        setItems(data.items || []);
        setSharedListItems(data.sharedListItems || []);
        setEditTitle(data.sharedList.title);
        setEditDescription(data.sharedList.description || '');
      } else if (response.status === 401 && data.requireLogin) {
        // ログインが必要な場合、/loginにリダイレクト
        const callbackUrl = encodeURIComponent(`/lists/share/${shareId}`);
        router.push(`/login?callbackUrl=${callbackUrl}`);
        return;
      } else {
        setError(data.error || '共有リストの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching shared list:', err);
      setError('共有リストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHeader = async () => {
    if (!sharedList) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList({
          ...sharedList,
          title: editTitle,
          description: editDescription
        });
        setIsEditingHeader(false);
        toast.success('リスト情報を更新しました');
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating shared list:', err);
      toast.error('更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  // 閲覧範囲を更新
  const handleVisibilityChange = async (newVisibility: VisibilityType) => {
    if (!sharedList) return;

    try {
      setSavingVisibility(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: newVisibility })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList({
          ...sharedList,
          visibility: newVisibility
        });
        toast.success('閲覧範囲を更新しました');
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating visibility:', err);
      toast.error('更新に失敗しました');
    } finally {
      setSavingVisibility(false);
    }
  };

  // 編集権限を更新
  const handleEditPermissionChange = async (newEditPermission: 'owner_only' | 'anyone') => {
    if (!sharedList) return;

    try {
      setSavingEditPermission(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ editPermission: newEditPermission })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList({
          ...sharedList,
          editPermission: newEditPermission
        });
        toast.success(newEditPermission === 'anyone' ? 'Wikiモードを有効にしました' : '編集権限をオーナーのみに変更しました');
      } else {
        toast.error(data.error || '更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating editPermission:', err);
      toast.error('更新に失敗しました');
    } finally {
      setSavingEditPermission(false);
    }
  };

  // 閲覧範囲のラベルとアイコンを取得
  const getVisibilityInfo = (visibility: VisibilityType) => {
    switch (visibility) {
      case 'public':
        return { label: 'ネット公開', icon: Globe, color: 'text-green-600', bgColor: 'bg-green-50' };
      case 'link_only':
        return { label: 'リンク限定', icon: LinkIcon, color: 'text-blue-600', bgColor: 'bg-blue-50' };
      case 'invited_only':
        return { label: '招待者限定', icon: Lock, color: 'text-orange-600', bgColor: 'bg-orange-50' };
      default:
        return { label: 'ネット公開', icon: Globe, color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  // 招待者を検索
  const handleSearchUsers = async (query: string) => {
    setInviteSearchQuery(query);
    if (query.length < 2) {
      setInviteSearchResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        // 既に招待済みのユーザーを除外
        const existingIds = sharedList?.sharedWith?.map(u => u.id) || [];
        const filteredResults = (data.users || []).filter(
          (user: any) => !existingIds.includes(user._id)
        );
        setInviteSearchResults(filteredResults);
      } else {
        setInviteSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setInviteSearchResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  // 招待者を追加
  const handleAddInvitee = async (userId: string) => {
    if (!sharedList) return;

    try {
      setAddingInvitee(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addUserId: userId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList({
          ...sharedList,
          sharedWith: data.sharedList.sharedWith || []
        });
        setInviteSearchQuery('');
        setInviteSearchResults([]);
        toast.success('招待者を追加しました');
      } else {
        toast.error(data.error || '招待者の追加に失敗しました');
      }
    } catch (err) {
      console.error('Error adding invitee:', err);
      toast.error('招待者の追加に失敗しました');
    } finally {
      setAddingInvitee(false);
    }
  };

  // 招待者を削除
  const handleRemoveInvitee = async (userId: string) => {
    if (!sharedList) return;

    try {
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeUserId: userId })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedList({
          ...sharedList,
          sharedWith: data.sharedList.sharedWith || []
        });
        toast.success('招待者を削除しました');
      } else {
        toast.error(data.error || '招待者の削除に失敗しました');
      }
    } catch (err) {
      console.error('Error removing invitee:', err);
      toast.error('招待者の削除に失敗しました');
    }
  };

  // Bond内の企業・人物・サービスを検索
  const handleSearchBond = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(`/api/search/bond?q=${encodeURIComponent(query)}&type=${newItemType}`);
      const data = await response.json();

      if (data.success) {
        setSearchResults(data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching bond:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // 検索結果から選択したアイテムを追加
  const handleAddSelectedItem = async () => {
    if (!selectedItem) {
      toast.error('アイテムを選択してください');
      return;
    }

    try {
      setAddingItem(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: selectedItem.type || newItemType,
          itemData: {
            name: selectedItem.name,
            slug: selectedItem.slug,
            description: selectedItem.description,
            logoUrl: selectedItem.logo || selectedItem.image
          },
          notes: newItemNotes.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedListItems(prev => [{
          id: data.item.id,
          source: 'shared',
          itemType: data.item.itemType,
          itemData: data.item.itemData,
          notes: data.item.notes,
          createdAt: data.item.createdAt
        }, ...prev]);

        resetAddModal();
        toast.success('アイテムを追加しました');
      } else {
        toast.error(data.error || 'アイテムの追加に失敗しました');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error('アイテムの追加に失敗しました');
    } finally {
      setAddingItem(false);
    }
  };

  // 手動入力でアイテムを追加
  const handleAddItem = async () => {
    if (!newItemName.trim()) {
      toast.error('名前を入力してください');
      return;
    }

    try {
      setAddingItem(true);
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: newItemType,
          itemData: {
            name: newItemName.trim(),
            description: newItemDescription.trim() || undefined,
            logoUrl: newItemLogoUrl.trim() || undefined
          },
          notes: newItemNotes.trim() || undefined
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedListItems(prev => [{
          id: data.item.id,
          source: 'shared',
          itemType: data.item.itemType,
          itemData: data.item.itemData,
          notes: data.item.notes,
          createdAt: data.item.createdAt
        }, ...prev]);

        resetAddModal();
        toast.success('アイテムを追加しました');
      } else {
        toast.error(data.error || 'アイテムの追加に失敗しました');
      }
    } catch (err) {
      console.error('Error adding item:', err);
      toast.error('アイテムの追加に失敗しました');
    } finally {
      setAddingItem(false);
    }
  };

  // モーダルをリセット
  const resetAddModal = () => {
    setShowAddModal(false);
    setAddMode('search');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedItem(null);
    setNewItemName('');
    setNewItemDescription('');
    setNewItemNotes('');
    setNewItemLogoUrl('');
  };

  // 追加したアイテムを削除
  const handleDeleteItem = async (itemId: string) => {
    if (!sharedList) return;
    if (!confirm('このアイテムを削除しますか？')) return;

    try {
      const response = await fetch(`/api/shared-lists/${sharedList.id}/items?itemId=${itemId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSharedListItems(prev => prev.filter(item => item.id !== itemId));
        toast.success('アイテムを削除しました');
      } else {
        toast.error(data.error || 'アイテムの削除に失敗しました');
      }
    } catch (err) {
      console.error('Error deleting item:', err);
      toast.error('アイテムの削除に失敗しました');
    }
  };

  // 評価投稿モーダルを開く
  const openEvaluationModal = (item: SharedItem) => {
    if (!isLoggedIn) {
      toast.error('評価を投稿するにはログインが必要です');
      return;
    }
    setEvaluationTargetItem(item);
    setEvaluationRating(0);
    setEvaluationComment('');
    setEvaluationRelationshipType('');
    setEvaluationIsAnonymous(false);
    setShowEvaluationModal(true);
  };

  // 評価を投稿
  const submitEvaluation = async () => {
    if (!evaluationTargetItem || evaluationRating === 0 || evaluationRelationshipType === '' || !evaluationComment.trim()) {
      toast.error('すべての項目を入力してください');
      return;
    }

    if (!currentUser?.id) {
      toast.error('評価を投稿するにはログインが必要です');
      return;
    }

    setSubmittingEvaluation(true);
    try {
      const companyName = evaluationTargetItem.itemData.name;
      const companySlug = evaluationTargetItem.itemData.slug || companyName.toLowerCase();

      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName,
          companySlug,
          rating: evaluationRating,
          comment: evaluationComment.trim(),
          categories: {
            culture: evaluationRating,
            growth: evaluationRating,
            workLifeBalance: evaluationRating,
            compensation: evaluationRating,
            leadership: evaluationRating
          },
          relationshipType: Number(evaluationRelationshipType),
          isAnonymous: evaluationIsAnonymous
        })
      });

      if (response.ok) {
        const data = await response.json();

        // ローカルステートを更新
        const newEvaluation: EvaluationData = {
          id: data.evaluation.id,
          rating: evaluationRating,
          relationshipType: Number(evaluationRelationshipType),
          comment: evaluationComment.trim(),
          isAnonymous: evaluationIsAnonymous,
          likesCount: 0,
          repliesCount: 0,
          replies: [],
          createdAt: new Date().toISOString(),
          user: evaluationIsAnonymous ? null : {
            id: currentUser.id,
            name: currentUser.name,
            image: currentUser.image,
            company: currentUser.company
          }
        };

        // アイテムの評価リストを更新
        const updateItemEvaluations = (item: SharedItem) => {
          if (item.id === evaluationTargetItem.id) {
            const evaluations = [...(item.itemData.evaluations || []), newEvaluation];
            const averageRating = evaluations.reduce((sum, e) => sum + e.rating, 0) / evaluations.length;
            return {
              ...item,
              itemData: {
                ...item.itemData,
                evaluations,
                averageRating
              }
            };
          }
          return item;
        };

        setItems(prev => prev.map(updateItemEvaluations));
        setSharedListItems(prev => prev.map(updateItemEvaluations));

        toast.success('評価を投稿しました！');
        setShowEvaluationModal(false);
        setEvaluationTargetItem(null);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || '評価の投稿に失敗しました');
      }
    } catch (error) {
      console.error('評価投稿エラー:', error);
      toast.error('評価の投稿中にエラーが発生しました');
    } finally {
      setSubmittingEvaluation(false);
    }
  };

  // いいねを追加
  const handleLike = async (evaluationId: string) => {
    // アニメーション開始
    setAnimatingLikes(prev => new Set(prev).add(evaluationId));
    setTimeout(() => {
      setAnimatingLikes(prev => {
        const next = new Set(prev);
        next.delete(evaluationId);
        return next;
      });
    }, 600);

    setLikingId(evaluationId);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/like`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();

        // アイテムの評価のいいね数を更新
        const updateLikes = (item: SharedItem) => ({
          ...item,
          itemData: {
            ...item.itemData,
            evaluations: item.itemData.evaluations?.map(e =>
              e.id === evaluationId
                ? { ...e, likesCount: data.likesCount }
                : e
            )
          }
        });

        setItems(prev => prev.map(updateLikes));
        setSharedListItems(prev => prev.map(updateLikes));
      }
    } catch (error) {
      console.error('Failed to add like:', error);
    } finally {
      setLikingId(null);
    }
  };

  // リプライ表示をトグル
  const toggleReplies = (evaluationId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(evaluationId)) {
        newSet.delete(evaluationId);
      } else {
        newSet.add(evaluationId);
      }
      return newSet;
    });
  };

  // リプライを投稿
  const handleReply = async (evaluationId: string) => {
    const content = replyInputs[evaluationId]?.trim();
    if (!content) return;

    if (!currentUser?.id) {
      toast.error('リプライするにはログインが必要です');
      return;
    }

    setSubmittingReply(evaluationId);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content, isAnonymous: false })
      });

      if (response.status === 401) {
        toast.error('リプライするにはログインが必要です');
        return;
      }

      if (response.ok) {
        const data = await response.json();

        // アイテムの評価のリプライを更新
        const updateReplies = (item: SharedItem) => ({
          ...item,
          itemData: {
            ...item.itemData,
            evaluations: item.itemData.evaluations?.map(e =>
              e.id === evaluationId
                ? {
                    ...e,
                    repliesCount: data.repliesCount,
                    replies: [...(e.replies || []), data.reply]
                  }
                : e
            )
          }
        });

        setItems(prev => prev.map(updateReplies));
        setSharedListItems(prev => prev.map(updateReplies));
        setReplyInputs(prev => ({ ...prev, [evaluationId]: '' }));
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
      toast.error('リプライの投稿に失敗しました');
    } finally {
      setSubmittingReply(null);
    }
  };

  // リプライ日時フォーマット
  const formatReplyTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    return date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  };

  // 編集前のログインチェック
  const requireLoginForEdit = (): boolean => {
    if (!isLoggedIn) {
      toast.error('編集するにはログインが必要です');
      return false;
    }
    return true;
  };

  // アイテムのメモを更新
  const handleSaveNotes = async (itemId: string, source: 'saved' | 'shared') => {
    if (!sharedList) return;

    try {
      setSavingItemEdit(true);
      // 共有リスト経由で更新（Wikiモード対応）
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, source, notes: editNoteText })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ローカルステートを更新
        if (source === 'saved') {
          setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, notes: editNoteText } : item
          ));
        } else {
          setSharedListItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, notes: editNoteText } : item
          ));
        }
        setEditingNoteId(null);
        setEditNoteText('');
        toast.success('メモを更新しました');
      } else {
        toast.error(data.error || 'メモの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating notes:', err);
      toast.error('メモの更新に失敗しました');
    } finally {
      setSavingItemEdit(false);
    }
  };

  // アイテムのタグを更新
  const handleSaveTags = async (itemId: string, source: 'saved' | 'shared') => {
    if (!sharedList) return;

    try {
      setSavingItemEdit(true);
      const newTags = editTagsText.split(',').map(t => t.trim()).filter(t => t.length > 0);

      // 共有リスト経由で更新（Wikiモード対応）
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, source, tags: newTags })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ローカルステートを更新
        if (source === 'saved') {
          setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, tags: newTags } : item
          ));
        } else {
          setSharedListItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, tags: newTags } : item
          ));
        }
        setEditingTagsId(null);
        setEditTagsText('');
        toast.success('タグを更新しました');
      } else {
        toast.error(data.error || 'タグの更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating tags:', err);
      toast.error('タグの更新に失敗しました');
    } finally {
      setSavingItemEdit(false);
    }
  };

  // アイテムの説明（概要）を更新
  const handleSaveDescription = async (itemId: string, source: 'saved' | 'shared') => {
    if (!sharedList) return;

    try {
      setSavingItemEdit(true);

      // 共有リスト経由で更新（Wikiモード対応）
      const response = await fetch(`/api/shared-lists/public/${shareId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, source, description: editDescriptionText })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ローカルステートを更新
        if (source === 'saved') {
          setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, itemData: { ...item.itemData, description: editDescriptionText } } : item
          ));
        } else {
          setSharedListItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, itemData: { ...item.itemData, description: editDescriptionText } } : item
          ));
        }
        setEditingDescriptionId(null);
        setEditDescriptionText('');
        toast.success('概要を更新しました');
      } else {
        toast.error(data.error || '概要の更新に失敗しました');
      }
    } catch (err) {
      console.error('Error updating description:', err);
      toast.error('概要の更新に失敗しました');
    } finally {
      setSavingItemEdit(false);
    }
  };

  const getItemIcon = (item: SharedItem) => {
    // 企業の場合は /api/company-logo/[slug] を使用
    if (item.itemType === 'company' || item.itemType === 'search_result') {
      const slug = item.itemData.slug || item.itemData.name.toLowerCase();
      const logoUrl = `/api/company-logo/${encodeURIComponent(slug)}`;

      return (
        <div className="relative h-10 w-10">
          <img
            src={logoUrl}
            alt={item.itemData.name}
            className="h-10 w-10 rounded-lg object-cover"
            onError={(e) => {
              // ロゴ読み込み失敗時はデフォルトアイコンを表示
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="fallback-icon h-10 w-10 rounded-lg bg-blue-100 items-center justify-center absolute inset-0 hidden">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      );
    }

    // ロゴURLを取得（複数のソースをチェック）- 人物・サービス用
    const logoUrl = item.itemData.logoUrl || item.itemData.metadata?.logo || item.itemData.metadata?.image;

    // ロゴURLがある場合はロゴを表示
    if (logoUrl) {
      return (
        <div className="relative h-10 w-10">
          <img
            src={logoUrl}
            alt={item.itemData.name}
            className="h-10 w-10 rounded-lg object-cover"
            onError={(e) => {
              // ロゴ読み込み失敗時はデフォルトアイコンを表示
              const target = e.currentTarget;
              target.style.display = 'none';
              const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
              if (fallback) {
                fallback.style.display = 'flex';
              }
            }}
          />
          <div className="fallback-icon h-10 w-10 rounded-lg bg-blue-100 items-center justify-center absolute inset-0 hidden">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      );
    }

    // デフォルトアイコン
    switch (item.itemType) {
      case 'person':
        return (
          <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
            <User className="h-5 w-5 text-green-500" />
          </div>
        );
      case 'service':
        return (
          <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
            <Package className="h-5 w-5 text-purple-500" />
          </div>
        );
      default:
        return (
          <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-500" />
          </div>
        );
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

  // 関係性タイプのラベルを取得
  const getRelationshipLabel = (type: number): string => {
    switch (type) {
      case 1: return '知人';
      case 2: return '取引先';
      case 3: return '協業先';
      case 4: return '投資先';
      case 5: return '株主';
      case 6: return '友達';
      default: return '未設定';
    }
  };

  // 関係性タイプの色を取得
  const getRelationshipColor = (type: number): string => {
    switch (type) {
      case 1: return 'bg-gray-100 text-gray-600';
      case 2: return 'bg-blue-100 text-blue-700';
      case 3: return 'bg-green-100 text-green-700';
      case 4: return 'bg-purple-100 text-purple-700';
      case 5: return 'bg-amber-100 text-amber-700';
      case 6: return 'bg-pink-100 text-pink-700';
      default: return 'bg-gray-100 text-gray-500';
    }
  };

  const getItemLink = (item: SharedItem) => {
    const slug = item.itemData.slug || item.itemData.metadata?.slug || encodeURIComponent(item.itemData.name);
    switch (item.itemType) {
      case 'company':
      case 'search_result': // 検索結果も企業ページにリンク
        return `/company/${slug}`;
      case 'service':
        return `/service/${slug}`;
      case 'person':
        return `/person/${slug}`;
      default:
        return `/company/${slug}`; // デフォルトも企業ページ
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // マークダウン形式のテキストを概要に要約する関数
  const summarizeDescription = (text: string, maxLength: number = 300): string => {
    if (!text) return '';

    // まずJSONラッパーを除去
    let cleanText = text
      // ```json { "answer": "..." } ``` 形式を処理
      .replace(/^```json\s*\{[\s\S]*?"answer"\s*:\s*"([\s\S]*?)"\s*\}[\s\S]*?```$/gm, '$1')
      // ```json ... ``` を除去
      .replace(/```json[\s\S]*?```/g, '')
      .replace(/```[\s\S]*?```/g, '')
      // エスケープされた改行を実際の改行に
      .replace(/\\n/g, '\n');

    // 「概要」セクションを優先的に抽出
    const overviewMatch = cleanText.match(/(?:^|\n)(?:#{1,2}\s*)?(?:\d+\.\s*)?概要[：:\s]*\n?([\s\S]*?)(?=\n#{1,2}\s|\n\d+\.\s|$)/i);
    let targetText = cleanText;

    if (overviewMatch && overviewMatch[1] && overviewMatch[1].trim().length > 30) {
      targetText = overviewMatch[1];
    }

    // マークダウンの見出し、リンク、強調などを除去
    let cleaned = targetText
      // 見出し行全体を除去（## 1. 概要 など）
      .replace(/^#{1,6}\s*\d*\.?\s*[^\n]*\n?/gm, '')
      // 番号付き見出し（1. 概要 など）を除去
      .replace(/^\d+\.\s+[^\n]*$/gm, '')
      // 太字・斜体 (**text**, *text*, __text__, _text_) を除去
      .replace(/(\*\*|__)(.*?)\1/g, '$2')
      .replace(/(\*|_)(.*?)\1/g, '$2')
      // リンク [text](url) をテキストのみに
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // 画像 ![alt](url) を除去
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      // 水平線 (---, ***, ___) を除去
      .replace(/^[-*_]{3,}\s*$/gm, '')
      // リストマーカー (-, *, 1.) を除去
      .replace(/^[\s]*[-*+]\s+/gm, '')
      // インラインコード (`code`) を除去
      .replace(/`+/g, '')
      // 絵文字を除去
      .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
      // URLを除去
      .replace(/https?:\/\/[^\s]+/g, '')
      // 「作成:」「日付:」などのメタ情報行を除去
      .replace(/^(作成|日付|Bond\s*ページ)[：:][^\n]*$/gm, '')
      // 改行を空白に変換
      .replace(/\n+/g, ' ')
      // 連続する空白を1つに
      .replace(/\s{2,}/g, ' ')
      .trim();

    // 最大文字数で切り詰め
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
      // 文の途中で切れないように、最後の句点で切る
      const lastPeriod = cleaned.lastIndexOf('。');
      if (lastPeriod > maxLength * 0.5) {
        cleaned = cleaned.substring(0, lastPeriod + 1);
      } else {
        cleaned = cleaned + '...';
      }
    }

    return cleaned;
  };

  // 全アイテムを結合して並び替え
  const allItems = [...sharedListItems, ...items].sort((a, b) => {
    switch (sortType) {
      case 'bondScore':
        // Bondスコア高い順（スコアがない場合は最後に）
        const scoreA = a.itemData.averageRating || 0;
        const scoreB = b.itemData.averageRating || 0;
        return scoreB - scoreA;
      case 'name':
        // あいうえお順（日本語ソート）
        return a.itemData.name.localeCompare(b.itemData.name, 'ja');
      case 'founded':
        // 創業年順（古い順、創業年がない場合は最後に）
        const yearA = a.itemData.founded ? parseInt(a.itemData.founded) : 9999;
        const yearB = b.itemData.founded ? parseInt(b.itemData.founded) : 9999;
        return yearA - yearB;
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-bond-pink" />
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold mb-2">エラー</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                トップページへ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedList) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Logo className="text-gray-900" />
                <span className="text-gray-300">/</span>
                <span>共有リスト</span>
                {sharedList.canEdit && (
                  <Badge className="ml-2 bg-green-100 text-green-700 hover:bg-green-100">
                    編集可能
                  </Badge>
                )}
              </div>

              {isEditingHeader ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-2xl font-bold text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bond-pink/50"
                    placeholder="リストタイトル"
                  />
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bond-pink/50 resize-none"
                    placeholder="説明（任意）"
                    rows={3}
                  />

                  {/* 閲覧範囲選択（オーナーのみ） */}
                  {sharedList.isOwner && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">閲覧範囲</span>
                        {savingVisibility && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { value: 'public', label: 'ネット公開', desc: '誰でも閲覧可能', icon: Globe, color: '#22c55e', bgColor: '#f0fdf4', borderColor: '#22c55e' },
                          { value: 'link_only', label: 'リンク限定', desc: 'リンクを知っている人のみ', icon: LinkIcon, color: '#3b82f6', bgColor: '#eff6ff', borderColor: '#3b82f6' },
                          { value: 'invited_only', label: '招待者限定', desc: '招待した人のみ', icon: Lock, color: '#f97316', bgColor: '#fff7ed', borderColor: '#f97316' }
                        ].map(({ value, label, desc, icon: Icon, color, bgColor, borderColor }) => {
                          const isSelected = sharedList.visibility === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleVisibilityChange(value as VisibilityType)}
                              disabled={savingVisibility}
                              className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left"
                              style={{
                                borderColor: isSelected ? borderColor : '#e5e7eb',
                                backgroundColor: isSelected ? bgColor : '#ffffff'
                              }}
                            >
                              <div
                                className="p-1.5 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: isSelected ? color : '#f3f4f6' }}
                              >
                                <Icon className="h-4 w-4" style={{ color: isSelected ? '#ffffff' : '#6b7280' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold" style={{ color: isSelected ? color : '#374151' }}>
                                  {label}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{desc}</div>
                              </div>
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 編集権限選択（オーナーのみ） */}
                  {sharedList.isOwner && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Edit3 className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">編集権限</span>
                        {savingEditPermission && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { value: 'owner_only', label: 'オーナーのみ', desc: '自分だけが編集可能', icon: Lock, color: '#6b7280', bgColor: '#f9fafb', borderColor: '#6b7280' },
                          { value: 'anyone', label: 'Wikiモード', desc: '誰でも追加・編集可能', icon: Users, color: '#8b5cf6', bgColor: '#f5f3ff', borderColor: '#8b5cf6' }
                        ].map(({ value, label, desc, icon: Icon, color, bgColor, borderColor }) => {
                          const isSelected = (sharedList.editPermission || 'owner_only') === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => handleEditPermissionChange(value as 'owner_only' | 'anyone')}
                              disabled={savingEditPermission}
                              className="flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left"
                              style={{
                                borderColor: isSelected ? borderColor : '#e5e7eb',
                                backgroundColor: isSelected ? bgColor : '#ffffff'
                              }}
                            >
                              <div
                                className="p-1.5 rounded-lg flex-shrink-0"
                                style={{ backgroundColor: isSelected ? color : '#f3f4f6' }}
                              >
                                <Icon className="h-4 w-4" style={{ color: isSelected ? '#ffffff' : '#6b7280' }} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-semibold" style={{ color: isSelected ? color : '#374151' }}>
                                  {label}
                                </div>
                                <div className="text-xs text-gray-500 truncate">{desc}</div>
                              </div>
                              {isSelected && (
                                <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      onClick={handleSaveHeader}
                      disabled={saving || !editTitle.trim()}
                      className="bg-bond-pink hover:bg-pink-600"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      保存
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditingHeader(false);
                        setEditTitle(sharedList.title);
                        setEditDescription(sharedList.description || '');
                      }}
                    >
                      キャンセル
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{sharedList.title}</h1>
                    {sharedList.canEdit && (
                      <button
                        onClick={() => setIsEditingHeader(true)}
                        className="p-1.5 text-gray-400 hover:text-bond-pink hover:bg-pink-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  {sharedList.description && (
                    <p className="text-gray-600 mt-2">{sharedList.description}</p>
                  )}
                </>
              )}

              <div className="flex flex-wrap gap-2 mt-3">
                {sharedList.tags.map(tag => (
                  <Badge key={tag} variant="secondary" className="text-sm bg-pink-50 text-pink-600">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 mt-3">
                {sharedList.owner && (
                  <div className="flex items-center gap-2">
                    {sharedList.owner.image ? (
                      <img
                        src={sharedList.owner.image}
                        alt={sharedList.owner.name}
                        className="h-6 w-6 rounded-full ring-2 ring-white"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                    )}
                    <span className="font-medium text-gray-700">{sharedList.owner.name}</span>
                    {sharedList.owner.company && (
                      <span className="text-gray-400">@ {sharedList.owner.company}</span>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span>{sharedList.viewCount} 回閲覧</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(sharedList.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* 閲覧範囲バッジと招待者（オーナーのみ表示） */}
              {sharedList.isOwner && !isEditingHeader && (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {/* 閲覧範囲バッジ */}
                  {(() => {
                    const info = getVisibilityInfo(sharedList.visibility);
                    const Icon = info.icon;
                    const colors: Record<VisibilityType, { bg: string; text: string }> = {
                      public: { bg: '#f0fdf4', text: '#15803d' },
                      link_only: { bg: '#eff6ff', text: '#1d4ed8' },
                      invited_only: { bg: '#fff7ed', text: '#c2410c' }
                    };
                    const c = colors[sharedList.visibility] || colors.public;
                    return (
                      <button
                        onClick={() => setIsEditingHeader(true)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                        style={{ backgroundColor: c.bg, color: c.text }}
                      >
                        <Icon className="h-3 w-3" />
                        {info.label}
                        <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                      </button>
                    );
                  })()}

                  {/* Wikiモードバッジ */}
                  {sharedList.editPermission === 'anyone' && (
                    <button
                      onClick={() => setIsEditingHeader(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                      style={{ backgroundColor: '#f5f3ff', color: '#7c3aed' }}
                    >
                      <Users className="h-3 w-3" />
                      Wikiモード
                      <Edit2 className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                    </button>
                  )}

                  {/* 招待者セクション */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>招待者:</span>
                    </div>

                    {/* 招待者アイコン */}
                    {sharedList.sharedWith && sharedList.sharedWith.length > 0 ? (
                      <div className="flex items-center -space-x-2">
                        {sharedList.sharedWith.slice(0, 5).map((user) => (
                          <div
                            key={user.id}
                            className="relative group"
                            title={user.name}
                          >
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name}
                                className="h-7 w-7 rounded-full ring-2 ring-white object-cover"
                              />
                            ) : (
                              <div className="h-7 w-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            {/* ホバー時のツールチップ */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                              {user.name}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveInvitee(user.id);
                                }}
                                className="ml-1.5 text-red-300 hover:text-red-400"
                              >
                                ×
                              </button>
                            </div>
                          </div>
                        ))}
                        {sharedList.sharedWith.length > 5 && (
                          <div className="h-7 w-7 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-xs text-gray-600 font-medium">
                            +{sharedList.sharedWith.length - 5}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">なし</span>
                    )}

                    {/* 招待者追加ボタン */}
                    <button
                      onClick={() => setShowInviteModal(true)}
                      className="h-7 w-7 rounded-full bg-gray-100 hover:bg-pink-100 flex items-center justify-center text-gray-500 hover:text-bond-pink transition-all"
                      title="招待者を追加"
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* 招待者表示（非オーナー用 - 閲覧のみ） */}
              {!sharedList.isOwner && sharedList.sharedWith && sharedList.sharedWith.length > 0 && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="h-3.5 w-3.5" />
                    <span>参加者:</span>
                  </div>
                  <div className="flex items-center -space-x-2">
                    {sharedList.sharedWith.slice(0, 5).map((user) => (
                      <div key={user.id} className="relative group" title={user.name}>
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-7 w-7 rounded-full ring-2 ring-white object-cover"
                          />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gray-200 ring-2 ring-white flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {sharedList.sharedWith.length > 5 && (
                      <div className="h-7 w-7 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-xs text-gray-600 font-medium">
                        +{sharedList.sharedWith.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* アイテム一覧 */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <p className="text-sm text-gray-500">{allItems.length} 件のアイテム</p>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 並び替え */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setSortType('bondScore')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sortType === 'bondScore'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="Bondスコア順"
              >
                <Star className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">スコア順</span>
              </button>
              <button
                onClick={() => setSortType('name')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sortType === 'name'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="あいうえお順"
              >
                <SortAsc className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">あいうえお順</span>
              </button>
              <button
                onClick={() => setSortType('founded')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  sortType === 'founded'
                    ? 'bg-white text-bond-pink shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                title="創業年順"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">創業年順</span>
              </button>
            </div>

            {sharedList.canEdit && (
              <Button
                onClick={() => {
                  if (!requireLoginForEdit()) return;
                  setShowAddModal(true);
                }}
                className="bg-bond-pink hover:bg-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                アイテムを追加
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3">
          {allItems.map(item => {
            const link = getItemLink(item);
            const isEditingTags = editingTagsId === `${item.source}-${item.id}`;
            const isEditingNotes = editingNoteId === `${item.source}-${item.id}`;
            return (
              <Card key={`${item.source}-${item.id}`} className="hover:shadow-lg transition-all duration-300 overflow-hidden">
                <CardContent className="p-3 sm:p-4">
                  {/* ヘッダー: ロゴ + 名前 + 外部リンク */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2">
                    <div className="flex-shrink-0">
                      {link ? (
                        <Link href={link}>
                          {getItemIcon(item)}
                        </Link>
                      ) : (
                        getItemIcon(item)
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {link ? (
                        <Link href={link} className="hover:text-bond-pink transition-colors">
                          <h3 className="font-semibold text-gray-900 text-base sm:text-lg hover:text-bond-pink break-words leading-tight">
                            {item.itemData.name}
                          </h3>
                        </Link>
                      ) : (
                        <h3 className="font-semibold text-gray-900 text-base sm:text-lg break-words leading-tight">
                          {item.itemData.name}
                        </h3>
                      )}
                    </div>
                    {link && (
                      <Link href={link} target="_blank" className="flex-shrink-0">
                        <ExternalLink className="h-4 w-4 text-gray-400 hover:text-bond-pink" />
                      </Link>
                    )}
                  </div>

                  {/* メタ情報行: タイプ + スコア */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="outline" className="text-xs">
                      {getItemTypeLabel(item.itemType)}
                    </Badge>
                    {/* Bondスコア */}
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                      item.itemData.averageRating !== undefined && item.itemData.averageRating > 0
                        ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`} title="Bondスコア">
                      <Star className={`h-3 w-3 ${
                        item.itemData.averageRating !== undefined && item.itemData.averageRating > 0
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`} />
                      <span className={`text-xs font-semibold ${
                        item.itemData.averageRating !== undefined && item.itemData.averageRating > 0
                          ? 'text-yellow-700'
                          : 'text-gray-400'
                      }`}>
                        {item.itemData.averageRating !== undefined && item.itemData.averageRating > 0
                          ? item.itemData.averageRating.toFixed(1)
                          : '未記載'}
                      </span>
                    </div>
                  </div>

                  {/* 概要（説明）表示・編集エリア */}
                  {editingDescriptionId === `${item.source}-${item.id}` ? (
                    <div className="mb-3">
                      <textarea
                        value={editDescriptionText}
                        onChange={(e) => setEditDescriptionText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink resize-vertical min-h-[200px]"
                        rows={12}
                        placeholder="企業・サービスの概要を入力..."
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveDescription(item.id, item.source)}
                          disabled={savingItemEdit}
                          className="bg-bond-pink hover:bg-pink-600"
                        >
                          {savingItemEdit ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingDescriptionId(null);
                            setEditDescriptionText('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3">
                      {item.itemData.description ? (
                        <div className="flex items-start gap-2">
                          <p className="text-sm text-gray-600 leading-relaxed break-words flex-1">
                            {summarizeDescription(item.itemData.description)}
                          </p>
                          {sharedList.canEdit && (
                            <button
                              onClick={() => {
                                if (!requireLoginForEdit()) return;
                                setEditingDescriptionId(`${item.source}-${item.id}`);
                                setEditDescriptionText(item.itemData.description || '');
                              }}
                              className="flex-shrink-0 p-1 text-gray-400 hover:text-bond-pink hover:bg-pink-50 rounded transition-all"
                              title="概要を編集"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ) : sharedList.canEdit && (
                        <button
                          onClick={() => {
                            if (!requireLoginForEdit()) return;
                            setEditingDescriptionId(`${item.source}-${item.id}`);
                            setEditDescriptionText('');
                          }}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-bond-pink"
                        >
                          <Plus className="h-3 w-3" />
                          概要を追加
                        </button>
                      )}
                    </div>
                  )}

                  {/* タグ表示・編集エリア */}
                  {isEditingTags ? (
                    <div className="mb-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editTagsText}
                          onChange={(e) => setEditTagsText(e.target.value)}
                          className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                          placeholder="タグをカンマ区切りで入力"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveTags(item.id, item.source)}
                          disabled={savingItemEdit}
                          className="bg-bond-pink hover:bg-pink-600"
                        >
                          {savingItemEdit ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingTagsId(null);
                            setEditTagsText('');
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">カンマ（,）で区切って複数のタグを入力できます</p>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      {item.tags && item.tags.length > 0 ? (
                        item.tags.map(tag => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs bg-pink-50 text-pink-600"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">タグなし</span>
                      )}
                      {sharedList.canEdit && (
                        <button
                          onClick={() => {
                            if (!requireLoginForEdit()) return;
                            setEditingTagsId(`${item.source}-${item.id}`);
                            setEditTagsText(item.tags?.join(', ') || '');
                          }}
                          className="p-1 text-gray-400 hover:text-bond-pink hover:bg-pink-50 rounded transition-colors"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* メモ表示・編集エリア */}
                  {isEditingNotes ? (
                    <div className="mt-2">
                      <textarea
                        value={editNoteText}
                        onChange={(e) => setEditNoteText(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink resize-none"
                        rows={3}
                        placeholder="メモを入力..."
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveNotes(item.id, item.source)}
                          disabled={savingItemEdit}
                          className="bg-bond-pink hover:bg-pink-600"
                        >
                          {savingItemEdit ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Save className="h-3 w-3 mr-1" />}
                          保存
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingNoteId(null);
                            setEditNoteText('');
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  ) : item.notes ? (
                    <div className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-2 sm:p-3 mt-2 group relative">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-pink-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-pink-700 whitespace-pre-wrap break-words flex-1 leading-relaxed">
                          {item.notes}
                        </p>
                        {sharedList.canEdit && (
                          <button
                            onClick={() => {
                              if (!requireLoginForEdit()) return;
                              setEditingNoteId(`${item.source}-${item.id}`);
                              setEditNoteText(item.notes || '');
                            }}
                            className="p-1 text-pink-300 hover:text-pink-500 hover:bg-pink-100 rounded opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : sharedList.canEdit && (
                    <button
                      onClick={() => {
                        if (!requireLoginForEdit()) return;
                        setEditingNoteId(`${item.source}-${item.id}`);
                        setEditNoteText('');
                      }}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-bond-pink mt-2"
                    >
                      <Plus className="h-3 w-3" />
                      メモを追加
                    </button>
                  )}

                  {/* 評価セクション - 評価があるか、ログインユーザーの場合のみ表示 */}
                  {((item.itemData.evaluations && item.itemData.evaluations.length > 0) || isLoggedIn) && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        {item.itemData.evaluations && item.itemData.evaluations.length > 0 ? (
                          <button
                            onClick={() => toggleEvaluations(`${item.source}-${item.id}`)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-bond-pink transition-colors"
                          >
                            <Star className="h-4 w-4 text-yellow-500" />
                            評価 ({item.itemData.evaluations.length}件)
                            {expandedEvaluations.has(`${item.source}-${item.id}`) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        ) : (
                          <div />
                        )}
                        {isLoggedIn && (
                          <button
                            onClick={() => openEvaluationModal(item)}
                            className="flex items-center gap-1 text-xs text-bond-pink hover:text-pink-600 font-medium transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                            評価を投稿
                          </button>
                        )}
                      </div>

                      {expandedEvaluations.has(`${item.source}-${item.id}`) && (
                        <div className="mt-2 space-y-2">
                          {item.itemData.evaluations && item.itemData.evaluations.length > 0 ? (
                            item.itemData.evaluations.map((evaluation) => (
                              <div
                                key={evaluation.id}
                                className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-2 sm:p-3"
                              >
                                {/* ヘッダー: アバター + ユーザー名 + バッジ + スコア */}
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  {/* ユーザーアバター */}
                                  {evaluation.user?.image ? (
                                    <img
                                      src={evaluation.user.image}
                                      alt={evaluation.user.name}
                                      className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                                      <User className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-gray-400" />
                                    </div>
                                  )}

                                  {/* ユーザー名 */}
                                  <span className="font-medium text-xs sm:text-sm text-gray-900">
                                    {evaluation.isAnonymous ? '匿名' : (evaluation.user?.name || '不明')}
                                  </span>

                                  {/* 関係性バッジ */}
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium ${getRelationshipColor(evaluation.relationshipType)}`}>
                                    {getRelationshipLabel(evaluation.relationshipType)}
                                  </span>

                                  {/* 評価スコア */}
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Star
                                        key={star}
                                        className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                                          star <= evaluation.rating
                                            ? 'text-yellow-400 fill-yellow-400'
                                            : 'text-gray-300'
                                        }`}
                                      />
                                    ))}
                                    <span className="ml-0.5 sm:ml-1 text-xs font-semibold text-gray-600">
                                      {evaluation.rating.toFixed(1)}
                                    </span>
                                  </div>
                                </div>

                                {/* コメント - 全幅表示 */}
                                {evaluation.comment && (
                                  <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words leading-relaxed">
                                    {evaluation.comment}
                                  </p>
                                )}

                                {/* いいね・リプライボタン */}
                                <div className="flex items-center gap-3 sm:gap-4 mt-2 pt-2 border-t border-gray-100">
                                  <button
                                    onClick={() => handleLike(evaluation.id)}
                                    disabled={likingId === evaluation.id}
                                    className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-bond-pink transition-colors group"
                                  >
                                    <Heart
                                      className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-200 ${
                                        animatingLikes.has(evaluation.id)
                                          ? 'fill-bond-pink text-bond-pink scale-125'
                                          : evaluation.likesCount > 0
                                            ? 'fill-bond-pink text-bond-pink'
                                            : 'group-hover:scale-110'
                                      }`}
                                    />
                                    <span className={`font-medium ${
                                      evaluation.likesCount > 0 ? 'text-bond-pink' : ''
                                    }`}>
                                      {evaluation.likesCount || 0}
                                    </span>
                                  </button>

                                  <button
                                    onClick={() => toggleReplies(evaluation.id)}
                                    className="flex items-center gap-1 text-xs sm:text-sm text-gray-500 hover:text-blue-500 transition-colors"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                    <span>{evaluation.repliesCount || 0}</span>
                                    {expandedReplies.has(evaluation.id) ? (
                                      <ChevronUp className="w-3 h-3" />
                                    ) : (
                                      <ChevronDown className="w-3 h-3" />
                                    )}
                                  </button>

                                  <span className="flex items-center gap-1 text-xs text-gray-400 ml-auto">
                                    <Calendar className="h-3 w-3" />
                                    {formatDate(evaluation.createdAt)}
                                  </span>
                                </div>

                                {/* リプライセクション */}
                                {expandedReplies.has(evaluation.id) && (
                                  <div className="mt-2 pt-2 border-t border-gray-100">
                                    {/* 既存のリプライ */}
                                    {evaluation.replies && evaluation.replies.length > 0 && (
                                      <div className="space-y-2 mb-2">
                                        {evaluation.replies.map((reply, index) => (
                                          <div key={reply.id || index} className="flex gap-2 pl-2 border-l-2 border-gray-200">
                                            <div className="flex-shrink-0">
                                              {reply.isAnonymous || !reply.user ? (
                                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-gray-500" />
                                                </div>
                                              ) : (
                                                <img
                                                  src={reply.user.image || '/avatar5.png'}
                                                  alt={reply.user.name}
                                                  className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover"
                                                  onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/avatar5.png';
                                                  }}
                                                />
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs font-medium text-gray-900">
                                                  {reply.isAnonymous ? '匿名' : reply.user?.name || '匿名'}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                  {formatReplyTimestamp(reply.createdAt)}
                                                </span>
                                              </div>
                                              <p className="text-xs sm:text-sm text-gray-700 break-words leading-relaxed">
                                                {reply.content}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* リプライ入力 */}
                                    {currentUser?.id ? (
                                      <div className="flex gap-2">
                                        <Textarea
                                          value={replyInputs[evaluation.id] || ''}
                                          onChange={(e) => setReplyInputs(prev => ({
                                            ...prev,
                                            [evaluation.id]: e.target.value
                                          }))}
                                          placeholder="リプライを入力..."
                                          className="flex-1 min-h-[50px] max-h-20 text-sm resize-none"
                                          maxLength={500}
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => handleReply(evaluation.id)}
                                          disabled={submittingReply === evaluation.id || !replyInputs[evaluation.id]?.trim()}
                                          className="self-end"
                                        >
                                          {submittingReply === evaluation.id ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Send className="w-4 h-4" />
                                          )}
                                        </Button>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-gray-500 text-center py-2">
                                        <Link href="/login" className="text-blue-600 hover:underline">
                                          ログイン
                                        </Link>
                                        してリプライする
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-3 text-sm text-gray-500">
                              まだ評価がありません
                              {isLoggedIn && (
                                <button
                                  onClick={() => openEvaluationModal(item)}
                                  className="block mx-auto mt-2 text-bond-pink hover:text-pink-600 font-medium"
                                >
                                  最初の評価を投稿する
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(item.createdAt)}
                      </span>
                      {item.addedBy && (
                        <span className="flex items-center gap-1">
                          {item.addedBy.image ? (
                            <img src={item.addedBy.image} alt={item.addedBy.name} className="h-4 w-4 rounded-full" />
                          ) : (
                            <User className="h-3 w-3" />
                          )}
                          {item.addedBy.name}が追加
                        </span>
                      )}
                    </div>
                    {item.source === 'shared' && sharedList.canEdit && (
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                        title="削除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {allItems.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-pink-300" />
            </div>
            <p className="text-gray-600 font-medium">このリストにはまだアイテムがありません</p>
            {sharedList.canEdit && (
              <Button
                onClick={() => {
                  if (!requireLoginForEdit()) return;
                  setShowAddModal(true);
                }}
                className="mt-4 bg-bond-pink hover:bg-pink-600"
              >
                <Plus className="h-4 w-4 mr-2" />
                最初のアイテムを追加
              </Button>
            )}
          </div>
        )}
      </div>

      {/* 評価投稿モーダル */}
      {showEvaluationModal && evaluationTargetItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-bond-pink to-pink-400 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  {evaluationTargetItem.itemData.name} を評価
                </h2>
                <button
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setEvaluationTargetItem(null);
                  }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 評価スター */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">評価</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvaluationRating(star)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= evaluationRating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  {evaluationRating > 0 && (
                    <span className="ml-2 text-lg font-semibold text-gray-700">
                      {evaluationRating}.0
                    </span>
                  )}
                </div>
              </div>

              {/* 関係性 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">関係性</label>
                <select
                  value={evaluationRelationshipType === '' ? '' : String(evaluationRelationshipType)}
                  onChange={(e) => {
                    const value = e.target.value === '' ? '' : Number(e.target.value);
                    setEvaluationRelationshipType(value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                >
                  <option value="">選択してください</option>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel.value} value={rel.value}>{rel.label}</option>
                  ))}
                </select>
              </div>

              {/* 表示設定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">表示設定</label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="anonymity"
                      checked={!evaluationIsAnonymous}
                      onChange={() => setEvaluationIsAnonymous(false)}
                      className="text-bond-pink focus:ring-bond-pink"
                    />
                    <span className="text-sm">
                      実名で投稿 ({currentUser?.name || ''})
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="anonymity"
                      checked={evaluationIsAnonymous}
                      onChange={() => setEvaluationIsAnonymous(true)}
                      className="text-bond-pink focus:ring-bond-pink"
                    />
                    <span className="text-sm">匿名で投稿</span>
                  </label>
                </div>
              </div>

              {/* コメント */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">評価内容</label>
                <Textarea
                  value={evaluationComment}
                  onChange={(e) => setEvaluationComment(e.target.value)}
                  placeholder="具体的な評価内容を入力してください"
                  className="w-full"
                  rows={4}
                />
              </div>

              {/* ボタン */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={submitEvaluation}
                  disabled={submittingEvaluation || evaluationRating === 0 || evaluationRelationshipType === '' || !evaluationComment.trim()}
                  className="flex-1 bg-bond-pink hover:bg-pink-600"
                >
                  {submittingEvaluation ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      投稿中...
                    </>
                  ) : (
                    '評価を投稿'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEvaluationModal(false);
                    setEvaluationTargetItem(null);
                  }}
                >
                  キャンセル
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* アイテム追加モーダル */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-bond-pink to-pink-400 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">アイテムを追加</h2>
                <button
                  onClick={resetAddModal}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* タイプ選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">タイプ</label>
                <div className="flex gap-2">
                  {[
                    { value: 'company', label: '企業', icon: Building2 },
                    { value: 'person', label: '人物', icon: User },
                    { value: 'service', label: 'サービス', icon: Package }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setNewItemType(value as any);
                        setSearchQuery('');
                        setSearchResults([]);
                        setSelectedItem(null);
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all ${
                        newItemType === value
                          ? 'border-bond-pink bg-pink-50 text-bond-pink'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* モード切り替え */}
              <div className="flex gap-2 border-b border-gray-200 pb-2">
                <button
                  onClick={() => setAddMode('search')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    addMode === 'search'
                      ? 'bg-bond-pink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Search className="h-4 w-4 inline mr-2" />
                  Bondから検索
                </button>
                <button
                  onClick={() => setAddMode('manual')}
                  className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                    addMode === 'manual'
                      ? 'bg-bond-pink text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Edit2 className="h-4 w-4 inline mr-2" />
                  手動で入力
                </button>
              </div>

              {addMode === 'search' ? (
                <>
                  {/* Bond内検索 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newItemType === 'company' ? '企業名' : newItemType === 'person' ? '人物名' : 'サービス名'}で検索
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchBond(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                        placeholder={`Bond上の${newItemType === 'company' ? '企業' : newItemType === 'person' ? '人物' : 'サービス'}を検索...`}
                      />
                      {searching && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* 検索結果 */}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {searchResults.map((result) => {
                        // 企業の場合は /api/company-logo/[slug] からロゴを取得
                        const logoSrc = result.type === 'company' && result.slug
                          ? `/api/company-logo/${encodeURIComponent(result.slug)}`
                          : result.logo || result.image;
                        // 説明文を短く要約
                        const shortDescription = result.description
                          ? summarizeDescription(result.description, 80)
                          : (result.industry || '');

                        return (
                          <button
                            key={result.slug || result.name}
                            onClick={() => setSelectedItem(result)}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                              selectedItem?.slug === result.slug
                                ? 'border-bond-pink bg-pink-50'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {logoSrc ? (
                              <div className="relative h-10 w-10 flex-shrink-0">
                                <img
                                  src={logoSrc}
                                  alt={result.name}
                                  className="h-10 w-10 rounded-lg object-cover"
                                  onError={(e) => {
                                    const target = e.currentTarget;
                                    target.style.display = 'none';
                                    const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                                    if (fallback) {
                                      fallback.style.display = 'flex';
                                    }
                                  }}
                                />
                                <div className="fallback-icon h-10 w-10 rounded-lg bg-gray-100 items-center justify-center absolute inset-0 hidden">
                                  {newItemType === 'company' ? (
                                    <Building2 className="h-5 w-5 text-gray-400" />
                                  ) : newItemType === 'person' ? (
                                    <User className="h-5 w-5 text-gray-400" />
                                  ) : (
                                    <Package className="h-5 w-5 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                                {newItemType === 'company' ? (
                                  <Building2 className="h-5 w-5 text-gray-400" />
                                ) : newItemType === 'person' ? (
                                  <User className="h-5 w-5 text-gray-400" />
                                ) : (
                                  <Package className="h-5 w-5 text-gray-400" />
                                )}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{result.name}</p>
                              {shortDescription && (
                                <p className="text-xs text-gray-500 line-clamp-2">{shortDescription}</p>
                              )}
                            </div>
                            {selectedItem?.slug === result.slug && (
                              <div className="h-5 w-5 rounded-full bg-bond-pink flex items-center justify-center flex-shrink-0">
                                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* 検索結果なし */}
                  {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 mb-3">
                        「{searchQuery}」は見つかりませんでした
                      </p>
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          Bondに登録されていない可能性があります
                        </p>
                        <Link
                          href={`/?q=${encodeURIComponent(searchQuery)}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-sm text-bond-pink hover:underline"
                        >
                          <Search className="h-4 w-4" />
                          「{searchQuery}」を検索してページを作成
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* 選択したアイテムのメモ */}
                  {selectedItem && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
                      <textarea
                        value={newItemNotes}
                        onChange={(e) => setNewItemNotes(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink resize-none"
                        rows={2}
                        placeholder="補足情報やコメント..."
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* 手動入力モード */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">名前 *</label>
                    <input
                      type="text"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                      placeholder="例: 株式会社サンプル"
                    />
                  </div>

                  {newItemType === 'company' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">ロゴURL（任意）</label>
                      <input
                        type="url"
                        value={newItemLogoUrl}
                        onChange={(e) => setNewItemLogoUrl(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">説明（任意）</label>
                    <textarea
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink resize-none"
                      rows={2}
                      placeholder="簡単な説明..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">メモ（任意）</label>
                    <textarea
                      value={newItemNotes}
                      onChange={(e) => setNewItemNotes(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink resize-none"
                      rows={2}
                      placeholder="補足情報やコメント..."
                    />
                  </div>
                </>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <Button
                onClick={addMode === 'search' ? handleAddSelectedItem : handleAddItem}
                disabled={addingItem || (addMode === 'search' ? !selectedItem : !newItemName.trim())}
                className="w-full bg-gradient-to-r from-bond-pink to-pink-500 hover:from-pink-600 hover:to-pink-600 text-white py-3 rounded-xl"
              >
                {addingItem ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                追加する
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 招待者追加モーダル */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-bond-pink to-pink-400 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  招待者を追加
                </h2>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteSearchQuery('');
                    setInviteSearchResults([]);
                  }}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* 検索入力 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ユーザーを検索</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={inviteSearchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-bond-pink/30 focus:border-bond-pink"
                    placeholder="名前またはメールアドレスで検索..."
                    autoFocus
                  />
                  {searchingUsers && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              {/* 検索結果 */}
              {inviteSearchResults.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {inviteSearchResults.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleAddInvitee(user._id)}
                      disabled={addingInvitee}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:border-bond-pink hover:bg-pink-50 transition-all text-left"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {addingInvitee ? (
                        <Loader2 className="h-5 w-5 animate-spin text-bond-pink" />
                      ) : (
                        <Plus className="h-5 w-5 text-bond-pink" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* 検索結果なし */}
              {inviteSearchQuery.length >= 2 && !searchingUsers && inviteSearchResults.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-xl">
                  <User className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    「{inviteSearchQuery}」に該当するユーザーが見つかりません
                  </p>
                </div>
              )}

              {/* 現在の招待者リスト */}
              {sharedList?.sharedWith && sharedList.sharedWith.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    現在の招待者 ({sharedList.sharedWith.length}人)
                  </label>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {sharedList.sharedWith.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-xl bg-gray-50"
                      >
                        {user.image ? (
                          <img
                            src={user.image}
                            alt={user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm">{user.name}</p>
                          {user.company && (
                            <p className="text-xs text-gray-500 truncate">{user.company}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveInvitee(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="削除"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 pb-6 pt-2 border-t border-gray-100">
              <Button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteSearchQuery('');
                  setInviteSearchResults([]);
                }}
                variant="outline"
                className="w-full py-3 rounded-xl"
              >
                閉じる
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* フッター - ログインしていないユーザーにのみ表示 */}
      {isLoggedIn === false && (
        <div className="bg-white border-t mt-8 py-8">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <img src="/bond-logo.png" alt="Bond" className="h-10 w-10 rounded-xl shadow-sm" />
              <span className="font-bold text-xl text-gray-800">Bond</span>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              このリストは Bond で共有されています
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-bond-pink to-pink-500 hover:from-pink-600 hover:to-pink-600 text-white px-8 py-2 rounded-xl shadow-md hover:shadow-lg transition-all">
                Bondを使ってみる
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
