'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Building2, Users, TrendingUp, ExternalLink, Share2, BookmarkPlus, Edit3, Save, X, History, Clock, Search, Copy, FileDown, Check } from 'lucide-react';
import Link from 'next/link';
import { getUserDisplayName } from '@/lib/user-display';
import { getRelationshipLabel, RELATIONSHIP_OPTIONS, RELATIONSHIP_TYPES } from '@/lib/relationship';
import { CompanyOverview } from '@/components/company/CompanyOverview';
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

interface RelatedCompany {
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
  const [relatedCompanies, setRelatedCompanies] = useState<RelatedCompany[]>([]);
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

      // 検索結果データ（常に取得して最新の検索レポートを表示）
      const apiSearchResults = await fetchSearchResults();
      
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

      // 検索結果から最新のレポート内容とウェブサイトURL、設立年、従業員数を取得
      let searchReportDescription = '';
      let extractedWebsiteUrl = '';
      let extractedFounded = '';
      let extractedEmployees = '';
      let extractedIndustry = '';
      let extractedSources: SourceInfo[] = [];

      if (apiSearchResults && apiSearchResults.length > 0) {
        const matchingResult = apiSearchResults.find((result: any) =>
          result.company?.toLowerCase() === companyName.toLowerCase() ||
          result.query?.toLowerCase() === companyName.toLowerCase()
        );
        if (matchingResult) {
          // 説明文の抽出
          if (matchingResult.answer) {
            // JSONブロックやマークダウンコードブロックを除去
            let cleanAnswer = matchingResult.answer;
            cleanAnswer = cleanAnswer.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
            // JSONオブジェクト部分を抽出してanswerフィールドを取得
            try {
              const jsonMatch = cleanAnswer.match(/\{[\s\S]*"answer"\s*:\s*"([^"]+)"[\s\S]*\}/);
              if (jsonMatch && jsonMatch[1]) {
                cleanAnswer = jsonMatch[1].replace(/\\n/g, '\n');
              }
            } catch (e) {
              // JSON解析に失敗した場合はそのまま使用
            }
            searchReportDescription = cleanAnswer;

            // レポートテキストから設立年を抽出
            const foundedPatterns = [
              /設立[：:\s]*(\d{4})年/,
              /(\d{4})年[に]?設立/,
              /創業[：:\s]*(\d{4})年/,
              /(\d{4})年[に]?創業/,
              /founded[:\s]*(\d{4})/i
            ];
            for (const pattern of foundedPatterns) {
              const match = cleanAnswer.match(pattern);
              if (match && match[1]) {
                extractedFounded = `${match[1]}年`;
                break;
              }
            }

            // レポートテキストから従業員数を抽出
            const employeePatterns = [
              /従業員[数]?[：:\s]*約?(\d+)[名人]/,
              /社員[数]?[：:\s]*約?(\d+)[名人]/,
              /約?(\d+)[名人]の?(従業員|社員|エンジニア)/,
              /employees[:\s]*(\d+)/i
            ];
            for (const pattern of employeePatterns) {
              const match = cleanAnswer.match(pattern);
              if (match && match[1]) {
                extractedEmployees = `${match[1]}名`;
                break;
              }
            }

            // レポートテキストから業界を抽出
            const industryPatterns = [
              /業[界種][：:\s]*([^、\n]+)/,
              /事業内容[：:\s]*([^、\n]+)/
            ];
            for (const pattern of industryPatterns) {
              const match = cleanAnswer.match(pattern);
              if (match && match[1]) {
                extractedIndustry = match[1].trim().substring(0, 30);
                break;
              }
            }
          }

          // metadata.factsから情報を抽出（より優先度高い）
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
              if (label.includes('業界') || label.includes('業種') || label.includes('industry')) {
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

          // 参考サイトを抽出して保存
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

          // 検索結果からウェブサイトURLを抽出（factsで見つからない場合）
          if (!extractedWebsiteUrl) {
            if (Array.isArray(sourcesArray) && sourcesArray.length > 0) {
              // SNSやニュースサイトを除外して公式サイトらしいURLを探す
              const excludedDomains = [
                'twitter.com', 'x.com', 'facebook.com', 'linkedin.com', 'instagram.com',
                'youtube.com', 'prtimes.jp', 'note.com', 'wantedly.com', 'wikipedia.org',
                'news.yahoo.co.jp', 'google.com', 'amazon.co.jp', 'rakuten.co.jp',
                'recruit.co.jp', 'green-japan.com', 'en-japan.com', 'doda.jp'
              ];

              // 会社の公式サイトらしいURLを探す
              const officialSite = sourcesArray.find((source: any) => {
                const url = source.url || source.link || source;
                if (typeof url !== 'string') return false;
                try {
                  const domain = new URL(url).hostname.toLowerCase();
                  // 除外ドメインをチェック
                  if (excludedDomains.some(d => domain.includes(d))) return false;
                  return true;
                } catch {
                  return false;
                }
              });

              if (officialSite) {
                extractedWebsiteUrl = officialSite.url || officialSite.link || officialSite;
              }
            }
          }

          // metadataにurlフィールドがある場合も確認
          if (!extractedWebsiteUrl && matchingResult.metadata?.url) {
            extractedWebsiteUrl = matchingResult.metadata.url;
          }

          // bondPageUrlがある場合は除外（Bond内部リンク）
          if (extractedWebsiteUrl && (extractedWebsiteUrl.includes('localhost') || extractedWebsiteUrl.includes('bond'))) {
            extractedWebsiteUrl = '';
          }

          console.log('Extracted from search results:', {
            founded: extractedFounded,
            employees: extractedEmployees,
            website: extractedWebsiteUrl,
            industry: extractedIndustry
          });
        }
      }

      // 会社データを設定（検索結果から抽出したデータを優先的に使用）
      // DBに「情報収集中」などの仮データがある場合は検索結果から抽出したものを使用
      const isPlaceholder = (val: string | undefined) => {
        if (!val) return true;
        return val === '情報収集中' || val === '情報収集中...' || val === '—' || val === '-';
      };

      if (companyApiData) {
        console.log('Using MongoDB data for:', companyApiData.name);
        // MongoDBの説明文を優先、なければ検索レポート、最後にフォールバック
        const finalDescription = companyApiData.description && companyApiData.description.length > 50
          ? companyApiData.description
          : (searchReportDescription || fallbackDescription);
        // 検索結果から抽出したデータをDBデータより優先（DBが空またはプレースホルダーの場合）
        const finalFounded = isPlaceholder(companyApiData.founded) ? extractedFounded : companyApiData.founded;
        const finalEmployees = isPlaceholder(companyApiData.employees) ? extractedEmployees : companyApiData.employees;
        const finalWebsite = isPlaceholder(companyApiData.website) ? extractedWebsiteUrl : companyApiData.website;
        const finalIndustry = isPlaceholder(companyApiData.industry) ? extractedIndustry : companyApiData.industry;
        // sourcesも検索結果から抽出したものがなければMongoDBから取得
        const finalSources = extractedSources.length > 0 ? extractedSources : (companyApiData.sources || []);

        setCompanyData({
          name: companyApiData.name,
          industry: finalIndustry || '情報収集中...',
          description: finalDescription,
          founded: finalFounded || '情報収集中',
          employees: finalEmployees || '情報収集中',
          website: finalWebsite || '',
          evaluations,
          averageRating: evaluations.length > 0
            ? averageRating
            : (typeof companyApiData.averageRating === 'number'
                ? companyApiData.averageRating
                : 0),
          searchCount: companyApiData.searchCount,
          editHistory,
          searchResults: apiSearchResults,
          sources: finalSources
        });
      } else {
        console.log('Using fallback data for:', companyName);
        const finalDescription = searchReportDescription || fallbackDescription;
        setCompanyData({
          name: companyName,
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

      // 関連企業を取得
      try {
        const relatedResponse = await fetch(`/api/companies/${companyName.toLowerCase()}/related`);
        if (relatedResponse.ok) {
          const relatedData = await relatedResponse.json();
          if (relatedData.success) {
            setRelatedCompanies(relatedData.relatedCompanies || []);
          }
        }
      } catch (error) {
        console.error('Error fetching related companies:', error);
      }
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
    setRelationshipType('');
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

        // ページをリロードして最新状態を確保
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

  // レポートをクリップボードにコピー
  const handleCopyReport = async () => {
    if (!companyData) return;

    const latestReport = searchResults[0]?.answer || '';
    const reportText = `# ${companyData.name} - 企業レポート

## 基本情報
- 会社名: ${companyData.name}
- 業界: ${companyData.industry}
- 設立: ${companyData.founded || '不明'}
- 従業員数: ${companyData.employees || '不明'}
- ウェブサイト: ${companyData.website || '不明'}

## 企業概要
${companyData.description || '情報なし'}

## AIレポート
${latestReport || '最新のAIレポートはありません。'}

## Bond評価
- 平均評価: ${companyData.averageRating.toFixed(1)} / 5.0
- レビュー数: ${companyData.evaluations.length}件

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

  // PDFとしてエクスポート
  const handleExportPDF = async () => {
    if (!companyData) return;

    const latestReport = searchResults[0]?.answer || '';

    // HTML形式でレポートを作成
    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${companyData.name} - 企業レポート</title>
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
  <h1>${companyData.name}</h1>

  <h2>基本情報</h2>
  <table class="info-table">
    <tr><td>業界</td><td>${companyData.industry}</td></tr>
    <tr><td>設立</td><td>${companyData.founded || '不明'}</td></tr>
    <tr><td>従業員数</td><td>${companyData.employees || '不明'}</td></tr>
    <tr><td>ウェブサイト</td><td>${companyData.website || '不明'}</td></tr>
  </table>

  <h2>企業概要</h2>
  <p>${companyData.description || '情報なし'}</p>

  ${latestReport ? `
  <h2>AIレポート</h2>
  <div class="ai-report">${latestReport.replace(/\n/g, '<br>')}</div>
  ` : ''}

  <h2>Bond評価</h2>
  <div class="rating">
    <div class="rating-stars">${'★'.repeat(Math.round(companyData.averageRating))}${'☆'.repeat(5 - Math.round(companyData.averageRating))}</div>
    <p><strong>${companyData.averageRating.toFixed(1)}</strong> / 5.0 （${companyData.evaluations.length}件のレビュー）</p>
  </div>

  <div class="footer">
    <p>Generated by Bond AI - ${new Date().toLocaleDateString('ja-JP')}</p>
    <p>${window.location.href}</p>
  </div>
</body>
</html>`;

    // 新しいウィンドウを開いて印刷ダイアログを表示
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

  return (
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
                    <p className="text-gray-600">{companyData.industry}</p>
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
                <Button
                  variant={isCopied ? "default" : "outline"}
                  size="sm"
                  onClick={handleCopyReport}
                  className={isCopied ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      コピー済み
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      コピー
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF}>
                  <FileDown className="w-4 h-4 mr-1" />
                  PDF
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
                <span className="text-gray-600">({companyData.evaluations.length}件の評価)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
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
                  {/* 整形された会社概要 */}
                  <CompanyOverview
                    overview={companyData.description}
                    maxSections={20}
                    isLoggedIn={!!currentUser?.id}
                  />
                  
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
                        <p className="text-gray-600 text-sm">編集履歴はありません</p>
                      )}
                    </div>
                  )}

                  {/* 基本情報 - 非表示 */}

                  {/* 公式サイト - 非表示 */}
                </CardContent>
              </Card>

              {/* 検索結果インサイト - 非表示 */}

              {/* 参考サイト */}
              {companyData.sources && companyData.sources.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="w-5 h-5" />
                      参考サイト
                    </CardTitle>
                    <CardDescription>
                      この企業情報の作成時に参照したウェブサイト
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {companyData.sources.slice(0, 10).map((source, index) => (
                        <div key={index} className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <div className="flex items-start gap-2">
                              <ExternalLink className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-primary hover:underline truncate">
                                  {source.title || (() => { try { return new URL(source.url).hostname; } catch { return source.url; } })()}
                                </p>
                                <p className="text-xs text-gray-600 truncate mt-0.5">
                                  {source.url}
                                </p>
                                {source.published_at && (
                                  <p className="text-xs text-gray-600 mt-1">
                                    {source.published_at}
                                  </p>
                                )}
                              </div>
                            </div>
                          </a>
                        </div>
                      ))}
                    </div>
                    {companyData.sources.length > 10 && (
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        他 {companyData.sources.length - 10} 件のソース
                      </p>
                    )}
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
                                  <span className="text-gray-600 text-xs ml-auto">
                                    {new Date(evaluation.timestamp).toLocaleDateString('ja-JP')}
                                  </span>
                                </div>
                                <p className="text-gray-700 leading-relaxed">
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
                      <p className="text-gray-600">まだこの企業の評価は投稿されていません。</p>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-center">
                        <span className="text-sm text-gray-600">最初の評価を投稿してみませんか？</span>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            console.log('評価投稿ボタンがクリックされました');
                            setShowEvaluationForm(true);
                          }}
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
            <div className="space-y-6">
              {/* 評価投稿フォーム */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">評価を投稿</CardTitle>
                </CardHeader>
                <CardContent>
                  {hasUserEvaluated ? (
                    <p className="text-gray-700 text-center py-4">
                      この会社については既に評価済みです
                    </p>
                  ) : !showEvaluationForm ? (
                    <Button
                      type="button"
                      onClick={() => {
                        console.log('サイドバーの評価投稿ボタンがクリックされました');
                        setShowEvaluationForm(true);
                      }}
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

              {/* よく調べられている関連企業 */}
              {relatedCompanies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">よく調べられている関連企業</CardTitle>
                    <CardDescription>
                      同業界・人気の企業
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {relatedCompanies.map((company) => (
                      <Link
                        key={company.slug}
                        href={`/company/${company.slug}`}
                        className="block"
                      >
                        <div className="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              <img
                                src={`/logos/${company.slug}.png`}
                                alt={`${company.name} ロゴ`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/default-company.png';
                                  e.currentTarget.onerror = null;
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate hover:text-primary">
                                {company.name}
                              </p>
                              <p className="text-xs text-gray-600 truncate">
                                {company.industry}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {company.averageRating > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600">
                                      {company.averageRating.toFixed(1)}
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-600">
                                    {company.searchCount}回
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

              {/* 関連アクション - 非表示 */}
            </div>
          </div>
        </div>
      </div>
  );
}
