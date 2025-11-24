"use client";

import React, { useState } from "react";
import { Download, Loader2, Share2, Check } from "lucide-react";
import BondHeartGraph from "@/components/BondHeartGraph";
import { useTrustMapExport } from "@/hooks/useTrustMapExport";
import { toPng } from "html-to-image";

// BondHeartGraph の props 型を再定義（既存コンポーネントを変更せず透過）
interface Node {
  id: string;
  reviewCount: number;
  isCenter?: boolean;
  type: "person" | "org";
  imageUrl?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link {
  source: string | Node;
  target: string | Node;
  strength: number;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

interface BondHeartGraphProps {
  data: GraphData;
  width?: number;
  height?: number;
  centerMode?: "logo" | "avatar";
}

// ShareableTrustMap 固有の追加 props
interface ShareableTrustMapOwnProps {
  /** ラッパ div に適用するクラス名 */
  className?: string;
  /** ダウンロードファイル名の識別子（例: userId） */
  identifier?: string;
  /** 画像保存ボタンを非表示にする（feature flag 以外での制御用） */
  hideExportButton?: boolean;
}

export type ShareableTrustMapProps = BondHeartGraphProps & ShareableTrustMapOwnProps;

// Feature flag: 環境変数で制御
const TRUSTMAP_SHARE_ENABLED =
  process.env.NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED === "true";

/**
 * BondHeartGraph をラップし、画像エクスポート機能を追加するコンポーネント
 * - 既存の BondHeartGraph の振る舞いは一切変更しない
 * - feature flag が OFF の場合はボタンを表示しない
 */
export default function ShareableTrustMap({
  data,
  width = 800,
  height = 600,
  centerMode = "logo",
  className,
  identifier,
  hideExportButton = false,
}: ShareableTrustMapProps) {
  const { ref, exportAsPng, isExporting, error } = useTrustMapExport({
    fileNamePrefix: "bond_trustmap",
    identifier,
  });
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isXSharing, setIsXSharing] = useState(false);

  const showExportButton = TRUSTMAP_SHARE_ENABLED && !hideExportButton;

  // シェア機能
  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = '信頼ネットワーク - Bond';

    // Web Share APIが使える場合（主にモバイル）
    if (typeof navigator !== 'undefined' && navigator.share) {
      setIsSharing(true);
      try {
        await navigator.share({
          title: shareText,
          url: shareUrl,
        });
      } catch (err) {
        // ユーザーがキャンセルした場合など
        console.log('Share cancelled or failed');
      } finally {
        setIsSharing(false);
      }
    } else {
      // クリップボードにコピー
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  // シェア用URL（OGP画像付き）を生成
  const getShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const baseUrl = window.location.origin;
    // identifierがある場合はシェア専用URLを使用（動的OGP画像付き）
    if (identifier) {
      return `${baseUrl}/trust-map/share/${identifier}`;
    }
    return window.location.href;
  };

  // X（Twitter）にシェア
  const handleXShare = async () => {
    setIsXSharing(true);
    try {
      const shareUrl = getShareUrl();
      const shareText = encodeURIComponent('私の信頼ネットワーク #Bond');
      const encodedUrl = encodeURIComponent(shareUrl);

      window.open(
        `https://twitter.com/intent/tweet?text=${shareText}&url=${encodedUrl}`,
        '_blank',
        'width=550,height=420'
      );
    } catch (err) {
      console.error('Failed to share to X:', err);
    } finally {
      setIsXSharing(false);
    }
  };

  return (
    <div className={className}>
      {/* 画像化対象のコンテナ */}
      <div
        ref={ref}
        className="relative"
        style={{ backgroundColor: "#FFFAF5" }}
      >
        <BondHeartGraph
          data={data}
          width={width}
          height={height}
          centerMode={centerMode}
        />
        {/* 画像に含めるウォーターマーク（オプション） */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-400 opacity-60 pointer-events-none">
          Powered by Bond
        </div>
      </div>

      {/* エクスポート・シェアボタン */}
      {showExportButton && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={exportAsPng}
            disabled={isExporting}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                画像で保存
              </>
            )}
          </button>
          <button
            onClick={handleXShare}
            disabled={isXSharing}
            className="inline-flex items-center rounded-lg border border-black bg-black px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isXSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                準備中...
              </>
            ) : (
              <>
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                X でシェア
              </>
            )}
          </button>
          <button
            onClick={handleShare}
            disabled={isSharing}
            className="inline-flex items-center rounded-lg border border-blue-500 bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSharing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                シェア中...
              </>
            ) : copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                コピーしました
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                URLをコピー
              </>
            )}
          </button>
          {error && (
            <span className="text-sm text-red-600">{error}</span>
          )}
        </div>
      )}
    </div>
  );
}
