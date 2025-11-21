'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Building2, Users, TrendingUp, ExternalLink, Share2, BookmarkPlus, Edit3, Save, X, History, Clock, Search } from 'lucide-react';
import Link from 'next/link';
import Head from 'next/head';
import { Metadata } from 'next';
import { getUserDisplayName } from '@/lib/user-display';
import { getRelationshipLabel, RELATIONSHIP_OPTIONS, RELATIONSHIP_TYPES } from '@/lib/relationship';
import ReactMarkdown from 'react-markdown';

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
}

interface SearchResultData {
  id: string;
  query: string;
  company: string;
  answer: string;
  metadata?: any;
  createdAt: string;
}

interface CompanyData {
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

export default function CompanyPage() {
  const params = useParams();
  const companySlug = params.slug as string;
  const companyName = decodeURIComponent(companySlug);
  
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEvaluationForm, setShowEvaluationForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [relationshipType, setRelationshipType] = useState<number | ''>('');
  const [comment, setComment] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPerson, setIsPerson] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultData[]>([]);
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
      const response = await fetch(`/api/search-results?company=${encodeURIComponent(companyName)}&limit=50`, {
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
        setIsSaved(items.includes(companyName.toLowerCase()));
      } catch (e) {
        console.error('Error parsing saved items:', e);
      }
    }

