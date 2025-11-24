/**
 * Bond テキスト整形ユーティリティ
 * 会社概要などの長文テキストを読みやすいMarkdown/HTML形式に整形する
 */

export interface FormattedSection {
  type: 'heading1' | 'heading2' | 'heading3' | 'paragraph' | 'list' | 'divider';
  content: string;
  items?: string[]; // list type の場合のみ使用
}

/**
 * 生テキストを構造化されたセクションに分割する
 */
export function parseTextToSections(raw: string | null | undefined): FormattedSection[] {
  if (!raw || raw.trim() === '') {
    return [];
  }

  // JSONブロックやコードブロックを除去
  let cleanText = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .replace(/^\s*\{[\s\S]*?"answer"\s*:\s*"/i, '') // JSON wrapper removal
    .replace(/"\s*\}[\s\S]*$/i, ''); // JSON closing

  // エスケープされた改行を実際の改行に変換
  cleanText = cleanText.replace(/\\n/g, '\n');

  const sections: FormattedSection[] = [];
  const lines = cleanText.split('\n');

  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim();
      if (text) {
        sections.push({ type: 'paragraph', content: text });
      }
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({ type: 'list', content: '', items: [...currentList] });
      currentList = [];
    }
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 空行は段落区切り
    if (!trimmedLine) {
      flushList();
      flushParagraph();
      continue;
    }

    // 区切り線 (--- or ===)
    if (/^[-=]{3,}$/.test(trimmedLine)) {
      flushList();
      flushParagraph();
      sections.push({ type: 'divider', content: '' });
      continue;
    }

    // 見出し1 (# または絵文字付きタイトル)
    if (/^#\s+/.test(trimmedLine) || /^[📘📗📙📕🏢💼]\s*.+/.test(trimmedLine)) {
      flushList();
      flushParagraph();
      const content = trimmedLine.replace(/^#\s+/, '').trim();
      sections.push({ type: 'heading1', content });
      continue;
    }

    // 見出し2 (## または数字+ピリオド)
    if (/^##\s+/.test(trimmedLine) || /^\d+\.\s+[^a-z]/.test(trimmedLine)) {
      flushList();
      flushParagraph();
      const content = trimmedLine
        .replace(/^##\s+/, '')
        .replace(/^\d+\.\s+/, '')
        .trim();
      sections.push({ type: 'heading2', content });
      continue;
    }

    // 見出し3 (###)
    if (/^###\s+/.test(trimmedLine)) {
      flushList();
      flushParagraph();
      const content = trimmedLine.replace(/^###\s+/, '').trim();
      sections.push({ type: 'heading3', content });
      continue;
    }

    // 箇条書き (-, *, ・, •)
    if (/^[-*・•]\s+/.test(trimmedLine)) {
      flushParagraph();
      const content = trimmedLine.replace(/^[-*・•]\s+/, '').trim();
      currentList.push(content);
      continue;
    }

    // 通常の段落
    flushList();
    currentParagraph.push(trimmedLine);
  }

  // 残りをフラッシュ
  flushList();
  flushParagraph();

  return sections;
}

/**
 * テキストがJSON形式かどうかを判定
 */
export function isJsonString(str: string): boolean {
  try {
    const parsed = JSON.parse(str);
    return typeof parsed === 'object' && parsed !== null;
  } catch {
    return false;
  }
}

/**
 * JSONからanswerフィールドを抽出
 */
export function extractAnswerFromJson(jsonStr: string): string {
  try {
    const parsed = JSON.parse(jsonStr);
    if (parsed.answer) {
      return parsed.answer;
    }
    return jsonStr;
  } catch {
    // JSON解析失敗時は正規表現でanswerを抽出
    try {
      // エスケープされた改行を含むJSON文字列からanswerを抽出
      const match = jsonStr.match(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
      if (match && match[1]) {
        // エスケープシーケンスを戻す
        return match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\r/g, '\r')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\');
      }
    } catch {
      // 正規表現も失敗
    }
    return jsonStr;
  }
}

/**
 * テキストを整形して返す（JSONの場合はanswerを抽出）
 */
export function normalizeOverviewText(raw: string | null | undefined): string {
  if (!raw || raw.trim() === '') {
    return '';
  }

  let text = raw.trim();

  // ```json ... ``` ブロックを除去
  text = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
  text = text.trim();

  // JSONの場合はanswerを抽出
  if (text.startsWith('{') && text.endsWith('}')) {
    text = extractAnswerFromJson(text);
  }

  // JSON内のanswer抽出（部分的なJSON形式の場合）
  const answerMatch = text.match(/"answer"\s*:\s*"([\s\S]*?)"\s*[,}]/);
  if (answerMatch && answerMatch[1]) {
    text = answerMatch[1];
  }

  // エスケープされた改行を変換
  text = text.replace(/\\n/g, '\n');

  // Bondレポートのメタデータ行を除去（作成者、Bondページなど）
  // 日付のみ残す
  text = text.replace(/\*作成[：:][^*]*\*/g, '');
  text = text.replace(/\*Bond\s*ページ[：:][^*]*\*/g, '');
  text = text.replace(/\*日付[：:]\s*(\d{4}-\d{2}-\d{2})\*/g, '作成日: $1');

  // 連続する改行を2つに正規化
  text = text.replace(/\n{3,}/g, '\n\n');

  // 先頭・末尾の余分な空白を除去
  text = text.trim();

  return text;
}

/**
 * セクション数からおおよその行数を計算
 */
export function estimateLineCount(sections: FormattedSection[]): number {
  let count = 0;
  for (const section of sections) {
    switch (section.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        count += 1;
        break;
      case 'paragraph':
        // 長い段落は複数行としてカウント
        count += Math.ceil(section.content.length / 50);
        break;
      case 'list':
        count += section.items?.length || 0;
        break;
      case 'divider':
        count += 1;
        break;
    }
  }
  return count;
}
