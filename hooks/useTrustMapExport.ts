"use client";

import { useRef, useState, useCallback } from "react";
import { toPng } from "html-to-image";

type UseTrustMapExportOptions = {
  /** ダウンロードファイル名のプレフィックス */
  fileNamePrefix?: string;
  /** 識別子（ユーザーIDや会社IDなど） */
  identifier?: string;
  /** 画像の背景色（デフォルト: 白） */
  backgroundColor?: string;
  /** 画像のピクセル比（デフォルト: 2） */
  pixelRatio?: number;
};

type UseTrustMapExportReturn = {
  /** 画像化対象のDOM要素に付与するref */
  ref: React.RefObject<HTMLDivElement | null>;
  /** PNG画像としてエクスポートしダウンロードする関数 */
  exportAsPng: () => Promise<void>;
  /** エクスポート処理中かどうか */
  isExporting: boolean;
  /** エラーメッセージ（あれば） */
  error: string | null;
};

/**
 * トラストマップをPNG画像としてエクスポートするためのカスタムフック
 */
export function useTrustMapExport(
  options: UseTrustMapExportOptions = {}
): UseTrustMapExportReturn {
  const {
    fileNamePrefix = "bond_trustmap",
    identifier,
    backgroundColor = "#FFFAF5", // bond-cream カラー
    pixelRatio = 2,
  } = options;

  const ref = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateFileName = useCallback((): string => {
    const date = new Date();
    const dateStr = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("");

    const parts = [fileNamePrefix];
    if (identifier) {
      parts.push(identifier);
    }
    parts.push(dateStr);

    return `${parts.join("_")}.png`;
  }, [fileNamePrefix, identifier]);

  const exportAsPng = useCallback(async (): Promise<void> => {
    if (!ref.current) {
      setError("エクスポート対象の要素が見つかりません");
      return;
    }

    setIsExporting(true);
    setError(null);

    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor,
        pixelRatio,
        cacheBust: true,
        // foreignObject内の画像をクロスオリジンで取得するための設定
        fetchRequestInit: {
          mode: "cors",
        },
      });

      // ダウンロードリンクを作成して自動クリック
      const link = document.createElement("a");
      link.download = generateFileName();
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Trust map export error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "画像のエクスポートに失敗しました"
      );
    } finally {
      setIsExporting(false);
    }
  }, [backgroundColor, pixelRatio, generateFileName]);

  return {
    ref,
    exportAsPng,
    isExporting,
    error,
  };
}