    const loadCompanyData = async () => {
      // APIから企業データを取得（最優先）
      let companyApiData = null;
      try {
        const response = await fetch(`/api/companies/${companyName.toLowerCase()}`, {
          credentials: 'include',
        });
        if (response.ok) {
          companyApiData = await response.json();
          console.log('MongoDB company data loaded:', companyApiData.name);
        }
      } catch (error) {
        console.error('Error fetching company data:', error);
      }

      // 検索結果データ（MongoDBデータがある場合は参照のみ）
      const apiSearchResults = companyApiData ? [] : await fetchSearchResults();
      
      // APIから評価データを取得
      let evaluations: Evaluation[] = [];
      let averageRating = 0;
      
      try {
        const evaluationResponse = await fetch(`/api/evaluations?company=${encodeURIComponent(companyName)}&limit=100`, {
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
                isAnonymous: isAnon
              };
            });
            
            // 平均評価を計算
            if (evaluations.length > 0) {
              averageRating = evaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / evaluations.length;
            }
            
            console.log(`Loaded ${evaluations.length} evaluations from API for ${companyName}`);
          }
        }
      } catch (error) {
        console.error('Error fetching evaluations from API:', error);
      }

      // 検索履歴から検索回数とタイプを取得（APIデータとローカルデータを統合）
      let searchCount = apiSearchResults ? apiSearchResults.length : 0;
      let entityType: 'company' | 'person' = 'company';
      
      // ローカルストレージからも検索履歴を取得して統合
      const searchHistory = localStorage.getItem('bond_search_history');
      if (searchHistory) {
        try {
          const history = JSON.parse(searchHistory);
          const matches = history.filter((item: any) => 
            item.query.toLowerCase() === companyName.toLowerCase()
          );
          searchCount += matches.length;
          // 最新の検索からタイプを取得
          if (matches.length > 0 && matches[0].mode) {
            entityType = matches[0].mode;
          }
        } catch (e) {
          console.error('Error parsing search history:', e);
        }
      }
      setIsPerson(entityType === 'person');

      // フォールバック用の概要（APIデータがない場合のみ使用）
      let fallbackDescription = `${companyName}に関する詳細情報を表示しています。Bond検索で投稿された評価やレビューを確認できます。`;
      
      // 検索結果データはAPIデータがない場合のフォールバックとしてのみ使用
      if (!companyApiData) {
        // APIから取得した検索結果を使用
        if (apiSearchResults && apiSearchResults.length > 0) {
          const companyResult = apiSearchResults.find((result: any) => 
            result.company?.toLowerCase() === companyName.toLowerCase() ||
            result.query?.toLowerCase() === companyName.toLowerCase()
          );
          
          if (companyResult && companyResult.answer) {
            fallbackDescription = companyResult.answer;
          }
        } else {
          // さらなるフォールバック：localStorage から検索結果を取得
          try {
            const searchResults = localStorage.getItem('bond_latest_search_results');
            if (searchResults) {
              const results = JSON.parse(searchResults);
              const companyResult = results.find((result: any) => 
                result.query?.toLowerCase() === companyName.toLowerCase() ||
                result.company?.toLowerCase() === companyName.toLowerCase()
              );
              
              if (companyResult && companyResult.answer) {
                fallbackDescription = companyResult.answer;
              }
            }
          } catch (e) {
            console.error('Error parsing search results:', e);
          }
        }
      }

      // 編集履歴はAPIデータから取得（ローカルストレージから削除）
      let editHistory: EditHistoryEntry[] = companyApiData?.editHistory || [];

      // 会社データを設定（MongoDBデータが存在する場合は絶対優先）
      if (companyApiData) {
        console.log('Using MongoDB data exclusively for:', companyApiData.name);
        setCompanyData({
          name: companyApiData.name,
          industry: companyApiData.industry,
          description: companyApiData.description,
          founded: companyApiData.founded,
          employees: companyApiData.employees,
          website: companyApiData.website || '',
          evaluations,
          averageRating: evaluations.length > 0
            ? averageRating
            : (typeof companyApiData.averageRating === 'number'
                ? companyApiData.averageRating
                : 0),
          searchCount: companyApiData.searchCount,
          editHistory,
          searchResults: []
        });
      } else {
        console.log('Using fallback data for:', companyName);
        setCompanyData({
          name: companyName,
          industry: '情報収集中...',
          description: fallbackDescription,
          founded: '情報収集中',
          employees: '情報収集中',
          website: '',
          evaluations,
          averageRating: averageRating,
          searchCount: searchCount,
          editHistory: [],
          searchResults: apiSearchResults
        });
      }

      setLoading(false);
    };

    loadCompanyData();
  }, [companyName]);

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
    
    // 既に評価済みかチェック
    const hasUserEvaluated = companyData?.evaluations.some(
      evaluation => evaluation.userId === currentUserId
    );
    
    if (hasUserEvaluated) {
      alert('この会社については既に評価済みです。');
      return;
    }

    try {
      // API に評価を送信
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyName,
          companySlug: companyName.toLowerCase(),
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
        
        // ローカルデータも更新（表示用）
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
          isAnonymous
        };

        const updatedEvaluations = [...(companyData?.evaluations || []), newEvaluation];
        const averageRating = updatedEvaluations.reduce((sum, evaluation) => sum + evaluation.rating, 0) / updatedEvaluations.length;

        // localStorage にも保存（互換性のため）
        const key = `bond_eval:${companyName.toLowerCase()}`;
        localStorage.setItem(key, JSON.stringify({
          evaluations: updatedEvaluations,
          averageRating
        }));

        // 状態を更新
        setCompanyData(prev => prev ? {
          ...prev,
          evaluations: updatedEvaluations,
          averageRating
        } : null);

        // 成功メッセージ
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

    // フォームをリセット
    setRating(0);
    setRelationship('');
    setComment('');
    setIsAnonymous(false);
    setShowEvaluationForm(false);
  };

  // Wiki編集機能
  const startEdit = (field: string, currentValue: string) => {
    setEditField(field);
    setEditValue(currentValue);
    setEditReason('');
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditField(null);
    setEditValue('');
    setEditReason('');
  };

  const saveEdit = () => {
    if (!editField || !editValue.trim() || !companyData) return;

    const currentUserId = getUserId();
    const currentValue = companyData[editField as keyof CompanyData] as string;

    if (currentValue === editValue.trim()) {
      cancelEdit();
      return;
    }

    // 編集履歴を作成
    const editEntry: EditHistoryEntry = {
      id: Date.now().toString(),
      field: editField,
      oldValue: currentValue,
      newValue: editValue.trim(),
      editor: currentUserId,
      timestamp: Date.now(),
      reason: editReason.trim() || '編集'
    };

    // 会社データを更新
    const updatedData = {
      ...companyData,
      [editField]: editValue.trim(),
      editHistory: [...(companyData.editHistory || []), editEntry]
    };

    setCompanyData(updatedData);

    // localStorage に保存
    const historyKey = `bond_edit_history:${companyName.toLowerCase()}`;
    localStorage.setItem(historyKey, JSON.stringify(updatedData.editHistory));

    // 会社データも更新して保存
    const searchResults = localStorage.getItem('bond_latest_search_results');
    if (searchResults) {
      try {
        const results = JSON.parse(searchResults);
        const updatedResults = results.map((result: any) => {
          if (result.company?.toLowerCase() === companyName.toLowerCase()) {
            return {
              ...result,
              answer: editField === 'description' ? editValue.trim() : result.answer
            };
          }
          return result;
        });
        localStorage.setItem('bond_latest_search_results', JSON.stringify(updatedResults));
      } catch (e) {
        console.error('Error updating search results:', e);
      }
    }

    cancelEdit();
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSaveEdit = async () => {
    if (typeof window === 'undefined') return;

    try {
      // フォームから値を取得
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

      // APIに送信
      const response = await fetch(`/api/companies/${companyName.toLowerCase()}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newData)
      });

      if (response.ok) {
        const data = await response.json();
        
        // 企業データを更新（APIから返された最新データを使用）
        const updatedCompanyData = {
          ...companyData!,
          ...newData,
          editHistory: data.company?.editHistory || companyData?.editHistory || []
        };

        setCompanyData(updatedCompanyData);
        setIsEditing(false);
        
        alert('企業情報をデータベースに保存しました');
        
        // データを再取得して最新状態を確保
        setTimeout(() => {
          loadCompanyData();
        }, 500);
      } else {
        const errorData = await response.json();
        alert(`保存に失敗しました: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error saving edit:', error);
      alert('保存中にエラーが発生しました');
    }
  };

  // シェア機能
  const handleShare = async () => {
    const shareData = {
      title: `${companyName} - Bond`,
      text: `${companyName}の評価・レビューを見る`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // フォールバック: クリップボードにコピー
        await navigator.clipboard.writeText(window.location.href);
        alert('URLをクリップボードにコピーしました');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // ロゴアップロード機能
  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('ファイルサイズは5MB以下にしてください');
      return;
    }

    // ファイル形式チェック
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('対応している画像形式: JPEG, PNG, GIF, WebP');
      return;
    }

    setIsUploadingLogo(true);

    try {
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('companySlug', companyData?.slug || companyName.toLowerCase());

      const response = await fetch('/api/upload/company-logo', {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        alert('ロゴがアップロードされました！');
        
        // ページをリロードしてロゴを反映
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
      // ファイル入力をリセット
      event.target.value = '';
    }
  };

  // 保存機能
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
      // 保存から削除
      items = items.filter(item => item !== companyName.toLowerCase());
    } else {
      // 保存に追加
      items.push(companyName.toLowerCase());
    }

    localStorage.setItem('bond_saved_items', JSON.stringify(items));
    setIsSaved(!isSaved);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (!companyData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">会社データが見つかりません</div>
        </div>
      </div>
    );
  }

  const currentUserId = getUserId();
  const hasUserEvaluated = companyData.evaluations.some(
    evaluation => evaluation.userId === currentUserId
  );

  // SEO用のヘルパー関数
  const generateMetaDescription = (data: CompanyData): string => {
    const ratingText = data.evaluations.length > 0 
      ? `平均評価${data.averageRating.toFixed(1)}点（${data.evaluations.length}件の評価）`
      : '評価募集中';
    
    const description = data.description.length > 100 
      ? data.description.substring(0, 100) + '...'
      : data.description;
    
    return `${data.name}の企業評価・レビューをBondで確認。${ratingText}。${description} 実際の関係者による信頼性の高い評価をお届けします。`;
  };

  const generateKeywords = (data: CompanyData): string => {
    return [
      data.name,
      `${data.name} 評価`,
      `${data.name} レビュー`,
      `${data.name} 企業情報`,
      `${data.name} 口コミ`,
      data.industry,
      '企業評価',
      'スタートアップ',
      '投資判断',
      'Bond',
      '企業分析'
    ].join(', ');
  };

  const generateOGImage = (data: CompanyData): string => {
    // 動的OG画像生成のURL（実装時にはVercel OG Image Generationなどを使用）
    const params = new URLSearchParams({
      name: data.name,
      rating: data.averageRating.toFixed(1),
      count: data.evaluations.length.toString(),
      industry: data.industry
    });
    return `https://bond.ai/api/og/company?${params.toString()}`;
  };

  const getLastModified = (data: CompanyData): string => {
    const latestEvaluation = data.evaluations.length > 0 
      ? Math.max(...data.evaluations.map(e => e.timestamp))
      : Date.now();
    return new Date(latestEvaluation).toISOString();
  };

  const generateStructuredData = (data: CompanyData) => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": data.name,
      "description": data.description,
      "url": `https://bond.ai/company/${encodeURIComponent(companyName)}`,
      "logo": generateOGImage(data),
      "foundingDate": data.founded !== '情報収集中' ? data.founded : undefined,
      "numberOfEmployees": data.employees !== '情報収集中' ? data.employees : undefined,
      "industry": data.industry,
      "aggregateRating": data.evaluations.length > 0 ? {
        "@type": "AggregateRating",
        "ratingValue": data.averageRating,
        "reviewCount": data.evaluations.length,
        "bestRating": 5,
        "worstRating": 1,
        "ratingCount": data.evaluations.length
      } : undefined,
      "review": data.evaluations.slice(0, 10).map(evaluation => ({
        "@type": "Review",
        "author": {
          "@type": "Person",
          "name": getUserDisplayName(evaluation.userId)
        },
        "reviewRating": {
          "@type": "Rating",
          "ratingValue": evaluation.rating,
          "bestRating": 5,
          "worstRating": 1
        },
        "reviewBody": evaluation.comment,
        "datePublished": new Date(evaluation.timestamp).toISOString(),
        "publisher": {
          "@type": "Organization",
          "name": "Bond"
        }
      })),
      "sameAs": data.website ? [data.website] : undefined
    };
  };

  const generateReviewsStructuredData = (data: CompanyData) => {
    if (data.evaluations.length === 0) return {};
    
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": `${data.name}の評価・レビュー`,
      "description": `${data.name}に関する${data.evaluations.length}件の評価とレビュー`,
      "numberOfItems": data.evaluations.length,
      "itemListElement": data.evaluations.map((evaluation, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Review",
          "name": `${data.name}の評価 - ${evaluation.rating}星`,
          "author": {
            "@type": "Person",
            "name": getUserDisplayName(evaluation.userId)
          },
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": evaluation.rating,
            "bestRating": 5,
            "worstRating": 1
          },
          "reviewBody": evaluation.comment,
          "datePublished": new Date(evaluation.timestamp).toISOString(),
          "itemReviewed": {
            "@type": "Organization",
            "name": data.name
          }
        }
      }))
    };
  };

  const generateBreadcrumbStructuredData = (data: CompanyData) => {
    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Bond",
          "item": "https://bond.ai"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "企業一覧",
          "item": "https://bond.ai/companies"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": data.name,
          "item": `https://bond.ai/company/${encodeURIComponent(companyName)}`
        }
      ]
    };
  };

  return (
    <>
      <Head>
        {/* 基本的なメタタグ */}
        <title>{companyData.name} - 企業評価・レビュー | Bond</title>
        <meta name="description" content={generateMetaDescription(companyData)} />
        <meta name="keywords" content={generateKeywords(companyData)} />
        <meta name="author" content="Bond" />
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        
        {/* Open Graph タグ */}
        <meta property="og:type" content="organization" />
        <meta property="og:title" content={`${companyData.name} - 企業評価・レビュー | Bond`} />
        <meta property="og:description" content={generateMetaDescription(companyData)} />
        <meta property="og:url" content={`https://bond.ai/company/${encodeURIComponent(companyName)}`} />
        <meta property="og:site_name" content="Bond" />
        <meta property="og:image" content={generateOGImage(companyData)} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={`${companyData.name}の企業評価`} />
        <meta property="og:locale" content="ja_JP" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${companyData.name} - 企業評価・レビュー | Bond`} />
        <meta name="twitter:description" content={generateMetaDescription(companyData)} />
        <meta name="twitter:image" content={generateOGImage(companyData)} />
        <meta name="twitter:site" content="@BondAI" />
        
        {/* 追加のSEOタグ */}
        <link rel="canonical" href={`https://bond.ai/company/${encodeURIComponent(companyName)}`} />
        <meta name="rating" content={companyData.averageRating.toString()} />
        <meta name="review-count" content={companyData.evaluations.length.toString()} />
        <meta name="company-industry" content={companyData.industry} />
        <meta name="last-modified" content={getLastModified(companyData)} />
        
        {/* 検索エンジン向け地域情報 */}
        <meta name="geo.region" content="JP" />
        <meta name="geo.country" content="Japan" />
        <meta name="language" content="Japanese" />
        
        {/* 構造化データ（JSON-LD） - 拡張版 */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateStructuredData(companyData))
          }}
        />
        
        {/* 評価用の追加構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateReviewsStructuredData(companyData))
          }}
        />
        
        {/* パンくずリスト構造化データ */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(generateBreadcrumbStructuredData(companyData))
          }}
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* ヘッダー */}
        <div className="bg-white border-b border-border">
          <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden relative group cursor-pointer"
                     onClick={() => document.getElementById('logo-upload')?.click()}>
                  <img
                    src={`/logos/${companyData.slug || companyName.toLowerCase()}.png`}
                    alt={`${companyData.name} ロゴ`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // フォールバック: デフォルト画像を使用
                      e.currentTarget.src = '/default-company.png';
                      e.currentTarget.onerror = null; // 無限ループを防ぐ
                    }}
                  />
                  <div className="hidden w-full h-full flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-primary" />
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
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">{companyData.name}</h1>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-muted-foreground">{companyData.industry}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isEditing && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setIsEditing(true)}
                    className="text-bond-pink border-bond-pink hover:bg-bond-pink hover:text-white"
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    編集
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="w-4 h-4 mr-1" />
                  シェア
                </Button>
                <Button 
                  variant={isSaved ? "default" : "outline"} 
                  size="sm" 
                  onClick={handleSave}
                >
                  <BookmarkPlus className="w-4 h-4 mr-1" />
                  {isSaved ? '保存済み' : '保存'}
                </Button>
              </div>
            </div>

            {/* 統合編集フォーム */}
            {isEditing && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                <h3 className="text-lg font-medium mb-4">企業情報を編集</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">会社名</label>
                    <input
                      id="edit-name"
                      type="text"
                      defaultValue={companyData.name}
                      placeholder="例: 株式会社サンプル"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">業界</label>
                    <input
                      id="edit-industry"
                      type="text"
                      defaultValue={companyData.industry}
                      placeholder="例: IT・ソフトウェア"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">設立年</label>
                    <input
                      id="edit-founded"
                      type="text"
                      defaultValue={companyData.founded}
                      placeholder="例: 2020年"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">従業員数</label>
                    <input
                      id="edit-employees"
                      type="text"
                      defaultValue={companyData.employees}
                      placeholder="例: 100名"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">ウェブサイト</label>
                    <input
                      id="edit-website"
                      type="url"
                      defaultValue={companyData.website || ''}
                      placeholder="例: https://example.com"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">企業概要</label>
                  <textarea
                    id="edit-description"
                    defaultValue={companyData.description}
                    placeholder="企業の概要を入力してください"
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
                    className="bg-bond-pink hover:bg-bond-pinkDark"
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
            <div className="mt-6 flex items-center gap-6">
              <div className="flex items-center gap-2">
                {renderStars(Math.round(companyData.averageRating))}
                <span className="text-lg font-semibold">{companyData.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({companyData.evaluations.length}件の評価)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
                <span>{companyData.searchCount}回検索</span>
              </div>
            </div>
          </div>
        </div>

        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-6">
              {/* 会社概要 - Wiki風編集機能付き */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>会社概要</CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowHistory(!showHistory)}
                        className="text-xs"
                      >
                        <History className="w-3 h-3 mr-1" />
                        履歴
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground leading-relaxed">
                    {companyData.description.split('\n').map((line, index) => {
                      if (line.startsWith('•')) {
                        return (
                          <div key={index} className="flex items-start gap-2 mb-2">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="flex-1">{line.substring(1).trim()}</span>
                          </div>
                        );
                      }
                      return line.trim() ? <p key={index} className="mb-2">{line}</p> : null;
                    })}
                  </div>
                  
                  {/* 編集履歴表示 */}
                  {showHistory && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        編集履歴
                      </h4>
                      {companyData.editHistory && companyData.editHistory.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {companyData.editHistory
                            .slice()
                            .reverse()
                            .map((entry, index) => (
                            <div key={index} className="border border-border rounded-lg p-3 text-sm">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">
                                  {getUserDisplayName(entry.editor)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                  {new Date(entry.editedAt).toLocaleDateString('ja-JP', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                              <div className="text-muted-foreground mb-2">
                                <strong>フィールド:</strong> {entry.field} | <strong>編集理由:</strong> {entry.reason}
                              </div>
                              <div className="mt-2">
                                <details className="text-xs">
                                  <summary className="cursor-pointer text-primary hover:underline">
                                    変更内容を表示
                                  </summary>
                                  <div className="mt-2 p-2 bg-muted rounded border-l-4 border-red-300">
                                    <div className="text-red-600 line-through">{entry.oldValue}</div>
                                  </div>
                                  <div className="mt-1 p-2 bg-muted rounded border-l-4 border-green-300">
                                    <div className="text-green-600">{entry.newValue}</div>
                                  </div>
                                </details>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-sm">編集履歴はありません</p>
                      )}
                    </div>
                  )}

                  {/* 基本情報 - 会社の場合のみ表示 */}
                  {!isPerson && (
                    <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">設立年:</span>
                        <span className="ml-2 text-muted-foreground">{companyData.founded}</span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <span className="font-medium">従業員数:</span>
                        <span className="ml-2 text-muted-foreground">{companyData.employees}</span>
                      </div>
                    </div>
                  )}


                  {companyData.website && (
                    <div className="mt-4">
                      <a href={companyData.website} target="_blank" rel="noopener noreferrer" 
                         className="inline-flex items-center gap-2 text-primary hover:underline">
                        <ExternalLink className="w-4 h-4" />
                        公式サイト
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 検索結果インサイト */}
              {companyData.searchResults && companyData.searchResults.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      検索インサイト
                    </CardTitle>
                    <CardDescription>
                      {companyData.name}に関する検索結果・分析レポート
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {companyData.searchResults.slice(0, 3).map((result) => (
                        <div key={result.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Search className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm text-blue-600">
                                  {result.query}
                                </span>
                              </div>
                              <div className="text-sm text-muted-foreground leading-relaxed overflow-hidden">
                                <ReactMarkdown className="prose prose-sm max-w-none whitespace-pre-wrap">
                                  {result.answer.length > 200
                                    ? result.answer.substring(0, 200) + '...'
                                    : result.answer}
                                </ReactMarkdown>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0 ml-2">
                              {new Date(result.createdAt).toLocaleDateString('ja-JP')}
                            </Badge>
                          </div>
                          {result.answer.length > 200 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs p-0 h-auto text-blue-600 hover:text-blue-700"
                              onClick={() => {
                                // 展開機能は後で実装
                                alert('詳細表示機能は開発中です');
                              }}
                            >
                              続きを読む
                            </Button>
                          )}
                        </div>
                      ))}
                      
                      {companyData.searchResults.length > 3 && (
                        <div className="text-center pt-2">
                          <Link href={`/search-results?company=${encodeURIComponent(companyName)}`}>
                            <Button variant="outline" size="sm">
                              すべての検索結果を見る ({companyData.searchResults.length}件)
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 評価一覧 */}
              <Card>
                <CardHeader>
                  <CardTitle>評価・レビュー</CardTitle>
                  <CardDescription>
                    関係者による実際の評価をご覧いただけます
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {companyData.evaluations.length > 0 ? (
                    <div className="space-y-4">
                      {companyData.evaluations.slice().reverse().map((evaluation) => {
                        const displayName = evaluation.isAnonymous
                          ? '匿名ユーザー'
                          : evaluation.userName || getUserDisplayName(evaluation.userId);
                        const relationshipLabel =
                          evaluation.relationshipLabel || getRelationshipLabel(evaluation.relationshipType);
                        const avatarSrc = evaluation.isAnonymous ? '' : evaluation.userImage || '/avatar5.png';

                        return (
                          <div key={evaluation.id} className="border border-border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                                {evaluation.isAnonymous ? (
                                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-600 text-lg font-bold">
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
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 text-sm">
                                  <span className="font-medium">
                                    {displayName}
                                  </span>
                                  <Badge variant="outline">
                                    {relationshipLabel}
                                  </Badge>
                                  <div className="flex items-center gap-1">
                                    {renderStars(evaluation.rating)}
                                  </div>
                                  <span className="text-muted-foreground text-xs ml-auto">
                                    {new Date(evaluation.timestamp).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                  "{evaluation.comment}"
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border border-dashed border-border rounded-lg p-6 text-center space-y-3">
                      <p className="text-muted-foreground">まだこの企業の評価は投稿されていません。</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                        <span className="text-sm text-gray-600">最初の評価を投稿してみませんか？</span>
                        <Button size="sm" onClick={() => setShowEvaluationForm(true)}>
                          評価を投稿する
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* サイドバー */}
            <div className="space-y-6">
              {/* 評価投稿フォーム */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">評価を投稿</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasUserEvaluated ? (
                    <p className="text-muted-foreground text-center py-4">
                      この会社については既に評価済みです
                    </p>
                  ) : !showEvaluationForm ? (
                    <Button onClick={() => setShowEvaluationForm(true)} className="w-full">
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
                            <p className="text-xs text-muted-foreground ml-6">
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
                            setRelationship('');
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

              {/* 関連アクション */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">関連アクション</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/search?q=${encodeURIComponent(companyName)}`}>
                    <Button variant="outline" className="w-full justify-start">
                      <Building2 className="w-4 h-4 mr-2" />
                      詳細を検索
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    類似企業を探す
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
