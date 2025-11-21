# 関係性システム - クイックスタートガイド

## ✅ 完了しました

関係性システムが完全に新しくなりました！

## 🎯 新システムの特徴

### シンプルな設計

```typescript
// データベース
relationshipType: number  // 0, 1, 2, 3, 4

// 表示
0 → 未設定
1 → 知人
2 → 取引先
3 → 協業先
4 → 投資家
```

## 📦 使い方

### 1. フォームで関係性を選択

```tsx
import { RELATIONSHIP_OPTIONS } from '@/lib/relationship';

<select value={relationshipType} onChange={(e) => setRelationshipType(Number(e.target.value))}>
  {RELATIONSHIP_OPTIONS.map((option) => (
    <option key={option.value} value={option.value}>
      {option.label}
    </option>
  ))}
</select>
```

### 2. APIで数値を送信

```typescript
await fetch('/api/evaluations', {
  method: 'POST',
  body: JSON.stringify({
    relationshipType: 4,  // 投資家
    // ... その他
  })
});
```

### 3. UIで表示

```tsx
import { getRelationshipLabel } from '@/lib/relationship';

// APIレスポンスに relationshipLabel がある場合
<span>{evaluation.relationshipLabel}</span>

// または relationshipType から変換
<span>{getRelationshipLabel(evaluation.relationshipType)}</span>
```

## 🚀 開発サーバー起動中

```
Local: http://localhost:3002
```

以下の画面で関係性が正しく表示されることを確認してください：

1. **チャット検索** → 企業を検索 → 評価を投稿
2. **タイムライン** → `/timeline` で評価一覧を確認
3. **ユーザープロフィール** → `/users/[username]` で関係性を確認

## 📚 詳細ドキュメント

- [`RELATIONSHIP_SYSTEM.md`](RELATIONSHIP_SYSTEM.md) - 完全なシステム設計
- [`MIGRATION_COMPLETE.md`](MIGRATION_COMPLETE.md) - 移行完了レポート

## 🛠 ファイル一覧

### 新規作成
- `lib/relationship.ts` ⭐ メインユーティリティ
- `scripts/migrate-relationship-data.ts` - データ移行
- `scripts/test-relationship-system.ts` - テスト

### 完全書き直し
- `app/api/evaluations/route.ts` - 評価API
- `app/api/timeline/route.ts` - タイムラインAPI
- `components/ChatResultBubble.tsx` - チャットUI
- `app/timeline/page.tsx` - タイムラインページ

### 更新
- `models/Evaluation.ts` - スキーマ
- `app/users/[username]/page.tsx` - ユーザーページ

## ✨ テスト結果

```bash
npx tsx scripts/test-relationship-system.ts
```

```
🎉 全てのテストが成功しました！
成功: 7/7
失敗: 0/7
```

## 💡 トラブルシューティング

### 関係性が「未設定」と表示される

新しい評価を投稿すると、正しく保存されます。既存データがある場合は：

```bash
npx tsx scripts/migrate-relationship-data.ts
```

### APIエラーが発生する

1. MongoDB接続を確認
2. `.env.local` の設定を確認
3. サーバーログを確認

## 📞 サポート

詳細は [`RELATIONSHIP_SYSTEM.md`](RELATIONSHIP_SYSTEM.md) を参照してください。

---

**ステータス**: ✅ 完了
**開発サーバー**: 起動中 (http://localhost:3002)
**次のステップ**: アプリケーションで評価を投稿してテスト
