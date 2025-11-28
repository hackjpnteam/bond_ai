'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Package, Users, TrendingUp, ExternalLink, Share2, BookmarkPlus, Edit3, Save, X, History, Clock, Search, Copy, FileDown, Check, Pencil, Heart, MessageCircle, Send, ChevronDown, ChevronUp, User, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getUserDisplayName } from '@/lib/user-display';
import { getRelationshipLabel, RELATIONSHIP_OPTIONS, RELATIONSHIP_TYPES } from '@/lib/relationship';
import { CompanyOverview } from '@/components/company/CompanyOverview';
import EditEvaluationModal from '@/components/EditEvaluationModal';
import ReactMarkdown from 'react-markdown';

interface Reply {
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  user: {
    _id: string;
    name: string;
    image: string;
  } | null;
}

interface Evaluation {
  id: string;
  rating: number;
  relationshipType: number;
  relationshipLabel: string;
  comment: string;
  timestamp: number;
  userId: string;
  userName?: string;
  userImage?: string;
  userCompany?: string;
  userRole?: string;
  isAnonymous: boolean;
  likesCount: number;
  hasLiked: boolean;
  repliesCount: number;
  replies: Reply[];
}

interface SearchResultData {
  id: string;
  query: string;
  company: string;
  answer: string;
  metadata?: any;
  createdAt: string;
}

interface RelatedService {
  name: string;
  slug: string;
  industry: string;
  averageRating: number;
  searchCount: number;
}

interface SourceInfo {
  url: string;
  title?: string;
  published_at?: string;
}

interface ServiceData {
  name: string;
  industry: string;
  description: string;
  founded: string;
  employees: string;
  website: string;
  evaluations: Evaluation[];
  averageRating: number;
  searchCount: number;
  editHistory?: EditHistoryEntry[];
  searchResults?: SearchResultData[];
  sources?: SourceInfo[];
}

interface EditHistoryEntry {
  id?: string;
  _id?: string;
  field: string;
  oldValue: string;
  newValue: string;
  editor: string;
  timestamp?: number;
  editedAt?: string | Date;
  reason?: string;
}

