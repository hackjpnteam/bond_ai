'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, User, Building2, TrendingUp, ExternalLink, Share2, BookmarkPlus, Edit3, Save, X, History, Clock, Search, Copy, FileDown, Check, Pencil, Briefcase, GraduationCap, Award, Globe, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';
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

interface SourceInfo {
  url: string;
  title?: string;
  published_at?: string;
}

interface PersonData {
  id: string;
  name: string;
  slug: string;
  nameKana?: string;
  title?: string;
  company?: string;
  companySlug?: string;
  position?: string;
  biography: string;
  career?: string;
  education?: string;
  achievements?: string;
  expertise?: string[];
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    website?: string;
  };
  imageUrl?: string;
  searchCount: number;
  averageRating: number;
  sources?: SourceInfo[];
  editHistory?: EditHistoryEntry[];
  createdAt: string;
  updatedAt: string;
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

export default function PersonPage() {
  const params = useParams();
  const personSlug = params.slug as string;
  const personName = decodeURIComponent(personSlug);

  const [personData, setPersonData] = useState<PersonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Wiki編集用の状態
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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
    // Check if saved
    const savedItems = localStorage.getItem('bond_saved_persons');
    if (savedItems) {
      try {
        const items = JSON.parse(savedItems);
        setIsSaved(items.includes(personName.toLowerCase()));
      } catch (e) {
        console.error('Error parsing saved items:', e);
      }
    }

    const loadPersonData = async () => {
      try {
        const response = await fetch(`/api/person/${encodeURIComponent(personSlug)}`, {
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setPersonData(data);
        } else if (response.status === 404) {
          setError('人物が見つかりません');
        } else {
          setError('人物情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('Error fetching person data:', err);
        setError('人物情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    loadPersonData();
  }, [personSlug, personName]);

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
            }`}
          />
        ))}
      </div>
    );
  };

  const handleSaveEdit = async () => {
    if (typeof window === 'undefined') return;

    try {
      const nameElement = document.getElementById('edit-name') as HTMLInputElement;
      const titleElement = document.getElementById('edit-title') as HTMLInputElement;
      const companyElement = document.getElementById('edit-company') as HTMLInputElement;
      const positionElement = document.getElementById('edit-position') as HTMLInputElement;
      const biographyElement = document.getElementById('edit-biography') as HTMLTextAreaElement;
      const careerElement = document.getElementById('edit-career') as HTMLTextAreaElement;
      const educationElement = document.getElementById('edit-education') as HTMLTextAreaElement;
      const achievementsElement = document.getElementById('edit-achievements') as HTMLTextAreaElement;
      const reasonElement = document.getElementById('edit-reason') as HTMLInputElement;

      const newData = {
        biography: biographyElement?.value.trim() || personData?.biography,
        career: careerElement?.value.trim(),
        education: educationElement?.value.trim(),
        achievements: achievementsElement?.value.trim(),
        title: titleElement?.value.trim(),
        company: companyElement?.value.trim(),
        position: positionElement?.value.trim(),
        editReason: reasonElement?.value.trim() || '情報更新',
        editorId: currentUser?.id || 'anonymous'
      };

      const response = await fetch(`/api/person/${encodeURIComponent(personSlug)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newData)
      });

      if (response.ok) {
        const data = await response.json();
        setPersonData(data.person);
        setIsEditing(false);
        alert('人物情報を保存しました');
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
      title: `${personData?.name} - Bond`,
      text: `${personData?.name}のプロフィールを見る`,
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

  // 保存機能
  const handleSave = () => {
    const savedItems = localStorage.getItem('bond_saved_persons');
    let items: string[] = [];

    try {
      if (savedItems) {
        items = JSON.parse(savedItems);
      }
    } catch (e) {
      console.error('Error parsing saved items:', e);
    }

    if (isSaved) {
      items = items.filter(item => item !== personName.toLowerCase());
    } else {
      items.push(personName.toLowerCase());
    }

    localStorage.setItem('bond_saved_persons', JSON.stringify(items));
    setIsSaved(!isSaved);
  };

  // レポートをクリップボードにコピー
  const handleCopyReport = async () => {
    if (!personData) return;

    const reportText = `# ${personData.name} - 人物レポート

## 基本情報
- 氏名: ${personData.name}
- 肩書き: ${personData.title || '不明'}
- 所属: ${personData.company || '不明'}
- 役職: ${personData.position || '不明'}

## プロフィール
${personData.biography || '情報なし'}

## キャリア
${personData.career || '情報なし'}

## 学歴
${personData.education || '情報なし'}

## 主な実績
${personData.achievements || '情報なし'}

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
    if (!personData) return;

    const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${personData.name} - 人物レポート</title>
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
    .section {
      background: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
      white-space: pre-wrap;
    }
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #888;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${personData.name}</h1>

  <h2>基本情報</h2>
  <table class="info-table">
    <tr><td>肩書き</td><td>${personData.title || '不明'}</td></tr>
    <tr><td>所属</td><td>${personData.company || '不明'}</td></tr>
    <tr><td>役職</td><td>${personData.position || '不明'}</td></tr>
  </table>

  <h2>プロフィール</h2>
  <div class="section">${personData.biography?.replace(/\n/g, '<br>') || '情報なし'}</div>

  ${personData.career ? `
  <h2>キャリア</h2>
  <div class="section">${personData.career.replace(/\n/g, '<br>')}</div>
  ` : ''}

  ${personData.education ? `
  <h2>学歴</h2>
  <div class="section">${personData.education.replace(/\n/g, '<br>')}</div>
  ` : ''}

  ${personData.achievements ? `
  <h2>主な実績</h2>
  <div class="section">${personData.achievements.replace(/\n/g, '<br>')}</div>
  ` : ''}

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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error || !personData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-screen-xl mx-auto px-4 md:px-6 py-8">
          <div className="text-center">
            <p className="text-gray-600 mb-4">{error || '人物データが見つかりません'}</p>
            <Link href="/search" className="text-blue-600 hover:underline">
              検索ページへ戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* ヘッダー */}
        <div className="bg-white border-b border-border">
          <div className="container max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6">
            {/* スマホ: 縦並び、PC: 横並び */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 bg-primary/10 rounded-full flex items-center justify-center overflow-hidden">
                  {personData.imageUrl ? (
                    <img
                      src={personData.imageUrl}
                      alt={`${personData.name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/avatar5.png';
                        e.currentTarget.onerror = null;
                      }}
                    />
                  ) : (
                    <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">{personData.name}</h1>
                  <p className="text-sm sm:text-base text-gray-600 truncate">
                    {personData.title || personData.position || ''}
                    {personData.company && ` @ ${personData.company}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-bond-pink border-bond-pink hover:bg-bond-pink hover:text-white px-2 sm:px-3"
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
                <h3 className="text-lg font-medium mb-4">人物情報を編集</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">肩書き</label>
                    <input
                      id="edit-title"
                      type="text"
                      defaultValue={personData.title || ''}
                      placeholder="例: CEO、代表取締役"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">所属企業</label>
                    <input
                      id="edit-company"
                      type="text"
                      defaultValue={personData.company || ''}
                      placeholder="例: 株式会社サンプル"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">役職</label>
                    <input
                      id="edit-position"
                      type="text"
                      defaultValue={personData.position || ''}
                      placeholder="例: 代表取締役社長"
                      className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">プロフィール・経歴</label>
                  <textarea
                    id="edit-biography"
                    defaultValue={personData.biography}
                    placeholder="プロフィールを入力してください"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={4}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">キャリア</label>
                  <textarea
                    id="edit-career"
                    defaultValue={personData.career || ''}
                    placeholder="キャリア履歴を入力してください"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">学歴</label>
                  <textarea
                    id="edit-education"
                    defaultValue={personData.education || ''}
                    placeholder="学歴を入力してください"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={2}
                  />
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium">主な実績</label>
                  <textarea
                    id="edit-achievements"
                    defaultValue={personData.achievements || ''}
                    placeholder="主な実績を入力してください"
                    className="w-full mt-1 px-3 py-2 border border-input bg-background rounded-md text-sm"
                    rows={3}
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

            {/* 検索回数 */}
            <div className="mt-4 sm:mt-6 flex flex-wrap items-center gap-3 sm:gap-6">
              <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <TrendingUp className="w-4 h-4" />
                <span>{personData.searchCount}回検索</span>
              </div>
              {personData.averageRating > 0 && (
                <div className="flex items-center gap-2">
                  {renderStars(Math.round(personData.averageRating))}
                  <span className="text-base sm:text-lg font-semibold">{personData.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="container max-w-screen-xl mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* メインコンテンツ */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* プロフィール */}
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <User className="w-5 h-5" />
                      プロフィール
                    </CardTitle>
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
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {personData.biography}
                    </p>
                  </div>

                  {/* 編集履歴表示 */}
                  {showHistory && personData.editHistory && personData.editHistory.length > 0 && (
                    <div className="mt-6 border-t pt-4">
                      <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        編集履歴
                      </h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {personData.editHistory
                          .slice()
                          .reverse()
                          .map((entry, index) => (
                          <div key={index} className="border border-border rounded-lg p-3 text-sm">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                {getUserDisplayName(entry.editor)}
                              </span>
                              <span className="text-gray-600 text-xs">
                                {new Date(entry.editedAt || '').toLocaleDateString('ja-JP', {
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
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* キャリア */}
              {personData.career && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Briefcase className="w-5 h-5" />
                      キャリア
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {personData.career}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 学歴 */}
              {personData.education && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <GraduationCap className="w-5 h-5" />
                      学歴
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {personData.education}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 主な実績 */}
              {personData.achievements && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Award className="w-5 h-5" />
                      主な実績
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {personData.achievements}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 参考サイト */}
              {personData.sources && personData.sources.length > 0 && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                      参考サイト
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      この人物情報の作成時に参照したウェブサイト
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <div className="space-y-2 sm:space-y-3">
                      {personData.sources.slice(0, 10).map((source, index) => (
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
            </div>

            {/* サイドバー */}
            <div className="space-y-4 sm:space-y-6">
              {/* 基本情報 */}
              <Card className="overflow-hidden">
                <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                  <CardTitle className="text-base sm:text-lg">基本情報</CardTitle>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 py-3 sm:py-4 space-y-3">
                  {personData.title && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-0.5">肩書き</Badge>
                      <span className="text-sm">{personData.title}</span>
                    </div>
                  )}
                  {personData.company && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-0.5">所属</Badge>
                      <span className="text-sm">
                        {personData.companySlug ? (
                          <Link href={`/company/${personData.companySlug}`} className="text-primary hover:underline">
                            {personData.company}
                          </Link>
                        ) : (
                          personData.company
                        )}
                      </span>
                    </div>
                  )}
                  {personData.position && (
                    <div className="flex items-start gap-2">
                      <Badge variant="outline" className="text-xs mt-0.5">役職</Badge>
                      <span className="text-sm">{personData.position}</span>
                    </div>
                  )}
                  {personData.expertise && personData.expertise.length > 0 && (
                    <div>
                      <Badge variant="outline" className="text-xs mb-2">専門分野</Badge>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {personData.expertise.map((exp, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {exp}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ソーシャルリンク */}
              {personData.socialLinks && (personData.socialLinks.twitter || personData.socialLinks.linkedin || personData.socialLinks.website) && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">リンク</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4 space-y-2">
                    {personData.socialLinks.website && (
                      <a
                        href={personData.socialLinks.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Globe className="w-4 h-4" />
                        ウェブサイト
                      </a>
                    )}
                    {personData.socialLinks.twitter && (
                      <a
                        href={personData.socialLinks.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Twitter className="w-4 h-4" />
                        Twitter
                      </a>
                    )}
                    {personData.socialLinks.linkedin && (
                      <a
                        href={personData.socialLinks.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Linkedin className="w-4 h-4" />
                        LinkedIn
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* 所属企業へのリンク */}
              {personData.company && (
                <Card className="overflow-hidden">
                  <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
                    <CardTitle className="text-base sm:text-lg">所属企業</CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6 py-3 sm:py-4">
                    <Link
                      href={`/company/${personData.companySlug || personData.company.toLowerCase().replace(/\s+/g, '-')}`}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center overflow-hidden">
                        <img
                          src={`/api/company-logo/${encodeURIComponent(personData.companySlug || personData.company.toLowerCase().replace(/\s+/g, '-'))}`}
                          alt={`${personData.company} ロゴ`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/bond-logo.png';
                            e.currentTarget.onerror = null;
                          }}
                        />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{personData.company}</p>
                        <p className="text-xs text-gray-600">企業ページを見る</p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
  );
}
