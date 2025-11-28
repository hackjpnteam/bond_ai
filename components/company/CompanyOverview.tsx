'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FileText, Lock, LogIn } from 'lucide-react';
import { parseTextToSections, normalizeOverviewText, estimateLineCount, FormattedSection } from '@/lib/bond/formatText';
import Link from 'next/link';

interface CompanyOverviewProps {
  overview: string | null | undefined;
  maxSections?: number; // 折りたたみ前に表示するセクション数
  className?: string;
  isLoggedIn?: boolean; // ユーザーがログインしているかどうか
  loginCutoffSection?: string; // ログイン必須セクション（デフォルト: 市場ポジション）
}

/**
 * 会社概要を整形して表示するコンポーネント
 * - Markdown形式のテキストを自動整形
 * - 長文は折りたたみ表示
 * - Bond UIスタイルに対応
 * - ログインしていないユーザーには一部コンテンツを隠す
 */
export function CompanyOverview({
  overview,
  maxSections = 6,
  className = '',
  isLoggedIn = false,
  loginCutoffSection = '市場ポジション'
}: CompanyOverviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // テキストを正規化してセクションに分割
  const sections = useMemo(() => {
    const normalized = normalizeOverviewText(overview);
    return parseTextToSections(normalized);
  }, [overview]);

  // 「市場ポジション」セクションのインデックスを見つける
  const loginCutoffIndex = useMemo(() => {
    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];
      if (
        (section.type === 'heading1' || section.type === 'heading2' || section.type === 'heading3') &&
        section.content.includes(loginCutoffSection)
      ) {
        return i;
      }
    }
    // 見つからない場合はセクション数の半分あたりで区切る
    return Math.min(Math.floor(sections.length * 0.4), maxSections);
  }, [sections, loginCutoffSection, maxSections]);

  const estimatedLines = useMemo(() => estimateLineCount(sections), [sections]);

  // 空の場合
  if (!overview || sections.length === 0) {
    return (
      <div className={`bg-gray-50 rounded-xl p-6 text-center ${className}`}>
        <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500">会社概要情報はありません</p>
        <p className="text-gray-400 text-sm mt-1">検索を実行すると、AIが企業情報を収集・分析します</p>
      </div>
    );
  }

  // ログインしていない場合の表示ロジック
  const hasRestrictedContent = loginCutoffIndex < sections.length - 1;
  const shouldShowLoginGate = !isLoggedIn && hasRestrictedContent && !isExpanded;

  // 表示するセクション数を決定
  let displaySections: FormattedSection[];
  let hiddenSectionCount: number;
  let shouldTruncate: boolean;

  if (isLoggedIn) {
    // ログイン済み: 通常の折りたたみロジック
    shouldTruncate = sections.length > maxSections;
    displaySections = isExpanded ? sections : sections.slice(0, maxSections);
    hiddenSectionCount = sections.length - maxSections;
  } else {
    // 未ログイン: 市場ポジションまでのみ表示
    const limitIndex = Math.min(loginCutoffIndex + 1, sections.length);
    shouldTruncate = hasRestrictedContent;
    displaySections = isExpanded ? sections : sections.slice(0, limitIndex);
    hiddenSectionCount = sections.length - limitIndex;
  }

  return (
    <div className={`relative ${className}`}>
      <div className="space-y-4">
        {displaySections.map((section, index) => (
          <SectionRenderer key={index} section={section} />
        ))}
      </div>

      {/* 折りたたみ時のグラデーションオーバーレイ */}
      {shouldTruncate && !isExpanded && (
        <div className="absolute bottom-12 left-0 right-0 h-24 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
      )}

      {/* ログインゲート表示（未ログイン & 隠しコンテンツあり） */}
      {shouldShowLoginGate && (
        <div className="mt-4 p-6 bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-xl text-center">
          <Lock className="w-8 h-8 mx-auto text-bond-pink mb-3" />
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            詳細を見るにはログインが必要です
          </h4>
          <p className="text-sm text-gray-600 mb-4">
            市場ポジション、競合情報、将来展望などの詳細分析を閲覧するにはログインしてください
          </p>
          <div className="flex justify-center gap-3">
            <Link href="/login">
              <Button className="bg-bond-pink hover:bg-bond-pinkDark text-white shadow-md">
                <LogIn className="w-4 h-4 mr-2" />
                ログイン
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="outline" className="border-2 border-bond-pink text-bond-pink hover:bg-bond-pink hover:text-white bg-white shadow-md">
                新規登録
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            残り {hiddenSectionCount} セクションの詳細情報があります
          </p>
        </div>
      )}

      {/* ログイン済みユーザー向けの展開/折りたたみボタン */}
      {isLoggedIn && shouldTruncate && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="border-2 border-bond-pink text-bond-pink hover:bg-bond-pink hover:text-white transition-colors bg-white shadow-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                閉じる
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" />
                詳細を表示（残り{hiddenSectionCount}セクション）
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * 各セクションをレンダリングするコンポーネント
 */
function SectionRenderer({ section }: { section: FormattedSection }) {
  switch (section.type) {
    case 'heading1':
      return (
        <h2 className="text-xl font-bold text-gray-900 mt-6 mb-3 flex items-center gap-2">
          {section.content}
        </h2>
      );

    case 'heading2':
      return (
        <h3 className="text-lg font-semibold text-gray-800 mt-5 mb-2 pb-2 border-b border-gray-200">
          {section.content}
        </h3>
      );

    case 'heading3':
      return (
        <h4 className="text-base font-medium text-gray-800 mt-4 mb-2">
          {section.content}
        </h4>
      );

    case 'paragraph':
      return (
        <p className="text-gray-700 leading-relaxed">
          {section.content}
        </p>
      );

    case 'list':
      return (
        <ul className="space-y-2 ml-1">
          {section.items?.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-gray-700">
              <span className="text-bond-pink mt-1.5 text-xs">●</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      );

    case 'divider':
      return <hr className="my-6 border-gray-200" />;

    default:
      return null;
  }
}

export default CompanyOverview;