export default function ServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = params.slug as string;
  // 二重エンコード対策: デコードを繰り返す
  let serviceName = serviceSlug;
  try {
    serviceName = decodeURIComponent(serviceSlug);
    if (serviceName.includes('%')) {
      serviceName = decodeURIComponent(serviceName);
    }
  } catch {
    // デコードエラーの場合は元の値を使用
  }

  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [relationshipType, setRelationshipType] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
  const [relatedServices, setRelatedServices] = useState<RelatedService[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const canUseRealIdentity = Boolean(currentUser?.id);
  const realIdentityLabel = canUseRealIdentity
    ? currentUser?.name || currentUser?.email || 'Bondユーザー'
    : 'ログインしてください';

  // Wiki編集用の状態
  const [isEditing, setIsEditing] = useState(false);
  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editReason, setEditReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [submittingReply, setSubmittingReply] = useState<string | null>(null);
  const [likingId, setLikingId] = useState<string | null>(null);

  const LEGACY_RELATIONSHIP_MAP: Record<string, number> = {
    shareholder: RELATIONSHIP_TYPES.INVESTOR,
    executive: RELATIONSHIP_TYPES.PARTNER,
    employee: RELATIONSHIP_TYPES.ACQUAINTANCE,
    partner: RELATIONSHIP_TYPES.PARTNER,
    customer: RELATIONSHIP_TYPES.CLIENT,
    other: RELATIONSHIP_TYPES.UNSET
  };

  useEffect(() => {
    // 認証されたユーザー情報を取得
    fetch('/api/auth/me', {
      credentials: 'include'
    })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        setCurrentUser(data?.user || null);
      })
      .catch(() => {
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setIsAnonymous(true);
    }
  }, [currentUser]);

  // ユーザーIDを取得または生成
  const getUserId = () => {
    if (typeof window === 'undefined') return 'anonymous';

    // 認証されたユーザーの場合は実際のユーザーIDを使用
    if (currentUser?.id) {
      return currentUser.id;
    }

    return 'anonymous';
  };

  // 検索結果を取得
  const fetchSearchResults = async () => {
    try {
      const response = await fetch(`/api/search-results?company=${encodeURIComponent(serviceName)}&limit=50`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.searchResults);
          return data.searchResults;
        }
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    }
    return [];
  };

  useEffect(() => {
    // Check if saved
    const savedItems = localStorage.getItem('bond_saved_items');
    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        setIsSaved(items.includes(serviceName.toLowerCase()));
      } catch (e) {
        console.error('Error parsing saved items:', e);
      }
    }

    const loadServiceData = async () => {
      // APIから企業データを取得（サービスも同じAPIを使用）
      let serviceApiData = null;
      try {
        const response = await fetch(`/api/companies/${serviceName.toLowerCase()}`, {
          credentials: 'include',
        });
        if (response.ok) {
          serviceApiData = await response.json();
          console.log('MongoDB service data loaded:', serviceApiData.name);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      }

      // 検索結果データ（常に取得して最新の検索レポートを表示）
      const apiSearchResults = await fetchSearchResults();

      // APIから評価データを取得
      let evaluations: Evaluation[] = [];
      let averageRating = 0;

      try {
        const evaluationResponse = await fetch(`/api/evaluations?company=${encodeURIComponent(serviceName)}&limit=100`, {
          credentials: 'include',
        });

        if (evaluationResponse.ok) {
          const evaluationData = await evaluationResponse.json();
          if (evaluationData.success && evaluationData.evaluations) {
            // APIから取得した評価データをフロントエンド形式に変換
            evaluations = evaluationData.evaluations.map((evaluation: any) => {
              const userInfo = evaluation.user || null;
              const fallbackUserId = (userInfo?.id || evaluation.userId || 'anonymous').toString();
              const isAnon = !!evaluation.isAnonymous;

              return {
                id: evaluation.id,
                rating: evaluation.rating,
                relationshipType: (() => {
                  if (typeof evaluation.relationshipType === 'number') {
                    return evaluation.relationshipType;
                  }
                  if (typeof evaluation.relationship === 'number') {
                    return evaluation.relationship;
                  }
                  const legacyValue = LEGACY_RELATIONSHIP_MAP[evaluation.relationship] ?? LEGACY_RELATIONSHIP_MAP[evaluation.categories?.role];
                  return typeof legacyValue === 'number' ? legacyValue : RELATIONSHIP_TYPES.UNSET;
                })(),
                relationshipLabel: (() => {
                  if (evaluation.relationshipLabel) return evaluation.relationshipLabel;
                  if (typeof evaluation.relationshipType === 'number') {
                    return getRelationshipLabel(evaluation.relationshipType);
                  }
                  const fallbackType = LEGACY_RELATIONSHIP_MAP[evaluation.relationship] ?? RELATIONSHIP_TYPES.UNSET;
                  return getRelationshipLabel(fallbackType);
                })(),
                comment: evaluation.comment,
                timestamp: new Date(evaluation.createdAt).getTime(),
                userId: fallbackUserId,
                userName: userInfo?.name,
                userImage: userInfo?.image,
                userCompany: userInfo?.company,
                userRole: userInfo?.role,
                isAnonymous: isAnon,
                likesCount: evaluation.likesCount || 0,
                hasLiked: evaluation.hasLiked || false,
                repliesCount: evaluation.repliesCount || 0,
                replies: evaluation.replies || []
              };
            });

            // 平均評価を計算
            if (evaluations.length > 0) {
              averageRating = evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / evaluations.length;
            }

            console.log(`Loaded ${evaluations.length} evaluations from API for ${serviceName}`);
          }
        }
      } catch (error) {
        console.error('Error fetching evaluations from API:', error);
      }

      // 検索履歴から検索回数を取得
      let searchCount = apiSearchResults ? apiSearchResults.length : 0;

      // ローカルストレージからも検索履歴を取得して統合
      const searchHistory = localStorage.getItem('bond_search_history');
      if (searchHistory) {
        try {
          const history = JSON.parse(searchHistory);
          const matches = history.filter((item: any) =>
            item.query.toLowerCase() === serviceName.toLowerCase()
          );
          searchCount += matches.length;
        } catch (e) {
          console.error('Error parsing search history:', e);
        }
      }

      // フォールバック用の概要（APIデータがない場合のみ使用）
      let fallbackDescription = `${serviceName}に関する詳細情報を表示しています。Bond検索で投稿された評価やレビューを確認できます。`;

      // 検索結果データはAPIデータがない場合のフォールバックとしてのみ使用
      if (!serviceApiData) {
        if (apiSearchResults && apiSearchResults.length > 0) {
          const serviceResult = apiSearchResults.find((result: any) =>
            result.company?.toLowerCase() === serviceName.toLowerCase() ||
            result.query?.toLowerCase() === serviceName.toLowerCase()
          );

          if (serviceResult && serviceResult.answer) {
            fallbackDescription = serviceResult.answer;
          }
        }
      }

      // 編集履歴はAPIデータから取得
      let editHistory: EditHistoryEntry[] = serviceApiData?.editHistory || [];

      // 検索結果から最新のレポート内容とウェブサイトURL、設立年、従業員数を取得
      let searchReportDescription = '';
      let extractedWebsiteUrl = '';
      let extractedFounded = '';
      let extractedEmployees = '';
      let extractedIndustry = '';
      let extractedSources: SourceInfo[] = [];

      if (apiSearchResults && apiSearchResults.length > 0) {
        const matchingResult = apiSearchResults.find((result: any) =>
          result.company?.toLowerCase() === serviceName.toLowerCase() ||
          result.query?.toLowerCase() === serviceName.toLowerCase()
        );
        if (matchingResult) {
          if (matchingResult.answer) {
            let cleanAnswer = matchingResult.answer;
            cleanAnswer = cleanAnswer.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            try {
              const jsonMatch = cleanAnswer.match(/\{[\s\S]*"answer"\s*:\s*"([^"]+)"[\s\S]*\}/);
              if (jsonMatch && jsonMatch[1]) {
                cleanAnswer = jsonMatch[1].replace(/\\n/g, '\n');
              }
            } catch (e) {
              // JSON解析に失敗した場合はそのまま使用
            }
            searchReportDescription = cleanAnswer;
          }

          // metadata.factsから情報を抽出
          const facts = matchingResult.metadata?.facts || [];
          if (Array.isArray(facts)) {
            for (const fact of facts) {
              const label = (fact.label || '').toLowerCase();
              const value = fact.value || '';

              if (label.includes('設立') || label.includes('創業') || label.includes('founded')) {
                if (value && value !== '—') {
                  extractedFounded = value;
                }
              }
              if (label.includes('従業員') || label.includes('社員') || label.includes('employee')) {
                if (value && value !== '—') {
                  extractedEmployees = value;
                }
              }
              if (label.includes('業界') || label.includes('業種') || label.includes('industry') || label.includes('カテゴリ')) {
                if (value && value !== '—') {
                  extractedIndustry = value;
                }
              }
              if (label.includes('ウェブサイト') || label.includes('website') || label.includes('url') || label.includes('公式')) {
                if (value && value !== '—' && value.startsWith('http')) {
                  extractedWebsiteUrl = value;
                }
              }
            }
          }

          // sources は metadata.sources または直接 sources にある場合がある
          const sourcesArray = matchingResult.metadata?.sources || matchingResult.sources || [];

          if (Array.isArray(sourcesArray) && sourcesArray.length > 0) {
            extractedSources = sourcesArray.map((source: any) => {
              const url = source.url || source.link || (typeof source === 'string' ? source : '');
              return {
                url: url,
                title: source.title || '',
                published_at: source.published_at || source.publishedAt || ''
              };
            }).filter((s: SourceInfo) => s.url && s.url.startsWith('http'));
          }
        }
      }

      // サービスデータを設定
      const isPlaceholder = (val: string | undefined) => {
        if (!val) return true;
        return val === '情報収集中' || val === '情報収集中...' || val === '—' || val === '-';
      };

      if (serviceApiData) {
        const finalDescription = serviceApiData.description && serviceApiData.description.length > 50
          ? serviceApiData.description
          : (searchReportDescription || fallbackDescription);
        const finalFounded = isPlaceholder(serviceApiData.founded) ? extractedFounded : serviceApiData.founded;
        const finalEmployees = isPlaceholder(serviceApiData.employees) ? extractedEmployees : serviceApiData.employees;
        const finalWebsite = isPlaceholder(serviceApiData.website) ? extractedWebsiteUrl : serviceApiData.website;
        const finalIndustry = isPlaceholder(serviceApiData.industry) ? extractedIndustry : serviceApiData.industry;
        const finalSources = extractedSources.length > 0 ? extractedSources : (serviceApiData.sources || []);

        setServiceData({
          name: serviceApiData.name,
          industry: finalIndustry || '情報収集中...',
          description: finalDescription,
          founded: finalFounded || '情報収集中',
          employees: finalEmployees || '情報収集中',
          website: finalWebsite || '',
          evaluations,
          averageRating: evaluations.length > 0
            ? averageRating
            : (typeof serviceApiData.averageRating === 'number'
                ? serviceApiData.averageRating
                : 0),
          searchCount: serviceApiData.searchCount,
          editHistory,
          searchResults: apiSearchResults,
          sources: finalSources
        });
      } else {
        const finalDescription = searchReportDescription || fallbackDescription;
        setServiceData({
          name: serviceName,
          industry: extractedIndustry || '情報収集中...',
          description: finalDescription,
          founded: extractedFounded || '情報収集中',
          employees: extractedEmployees || '情報収集中',
          website: extractedWebsiteUrl || '',
          evaluations,
          averageRating: averageRating,
          searchCount: searchCount,
          editHistory: [],
          searchResults: apiSearchResults,
          sources: extractedSources
        });
      }

      setLoading(false);

      // 関連サービスを取得
      try {
        const relatedResponse = await fetch(`/api/companies/${serviceName.toLowerCase()}/related`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          if (relatedData.success) {
            setRelatedServices(relatedData.relatedCompanies || []);
          }
        }
      } catch (error) {
        console.error('Error fetching related services:', error);
      }
    };

    loadServiceData();
  }, [serviceName, serviceSlug, router]);

  const renderStars = (currentRating: number, interactive: boolean = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= currentRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:text-yellow-400' : ''}`}
            onClick={interactive ? () => setRating(star) : undefined}
          />
        ))}
      </div>
    );
  };

  const submitEvaluation = async () => {
    if (rating === 0 || relationshipType === '' || !comment.trim()) return;

    if (!currentUser?.id) {
      alert('評価を投稿するにはログインが必要です。');
      return;
    }

    const currentUserId = getUserId();

    const hasUserEvaluated = serviceData?.evaluations.some(
      evaluation => evaluation.userId === currentUserId
    );

    if (hasUserEvaluated) {
      alert('このサービスについては既に評価済みです。');
      return;
    }

    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyName: serviceName,
          companySlug: serviceName.toLowerCase(),
          rating,
          comment: comment.trim(),
          categories: {
            culture: rating,
            growth: rating,
            workLifeBalance: rating,
            compensation: rating,
            leadership: rating
          },
          relationshipType: Number(relationshipType),
          isAnonymous
        })
      });

      if (response.ok) {
        const data = await response.json();

        const normalizedRelationshipType = Number(relationshipType);
        const newEvaluation: Evaluation = {
          id: data.evaluation.id,
          rating,
          relationshipType: normalizedRelationshipType,
          relationshipLabel: getRelationshipLabel(normalizedRelationshipType),
          comment: comment.trim(),
          timestamp: Date.now(),
          userId: currentUserId,
          userName: isAnonymous ? undefined : currentUser?.name,
          userImage: isAnonymous ? undefined : currentUser?.image,
          userCompany: currentUser?.company,
          userRole: currentUser?.role,
          isAnonymous,
          likesCount: 0,
          hasLiked: false,
          repliesCount: 0,
          replies: []
        };

        const updatedEvaluations = [...(serviceData?.evaluations || []), newEvaluation];
        const avgRating = updatedEvaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / updatedEvaluations.length;

        setServiceData(prev => prev ? {
          ...prev,
          evaluations: updatedEvaluations,
          averageRating: avgRating
        } : null);

        alert('評価を投稿しました！');
      } else {
        const errorData = await response.json();
        alert(`評価の投稿に失敗しました: ${errorData.error}`);
        return;
      }
    } catch (error) {
      console.error('評価投稿エラー:', error);
      alert('評価の投稿中にエラーが発生しました。');
      return;
    }

    setRating(0);
    setRelationshipType('');
    setComment('');
    setIsAnonymous(false);
    setShowEvaluationForm(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditField(null);
    setEditValue('');
    setEditReason('');
  };

  const handleSaveEdit = async () => {
    if (typeof window === 'undefined') return;

    try {
      const nameElement = document.getElementById('edit-name') as HTMLInputElement;
      const industryElement = document.getElementById('edit-industry') as HTMLInputElement;
      const foundedElement = document.getElementById('edit-founded') as HTMLInputElement;
      const employeesElement = document.getElementById('edit-employees') as HTMLInputElement;
      const websiteElement = document.getElementById('edit-website') as HTMLInputElement;
      const descriptionElement = document.getElementById('edit-description') as HTMLTextAreaElement;
      const reasonElement = document.getElementById('edit-reason') as HTMLInputElement;

      if (!nameElement || !industryElement || !foundedElement || !employeesElement || !websiteElement || !descriptionElement) {
        alert('編集フォームの要素が見つかりません');
        return;
      }

      const newData = {
        name: nameElement.value.trim(),
        industry: industryElement.value.trim(),
        founded: foundedElement.value.trim(),
        employees: employeesElement.value.trim(),
        description: descriptionElement.value.trim(),
        website: websiteElement.value.trim(),
        reason: reasonElement.value.trim() || '情報更新'
      };

      const response = await fetch(`/api/companies/${serviceName.toLowerCase()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newData)
      });

      if (response.ok) {
        const data = await response.json();

        const updatedServiceData = {
          ...serviceData!,
          ...newData,
          editHistory: data.company?.editHistory || serviceData?.editHistory || []
        };

        setServiceData(updatedServiceData);
        setIsEditing(false);

        alert('サービス情報をデータベースに保存しました');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`保存に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('保存中にエラーが発生しました');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${serviceName} - Bond`,
      text: `${serviceName}の評価・レビューを見る`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('URLをクリップボードにコピーしました');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('対応している画像形式: JPEG, PNG, GIF, WebP');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('companySlug', serviceData?.slug || serviceName.toLowerCase());

      const response = await fetch('/api/upload/company-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        alert('ロゴがアップロードされました！');
        window.location.reload();
      } else {
        const errorData = await response.json();
        alert(`ロゴのアップロードに失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Logo upload error:', error);
      alert('ロゴのアップロード中にエラーが発生しました');
    } finally {
      setIsUploadingLogo(false);
      event.target.value = '';
    }
  };

  const handleSave = () => {
    const savedItems = localStorage.getItem('bond_saved_items');
    let items: string[] = [];

    try {
      if (savedItems) {
        items = JSON.parse(savedItems);
      }
    } catch (e) {
      console.error('Error parsing saved items:', e);
    }

    if (isSaved) {
      items = items.filter(item => item !== serviceName.toLowerCase());
    } else {
      items.push(serviceName.toLowerCase());
    }

    localStorage.setItem('bond_saved_items', JSON.stringify(items));
    setIsSaved(!isSaved);
  };

  const handleEditEvaluation = (evaluation: Evaluation) => {
    setEditingEvaluation({
      ...evaluation,
      companyName: serviceData?.name || serviceName,
      companySlug: serviceName.toLowerCase()
    } as any);
    setIsEditModalOpen(true);
  };

  const handleSaveEvaluation = (updatedEvaluation: any) => {
    if (!serviceData) return;

    const updatedEvaluations = serviceData.evaluations.map(evaluation =>
      evaluation.id === updatedEvaluation.id
        ? {
            ...evaluation,
            rating: updatedEvaluation.rating,
            comment: updatedEvaluation.comment,
            relationshipType: updatedEvaluation.relationshipType,
            relationshipLabel: getRelationshipLabel(updatedEvaluation.relationshipType),
            isAnonymous: updatedEvaluation.isAnonymous
          }
        : evaluation
    );

    const avgRating = updatedEvaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / updatedEvaluations.length;

    setServiceData({
      ...serviceData,
      evaluations: updatedEvaluations,
      averageRating: avgRating
    });
  };

  // 評価削除ハンドラ
  const handleDeleteEvaluation = async (evaluationId: string) => {
    if (!confirm('この評価を削除しますか？削除するとトラストマップからの繋がりも解除されます。')) {
      return;
    }

    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // ローカル状態から評価を削除
        if (serviceData) {
          const updatedEvaluations = serviceData.evaluations.filter(e => e.id !== evaluationId);
          const averageRating = updatedEvaluations.length > 0
            ? updatedEvaluations.reduce((sum, e) => sum + e.rating, 0) / updatedEvaluations.length
            : 0;

          setServiceData({
            ...serviceData,
            evaluations: updatedEvaluations,
            averageRating
          });
        }
        alert(data.connectionRemoved
          ? '評価を削除しました。トラストマップからの繋がりも解除されました。'
          : '評価を削除しました。');
      } else {
        alert(data.error || '評価の削除に失敗しました');
      }
    } catch (error) {
      console.error('Delete evaluation error:', error);
      alert('評価の削除に失敗しました');
    }
  };

  const handleLike = async (evaluationId: string) => {
    if (!currentUser?.id) {
      alert('いいねするにはログインが必要です');
      return;
    }

    setLikingId(evaluationId);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}/like`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.status === 401) {
        alert('いいねするにはログインが必要です');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setServiceData(prev => prev ? {
          ...prev,
          evaluations: prev.evaluations.map(e =>
            e.id === evaluationId
              ? { ...e, hasLiked: data.liked, likesCount: data.likesCount }
              : e
          )
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setLikingId(null);
    }
  };

  const handleReply = async (evaluationId: string) => {
    const content = replyInputs[evaluationId]?.trim();
    if (!content) return;

    if (!currentUser?.id) {
      alert('リプライするにはログインが必要です');
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
        alert('リプライするにはログインが必要です');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setServiceData(prev => prev ? {
          ...prev,
          evaluations: prev.evaluations.map(e =>
            e.id === evaluationId
              ? {
                  ...e,
                  repliesCount: data.repliesCount,
                  replies: [...e.replies, data.reply]
                }
              : e
          )
        } : null);
        setReplyInputs(prev => ({ ...prev, [evaluationId]: '' }));
        setExpandedReplies(prev => new Set(prev).add(evaluationId));
      }
    } catch (error) {
      console.error('Failed to add reply:', error);
    } finally {
      setSubmittingReply(null);
    }
  };

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

  const handleCopyReport = async () => {
    if (!serviceData) return;

    const latestReport = searchResults[0]?.answer || '';
    const reportText = `# ${serviceData.name} - サービスレポート

