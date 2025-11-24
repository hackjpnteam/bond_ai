'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Search, Building2, User, Sparkles, ChevronDown, ChevronUp, Filter, MapPin, Tag, HelpCircle, Lightbulb } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApiRequest, ApiResponse, CompanyCandidate } from '@/types/bond';
import { ChatResultBubble, renderMarkdownContent } from '@/components/ChatResultBubble';
import InputBar from '@/components/InputBar';
import { RotatingMessage, SimpleStep, SourceList, type Source } from '@/components/analysis';
import { CompanyCandidates } from '@/components/CompanyCandidates';

export default function BondSearchPage() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'company' | 'person' | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<ApiResponse | null>(null);
  const [lastQuery, setLastQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [showSatisfactionSurvey, setShowSatisfactionSurvey] = useState(false);
  const [satisfactionAnswered, setSatisfactionAnswered] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [companyCandidates, setCompanyCandidates] = useState<CompanyCandidate[]>([]);
  const [pendingSelectionQuery, setPendingSelectionQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // 絞り込み用の追加フィールド
  const [categoryKeyword, setCategoryKeyword] = useState('');
  const [regionKeyword, setRegionKeyword] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchTips, setShowSearchTips] = useState(false);

  // Loading state management
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sources, setSources] = useState<Source[]>([]);

  const apiUrl = process.env.NEXT_PUBLIC_BOND_API_URL || '/api/search-summarize';

  // カテゴリ選択時のチャット処理
  const handleCategorySelect = (selectedMode: 'company' | 'person') => {
    const categoryText = selectedMode === 'company' ? '会社・企業について' : '人物について';
    
    // ユーザーメッセージを追加
    const userMessage = { role: 'user' as const, content: categoryText };
    setMessages(prev => [...prev, userMessage]);
    
    // モードを設定
    setMode(selectedMode);
    
    // アシスタントの返答を追加
    setTimeout(() => {
      const assistantMessage = { 
        role: 'assistant' as const, 
        content: `${selectedMode === 'company' ? '会社・企業' : '人物'}についてですね！どちらについてお調べしましょうか？` 
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 500);
  };

  // サンプル項目選択時のチャット処理
  const handleSampleSelect = (sampleQuery: string) => {
    setQuery(sampleQuery);
    // 少し遅延してから自動的に検索実行
    setTimeout(() => {
      handleSubmit();
    }, 100);
  };

  const handleSatisfactionResponse = (satisfied: boolean) => {
    setSatisfactionAnswered(true);
    setMessages(prev => [...prev, { role: 'assistant', content: 'ありがとうございます。' }]);

    if (satisfied) {
      setTimeout(() => {
        setShowSatisfactionSurvey(false);
      }, 2000);
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: '早急に改善いたします。' }]);
      setTimeout(() => {
        setShowFeedbackInput(true);
        setMessages(prev => [...prev, { role: 'assistant', content: 'どのような点を改善すればよいか教えていただけますか？' }]);
      }, 1000);
    }
  };

  const handleFeedbackSubmit = () => {
    if (!feedbackText.trim()) return;

    // ユーザーのフィードバックを追加
    setMessages(prev => [...prev, { role: 'user', content: feedbackText }]);

    // 感謝のメッセージを追加
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'フィードバックありがとうございます。改善の参考にさせていただきます。' }]);

      // フィードバック入力をリセット
      setFeedbackText('');
      setShowFeedbackInput(false);

      // 調査を非表示
      setTimeout(() => {
        setShowSatisfactionSurvey(false);
      }, 2000);
    }, 500);
  };

  const saveSearchHistory = async (searchQuery: string, searchMode: 'company' | 'person') => {
    try {
      await fetch('/api/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query: searchQuery, mode: searchMode }),
      });
    } catch (e) {
      console.error('Error saving search history:', e);
    }
  };

  const executeSearch = async ({
    userQuery,
    selectedCompanySlug,
    skipHistory,
    historyMessages
  }: {
    userQuery: string;
    selectedCompanySlug?: string;
    skipHistory?: boolean;
    historyMessages: Array<{ role: 'user' | 'assistant'; content: string }>;
  }) => {
    try {
      if (!skipHistory && mode) {
        await saveSearchHistory(userQuery, mode);
      }

      const requestBody: ApiRequest = {
        query: userQuery,
        mode: mode || 'company',
        history: historyMessages
      };

      if (selectedCompanySlug) {
        requestBody.companySlug = selectedCompanySlug;
      }

      // 絞り込み用キーワードを追加
      if (categoryKeyword.trim()) {
        requestBody.categoryKeyword = categoryKeyword.trim();
      }
      if (regionKeyword.trim()) {
        requestBody.regionKeyword = regionKeyword.trim();
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data: ApiResponse = await res.json();

      if (data.selectionRequired && data.candidates) {
        setCompanyCandidates(data.candidates);
        setPendingSelectionQuery(userQuery);
        setShowSatisfactionSurvey(false);
        setSatisfactionAnswered(false);
        setShowFeedbackInput(false);
        return;
      }

      setCompanyCandidates([]);
      setPendingSelectionQuery('');
      setLastResult(data);

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);

      setShowSatisfactionSurvey(true);
      setSatisfactionAnswered(false);

      try {
        await fetch('/api/search-results', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            query: userQuery,
            company: data.companyName || userQuery,
            answer: data.answer,
            metadata: {
              mode,
              sources: data.sources || [],
              companySlug: data.companySlug,
              bondPageUrl: data.bondPageUrl,
              facts: data.facts
            }
          }),
        });
      } catch (e) {
        console.error('Error saving search results:', e);
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = 'エラーが発生しました。もう一度お試しください。';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim() || loading || mode === null) return;

    if (showSatisfactionSurvey || showFeedbackInput) {
      return;
    }

    const userQuery = query.trim();
    setLastQuery(userQuery);
    setQuery('');
    setLoading(true);
    setCompanyCandidates([]);
    setPendingSelectionQuery('');

    const newUserMessage = { role: 'user' as const, content: userQuery };
    const historyMessages = [...messages, newUserMessage];
    setMessages(historyMessages);

    await executeSearch({
      userQuery,
      historyMessages,
      skipHistory: false
    });
  };

  const handleCompanySelection = async (candidate: CompanyCandidate) => {
    if (!pendingSelectionQuery || loading) return;
    setCompanyCandidates([]);
    setLoading(true);
    const selectionMessage = {
      role: 'assistant' as const,
      content: `${candidate.name}を調査します。`
    };
    const historyMessages = [...messages, selectionMessage];
    setMessages(historyMessages);

    await executeSearch({
      userQuery: pendingSelectionQuery,
      selectedCompanySlug: candidate.slug,
      skipHistory: true,
      historyMessages
    });
  };

  // Step progression during loading
  useEffect(() => {
    if (!loading) {
      setStep(1);
      return;
    }

    // Initialize sources when loading starts
    const sampleSources: Source[] = [
      { title: '公式サイト', url: 'https://example.com', status: 'fetching' },
      { title: 'プレスリリース', url: 'https://prtimes.jp', status: 'pending' },
      { title: '業界ニュース', url: 'https://techcrunch.com', status: 'pending' },
      { title: '企業データベース', url: 'https://crunchbase.com', status: 'pending' },
      { title: 'SNS情報', url: 'https://twitter.com', status: 'pending' },
    ];
    setSources(sampleSources);

    // Step 1 -> 2 after 3 seconds
    const step2Timer = setTimeout(() => {
      setStep(2);
      setSources((prev) =>
        prev.map((s, i) =>
          i === 0 ? { ...s, status: 'done' as const } : i === 1 ? { ...s, status: 'fetching' as const } : s
        )
      );
    }, 3000);

    // Step 2 -> 3 after 7 seconds
    const step3Timer = setTimeout(() => {
      setStep(3);
      setSources((prev) =>
        prev.map((s, i) =>
          i <= 2 ? { ...s, status: 'done' as const } : i === 3 ? { ...s, status: 'fetching' as const } : s
        )
      );
    }, 7000);

    // Mark all sources as done after 10 seconds
    const doneTimer = setTimeout(() => {
      setSources((prev) => prev.map((s) => ({ ...s, status: 'done' as const })));
    }, 10000);

    return () => {
      clearTimeout(step2Timer);
      clearTimeout(step3Timer);
      clearTimeout(doneTimer);
    };
  }, [loading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - ChatGPT風 */}
      <div className="flex-shrink-0 border-b border-border/30 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-semibold text-foreground">Bond検索</h1>
          {mode && (
            <Badge variant="outline" className="text-xs">
              {mode === 'company' ? '企業検索' : '人物検索'}
            </Badge>
          )}
        </div>
      </div>

      {/* Main Chat Area - 全画面活用 */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="space-y-6">
                    {/* モード未選択時の質問 */}
                    {mode === null ? (
                      <div className="flex justify-start">
                        <div className="max-w-[90%] md:max-w-[85%] bg-white text-foreground rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                              <img
                                src="/avatar5.png"
                                alt="Bond AI Assistant"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Bond</span>
                          </div>
                          <p className="leading-relaxed mb-4">
                            こんにちは！今日は何についてお調べしましょうか？
                          </p>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => handleCategorySelect('company')}
                              className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-medium border border-primary/20 hover:border-primary/30"
                            >
                              <Building2 className="w-4 h-4" />
                              会社・企業について
                            </button>
                            <button
                              onClick={() => handleCategorySelect('person')}
                              className="flex items-center gap-2 px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-medium border border-primary/20 hover:border-primary/30"
                            >
                              <User className="w-4 h-4" />
                              人物について
                            </button>
                          </div>

                          {/* 検索ルールのトグル */}
                          <button
                            onClick={() => setShowSearchTips(!showSearchTips)}
                            className="mt-4 w-full group"
                          >
                            <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                              showSearchTips
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25'
                                : 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 hover:from-amber-200 hover:to-orange-200 dark:hover:from-amber-900/60 dark:hover:to-orange-900/60 border border-amber-300/50 dark:border-amber-700/50'
                            }`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                  showSearchTips
                                    ? 'bg-white/20'
                                    : 'bg-amber-500/20 dark:bg-amber-500/30'
                                }`}>
                                  <Lightbulb className={`w-4 h-4 ${showSearchTips ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                                </div>
                                <div className="text-left">
                                  <p className={`text-sm font-bold ${showSearchTips ? 'text-white' : 'text-amber-800 dark:text-amber-200'}`}>
                                    ✨ 検索のコツを見る
                                  </p>
                                  <p className={`text-xs ${showSearchTips ? 'text-white/80' : 'text-amber-600 dark:text-amber-400'}`}>
                                    より精度の高い検索結果を得るために
                                  </p>
                                </div>
                              </div>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${
                                showSearchTips ? 'bg-white/20 rotate-180' : 'bg-amber-500/20 dark:bg-amber-500/30'
                              }`}>
                                <ChevronDown className={`w-4 h-4 ${showSearchTips ? 'text-white' : 'text-amber-600 dark:text-amber-400'}`} />
                              </div>
                            </div>
                          </button>

                          {showSearchTips && (
                            <div className="mt-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl p-4 border border-amber-200/50 dark:border-amber-800/50">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div className="flex-1 space-y-3">
                                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    🎯 精度の高いAI検索のコツ
                                  </p>
                                  <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                                    検索内容をより詳細にすることで、精度の高い結果を得られます。
                                  </p>

                                  <div className="space-y-2">
                                    <div className="p-3 bg-white/70 dark:bg-black/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 font-medium">企業検索の例</p>
                                      <p className="text-sm text-foreground">
                                        「<span className="text-primary font-medium">hackjpn</span>」「<span className="text-primary font-medium">投資会社</span>」「<span className="text-primary font-medium">代表戸村</span>」
                                      </p>
                                    </div>
                                    <div className="p-3 bg-white/70 dark:bg-black/20 rounded-lg border border-amber-200/50 dark:border-amber-700/50">
                                      <p className="text-xs text-amber-600 dark:text-amber-400 mb-1 font-medium">人物検索の例</p>
                                      <p className="text-sm text-foreground">
                                        「<span className="text-primary font-medium">戸村光</span>」「<span className="text-primary font-medium">hackjpn CEO</span>」「<span className="text-primary font-medium">投資家</span>」
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-start gap-2 pt-2 border-t border-amber-200/50 dark:border-amber-700/50">
                                    <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-600 dark:text-amber-400">
                                      会社名・業界・代表者名・地域などを組み合わせると、同名の企業がある場合でも正確に特定できます。
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* モード選択後の推奨メッセージ */
                      <div className="flex justify-start">
                        <div className="max-w-[90%] md:max-w-[85%] bg-white text-foreground rounded-lg p-4 shadow-sm border border-gray-100">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20">
                              <img 
                                src="/avatar5.png" 
                                alt="Bond AI Assistant" 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground">Bond</span>
                          </div>
                          <p className="leading-relaxed">
                            {mode === 'company' ? '会社・企業' : '人物'}についてですね！どちらについてお調べしましょうか？
                          </p>
                          {mode === 'company' && (
                            <div className="mt-4 space-y-4">
                              {/* 検索のコツ */}
                              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      🎯 より精度の高い検索のコツ
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      会社名に加えて、<span className="text-primary font-medium">業界</span>や<span className="text-primary font-medium">代表者名</span>などを入力すると、より正確な情報をお届けできます。
                                    </p>
                                    <div className="mt-3 p-3 bg-background/80 rounded-lg border border-border/50">
                                      <p className="text-xs text-muted-foreground mb-1.5">例えば...</p>
                                      <p className="text-sm text-foreground font-medium">
                                        「<span className="text-primary">hackjpn</span>」+「<span className="text-primary">投資会社</span>」+「<span className="text-primary">代表戸村</span>」
                                      </p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                      💡 下の「絞り込みオプション」から詳細条件を設定できます
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* 人気の検索 */}
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">人気の企業検索：</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleSampleSelect('テスラ')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    テスラ
                                  </button>
                                  <button
                                    onClick={() => handleSampleSelect('Apple')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    Apple
                                  </button>
                                  <button
                                    onClick={() => handleSampleSelect('Microsoft')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    Microsoft
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          {mode === 'person' && (
                            <div className="mt-4 space-y-4">
                              {/* 検索のコツ */}
                              <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/20">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-foreground mb-1">
                                      🎯 より精度の高い検索のコツ
                                    </p>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      人物名に加えて、<span className="text-primary font-medium">所属会社</span>や<span className="text-primary font-medium">役職</span>などを入力すると、より正確な情報をお届けできます。
                                    </p>
                                    <div className="mt-3 p-3 bg-background/80 rounded-lg border border-border/50">
                                      <p className="text-xs text-muted-foreground mb-1.5">例えば...</p>
                                      <p className="text-sm text-foreground font-medium">
                                        「<span className="text-primary">戸村光</span>」+「<span className="text-primary">hackjpn CEO</span>」+「<span className="text-primary">投資家</span>」
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* 人気の検索 */}
                              <div>
                                <p className="text-sm text-muted-foreground mb-2">人気の人物検索：</p>
                                <div className="flex flex-wrap gap-2">
                                  <button
                                    onClick={() => handleSampleSelect('イーロン・マスク')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    イーロン・マスク
                                  </button>
                                  <button
                                    onClick={() => handleSampleSelect('サム・アルトマン')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    サム・アルトマン
                                  </button>
                                  <button
                                    onClick={() => handleSampleSelect('ビル・ゲイツ')}
                                    className="px-3 py-1.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded-full transition-colors cursor-pointer border border-primary/20"
                                  >
                                    ビル・ゲイツ
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                          <p className="text-sm text-muted-foreground mt-3">
                            気になる{mode === 'company' ? '企業名' : '人名'}を下の入力欄に打ち込んでくださいね！
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      } mb-4`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-2 md:mr-3 mt-1 flex-shrink-0">
                          <img 
                            src="/avatar5.png" 
                            alt="Bond AI Assistant" 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] md:max-w-[75%] p-3 md:p-4 rounded-lg shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-white text-foreground border border-gray-100'
                        }`}
                      >
                        {msg.role === 'assistant' && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-xs font-medium text-muted-foreground">Bond</span>
                          </div>
                        )}
                        <div className="prose prose-sm max-w-none">
                          {msg.role === 'assistant'
                            ? renderMarkdownContent(msg.content)
                            : <div className="whitespace-pre-wrap">{msg.content}</div>
                          }
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {/* 最新の結果があれば ChatResultBubble を表示 */}
                {lastResult && messages.length > 0 && (
                  <ChatResultBubble result={lastResult} mode={mode} company={lastQuery || 'unknown'} />
                )}

                {companyCandidates.length > 0 && (
                  <div className="mb-6">
                    <CompanyCandidates
                      candidates={companyCandidates}
                      query={pendingSelectionQuery}
                      onSelect={handleCompanySelection}
                    />
                  </div>
                )}

                {/* Satisfaction Survey */}
                {showSatisfactionSurvey && !satisfactionAnswered && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                        <img
                          src="/avatar5.png"
                          alt="Bond AI Assistant"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm max-w-[80%] md:max-w-[75%] border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-muted-foreground">Bond</span>
                        </div>
                        <div className="flex items-center gap-3 flex-nowrap text-sm mb-3">
                          <span>この調査に満足しましたか？</span>
                          <button
                            onClick={() => handleSatisfactionResponse(true)}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                          >
                            YES
                          </button>
                          <button
                            onClick={() => handleSatisfactionResponse(false)}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium text-sm whitespace-nowrap"
                          >
                            NO
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Feedback Input */}
                {showFeedbackInput && (
                  <div className="flex justify-start mb-4">
                    <div className="flex items-start gap-2 w-full max-w-[85%]">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0">
                        <img
                          src="/avatar5.png"
                          alt="Bond AI Assistant"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-white p-4 rounded-lg shadow-sm flex-1 border border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-medium text-muted-foreground">Bond</span>
                        </div>
                        <textarea
                          value={feedbackText}
                          onChange={(e) => setFeedbackText(e.target.value)}
                          placeholder="改善してほしい点を具体的に教えてください..."
                          className="w-full p-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary bg-background text-sm"
                          rows={3}
                        />
                        <div className="flex justify-end mt-3">
                          <button
                            onClick={handleFeedbackSubmit}
                            disabled={!feedbackText.trim()}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            送信
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
          {loading && (
            <div className="flex justify-start mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden mr-2 md:mr-3 flex-shrink-0 mt-1">
                <img
                  src="/avatar5.png"
                  alt="Bond AI Assistant"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-4 max-w-full md:max-w-[85%]">
                <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                  <SimpleStep step={step} />
                  <div className="mt-4">
                    <RotatingMessage />
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form - 下部固定（ChatGPT風） */}
        <div className="flex-shrink-0 border-t border-border/30 bg-background/90 backdrop-blur-sm p-4">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* 絞り込みフィルター（企業検索モードの場合のみ表示） */}
            {mode === 'company' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="w-full"
                >
                  <div className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 ${
                    showFilters
                      ? 'bg-gradient-to-r from-pink-400/90 to-rose-400/90 text-white shadow-md shadow-pink-300/20'
                      : 'bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/20 dark:to-rose-950/20 hover:from-pink-100 hover:to-rose-100 dark:hover:from-pink-950/30 dark:hover:to-rose-950/30 border border-pink-200/60 dark:border-pink-800/40'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        showFilters
                          ? 'bg-white/20'
                          : 'bg-pink-200/50 dark:bg-pink-800/30'
                      }`}>
                        <Filter className={`w-4 h-4 ${showFilters ? 'text-white' : 'text-pink-500 dark:text-pink-400'}`} />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${showFilters ? 'text-white' : 'text-pink-700 dark:text-pink-300'}`}>
                            🔍 絞り込みオプション
                          </p>
                          {(categoryKeyword || regionKeyword) && (
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                              showFilters
                                ? 'bg-white/20 text-white'
                                : 'bg-pink-200/70 text-pink-600 dark:bg-pink-800/50 dark:text-pink-300'
                            }`}>
                              {[categoryKeyword, regionKeyword].filter(Boolean).length}件設定中
                            </span>
                          )}
                        </div>
                        <p className={`text-xs ${showFilters ? 'text-white/80' : 'text-pink-500 dark:text-pink-400'}`}>
                          業界・地域で検索精度UP
                        </p>
                      </div>
                    </div>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-300 ${
                      showFilters ? 'bg-white/20 rotate-180' : 'bg-pink-200/50 dark:bg-pink-800/30'
                    }`}>
                      <ChevronDown className={`w-4 h-4 ${showFilters ? 'text-white' : 'text-pink-500 dark:text-pink-400'}`} />
                    </div>
                  </div>
                </button>

                {showFilters && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-gradient-to-br from-pink-50/80 to-rose-50/80 dark:from-pink-950/20 dark:to-rose-950/20 rounded-xl border border-pink-200/40 dark:border-pink-800/30">
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-pink-600 dark:text-pink-400">
                        <Tag className="w-3.5 h-3.5" />
                        カテゴリ/業界
                      </label>
                      <input
                        type="text"
                        value={categoryKeyword}
                        onChange={(e) => setCategoryKeyword(e.target.value)}
                        placeholder="例: 医療系スタートアップ, SaaS, ヘルスケア"
                        className="w-full h-10 px-3 text-sm rounded-lg border border-pink-200/60 dark:border-pink-800/40 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400"
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-xs font-medium text-pink-600 dark:text-pink-400">
                        <MapPin className="w-3.5 h-3.5" />
                        地域/市場
                      </label>
                      <input
                        type="text"
                        value={regionKeyword}
                        onChange={(e) => setRegionKeyword(e.target.value)}
                        placeholder="例: 日本, 米国, 東証グロース"
                        className="w-full h-10 px-3 text-sm rounded-lg border border-pink-200/60 dark:border-pink-800/40 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-400/40 focus:border-pink-400"
                        disabled={loading}
                      />
                    </div>
                    {(categoryKeyword || regionKeyword) && (
                      <div className="sm:col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setCategoryKeyword('');
                            setRegionKeyword('');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-pink-500 dark:text-pink-400 hover:bg-pink-100/50 dark:hover:bg-pink-900/30 rounded-lg transition-colors"
                        >
                          ✕ クリア
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <InputBar
              value={query}
              setValue={setQuery}
              loading={loading}
              onSubmit={() => handleSubmit()}
              placeholder={
                showSatisfactionSurvey || showFeedbackInput
                  ? '満足度調査に回答してください'
                  : mode === null
                  ? 'まず上でカテゴリを選んでください'
                  : `${mode === 'company' ? '会社' : '人物'}名を入力...`
              }
              disabled={mode === null || showSatisfactionSurvey || showFeedbackInput}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
