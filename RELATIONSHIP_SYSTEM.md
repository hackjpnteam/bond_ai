# 関係性システム - 完全リニューアル

## 概要

Bondアプリケーションの関係性表示システムを完全に再設計しました。シンプルで一貫性のあるデータモデルと、明確なAPI設計により、バグのない実装を実現しています。

## システム設計

### データモデル

**MongoDB (evaluations コレクション)**
```typescript
{
  relationshipType: number  // 0-4の数値
  // 0: 未設定
  // 1: 知人
  // 2: 取引先
  // 3: 協業先
  // 4: 投資家
}
```

**API レスポンス**
```typescript
{
  relationshipType: number       // データベースの値 (0-4)
  relationshipLabel: string      // 日本語ラベル ("投資家" など)
}
```

**UIコンポーネント**
- `relationshipLabel` を直接表示
- 数値から文字列への変換は `getRelationshipLabel()` を使用

## ファイル構成

### コアファイル

1. **`lib/relationship.ts`** - 中央ユーティリティ
   - `getRelationshipLabel(type)` - 数値→ラベル変換
   - `getRelationshipColor(type)` - カラークラス取得
   - `RELATIONSHIP_OPTIONS` - フォーム選択肢
   - `RELATIONSHIP_TYPES` - 定数

2. **`models/Evaluation.ts`** - MongoDB スキーマ
   - `relationshipType: number` フィールド (0-4, required)

3. **API エンドポイント**
   - `app/api/evaluations/route.ts` - 評価の CRUD
   - `app/api/timeline/route.ts` - タイムライン取得

4. **UI コンポーネント**
   - `components/ChatResultBubble.tsx` - チャット検索結果
   - `app/timeline/page.tsx` - タイムラインページ
   - `app/users/[username]/page.tsx` - ユーザープロフィール

## マッピング

| 数値 (relationshipType) | 日本語ラベル | カラー |
|------------------------|-----------|--------|
| 0 | 未設定 | gray |
| 1 | 知人 | blue |
| 2 | 取引先 | green |
| 3 | 協業先 | purple |
| 4 | 投資家 | orange |

## 使用方法

### API からのデータ取得

```typescript
// GET /api/evaluations
const response = await fetch('/api/evaluations?company=gigoo');
const data = await response.json();

// data.evaluations[0]の構造:
{
  relationshipType: 4,           // 数値
  relationshipLabel: "投資家",    // 日本語ラベル
  // ... その他のフィールド
}
```

### 評価の投稿

```typescript
// POST /api/evaluations
await fetch('/api/evaluations', {
  method: 'POST',
  body: JSON.stringify({
    relationshipType: 4,  // 数値を送信
    // ... その他のフィールド
  })
});
```

### UI での表示

```tsx
import { getRelationshipLabel } from '@/lib/relationship';

// パターン1: APIから relationshipLabel が返ってくる場合
<span>{evaluation.relationshipLabel}</span>

// パターン2: relationshipType から変換する場合
<span>{getRelationshipLabel(evaluation.relationshipType)}</span>
```

### フォームの実装

```tsx
import { RELATIONSHIP_OPTIONS } from '@/lib/relationship';

<select value={relationshipType} onChange={(e) => setRelationshipType(Number(e.target.value))}>
  <option value="">関係性を選択</option>
  {RELATIONSHIP_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

## データ移行

既存のデータを新システムに移行するには：

### 1. テストを実行

```bash
npx tsx scripts/test-relationship-system.ts
```

### 2. データベース移行を実行

```bash
npx tsx scripts/migrate-relationship-data.ts
```

このスクリプトは：
- 旧 `relationship` (string) フィールドを読み取り
- 新 `relationshipType` (number) フィールドに変換
- データの整合性を確認

### 3. 移行結果の確認

スクリプトが以下を表示します：
- 移行前のデータ分布
- 移行された件数
- 移行後の確認

## 旧システムからの変更点

### ❌ 削除されたもの

- `lib/relationship-utils.ts` - 複雑な優先度ベースの解決システム
- `relationship: string` フィールド (MongoDB)
- レガシー文字列値 ('shareholder', 'executive', など)
- 複雑な `resolveRelationshipDisplay()` 関数
- 互換性フィールド (`label`, `value`, `relationshipValue`)

### ✅ 新システムの利点

1. **シンプル** - 数値のみをDBに保存
2. **高速** - 変換ロジックが最小限
3. **型安全** - TypeScript で完全に型付け
4. **バグフリー** - ロジックが単純なのでバグが入りにくい
5. **保守性** - 1箇所だけを管理すればよい

## トラブルシューティング

### 「その他」や「未設定」が表示される

- データベースに `relationshipType` フィールドがあるか確認
- APIレスポンスに `relationshipLabel` が含まれているか確認
- マイグレーションスクリプトを実行したか確認

### TypeScript エラー

```bash
npm run build
```

で型エラーを確認してください。全てのコンポーネントが新しい型定義を使用している必要があります。

## 開発ガイドライン

### 新しい関係性タイプを追加する場合

1. `lib/relationship.ts` の定数を更新
   - `RELATIONSHIP_LABELS` にラベルを追加
   - `RELATIONSHIP_COLORS` に色を追加
   - `RELATIONSHIP_OPTIONS` に選択肢を追加
   - `RELATIONSHIP_TYPES` に定数を追加

2. スキーマを更新
   - `models/Evaluation.ts` の `max` 値を調整

3. テストを実行
   ```bash
   npx tsx scripts/test-relationship-system.ts
   ```

### ベストプラクティス

- ✅ **常に** `getRelationshipLabel()` を使用して変換
- ✅ API は **必ず** `relationshipLabel` を返す
- ✅ フォームは **必ず** 数値を送信
- ❌ 文字列の関係性値を **使用しない**
- ❌ 手動でマッピングを **作成しない**

## まとめ

新しい関係性システムは、シンプルで一貫性があり、拡張可能です。全てのデータは数値として保存され、表示時のみ日本語に変換されます。このアプローチにより、データの整合性が保証され、バグのリスクが最小化されます。