## 基本情報
- サービス名: ${serviceData.name}
- カテゴリ: ${serviceData.industry}
- 設立: ${serviceData.founded || '不明'}
- ウェブサイト: ${serviceData.website || '不明'}

## サービス概要
${serviceData.description || '情報なし'}

## AIレポート
${latestReport || '最新のAIレポートはありません。'}

## Bond評価
- 平均評価: ${serviceData.averageRating.toFixed(1)} / 5.0
- レビュー数: ${serviceData.evaluations.length}件

---
Generated by Bond AI - ${new Date().toLocaleDateString('ja-JP')}
URL: ${window.location.href}`;

    try {
      await navigator.clipboard.writeText(reportText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('コピーに失敗しました');
    }
  };

  const handleExportPDF = async () => {
    if (!serviceData) return;

    const latestReport = searchResults[0]?.answer || '';

    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${serviceData.name} - サービス分析レポート</title>
  <style>
    body {
      font-family: 'Hiragino Sans', 'Meiryo', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      line-height: 1.8;
      color: #333;
    }
    h1 {
      color: #1a1a1a;
      border-bottom: 3px solid #FF5E9E;
      padding-bottom: 10px;
      margin-bottom: 30px;
    }
    h2 {
      color: #444;
      margin-top: 30px;
      border-left: 4px solid #FF5E9E;
      padding-left: 12px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    .info-table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .info-table td:first-child {
      font-weight: bold;
      width: 120px;
      color: #666;
    }
    .rating {
      background: linear-gradient(135deg, #FFF3F8, #FFE4EC);
      padding: 20px;
      border-radius: 12px;
      margin: 20px 0;
    }
    .rating-stars { color: #FFD700; font-size: 20px; }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
    .ai-report {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <h1>📘 ${serviceData.name} – サービス分析レポート</h1>

  <h2>基本情報</h2>
  <table class="info-table">
    <tr><td>カテゴリ</td><td>${serviceData.industry}</td></tr>
    <tr><td>設立</td><td>${serviceData.founded || '不明'}</td></tr>
    <tr><td>ウェブサイト</td><td>${serviceData.website || '不明'}</td></tr>
  </table>

  <h2>サービス概要</h2>
  <p>${serviceData.description || '情報なし'}</p>

  ${latestReport ? `
  <h2>AIレポート</h2>
  <div class="ai-report">${latestReport.replace(/\n/g, '<br>')}</div>
  ` : ''}

  <h2>Bond評価</h2>
  <div class="rating">
    <div class="rating-stars">${'★'.repeat(Math.round(serviceData.averageRating))}${'☆'.repeat(5 - Math.round(serviceData.averageRating))}</div>
    <p><strong>${serviceData.averageRating.toFixed(1)}</strong> / 5.0 （${serviceData.evaluations.length}件のレビュー）</p>
  </div>

  <div class="footer">
    <p>Generated by Bond AI - ${new Date().toLocaleDateString('ja-JP')}</p>
    <p>${window.location.href}</p>
  </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    } else {
      alert('ポップアップがブロックされました。ブラウザの設定を確認してください。');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">サービスデータが見つかりません</div>
        </div>
      </div>
    );
  }

  const currentUserId = getUserId();
  const hasUserEvaluated = serviceData.evaluations.some(
    evaluation => evaluation.userId === currentUserId
  );

  return (
    <div className="min-h-screen bg-white">
        {/* ヘッダー */}
        <div className="bg-white border-b border-border">
          <div className="container max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {/* タイトル: サービス分析レポート */}
            <div className="mb-4">
              <span className="text-sm text-gray-500">📘 BOND –</span>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground">サービス分析レポート</h1>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer"
                     onClick={() => document.getElementById('logo-upload')?.click()}>
                  <img
                    src={`/api/company-logo/${encodeURIComponent(serviceData.slug || serviceName.toLowerCase())}`}
                    alt={`${serviceData.name} ロゴ`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/bond-logo.png';
                      e.currentTarget.onerror = null;
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs">ロゴ変更</span>
                  </div>
                </div>
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{serviceData.name}</h2>
                  <p className="text-sm sm:text-base text-gray-600 truncate">{serviceData.industry}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-bond-pink border-2 border-bond-pink hover:bg-bond-pink hover:text-white px-2 sm:px-3 bg-white"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span className="hidden sm:inline ml-1">編集</span>
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleShare} className="px-2 sm:px-3">
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">シェア</span>
                </Button>
                <Button
                  variant={isSaved ? "default" : "outline"}
                  size="sm"
                  onClick={handleSave}
                  className="px-2 sm:px-3"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">{isSaved ? '保存済み' : '保存'}</span>
                </Button>
                <Button
                  variant={isCopied ? "default" : "outline"}
                  size="sm"
                  onClick={handleCopyReport}
                  className={`px-2 sm:px-3 ${isCopied ? "bg-green-500 hover:bg-green-600" : ""}`}
                >
                  {isCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline ml-1">{isCopied ? 'コピー済み' : 'コピー'}</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} className="px-2 sm:px-3">
                  <FileDown className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1">PDF</span>
                </Button>
              </div>
            </div>

            {/* 統合編集フォーム */}
            {isEditing && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium mb-4">サービス情報を編集</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">サービス名</label>
                    <input
                      id="edit-name"
                      type="text"
                      defaultValue={serviceData.name}
                      placeholder="例: ChatGPT"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">カテゴリ</label>
                    <input
                      id="edit-industry"
                      type="text"
                      defaultValue={serviceData.industry}
                      placeholder="例: AIチャットボット"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">設立年/リリース年</label>
                    <input
                      id="edit-founded"
                      type="text"
                      defaultValue={serviceData.founded}
                      placeholder="例: 2022年"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ユーザー数</label>
                    <input
                      id="edit-employees"
                      type="text"
                      defaultValue={serviceData.employees}
                      placeholder="例: 1億人以上"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ウェブサイト</label>
                    <input
                      id="edit-website"
                      type="url"
                      defaultValue={serviceData.website || ''}
                      placeholder="例: https://example.com"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">サービス概要</label>
                  <textarea
                    id="edit-description"
                    defaultValue={serviceData.description}
                    placeholder="サービスの概要を入力してください"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={4}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">編集理由 (任意)</label>
                  <input
                    id="edit-reason"
                    type="text"
                    placeholder="例: 最新情報に更新、誤字修正など"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={handleSaveEdit}
                    className="bg-bond-pink hover:bg-bond-pinkDark text-white shadow-md"
                  >
                    <Save className="w-4 h-4 mr-1" />
                    保存
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-1" />
                    キャンセル
                  </Button>
                </div>
              </div>
            )}

            {/* 評価サマリー */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(serviceData.averageRating))}
                <span className="text-base sm:text-lg font-semibold">{serviceData.averageRating.toFixed(1)}</span>
                <span className="text-sm sm:text-base text-gray-600">({serviceData.evaluations.length}件)</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{serviceData.searchCount}回検索</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* サービス概要 */}
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg">サービス概要</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs px-2 sm:px-3"
                    >
                      <History className="w-3 h-3" />
                      <span className="hidden sm:inline ml-1">履歴</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                  <CompanyOverview
                    overview={serviceData.description}
                    maxSections={20}
                    isLoggedIn={!!currentUser?.id}
                  />

                  {showHistory && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        編集履歴
                      </h4>
                      {serviceData.editHistory && serviceData.editHistory.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {serviceData.editHistory
                            .slice()
                            .reverse()
                            .map((entry, index) => (
                            <div key={index} className="border border-border rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {getUserDisplayName(entry.editor)}
                                </span>
                                <span className="text-gray-600 text-xs">
                                  {new Date(entry.editedAt).toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-gray-600 mb-2">
                                <strong>フィールド:</strong> {entry.field} | <strong>編集理由:</strong> {entry.reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm">編集履歴はありません</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 参考サイト */}
              {serviceData.sources && serviceData.sources.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      参考サイト
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      このサービス情報の作成時に参照したウェブサイト
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-2 sm:space-y-3">
                      {serviceData.sources.slice(0, 10).map((source, index) => (
                        <div key={index} className="border border-border rounded-lg p-2 sm:p-3 hover:bg-muted/50 transition-colors">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex items-start gap-2">
                              <ExternalLink className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-primary hover:underline truncate">
                                  {source.title || (() => { try { return new URL(source.url).hostname; } catch { return source.url; } })()}
                                </p>
                                <p className="text-xs text-gray-600 truncate mt-0.5">
                                  {source.url}
                                </p>
                              </div>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 評価一覧 */}
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">評価・レビュー</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    ユーザーによる実際の評価をご覧いただけます
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                  {serviceData.evaluations.length > 0 ? (
                    <div className="space-y-3 sm:space-y-4">
                      {(() => {
                        const sortedEvaluations = serviceData.evaluations.slice().sort((a, b) => {
                          if (b.likesCount !== a.likesCount) {
                            return b.likesCount - a.likesCount;
                          }
                          return b.timestamp - a.timestamp;
                        });
                        const isLoggedIn = !!currentUser?.id;
                        const displayEvaluations = isLoggedIn ? sortedEvaluations : sortedEvaluations.slice(0, 3);
                        const hiddenCount = isLoggedIn ? 0 : Math.max(0, sortedEvaluations.length - 3);

                        return (
                          <>
                            {displayEvaluations.map((evaluation) => {
                        const displayName = evaluation.isAnonymous
                          ? '匿名ユーザー'
                          : evaluation.userName || getUserDisplayName(evaluation.userId);
                        const relationshipLabel =
                          evaluation.relationshipLabel || getRelationshipLabel(evaluation.relationshipType);
                        const avatarSrc = evaluation.isAnonymous ? '' : evaluation.userImage || '/avatar5.png';

                        return (
                          <div key={evaluation.id} className="border border-border rounded-lg p-3 sm:p-4">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                                {evaluation.isAnonymous ? (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-bold">
                                    匿
                                  </div>
                                ) : (
                                  <img
                                    src={avatarSrc}
                                    alt={displayName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = '/avatar5.png';
                                    }}
                                  />
                                )}
                              </div>
                              <div className="flex-1 min-w-0 flex flex-wrap items-center gap-1.5 sm:gap-2">
                                <span className="font-medium text-sm sm:text-base">
                                  {displayName}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {relationshipLabel}
                                </Badge>
                                <div className="flex items-center gap-0.5">
                                  {renderStars(evaluation.rating)}
                                </div>
                                <span className="text-gray-500 text-xs ml-auto">
                                  {new Date(evaluation.timestamp).toLocaleDateString('ja-JP')}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                              {evaluation.comment}
                            </p>

                            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                              <button
                                onClick={() => handleLike(evaluation.id)}
                                disabled={likingId === evaluation.id}
                                className={`flex items-center gap-1.5 text-sm transition-colors ${
                                  evaluation.hasLiked
                                    ? 'text-red-500'
                                    : 'text-gray-500 hover:text-red-500'
                                }`}
                              >
                                <Heart
                                  className={`w-4 h-4 ${evaluation.hasLiked ? 'fill-red-500' : ''}`}
                                />
                                <span>{evaluation.likesCount > 0 ? evaluation.likesCount : ''}</span>
                                <span className="hidden sm:inline">いいね</span>
                              </button>

                              <button
                                onClick={() => toggleReplies(evaluation.id)}
                                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-500 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{evaluation.repliesCount > 0 ? evaluation.repliesCount : ''}</span>
                                <span className="hidden sm:inline">リプライ</span>
                                {expandedReplies.has(evaluation.id) ? (
                                  <ChevronUp className="w-3 h-3" />
                                ) : (
                                  <ChevronDown className="w-3 h-3" />
                                )}
                              </button>

                              {/* 自分の評価の場合は編集・削除ボタンを表示 */}
                              {currentUser?.id === evaluation.userId && (
                                <div className="flex items-center gap-2 ml-auto">
                                  <button
                                    onClick={() => handleEditEvaluation(evaluation)}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    <Pencil className="w-3 h-3" />
                                    <span className="hidden sm:inline">編集</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEvaluation(evaluation.id)}
                                    className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    <span className="hidden sm:inline">削除</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {expandedReplies.has(evaluation.id) && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                {evaluation.replies && evaluation.replies.length > 0 && (
                                  <div className="space-y-2 mb-3">
                                    {evaluation.replies.map((reply, index) => (
                                      <div key={index} className="flex gap-2 pl-2 border-l-2 border-gray-200">
                                        <div className="flex-shrink-0">
                                          {reply.isAnonymous || !reply.user ? (
                                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                              <User className="w-3 h-3 text-gray-500" />
                                            </div>
                                          ) : (
                                            <img
                                              src={reply.user.image || '/avatar5.png'}
                                              alt={reply.user.name}
                                              className="w-6 h-6 rounded-full object-cover"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/avatar5.png';
                                              }}
                                            />
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-gray-900">
                                              {reply.isAnonymous ? '匿名' : reply.user?.name || '匿名'}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                              {formatReplyTimestamp(reply.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-700 break-words">
                                            {reply.content}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {currentUser?.id && (
                                  <div className="flex gap-2">
                                    <Textarea
                                      value={replyInputs[evaluation.id] || ''}
                                      onChange={(e) => setReplyInputs(prev => ({
                                        ...prev,
                                        [evaluation.id]: e.target.value
                                      }))}
                                      placeholder="リプライを入力..."
                                      className="flex-1 min-h-[60px] max-h-24 text-sm resize-none"
                                      maxLength={500}
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() => handleReply(evaluation.id)}
                                      disabled={submittingReply === evaluation.id || !replyInputs[evaluation.id]?.trim()}
                                      className="self-end"
                                    >
                                      <Send className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}

                                {!currentUser?.id && (
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
                        );
                      })}
                            {hiddenCount > 0 && (
                              <div className="border border-dashed border-border rounded-lg p-6 text-center bg-muted/30">
                                <p className="text-gray-600 mb-3">
                                  他 {hiddenCount} 件の評価があります
                                </p>
                                <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                                  ログインしてすべての評価を見る
                                </Link>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center space-y-3">
                      <p className="text-gray-600">まだこのサービスの評価は投稿されていません。</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                        <span className="text-sm text-gray-600">最初の評価を投稿してみませんか？</span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowEvaluationForm(true)}
                        >
                          評価を投稿する
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* サイドバー */}
            <div className="space-y-4 sm:space-y-6">
              {/* 評価投稿フォーム */}
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">評価を投稿</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                  {hasUserEvaluated ? (
                    <p className="text-gray-700 text-center py-4">
                      このサービスについては既に評価済みです
                    </p>
                  ) : !showEvaluationForm ? (
                    <Button
                      type="button"
                      onClick={() => setShowEvaluationForm(true)}
                      className="w-full"
                    >
                      評価を投稿する
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">評価</label>
                        <div className="mt-1">
                          {renderStars(rating, true)}
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">関係性</label>
                        <select
                          value={relationshipType === '' ? '' : String(relationshipType)}
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : Number(e.target.value);
                            setRelationshipType(value);
                          }}
                          className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                        >
                          <option value="">選択してください</option>
                          {RELATIONSHIP_OPTIONS.filter((rel) => rel.value !== 0).map((rel) => (
                            <option key={rel.value} value={rel.value}>{rel.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium">表示設定</label>
                        <div className="mt-2 space-y-2">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="anonymity"
                              value="real"
                              checked={!isAnonymous}
                              onChange={() => setIsAnonymous(false)}
                              className="text-bond-pink focus:ring-bond-pink"
                              disabled={!canUseRealIdentity}
                            />
                            <span className="text-sm">
                              実名で投稿 ({realIdentityLabel})
                            </span>
                          </label>
                          {!canUseRealIdentity && (
                            <p className="text-xs text-gray-600 ml-6">
                              ログインすると実名で投稿できます
                            </p>
                          )}
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name="anonymity"
                              value="anonymous"
                              checked={isAnonymous}
                              onChange={() => setIsAnonymous(true)}
                              className="text-bond-pink focus:ring-bond-pink"
                            />
                            <span className="text-sm">匿名で投稿</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">評価内容</label>
                        <Textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="具体的な評価内容を入力してください"
                          className="mt-1"
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={submitEvaluation}
                          disabled={rating === 0 || relationshipType === '' || !comment.trim()}
                          className="flex-1"
                        >
                          投稿
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowEvaluationForm(false);
                            setRating(0);
                            setRelationshipType('');
                            setComment('');
                            setIsAnonymous(false);
                          }}
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 関連サービス */}
              {relatedServices.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">関連サービス</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      同カテゴリ・人気のサービス
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4 space-y-2 sm:space-y-3">
                    {relatedServices.map((service) => (
                      <Link
                        key={service.slug}
                        href={`/service/${service.slug}`}
                        className="block"
                      >
                        <div className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={`/api/company-logo/${encodeURIComponent(service.slug)}`}
                                alt={`${service.name} ロゴ`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/bond-logo.png';
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate hover:text-primary">
                                {service.name}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {service.industry}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {service.averageRating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600">
                                      {service.averageRating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">
                                    {service.searchCount}回
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* 評価編集モーダル */}
        <EditEvaluationModal
          evaluation={editingEvaluation as any}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEvaluation(null);
          }}
          onSave={handleSaveEvaluation}
        />
      </div>
  );
}
