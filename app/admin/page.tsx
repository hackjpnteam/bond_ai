'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import {
  Users,
  Search,
  Star,
  TrendingUp,
  Building2,
  UserCircle,
  RefreshCw,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Loader2,
  Shield,
  BarChart3,
  Eye,
  Download,
  Link2
} from 'lucide-react';

interface Stats {
  users: {
    total: number;
    last7Days: number;
    last30Days: number;
    growth: Array<{ _id: string; count: number }>;
  };
  evaluations: {
    total: number;
    last7Days: number;
    last30Days: number;
    growth: Array<{ _id: string; count: number }>;
    topEvaluators: Array<{ _id: string; count: number; user: any }>;
  };
  connections: {
    total: number;
    last7Days: number;
    last30Days: number;
  };
  searches: {
    total: number;
    last7Days: number;
    last30Days: number;
    popular: Array<{ _id: { query: string; mode: string }; count: number }>;
  };
  content: {
    companies: number;
    people: number;
  };
}

interface User {
  _id: string;
  name: string;
  email: string;
  company?: string;
  role: string;
  image?: string;
  createdAt: string;
  connectionCount: number;
  evaluationCount: number;
  isAdmin?: boolean;
}

interface SearchRecord {
  _id: string;
  userId: string;
  query: string;
  mode: string;
  createdAt: string;
  user: { name: string; email: string };
}

interface EvaluationRecord {
  _id: string;
  userId: string;
  companyName: string;
  companySlug: string;
  rating: number;
  comment?: string;
  createdAt: string;
  isAnonymous: boolean;
  user: { name: string; email: string };
}

type Tab = 'overview' | 'users' | 'searches' | 'evaluations';

