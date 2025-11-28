/**
 * トラストマップをPNG画像として生成するクライアントサイド関数
 * 既存の「画像保存」機能と同じロジックを使用
 */
import { toPng } from "html-to-image";

type GenerateTrustmapPngOptions = {
  /** 画像化対象のDOM要素への参照 */
  element: HTMLElement;
  /** 画像の背景色（デフォルト: #FFFAF5） */
  backgroundColor?: string;
  /** 画像のピクセル比（デフォルト: 2） */
  pixelRatio?: number;
};

/**
 * DOM要素をPNG画像のFileオブジェクトとして生成する
 * 「画像保存」機能と同じhtml-to-imageライブラリを使用
 */
export async function generateTrustmapPngFromElement(
  options: GenerateTrustmapPngOptions
): Promise<File> {
  const {
    element,
    backgroundColor = "#FFFAF5", // bond-cream カラー
    pixelRatio = 2,
  } = options;

  // html-to-imageでdata URLを生成（既存の画像保存と同じ処理）
  const dataUrl = await toPng(element, {
    backgroundColor,
    pixelRatio,
    cacheBust: true,
    fetchRequestInit: {
      mode: "cors",
    },
  });

  // data URL -> Blob -> File に変換
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  const fileName = `trustmap-${Date.now()}.png`;
  const file = new File([blob], fileName, { type: "image/png" });

  return file;
}

/**
 * useTrustMapExportのrefから直接PNG Fileを生成するヘルパー
 */
export async function generateTrustmapPngFromRef(
  ref: React.RefObject<HTMLElement | null>,
  options?: Omit<GenerateTrustmapPngOptions, "element">
): Promise<File> {
  if (!ref.current) {
    throw new Error("Trust map element not found");
  }

  return generateTrustmapPngFromElement({
    element: ref.current,
    ...options,
  });
}
