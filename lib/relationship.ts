/**
 * 関係性システム - シンプルで一貫性のある実装
 *
 * データベース: relationshipType (number 0-6)
 * 表示: 日本語ラベル
 */

// 関係性タイプの定義
export const RELATIONSHIP_TYPES = {
  UNSET: 0,      // 未設定
  ACQUAINTANCE: 1, // 知人
  CLIENT: 2,     // 取引先
  PARTNER: 3,    // 協業先
  INVESTOR: 4,   // 投資先
  SHAREHOLDER: 5, // 株主
  FRIEND: 6      // 友達
} as const;

// 日本語ラベルマッピング
const RELATIONSHIP_LABELS: Record<number, string> = {
  0: '未設定',
  1: '知人',
  2: '取引先',
  3: '協業先',
  4: '投資先',
  5: '株主',
  6: '友達'
};

// カラークラスマッピング
const RELATIONSHIP_COLORS: Record<number, string> = {
  0: 'bg-gray-100 text-gray-600',
  1: 'bg-blue-100 text-blue-700',
  2: 'bg-green-100 text-green-700',
  3: 'bg-purple-100 text-purple-700',
  4: 'bg-orange-100 text-orange-700',
  5: 'bg-pink-100 text-pink-700',
  6: 'bg-cyan-100 text-cyan-700'
};

/**
 * 関係性タイプを日本語ラベルに変換
 */
export function getRelationshipLabel(type: number | null | undefined): string {
  if (type === null || type === undefined) {
    return '未設定';
  }
  return RELATIONSHIP_LABELS[type] || '未設定';
}

/**
 * 関係性タイプのカラークラスを取得
 */
export function getRelationshipColor(type: number | null | undefined): string {
  if (type === null || type === undefined) {
    return RELATIONSHIP_COLORS[0];
  }
  return RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS[0];
}

/**
 * フォーム用の選択肢リスト
 */
export const RELATIONSHIP_OPTIONS = [
  { value: 0, label: '未設定' },
  { value: 1, label: '知人' },
  { value: 2, label: '取引先' },
  { value: 3, label: '協業先' },
  { value: 4, label: '投資先' },
  { value: 5, label: '株主' },
  { value: 6, label: '友達' }
];