export default function AdminPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [searches, setSearches] = useState<SearchRecord[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ページネーション
  const [userPage, setUserPage] = useState(1);
  const [userTotal, setUserTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [evalPage, setEvalPage] = useState(1);
  const [evalTotal, setEvalTotal] = useState(0);

  // フィルター
  const [userSearch, setUserSearch] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [evalFilter, setEvalFilter] = useState('');

  const limit = 20;

  // CSVエクスポート
  const handleExportCSV = async (type: 'users' | 'evaluations' | 'searches' | 'connections' | 'stats') => {
    try {
      const res = await fetch(`/api/admin/export?type=${type}`);
      if (!res.ok) throw new Error('エクスポートに失敗しました');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 統計を取得
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin');
      if (!res.ok) {
        if (res.status === 403) {
          router.push('/mypage');
          return;
        }
        throw new Error('統計の取得に失敗しました');
      }
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [router]);

  // ユーザー一覧を取得
  const fetchUsers = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: userPage.toString(),
        limit: limit.toString(),
        search: userSearch
      });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('ユーザー一覧の取得に失敗しました');
      const data = await res.json();
      setUsers(data.users);
      setUserTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.message);
    }
  }, [userPage, userSearch]);

  // 検索履歴を取得
  const fetchSearches = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: searchPage.toString(),
        limit: limit.toString(),
        search: searchFilter
      });
      const res = await fetch(`/api/admin/searches?${params}`);
      if (!res.ok) throw new Error('検索履歴の取得に失敗しました');
      const data = await res.json();
      setSearches(data.searches);
      setSearchTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.message);
    }
  }, [searchPage, searchFilter]);

  // 評価一覧を取得
  const fetchEvaluations = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: evalPage.toString(),
        limit: limit.toString(),
        search: evalFilter
      });
      const res = await fetch(`/api/admin/evaluations?${params}`);
      if (!res.ok) throw new Error('評価一覧の取得に失敗しました');
      const data = await res.json();
      setEvaluations(data.evaluations);
      setEvalTotal(data.pagination.total);
    } catch (err: any) {
      setError(err.message);
    }
  }, [evalPage, evalFilter]);

  // 初期ロード
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push('/login');
      return;
    }

    const load = async () => {
      setLoading(true);
      await fetchStats();
      setLoading(false);
    };
    load();
  }, [authLoading, user, router, fetchStats]);

  // タブ切り替え時のデータ取得
  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'searches') fetchSearches();
    else if (activeTab === 'evaluations') fetchEvaluations();
  }, [activeTab, fetchUsers, fetchSearches, fetchEvaluations]);

  // ユーザー削除
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`本当に ${userName} を削除しますか？関連データもすべて削除されます。`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchUsers();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 評価削除
  const handleDeleteEvaluation = async (evalId: string) => {
    if (!confirm('本当にこの評価を削除しますか？')) return;

    try {
      const res = await fetch('/api/admin/evaluations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evaluationId: evalId })
      });
      if (!res.ok) throw new Error('削除に失敗しました');
      fetchEvaluations();
      fetchStats();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">管理者ダッシュボード</h1>
              <p className="text-sm text-gray-500">サービス全体の統計と管理</p>
            </div>
          </div>
        </div>
      </div>

      {/* タブ */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: '概要', icon: BarChart3 },
              { id: 'users', label: 'ユーザー', icon: Users },
              { id: 'searches', label: '検索履歴', icon: Search },
              { id: 'evaluations', label: '評価', icon: Star }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 概要タブ */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* エクスポートボタン */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Download className="w-5 h-5" />
                データエクスポート
              </h3>
              <p className="text-sm text-gray-500 mb-4">各データをCSV形式でダウンロードできます</p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleExportCSV('stats')}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  統計サマリー
                </button>
                <button
                  onClick={() => handleExportCSV('users')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  ユーザー一覧
                </button>
                <button
                  onClick={() => handleExportCSV('evaluations')}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Star className="w-4 h-4" />
                  評価一覧
                </button>
                <button
                  onClick={() => handleExportCSV('searches')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  検索履歴
                </button>
                <button
                  onClick={() => handleExportCSV('connections')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  つながり一覧
                </button>
              </div>
            </div>

            {/* メイン統計 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={Users}
                label="総ユーザー数"
                value={stats.users.total}
                sub={`+${stats.users.last7Days} (7日)`}
              />
              <StatCard
                icon={Star}
                label="総評価数"
                value={stats.evaluations.total}
                sub={`+${stats.evaluations.last7Days} (7日)`}
              />
              <StatCard
                icon={TrendingUp}
                label="つながり数"
                value={stats.connections.total}
                sub={`+${stats.connections.last7Days} (7日)`}
              />
              <StatCard
                icon={Search}
                label="総検索数"
                value={stats.searches.total}
                sub={`+${stats.searches.last7Days} (7日)`}
              />
            </div>

            {/* コンテンツ統計 */}
            <div className="grid grid-cols-2 gap-4">
              <StatCard icon={Building2} label="登録会社数" value={stats.content.companies} />
              <StatCard icon={UserCircle} label="登録人物数" value={stats.content.people} />
            </div>

            {/* 人気検索ワード */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Search className="w-5 h-5" />
                人気検索ワード
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {stats.searches.popular.map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <span className="truncate">{s._id.query}</span>
                    <span className="text-gray-500 ml-2">{s.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 評価ランキング */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" />
                評価投稿ランキング
              </h3>
              <div className="space-y-2">
                {stats.evaluations.topEvaluators.map((e, i) => (
                  <div key={e._id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-medium">{e.user?.name || '不明'}</span>
                      <span className="text-sm text-gray-500">{e.user?.email}</span>
                    </div>
                    <span className="font-bold text-primary">{e.count}件</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ユーザータブ */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="名前、メール、会社で検索..."
                value={userSearch}
                onChange={e => {
                  setUserSearch(e.target.value);
                  setUserPage(1);
                }}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button onClick={fetchUsers} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleExportCSV('users')}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">会社</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">役割</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">つながり</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">評価</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">登録日</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(user => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {user.image ? (
                            <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserCircle className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium flex items-center gap-2">
                              {user.name}
                              {user.isAdmin && (
                                <span className="px-1.5 py-0.5 bg-primary text-white text-xs rounded">Admin</span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{user.company || '-'}</td>
                      <td className="px-4 py-3 text-sm">{user.role}</td>
                      <td className="px-4 py-3 text-center text-sm">{user.connectionCount}</td>
                      <td className="px-4 py-3 text-center text-sm">{user.evaluationCount}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                          disabled={user.isAdmin}
                          title={user.isAdmin ? '管理者は削除できません' : '削除'}
                        >
                          <Trash2 className={`w-4 h-4 ${user.isAdmin ? 'opacity-30' : ''}`} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={userPage}
              total={userTotal}
              limit={limit}
              onPageChange={setUserPage}
            />
          </div>
        )}

        {/* 検索履歴タブ */}
        {activeTab === 'searches' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="検索ワードで絞り込み..."
                value={searchFilter}
                onChange={e => {
                  setSearchFilter(e.target.value);
                  setSearchPage(1);
                }}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button onClick={fetchSearches} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleExportCSV('searches')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ユーザー</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">検索ワード</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">モード</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {searches.map(search => (
                    <tr key={search._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{search.user?.name || '不明'}</div>
                        <div className="text-sm text-gray-500">{search.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 font-medium">{search.query}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          search.mode === 'company' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {search.mode === 'company' ? '会社' : '人物'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(search.createdAt).toLocaleString('ja-JP')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={searchPage}
              total={searchTotal}
              limit={limit}
              onPageChange={setSearchPage}
            />
          </div>
        )}

        {/* 評価タブ */}
        {activeTab === 'evaluations' && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="会社名、コメントで検索..."
                value={evalFilter}
                onChange={e => {
                  setEvalFilter(e.target.value);
                  setEvalPage(1);
                }}
                className="flex-1 px-4 py-2 border rounded-lg"
              />
              <button onClick={fetchEvaluations} className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                <RefreshCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleExportCSV('evaluations')}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
              >
                <Download className="w-4 h-4" />
                CSV
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">投稿者</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">対象</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">評価</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">コメント</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {evaluations.map(evaluation => (
                    <tr key={evaluation._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {evaluation.isAnonymous ? '匿名' : evaluation.user?.name || '不明'}
                        </div>
                        {!evaluation.isAnonymous && (
                          <div className="text-sm text-gray-500">{evaluation.user?.email}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={`/company/${evaluation.companySlug}`}
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          {evaluation.companyName}
                        </a>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          {evaluation.rating}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm max-w-xs truncate">{evaluation.comment || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(evaluation.createdAt).toLocaleDateString('ja-JP')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleDeleteEvaluation(evaluation._id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={evalPage}
              total={evalTotal}
              limit={limit}
              onPageChange={setEvalPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// 統計カード
function StatCard({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: any;
  label: string;
  value: number;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5 text-primary" />
        <span className="text-sm text-gray-600">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      {sub && <div className="text-sm text-green-600 mt-1">{sub}</div>}
    </div>
  );
}

// ページネーション
function Pagination({
  page,
  total,
  limit,
  onPageChange
}: {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-500">
        {total}件中 {(page - 1) * limit + 1}〜{Math.min(page * limit, total)}件
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <span className="px-3 py-1">{page} / {totalPages}</span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
