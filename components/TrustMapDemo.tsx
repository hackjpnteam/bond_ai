'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Building2 } from 'lucide-react';

interface Connection {
  id: string;
  name: string;
  username?: string;
  company: string;
  role: string;
  image?: string;
  x: number;
  y: number;
  trustScore: number;
  relationship: string;
}

interface CompanyRelation {
  id: string;
  name: string;
  slug: string;
  type: string;
  logo?: string;
  x: number;
  y: number;
  rating: number;
  relationship: string;
}

interface CenterUser {
  id: string;
  name: string;
  username: string;
  image?: string;
  company: string;
  role: string;
  trustScore: number;
}

interface TrustMapData {
  centerUser: CenterUser;
  connections: Connection[];
  companyRelations: CompanyRelation[];
}

export function TrustMapDemo() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [animatedItems, setAnimatedItems] = useState<Set<string>>(new Set());
  const [data, setData] = useState<TrustMapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrustMapData();
  }, []);

  const fetchTrustMapData = async () => {
    try {
      const response = await fetch('/api/trustmap?username=hikarutomura');
      if (response.ok) {
        const trustMapData = await response.json();
        setData(trustMapData);
      }
    } catch (error) {
      console.error('Failed to fetch trust map:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!data) return;

    // アニメーション: 順番にアイテムを表示
    const allItems = [
      ...data.connections.map(c => c.id),
      ...data.companyRelations.map(c => c.id)
    ];

    let index = 0;
    const timer = setInterval(() => {
      if (index < allItems.length) {
        setAnimatedItems(prev => new Set(prev).add(allItems[index]));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 200);

    return () => clearInterval(timer);
  }, [data]);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'founder': return '起業家';
      case 'investor': return '投資家';
      case 'employee': return '会社員';
      case 'advisor': return 'アドバイザー';
      default: return '';
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0].charAt(0) + parts[1].charAt(0);
    }
    return name.charAt(0);
  };

  if (loading) {
    return (
      <section className="py-8 md:py-16 bg-gradient-to-b from-white to-ash-surface/30">
        <div className="w-full px-2 sm:px-4 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-72 sm:w-96 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <section className="py-8 md:py-16 bg-gradient-to-b from-white to-ash-surface/30 overflow-hidden">
      <div className="w-full">
        <div className="text-center mb-6 md:mb-10 px-4">
          <h2 className="mb-2 md:mb-4 text-xl sm:text-2xl md:text-3xl font-bold">信頼でつながるネットワーク</h2>
          <p className="max-w-2xl mx-auto leading-relaxed text-sm md:text-base text-ash-muted">
            信頼の可視化でビジネスをスケールさせましょう。
          </p>
        </div>

        {/* Trust Map Visualization */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative w-full aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/9] min-h-[280px] sm:min-h-[350px] md:min-h-[400px] bg-gradient-to-br from-white/80 to-ash-surface/50 rounded-xl sm:rounded-2xl border border-ash-line/50 shadow-lg overflow-hidden">
            {/* 背景のグリッド */}
            <div className="absolute inset-0 opacity-10">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            {/* 中心のユーザー */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="relative">
                {/* パルスエフェクト */}
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-bond-pink/20 rounded-full animate-ping" />
                <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-bond-pink/30 rounded-full animate-pulse" />

                {/* メインアバター */}
                <Link
                  href="/person/戸村光"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-gradient-to-br from-bond-pink to-bond-pinkDark rounded-full flex items-center justify-center shadow-xl border-3 sm:border-4 border-white overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                >
                  {data.centerUser.image ? (
                    <img
                      src={data.centerUser.image}
                      alt={data.centerUser.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-white font-bold text-base sm:text-lg md:text-xl">${getInitials(data.centerUser.name)}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-white font-bold text-base sm:text-lg md:text-xl">{getInitials(data.centerUser.name)}</span>
                  )}
                </Link>

                {/* 名前ラベル */}
                <div className="absolute -bottom-7 sm:-bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                  <span className="bg-white/90 backdrop-blur-sm px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs md:text-sm font-semibold text-gray-800 shadow-md border border-ash-line/50">
                    {data.centerUser.name}
                  </span>
                </div>

                {/* 信頼スコアバッジ */}
                <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 bg-green-500 text-white text-[10px] sm:text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow-lg">
                  {data.centerUser.trustScore}pts
                </div>
              </div>
            </div>

            {/* コネクションライン（SVG）- 画像/ロゴがあるノードのみ */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {/* ユーザーへのライン（画像があるもののみ） */}
              {data.connections.filter(conn => conn.image).map((conn) => {
                const isAnimated = animatedItems.has(conn.id);
                return (
                  <line
                    key={`line-user-${conn.id}`}
                    x1="50%"
                    y1="50%"
                    x2={`${conn.x}%`}
                    y2={`${conn.y}%`}
                    stroke={activeItem === conn.id ? '#C73B78' : '#E7D8CA'}
                    strokeWidth={activeItem === conn.id ? 3 : 2}
                    opacity={isAnimated ? (activeItem === conn.id ? 1 : 0.6) : 0}
                    className="transition-all duration-500"
                  />
                );
              })}
              {/* 会社へのライン（ロゴがあるもののみ） */}
              {data.companyRelations.filter(company => company.logo).map((company) => {
                const isAnimated = animatedItems.has(company.id);
                return (
                  <line
                    key={`line-company-${company.id}`}
                    x1="50%"
                    y1="50%"
                    x2={`${company.x}%`}
                    y2={`${company.y}%`}
                    stroke={activeItem === company.id ? '#3B82F6' : '#D1D5DB'}
                    strokeWidth={activeItem === company.id ? 3 : 1.5}
                    strokeDasharray="4,4"
                    opacity={isAnimated ? (activeItem === company.id ? 1 : 0.5) : 0}
                    className="transition-all duration-500"
                  />
                );
              })}
            </svg>

            {/* ユーザーコネクションノード（画像があるもののみ表示） */}
            {data.connections.filter(conn => conn.image).map((conn) => {
              const isAnimated = animatedItems.has(conn.id);
              const isActive = activeItem === conn.id;

              return (
                <div
                  key={conn.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${
                    isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                  style={{ left: `${conn.x}%`, top: `${conn.y}%`, zIndex: isActive ? 15 : 10 }}
                  onMouseEnter={() => setActiveItem(conn.id)}
                  onMouseLeave={() => setActiveItem(null)}
                  onClick={() => setActiveItem(isActive ? null : conn.id)}
                >
                  {/* ノード */}
                  <div className={`relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'bg-bond-pink border-white scale-110'
                      : 'bg-white border-ash-line hover:border-bond-pink'
                  }`}>
                    {conn.image ? (
                      <img
                        src={conn.image}
                        alt={conn.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className={`font-semibold text-xs sm:text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>
                        {conn.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* ホバー/タップ時の詳細（右側に表示） */}
                  {isActive && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-white rounded-lg shadow-xl p-2 sm:p-3 min-w-[120px] sm:min-w-[160px] border border-ash-line z-30">
                      <p className="font-bold text-xs sm:text-sm text-gray-900">{conn.name}</p>
                      {conn.company && <p className="text-[10px] sm:text-xs text-gray-500">{conn.company}</p>}
                      {conn.role && <p className="text-[10px] sm:text-xs text-gray-500">{getRoleLabel(conn.role)}</p>}
                      <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-ash-line flex items-center justify-between">
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-bond-pink/10 text-bond-pink font-medium">
                          {conn.relationship}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-green-600">
                          {conn.trustScore}点
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 会社ノード（ロゴがあるもののみ表示） */}
            {data.companyRelations.filter(company => company.logo).map((company) => {
              const isAnimated = animatedItems.has(company.id);
              const isActive = activeItem === company.id;

              return (
                <Link
                  key={company.id}
                  href={`/company/${company.slug}`}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-500 ${
                    isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                  }`}
                  style={{ left: `${company.x}%`, top: `${company.y}%`, zIndex: isActive ? 15 : 10 }}
                  onMouseEnter={() => setActiveItem(company.id)}
                  onMouseLeave={() => setActiveItem(null)}
                >
                  {/* ノード */}
                  <div className={`relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center shadow-lg border-2 transition-all duration-300 overflow-hidden ${
                    isActive
                      ? 'bg-blue-500 border-white scale-110'
                      : 'bg-white border-gray-200 hover:border-blue-400'
                  }`}>
                    {company.logo ? (
                      <img
                        src={company.logo}
                        alt={company.name}
                        className="w-full h-full object-contain p-0.5 sm:p-1"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <Building2 className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-gray-600'} ${company.logo ? 'hidden' : ''}`} />
                  </div>

                  {/* ホバー時の詳細（右側に表示） */}
                  {isActive && (
                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 bg-white rounded-lg shadow-xl p-2 sm:p-3 min-w-[110px] sm:min-w-[140px] border border-ash-line z-30">
                      <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">{company.name}</p>
                      <div className="mt-1.5 sm:mt-2 pt-1.5 sm:pt-2 border-t border-ash-line flex items-center justify-between gap-1">
                        <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium truncate">
                          {company.relationship}
                        </span>
                        <span className="text-[10px] sm:text-xs font-semibold text-yellow-600 whitespace-nowrap">
                          ★{company.rating}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}

            {/* 装飾的な円 */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 border border-dashed border-bond-pink/30 rounded-full" />
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 border border-dashed border-ash-line/50 rounded-full" />
          </div>

          {/* 統計と凡例 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 sm:mt-6 px-2">
            {/* 凡例 */}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-bond-pink" />
                <span className="text-[10px] sm:text-xs text-gray-600">ユーザー</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-lg bg-blue-500" />
                <span className="text-[10px] sm:text-xs text-gray-600">企業</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500" />
                <span className="text-[10px] sm:text-xs text-gray-600">高信頼</span>
              </div>
            </div>

            {/* 統計（画像/ロゴがあるノードのみカウント） */}
            <div className="flex gap-3 sm:gap-4">
              <div className="text-center px-3 sm:px-4 py-2 bg-white/80 rounded-lg border border-ash-line/50">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-bond-pink">{data.connections.filter(c => c.image).length}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">接続</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-2 bg-white/80 rounded-lg border border-ash-line/50">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600">{data.companyRelations.filter(c => c.logo).length}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">企業</div>
              </div>
              <div className="text-center px-3 sm:px-4 py-2 bg-white/80 rounded-lg border border-ash-line/50">
                <div className="text-lg sm:text-xl md:text-2xl font-bold text-green-600">{data.centerUser.trustScore}</div>
                <div className="text-[10px] sm:text-xs text-gray-500">スコア</div>
              </div>
            </div>
          </div>
        </div>

        {/* 信頼マップを作るボタン */}
        <div className="text-center mt-8 md:mt-12 px-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-bond-pink hover:bg-bond-pinkDark text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            信頼マップを作る
          </Link>
        </div>

        {/* 最適ルート例 */}
        <div className="max-w-3xl mx-auto mt-8 md:mt-12 px-4">
          <div className="text-center mb-4 md:mb-6">
            <h3 className="text-lg md:text-xl font-bold mb-2">AIが提案する最適ルート</h3>
            <p className="text-xs md:text-sm text-ash-muted">目標企業への最短・最適なアプローチを自動で可視化</p>
          </div>

          <div className="card p-4 md:p-6 border-l-4 border-l-blue-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 mb-3 md:mb-4">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md border px-2.5 py-0.5 font-semibold text-xs bg-blue-100 text-blue-800">
                  最適ルート
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1">
                  <span className="font-medium text-emerald-600">効率 95%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium px-1.5 md:px-2 py-0.5 md:py-1 rounded text-green-600 bg-green-50">成功率 90%</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="font-medium text-purple-600">約3日</span>
                </div>
              </div>
            </div>

            {/* モバイル: 縦並び, デスクトップ: 横並び */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3 py-2">
              {/* あなた */}
              <div className="flex-shrink-0 text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mb-1 mx-auto shadow-lg shadow-blue-200 ring-2 ring-blue-100">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-white">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div className="text-xs font-medium text-gray-700">あなた</div>
              </div>

              {/* アニメーション付きルート矢印1 - モバイル:縦向き, デスクトップ:横向き */}
              <div className="flex-shrink-0 h-8 sm:h-auto sm:w-20 flex items-center justify-center">
                {/* モバイル用縦向き矢印 */}
                <div className="sm:hidden relative flex flex-col items-center h-full w-2">
                  <div className="absolute inset-0 flex justify-center">
                    <div className="w-0.5 h-full bg-gradient-to-b from-blue-300 via-purple-300 to-purple-400 rounded-full opacity-40"></div>
                  </div>
                  <div className="absolute h-2 w-2 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-lg shadow-purple-300 animate-[moveDown_1.5s_ease-in-out_infinite]"></div>
                  <div className="absolute bottom-0 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-purple-500"></div>
                </div>
                {/* デスクトップ用横向き矢印 */}
                <div className="hidden sm:block relative w-full h-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-gradient-to-r from-blue-300 via-purple-300 to-purple-400 rounded-full opacity-40"></div>
                  </div>
                  <div className="absolute h-2 w-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg shadow-purple-300 animate-[moveRight_1.5s_ease-in-out_infinite]"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-purple-500"></div>
                </div>
              </div>

              {/* 仲介者 */}
              <Link href="/person/戸村光" className="flex-shrink-0 text-center hover:scale-105 transition-transform">
                <div className="relative mb-1 inline-block">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-purple-400 shadow-lg shadow-purple-200 ring-2 ring-purple-100">
                    <img
                      src={data?.centerUser.image || '/default-avatar.png'}
                      alt="戸村 光"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md border-2 border-white">
                    <span className="text-white text-[10px] font-bold">★</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-gray-800">戸村 光</div>
                <div className="text-[10px] text-purple-600 font-semibold">株主</div>
                <div className="flex items-center justify-center gap-0.5 mt-0.5">
                  <span className="text-[10px] font-medium text-yellow-600">★ 4.8</span>
                </div>
              </Link>

              {/* アニメーション付きルート矢印2 - モバイル:縦向き, デスクトップ:横向き */}
              <div className="flex-shrink-0 h-8 sm:h-auto sm:w-20 flex items-center justify-center">
                {/* モバイル用縦向き矢印 */}
                <div className="sm:hidden relative flex flex-col items-center h-full w-2">
                  <div className="absolute inset-0 flex justify-center">
                    <div className="w-0.5 h-full bg-gradient-to-b from-purple-300 via-emerald-300 to-emerald-400 rounded-full opacity-40"></div>
                  </div>
                  <div className="absolute h-2 w-2 bg-gradient-to-b from-purple-500 to-emerald-500 rounded-full shadow-lg shadow-emerald-300 animate-[moveDown_1.5s_ease-in-out_infinite_0.5s]"></div>
                  <div className="absolute bottom-0 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[8px] border-t-emerald-500"></div>
                </div>
                {/* デスクトップ用横向き矢印 */}
                <div className="hidden sm:block relative w-full h-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="h-0.5 w-full bg-gradient-to-r from-purple-300 via-emerald-300 to-emerald-400 rounded-full opacity-40"></div>
                  </div>
                  <div className="absolute h-2 w-2 bg-gradient-to-r from-purple-500 to-emerald-500 rounded-full shadow-lg shadow-emerald-300 animate-[moveRight_1.5s_ease-in-out_infinite_0.5s]"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px] border-l-emerald-500"></div>
                </div>
              </div>

              {/* 目標企業 */}
              <Link href="/company/east-ventures" className="flex-shrink-0 text-center hover:scale-105 transition-transform">
                <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-1 mx-auto border-3 border-emerald-400 shadow-lg shadow-emerald-200 ring-2 ring-emerald-100 overflow-hidden p-1">
                  <img
                    src="/api/company-logo/east%20ventures"
                    alt="East Ventures"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-xs font-bold text-emerald-700">East Ventures</div>
                <div className="text-[10px] text-gray-600">目標企業</div>
              </Link>
            </div>

            <div className="mt-4 md:mt-5 pt-4 md:pt-5 border-t border-gray-100">
              <div className="grid grid-cols-4 gap-2 md:gap-4 text-center">
                <div>
                  <div className="text-base md:text-lg font-bold text-blue-600">4.8</div>
                  <div className="text-[10px] md:text-xs text-gray-600">信頼スコア</div>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-green-600">90%</div>
                  <div className="text-[10px] md:text-xs text-gray-600">成功確率</div>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-purple-600">3日</div>
                  <div className="text-[10px] md:text-xs text-gray-600">予想期間</div>
                </div>
                <div>
                  <div className="text-base md:text-lg font-bold text-orange-600">1人</div>
                  <div className="text-[10px] md:text-xs text-gray-600">経由人数</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-6 sm:mt-8 px-4">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-bond-pink hover:bg-bond-pinkDark text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-full transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            最適ルートを見つける
          </Link>
        </div>
      </div>
    </section>
  );
}
