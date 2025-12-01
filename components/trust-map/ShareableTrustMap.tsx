"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Loader2, Share2, Check, ZoomIn, ZoomOut } from "lucide-react";
import BondHeartGraph from "@/components/BondHeartGraph";
import { useTrustMapExport } from "@/hooks/useTrustMapExport";
import { toPng } from "html-to-image";
import { generateTrustmapPngFromRef } from "@/lib/client/generateTrustmapPng";

// モバイル判定用hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

// レスポンシブサイズ計算用hook
function useResponsiveGraphSize(baseWidth: number, baseHeight: number) {
  const [size, setSize] = useState({ width: baseWidth, height: baseHeight });

  const calculateSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const isMobile = windowWidth < 640;

    if (isMobile) {
      // モバイル: 画面幅いっぱいに、縦長を最大限活用
      const graphWidth = windowWidth - 24; // 左右12pxずつのパディング
      // 縦長を活用: 画面高さの70%を使用（ヘッダー・フッター分を除く）
      const availableHeight = windowHeight * 0.7;
      // 最小でも幅の1.3倍、最大で利用可能な高さまで
      const graphHeight = Math.max(graphWidth * 1.3, Math.min(availableHeight, windowHeight - 200));
      setSize({ width: graphWidth, height: Math.max(graphHeight, 450) });
    } else {
      // デスクトップ: 元のサイズを維持
      setSize({ width: baseWidth, height: baseHeight });
    }
  }, [baseWidth, baseHeight]);

  useEffect(() => {
    calculateSize();
    window.addEventListener('resize', calculateSize);
    return () => window.removeEventListener('resize', calculateSize);
  }, [calculateSize]);

  return size;
}

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
  nodeScale?: number;
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
  const [isXSharing, setIsXSharing] = useState(false);
  const [isFacebookSharing, setIsFacebookSharing] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const isMobile = useIsMobile();
  const responsiveSize = useResponsiveGraphSize(width, height);

  // 実際に使用するサイズ（モバイルはレスポンシブ、デスクトップは元のサイズ）
  const actualWidth = isMobile ? responsiveSize.width : width;
  const actualHeight = isMobile ? responsiveSize.height : height;

  // ズーム機能
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const showExportButton = TRUSTMAP_SHARE_ENABLED && !hideExportButton;

  // URLコピー機能
  const handleCopyUrl = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
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

  // PNG画像をアップロードしてOGP画像を更新し、shareUrlを取得
  const uploadSnapshotAndGetShareUrl = async (): Promise<{ shareUrl: string; file: File } | null> => {
    if (!identifier || !ref.current) {
      console.error('identifier or ref not available');
      return null;
    }

    try {
      // 1. クライアント側でPNG生成（画像保存と同じロジック）
      const file = await generateTrustmapPngFromRef(ref);

      // 2. サーバーにアップロード
      const formData = new FormData();
      formData.append('file', file);
      formData.append('userId', identifier);

      const res = await fetch('/api/trustmap/snapshot', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        console.error('Failed to upload snapshot');
        return null;
      }

      const data = await res.json();
      return { shareUrl: data.shareUrl as string, file };
    } catch (err) {
      console.error('Error uploading snapshot:', err);
      return null;
    }
  };

  // X（Twitter）にシェア（画像アップロード付き）
  const handleXShare = async () => {
    setIsXSharing(true);
    try {
      // 1. スナップショットをアップロード
      const result = await uploadSnapshotAndGetShareUrl();
      const shareUrl = result?.shareUrl || getShareUrl();
      const file = result?.file;

      const text = 'Bondで作った私のトラストマップ #bond #信頼マップ';

      // 2. Web Share API Level 2 が使える場合（ファイル共有対応）
      if (file && typeof navigator !== 'undefined' && 'share' in navigator) {
        try {
          // @ts-expect-error canShare は一部ブラウザのみ
          const canShareFiles = typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
          if (canShareFiles) {
            // @ts-expect-error
            await navigator.share({
              title: 'Bond Trust Map',
              text,
              files: [file],
              url: shareUrl,
            });
            return;
          }
        } catch (e) {
          console.log('Web Share with files not supported, falling back to intent');
        }
      }

      // 3. フォールバック: Twitter intent URL（OGP画像がプレビューに出る）
      const shareText = encodeURIComponent(text);
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

  // Facebookにシェア（画像アップロード付き）
  const handleFacebookShare = async () => {
    setIsFacebookSharing(true);
    try {
      // 1. スナップショットをアップロード
      const result = await uploadSnapshotAndGetShareUrl();
      const shareUrl = result?.shareUrl || getShareUrl();

      // 2. Facebook Share URL を開く（OGP画像が表示される）
      const encodedUrl = encodeURIComponent(shareUrl);
      const quote = encodeURIComponent('Bondで作った私のトラストマップ #bond #信頼マップ');

      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${quote}`,
        '_blank',
        'width=550,height=420'
      );
    } catch (err) {
      console.error('Failed to share to Facebook:', err);
    } finally {
      setIsFacebookSharing(false);
    }
  };

  return (
    <div className={`${className || ''} bg-bond-cream`}>
      {/* ズームボタン（モバイル・デスクトップ共通） */}
      <div className="flex items-center justify-end gap-2 mb-2">
        <span className="text-xs text-gray-500">ノードサイズ: {Math.round(zoomLevel * 100)}%</span>
        <button
          onClick={handleZoomOut}
          disabled={zoomLevel <= 0.5}
          className="p-1.5 sm:p-2 rounded-lg bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="縮小"
        >
          <ZoomOut className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoomLevel >= 2}
          className="p-1.5 sm:p-2 rounded-lg bg-white border border-gray-300 shadow-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="拡大"
        >
          <ZoomIn className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
        </button>
      </div>

      {/* 画像化対象のコンテナ */}
      <div
        className={`relative w-full bg-bond-cream ${isMobile ? 'overflow-auto' : ''}`}
        style={{
          maxHeight: isMobile ? `${actualHeight}px` : undefined,
        }}
      >
        <div
          ref={ref}
          className="relative mx-auto bg-bond-cream"
          style={{
            width: actualWidth,
            height: actualHeight,
            transformOrigin: 'top left',
          }}
        >
          <BondHeartGraph
            data={data}
            width={actualWidth}
            height={actualHeight}
            centerMode={centerMode}
            nodeScale={zoomLevel}
          />
          {/* 画像に含めるウォーターマーク（オプション） */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 opacity-60 pointer-events-none">
            Powered by Bond
          </div>
        </div>
      </div>

      {/* エクスポート・シェアボタン */}
      {showExportButton && (
        <div className="mt-4 pb-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 bg-bond-cream">
          <button
            onClick={exportAsPng}
            disabled={isExporting}
            className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs sm:text-sm sm:px-4 font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">生成中...</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Download className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">画像で保存</span>
                <span className="sm:hidden">保存</span>
              </>
            )}
          </button>
          <button
            onClick={handleXShare}
            disabled={isXSharing}
            className="inline-flex items-center rounded-lg border border-black bg-black px-3 py-2 text-xs sm:text-sm sm:px-4 font-medium text-white shadow-sm transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isXSharing ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">準備中...</span>
              </>
            ) : (
              <>
                <svg className="mr-1 sm:mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="hidden sm:inline">X でシェア</span>
                <span className="sm:hidden">X</span>
              </>
            )}
          </button>
          <button
            onClick={handleFacebookShare}
            disabled={isFacebookSharing}
            className="inline-flex items-center rounded-lg border border-[#1877F2] bg-[#1877F2] px-3 py-2 text-xs sm:text-sm sm:px-4 font-medium text-white shadow-sm transition-colors hover:bg-[#166FE5] focus:outline-none focus:ring-2 focus:ring-[#1877F2] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isFacebookSharing ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-4 w-4 animate-spin" />
                <span className="hidden sm:inline">準備中...</span>
              </>
            ) : (
              <>
                <svg className="mr-1 sm:mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="hidden sm:inline">Facebook</span>
                <span className="sm:hidden">FB</span>
              </>
            )}
          </button>
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center rounded-lg border border-blue-500 bg-blue-500 px-3 py-2 text-xs sm:text-sm sm:px-4 font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {copied ? (
              <>
                <Check className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">コピーしました</span>
                <span className="sm:hidden">OK</span>
              </>
            ) : (
              <>
                <Share2 className="mr-1 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">URLをコピー</span>
                <span className="sm:hidden">URL</span>
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
