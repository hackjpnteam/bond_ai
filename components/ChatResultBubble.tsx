'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, Building2, User, BookmarkPlus, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ApiResponse } from '@/types/bond';
import { useAuth } from '@/lib/auth';
import { getRelationshipLabel, RELATIONSHIP_OPTIONS } from '@/lib/relationship';

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
  isAnonymous: boolean;
}

interface CompanyEvaluations {
  evaluations: Evaluation[];
  averageRating: number;
}

interface ChatResultBubbleProps {
  result: ApiResponse;
  mode: 'company' | 'person' | 'service' | null;
  company: string;
}

// Helper function to extract answer text from potentially JSON-encoded content
function extractAnswerText(raw: string | undefined | null): string {
  if (!raw) return '';

  let text = '';

  try {
    // Check if raw is a JSON string containing "answer" field
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && typeof parsed.answer === 'string') {
        text = parsed.answer;
      } else if (typeof parsed === 'string') {
        text = parsed;
      } else {
        text = raw;
      }
    } else {
      text = raw;
    }
  } catch {
    // If parsing fails, use the raw string
    text = raw;
  }

  // Clean up any escaped newlines
  text = text.replace(/\\n/g, '\n');

  return text;
}

export function renderInlineElements(text: string, keyPrefix: string) {
  const elements: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|\*[^*]+\*|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let partIndex = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const chunk = text.slice(lastIndex, match.index);
      elements.push(
        <React.Fragment key={`${keyPrefix}-text-${partIndex++}`}>{chunk}</React.Fragment>
      );
    }

    const token = match[0];
    if (token.startsWith('**')) {
      elements.push(
        <strong key={`${keyPrefix}-bold-${partIndex++}`} className="font-bold text-gray-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*')) {
      elements.push(
        <em key={`${keyPrefix}-italic-${partIndex++}`} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    } else {
      elements.push(
        <a
          key={`${keyPrefix}-link-${partIndex++}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#ff5f4a] underline break-all overflow-wrap-anywhere"
        >
          {token}
        </a>
      );
    }

    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < text.length) {
    elements.push(
      <React.Fragment key={`${keyPrefix}-tail-${partIndex++}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return elements;
}

export function renderMarkdownContent(text: string) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listStartIndex = 0;
  let inCodeBlock = false;
  let codeLanguage = '';
  let codeLines: string[] = [];

  const flushList = () => {
    if (!currentList.length) return;
    elements.push(
      <ul
        key={`list-${listStartIndex}`}
        className="list-disc pl-6 space-y-2 text-sm text-gray-700 my-3"
      >
        {currentList.map((item, idx) => (
          <li key={`list-${listStartIndex}-${idx}`} className="leading-relaxed">
            {renderInlineElements(item, `list-${listStartIndex}-${idx}`)}
          </li>
        ))}
      </ul>
    );
    currentList = [];
  };

  const flushCodeBlock = () => {
    if (!inCodeBlock || codeLines.length === 0) return;
    elements.push(
      <div key={`code-${listStartIndex}`} className="bg-gray-50 p-4 rounded-lg text-sm overflow-hidden">
        <div className="text-gray-800 font-mono whitespace-pre-wrap break-words leading-relaxed">
          {codeLines.join('\n')}
        </div>
      </div>
    );
    inCodeBlock = false;
    codeLines = [];
    codeLanguage = '';
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        flushCodeBlock();
      } else {
        flushList();
        inCodeBlock = true;
        codeLanguage = line.substring(3).trim();
        codeLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    if (!line) {
      flushList();
      return;
    }

    if (line.startsWith('- ')) {
      if (!currentList.length) {
        listStartIndex = idx;
      }
      currentList.push(rawLine.replace(/^-+\s*/, ''));
      return;
    }

    flushList();

    const headingMatch = line.match(/^(#{1,4})\s+(.*)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const content = headingMatch[2];
      const HeadingTag = `h${Math.min(level + 1, 4)}` as keyof JSX.IntrinsicElements;
      const headingClasses = [
        'text-xl font-bold text-gray-900 mt-6 mb-3 leading-tight',
        'text-lg font-semibold text-gray-900 mt-5 mb-3 leading-snug',
        'text-base font-semibold text-gray-800 mt-4 mb-2 leading-normal',
        'text-sm font-semibold text-gray-700 mt-3 mb-2 leading-normal'
      ];

      elements.push(
        <HeadingTag key={`heading-${idx}`} className={headingClasses[Math.min(level - 1, 3)]}>
          {renderInlineElements(content, `heading-${idx}`)}
        </HeadingTag>
      );
      return;
    }

    if (/^---+$/.test(line)) {
      elements.push(<hr key={`hr-${idx}`} className="my-4 border-gray-200" />);
      return;
    }

    elements.push(
      <p key={`p-${idx}`} className="text-sm text-gray-700 leading-relaxed mb-3 break-words">
        {renderInlineElements(rawLine, `p-${idx}`)}
      </p>
    );
  });

  flushList();
  flushCodeBlock();

  return <div className="space-y-3 break-words overflow-hidden">{elements}</div>;
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export function ChatResultBubble({ result, mode, company }: ChatResultBubbleProps) {
  const [evaluations, setEvaluations] = useState<CompanyEvaluations>({ evaluations: [], averageRating: 0 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { user: currentUser } = useAuth();

  // 評価データをAPIから取得
  useEffect(() => {
    const loadEvaluations = async () => {
      try {
        const response = await fetch(`/api/evaluations?company=${encodeURIComponent(company.toLowerCase())}`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.evaluations.length > 0) {
            const evaluationData = data.evaluations.map((evaluation: any) => ({
              id: evaluation.id,
              rating: evaluation.rating,
              relationshipType: evaluation.relationshipType,
              relationshipLabel: evaluation.relationshipLabel,
              comment: evaluation.comment,
              timestamp: new Date(evaluation.createdAt).getTime(),
              userId: evaluation.userId,
              userName: evaluation.user?.name,
              userImage: evaluation.user?.image,
              isAnonymous: evaluation.isAnonymous
            }));

            const averageRating = evaluationData.reduce((sum: number, e: Evaluation) => sum + e.rating, 0) / evaluationData.length;
            setEvaluations({ evaluations: evaluationData, averageRating });
          }
        }
      } catch (error) {
        console.error('Error loading evaluations:', error);
      }
    };

    if (company) {
      loadEvaluations();
    }
  }, [company]);

  const hasUserEvaluated = false;
  const userEvaluation = null;

  // 新しい評価の入力状態
  const [rating, setRating] = useState(0);
  const [relationshipType, setRelationshipType] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsAnonymous(!currentUser);
  }, [currentUser]);

  const canUseRealIdentity = Boolean(currentUser);
  const normalizedCompanyName = company?.toLowerCase() || '';
  const localStorageKey = `bond-saved-${mode}-${normalizedCompanyName}`;

  useEffect(() => {
    if (!normalizedCompanyName) return;
    try {
      const stored = window.localStorage.getItem(localStorageKey);
      if (stored === 'true') {
        setIsSaved(true);
      }
    } catch (error) {
      console.error('Error reading saved status cache:', error);
    }
  }, [normalizedCompanyName, localStorageKey]);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!currentUser || !normalizedCompanyName) {
        setIsSaved(false);
        return;
      }

      try {
        const response = await fetch(`/api/saved-items?type=${mode}&limit=500`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          const alreadySaved = (data.savedItems || []).some(
            (item: any) =>
              item.itemType === mode &&
              item.itemData?.name?.toLowerCase() === normalizedCompanyName
          );
          setIsSaved(alreadySaved);
          if (alreadySaved) {
            window.localStorage.setItem(localStorageKey, 'true');
          } else {
            window.localStorage.removeItem(localStorageKey);
          }
        }
      } catch (error) {
        console.error('Error checking saved status:', error);
      }
    };

    checkSavedStatus();
  }, [currentUser, normalizedCompanyName, mode]);

  const submitEvaluation = async () => {
    if (!rating || relationshipType === null || !comment.trim()) {
      alert('すべての項目を入力してください');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          companyName: company,
          companySlug: company.toLowerCase(),
          rating,
          comment: comment.trim(),
          categories: {
            culture: rating,
            growth: rating,
            workLifeBalance: rating,
            compensation: rating,
            leadership: rating
          },
          relationshipType,
          isAnonymous
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newEvaluation: Evaluation = {
            id: data.evaluation.id,
            rating: data.evaluation.rating,
            relationshipType: data.evaluation.relationshipType,
            relationshipLabel: data.evaluation.relationshipLabel,
            comment: data.evaluation.comment,
            timestamp: new Date(data.evaluation.createdAt).getTime(),
            userId: currentUser?.id || 'current-user',
            userName: isAnonymous ? undefined : currentUser?.name,
            userImage: isAnonymous ? undefined : currentUser?.image,
            isAnonymous
          };

          setEvaluations(prev => {
            const updatedEvaluations = [...(prev.evaluations || []), newEvaluation];
            const newAverageRating = updatedEvaluations.reduce((sum, e) => sum + e.rating, 0) / updatedEvaluations.length;
            return {
              evaluations: updatedEvaluations,
              averageRating: newAverageRating
            };
          });

          setRating(0);
          setRelationshipType(null);
          setComment('');
          setShowForm(false);
          setIsAnonymous(!currentUser);

          alert('評価を投稿しました！');
        }
      } else {
        const errorData = await response.json();
        alert(errorData.error || '評価の投稿に失敗しました');
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      alert('評価の投稿中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= count
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={interactive ? () => setRating(star) : undefined}
          />
        ))}
      </div>
    );
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

  const handleCopyAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(extractAnswerText(result.answer));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-[#ff7a18] via-[#ff5f4a] to-[#ff3d81] p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
              {mode === 'person' ? (
                <User className="w-6 h-6 text-white" />
              ) : (
                <>
                  <img
                    src={`/api/company-logo/${encodeURIComponent(company.toLowerCase())}`}
                    alt={`${company} ロゴ`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full items-center justify-center hidden">
                    <Building2 className="w-6 h-6 text-white" />
                  </div>
                </>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{company}</h2>
              {evaluations.evaluations.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-300 text-yellow-300" />
                    <span className="text-sm font-semibold text-white">
                      {evaluations.averageRating.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-xs text-white/80">
                    ({evaluations.evaluations.length}件の評価)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 space-y-6">
          {/* AI回答 */}
          <div className="relative">
            {/* コピーボタン */}
            <div className="absolute top-0 right-0 z-10">
              <Button
                onClick={handleCopyAnalysis}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    コピー完了
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    分析結果をコピー
                  </>
                )}
              </Button>
            </div>

            <div className="prose prose-sm max-w-none mt-12 whitespace-pre-wrap leading-relaxed">
              <div className="text-gray-700 break-words overflow-wrap-anywhere">
                {renderMarkdownContent(extractAnswerText(result.answer))}
              </div>
            </div>
          </div>

          {result.bondPageUrl && (
            <div className="border-t border-dashed pt-4">
              <a
                href={result.bondPageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#ff5f4a] hover:text-[#ff3d81]"
              >
                Bondページで詳しく見る
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M18 13v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" x2="21" y1="14" y2="3" />
                </svg>
              </a>
            </div>
          )}

          {/* ソース */}
          {result.sources && result.sources.length > 0 && (
            <div className="border-t pt-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                参考情報
              </h3>
              <div className="space-y-2">
                {result.sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-mono text-gray-400">
                        {hostname(source.url)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {source.title || source.url}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* 評価セクション */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-gray-900">
                コミュニティの評価
              </h3>
              {!showForm && (
                <Button
                  onClick={() => setShowForm(true)}
                  size="sm"
                  className="bg-gradient-to-r from-[#ff7a18] to-[#ff5f4a] hover:from-[#ff8f3d] hover:to-[#ff6f5f] text-white"
                >
                  評価を投稿
                </Button>
              )}
            </div>

            {/* 評価一覧 */}
            {evaluations.evaluations.length > 0 && (
              <div className="space-y-4 mb-6">
                {evaluations.evaluations.map((evaluation) => (
                  <div key={evaluation.id} className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0">
                        {evaluation.userImage && !evaluation.isAnonymous ? (
                          <img
                            src={evaluation.userImage}
                            alt={evaluation.userName || '評価者'}
                            className="w-10 h-10 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/avatar5.png';
                            }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                            <span className="text-gray-500 text-sm">👤</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-3 text-xs sm:text-sm">
                          <span className="font-medium text-foreground">
                            {evaluation.isAnonymous ? '匿名ユーザー' : (evaluation.userName || 'Bondユーザー')}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[11px] sm:text-xs font-medium">
                            {evaluation.relationshipLabel}
                          </span>
                          <span className="text-muted-foreground">が</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px] sm:text-xs font-medium">
                            {company}
                          </span>
                          <span className="text-muted-foreground">を評価</span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {renderStars(evaluation.rating)}
                          </div>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {formatTimestamp(evaluation.timestamp)}
                          </span>
                        </div>

                        <p className="text-sm text-gray-700 leading-relaxed">
                          {evaluation.comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 評価フォーム */}
            {showForm && (
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 space-y-4">
                <h4 className="font-semibold text-gray-900">評価を投稿する</h4>

                <div>
                  <label className="text-xs text-gray-700 font-medium">評価 (星の数)</label>
                  {renderStars(rating, true)}
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-medium block mb-2">関係性</label>
                  <select
                    value={relationshipType ?? ''}
                    onChange={(e) => setRelationshipType(e.target.value ? Number(e.target.value) : null)}
                    className="w-full h-8 text-xs px-3 py-1 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">関係性を選択</option>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-gray-700 font-medium">コメント</label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="具体的な経験や感想を教えてください..."
                    className="mt-1 min-h-[100px] text-sm bg-white text-gray-900"
                  />
                </div>

                {canUseRealIdentity && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="anonymous" className="text-xs text-gray-600">
                      匿名で投稿する
                    </label>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    onClick={submitEvaluation}
                    disabled={loading || !rating || relationshipType === null || !comment.trim()}
                    className="flex-1 bg-gradient-to-r from-[#ff7a18] to-[#ff5f4a] hover:from-[#ff8f3d] hover:to-[#ff6f5f] text-white"
                  >
                    {loading ? '投稿中...' : '投稿する'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowForm(false);
                      setRating(0);
                      setRelationshipType(null);
                      setComment('');
                    }}
                    variant="outline"
                  >
                    キャンセル
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* マイリスト追加プロンプト */}
        <div className="mt-6 border-t border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-foreground mb-1">
                マイリストに追加しますか？
              </p>
              <p className="text-sm text-muted-foreground">
                後で確認できるように保存しておきましょう
              </p>
            </div>
            <Button
              onClick={async () => {
                try {
                  const response = await fetch('/api/saved-items', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                      itemType: mode === 'company' ? 'company' : 'person',
                      itemData: {
                        name: company,
                        description: result.answer,
                        metadata: { mode }
                      }
                    }),
                  });

                  const data = await response.json();

                  if (response.ok && data.success) {
                    alert('マイリストに追加しました！');
                    setIsSaved(true);
                    window.localStorage.setItem(localStorageKey, 'true');
                  } else {
                    if (response.status === 409) {
                      setIsSaved(true);
                      window.localStorage.setItem(localStorageKey, 'true');
                      alert('このアイテムは既に保存済みです');
                    } else {
                      setIsSaved(false);
                      window.localStorage.removeItem(localStorageKey);
                      alert(data.error || '保存に失敗しました');
                    }
                  }
                } catch (error) {
                  console.error('Error saving to list:', error);
                  setIsSaved(false);
                  window.localStorage.removeItem(localStorageKey);
                  alert('保存中にエラーが発生しました');
                }
              }}
              disabled={isSaved}
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all transform hover:scale-105 bg-gradient-to-r from-[#ff7a18] via-[#ff5f4a] to-[#ff3d81] hover:from-[#ff8f3d] hover:to-[#ff4f91] disabled:opacity-60 disabled:hover:scale-100"
            >
              <BookmarkPlus className="w-4 h-4" />
              {isSaved ? '追加済み' : '追加する'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
