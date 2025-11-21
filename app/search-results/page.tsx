'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Clock, Building2, FileText, ExternalLink, Filter } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';

interface SearchResult {
  id: string;
  query: string;
  company: string;
  answer: string;
  metadata?: any;
  createdAt: string;
}

export default function SearchResultsPage() {
  const { user } = useAuth();
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (user) {
      fetchSearchResults();
    }
  }, [user]);

  const fetchSearchResults = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/search-results?limit=50', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSearchResults(data.searchResults);
        }
      }
    } catch (error) {
      console.error('Error fetching search results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = searchResults.filter(result => {
    if (!filter) return true;
    return result.query.toLowerCase().includes(filter.toLowerCase()) ||
           result.company.toLowerCase().includes(filter.toLowerCase()) ||
           result.answer.toLowerCase().includes(filter.toLowerCase());
  });

  const groupedResults = filteredResults.reduce((acc, result) => {
    const date = new Date(result.createdAt).toLocaleDateString('ja-JP');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ログインが必要です</h2>
          <p className="text-gray-600 mb-4">検索履歴を表示するにはログインしてください</p>
          <Link href="/login">
            <Button>ログインする</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">検索履歴</h1>
                <p className="text-gray-600 mt-2">
                  過去の検索結果を確認・管理
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {searchResults.length} 件の検索
                </Badge>
              </div>
            </div>

            {/* Search Filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="検索履歴を絞り込み..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Content */}
          {filteredResults.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {filter ? '検索条件に一致する結果がありません' : '検索履歴がありません'}
              </h3>
              <p className="text-gray-600 mb-4">
                {filter ? '別のキーワードで試してみてください' : '企業や人物を検索してみましょう'}
              </p>
              {!filter && (
                <Link href="/search">
                  <Button>
                    <Search className="w-4 h-4 mr-2" />
                    検索を開始
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedResults)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, results]) => (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-4">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
                      <Badge variant="secondary" className="ml-2">
                        {results.length}件
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {results.map((result) => (
                        <Card key={result.id} className="hover:shadow-lg transition-all duration-300">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-base font-semibold text-gray-900 mb-2">
                                  <div className="flex items-center gap-2">
                                    <Search className="w-4 h-4 text-blue-600" />
                                    <span className="truncate">{result.query}</span>
                                  </div>
                                </CardTitle>
                                <div className="flex items-center gap-2">
                                  <Building2 className="w-3 h-3 text-gray-500" />
                                  <span className="text-sm text-gray-600">{result.company}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-xs shrink-0 ml-2">
                                {new Date(result.createdAt).toLocaleTimeString('ja-JP', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="text-sm text-gray-700 mb-4 line-clamp-4 leading-relaxed overflow-hidden">
                              <ReactMarkdown className="prose prose-sm max-w-none whitespace-pre-wrap">
                                {result.answer}
                              </ReactMarkdown>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-gray-500">
                                  {result.answer.length}文字の回答
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/company/${result.company.toLowerCase()}`}
                                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                  企業詳細
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // 検索ページに結果を渡して再表示
                                    const searchUrl = `/search?query=${encodeURIComponent(result.query)}&company=${encodeURIComponent(result.company)}`;
                                    window.open(searchUrl, '_blank');
                                  }}
                                  className="text-xs"
                                >
                                  再検索
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}