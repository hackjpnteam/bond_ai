# Vercel Blob Storage セットアップガイド

## 問題
ロゴアップロードで500エラーが発生する

## 原因
Vercelの本番環境では、ファイルシステムが読み取り専用のため、`public/logos` にファイルを保存できません。

## 解決策
Vercel Blob Storageを使用してファイルをクラウドに保存します。

---

## セットアップ手順

### 1. Vercel Dashboard でBlob Storageを有効化

1. **Vercel Dashboard** にアクセス
   https://vercel.com/dashboard

2. プロジェクト `bondai-mu` を選択

3. **Storage** タブに移動

4. **Create Database** → **Blob** を選択

5. データベース名を入力（例: `bond-uploads`）

6. **Create** をクリック

7. **Connect Store to Project** で `bondai-mu` を選択

8. **Connect** をクリック

これで自動的に環境変数 `BLOB_READ_WRITE_TOKEN` が設定されます。

### 2. 環境変数の確認

Vercel Dashboard → Settings → Environment Variables で以下が設定されていることを確認：

- `BLOB_READ_WRITE_TOKEN` - Vercel Blobから自動設定

### 3. ローカル環境でのテスト

`.env.local` に以下を追加（ローカル開発用）：

```bash
# Vercel Blobのトークン（Vercel Dashboardから取得）
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

**トークンの取得方法**:
1. Vercel Dashboard → Storage → bond-uploads
2. **Settings** タブ
3. **Read & Write Token** をコピー

### 4. デプロイ

```bash
git add .
git commit -m "Fix logo upload using Vercel Blob"
git push origin main
```

Vercelが自動的に再デプロイします。

---

## 変更内容

### 修正前 (ファイルシステムに保存)
```typescript
// public/logos にファイルを保存
const uploadDir = path.join(process.cwd(), 'public', 'logos');
await writeFile(filePath, buffer);
```

### 修正後 (Vercel Blobに保存)
```typescript
// Vercel Blobにアップロード
import { put } from '@vercel/blob';

const blob = await put(fileName, file, {
  access: 'public',
  addRandomSuffix: false,
});

// blob.url: https://xxxxx.public.blob.vercel-storage.com/logos/company.png
```

---

## 動作確認

### ローカル環境
1. ロゴをアップロード
2. コンソールに以下が表示されることを確認:
   ```
   Company logo uploaded: logos/company.png for company
   ```
3. 返された `logoUrl` にアクセスして画像が表示されることを確認

### 本番環境
1. https://bondai-mu.vercel.app でロゴをアップロード
2. アップロード成功メッセージが表示される
3. 画像が正しく表示される

---

## トラブルシューティング

### エラー: `BLOB_READ_WRITE_TOKEN is not defined`

**原因**: 環境変数が設定されていない

**解決策**:
1. Vercel Dashboard → Storage → Blobストアを作成
2. プロジェクトに接続
3. 再デプロイ

### エラー: `Failed to upload to Vercel Blob`

**原因**: トークンが無効または期限切れ

**解決策**:
1. Vercel Dashboard → Storage → bond-uploads → Settings
2. 新しいトークンを生成
3. 環境変数を更新
4. 再デプロイ

### ローカル開発で `BLOB_READ_WRITE_TOKEN is not defined`

**解決策**:
`.env.local` にトークンを追加:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxx
```

---

## Vercel Blob の特徴

### メリット
- ✅ Vercelと完全統合
- ✅ 自動スケーリング
- ✅ CDN配信（高速）
- ✅ 無料プランあり（100GB転送/月）
- ✅ セットアップが簡単

### 料金
- **Free**: 5GB ストレージ、100GB 転送/月
- **Pro**: 1GB あたり $0.15/月、転送 $0.15/GB

詳細: https://vercel.com/docs/storage/vercel-blob/pricing

---

## 参考リンク

- [Vercel Blob Documentation](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob NPM Package](https://www.npmjs.com/package/@vercel/blob)
- [Vercel Storage Dashboard](https://vercel.com/dashboard/stores)
