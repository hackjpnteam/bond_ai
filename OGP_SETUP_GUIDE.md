# OGP（Open Graph Protocol）セットアップガイド

## 概要

このガイドでは、BondアプリケーションのOGP画像生成とSNSシェア機能の設定・検証方法を説明します。

## 実装済みの機能

### 1. 動的OGP画像生成
- ユーザーごとの信頼ネットワークを可視化したOGP画像を自動生成
- サイズ: 1200x630px（Twitter/Facebook推奨サイズ）
- 内容:
  - ユーザー名
  - 企業数とつながり数の統計
  - ネットワークの可視化（ノードと接続線）
  - Bondロゴ

### 2. SNSシェア機能
- 「画像で保存」: PNG形式で信頼マップをダウンロード
- 「X でシェア」: X（Twitter）への直接投稿（OGP画像付き）
- 「URLをコピー」: シェア用URLをクリップボードにコピー

## セットアップ手順

### 1. 環境変数の設定

#### ローカル開発環境
`.env.local` に以下を追加:
```bash
# シェア機能の有効化
NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED=true

# ベースURL（本番URLを指定）
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```

#### Vercel本番環境
1. Vercel Dashboard にアクセス
2. プロジェクトを選択
3. **Settings** → **Environment Variables** に移動
4. 以下の環境変数を追加:
   - Key: `NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED`
   - Value: `true`
   - Environment: Production, Preview, Development（必要に応じて選択）
5. Key: `NEXT_PUBLIC_BASE_URL`
   - Value: `https://your-domain.vercel.app`
   - Environment: Production

### 2. 再デプロイ

**重要**: 環境変数を追加した後は必ず再デプロイが必要です。

#### 方法1: Vercel Dashboardから
1. **Deployments** タブに移動
2. 最新のデプロイメントの右側にある **⋯** メニューをクリック
3. **Redeploy** を選択

#### 方法2: GitHubからプッシュ
```bash
git add .
git commit -m "Enable share feature"
git push origin main
```
Vercelが自動的に新しいデプロイを開始します。

### 3. デプロイの確認

デプロイが完了するまで待ちます（通常1-3分）。
Vercel Dashboardの **Deployments** タブで「Ready」になることを確認。

## 検証方法

### 自動検証スクリプト

プロジェクトルートで以下のコマンドを実行:

```bash
# 本番環境の検証（userIdを指定）
./scripts/verify-ogp.sh https://your-domain.vercel.app 6907dd732c1f7abff64f0667
```

このスクリプトは以下をチェックします:
- ✅ ページの存在確認
- ✅ OGPメタタグの存在
- ✅ 必須タグ（og:title, og:image, twitter:card など）
- ✅ OGP画像の生成確認
- ✅ APIエンドポイントの動作確認

### 手動での検証

#### 1. ブラウザで直接確認

OGP画像URLに直接アクセス:
```
https://your-domain.vercel.app/trust-map/share/[userId]/opengraph-image
```

**期待される結果**: 信頼ネットワークの画像が表示される

#### 2. メタタグの確認

ターミナルで実行:
```bash
curl -sL "https://your-domain.vercel.app/trust-map/share/[userId]" | grep -E 'og:|twitter:'
```

**期待される出力**:
```html
<meta property="og:title" content="..." />
<meta property="og:image" content="https://your-domain.vercel.app/trust-map/share/[userId]/opengraph-image" />
<meta name="twitter:card" content="summary_large_image" />
```

#### 3. SNS検証ツール

##### Twitter Card Validator
1. https://cards-dev.twitter.com/validator にアクセス
2. シェアURLを入力: `https://your-domain.vercel.app/trust-map/share/[userId]`
3. 「Preview card」をクリック
4. カードプレビューが表示されることを確認

##### Facebook Sharing Debugger
1. https://developers.facebook.com/tools/debug/ にアクセス
2. URLを入力してデバッグ
3. OGP画像とメタデータが正しく表示されることを確認
4. 警告やエラーがないことを確認

#### 4. 実際のSNS投稿でテスト

##### Xでテスト
1. Xに新規投稿を作成（公開しなくてもOK）
2. シェアURLを貼り付け
3. カードプレビューが自動展開されることを確認

**注意**: キャッシュの影響で、初回は画像が表示されない場合があります。その場合は:
- URLの末尾に `?v=2` などのクエリパラメータを追加
- Twitter Card Validatorで再検証

## トラブルシューティング

### シェアボタンが表示されない

**症状**: `/trust-map` ページにシェアボタンが表示されない

**原因と解決策**:
1. 環境変数が設定されていない
   ```bash
   # Vercel Dashboard → Settings → Environment Variables
   NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED=true
   ```

2. 環境変数設定後に再デプロイしていない
   - Vercel Dashboardから手動で Redeploy
   - または、新しいコミットをプッシュ

3. キャッシュの問題
   ```bash
   # ローカル開発環境の場合
   rm -rf .next
   npm run dev
   ```

### OGP画像が生成されない

**症状**: `/trust-map/share/[userId]/opengraph-image` にアクセスすると500エラー

**確認事項**:
1. APIエンドポイントが動作しているか
   ```bash
   curl https://your-domain.vercel.app/api/trust-map/share/[userId]
   ```
   正常な場合、ユーザーデータのJSONが返される

2. userIdが正しいか
   - 実際に存在するユーザーIDを使用しているか確認

3. Vercelのログを確認
   - Vercel Dashboard → Deployments → Functions
   - エラーログがないか確認

### SNSでOGP画像が表示されない

**原因**: SNSプラットフォームのキャッシュ

**解決策**:
1. Twitter Card Validatorで強制再取得
   - https://cards-dev.twitter.com/validator
   - URLを入力して「Preview card」をクリック

2. Facebook Sharing Debuggerでキャッシュクリア
   - https://developers.facebook.com/tools/debug/
   - 「Scrape Again」ボタンをクリック

3. URLにバージョンパラメータを追加
   ```
   https://your-domain.vercel.app/trust-map/share/[userId]?v=2
   ```

## ファイル構成

### OGP画像生成
```
app/trust-map/share/[userId]/
  ├── page.tsx                    # シェアページ
  └── opengraph-image.tsx         # OGP画像生成ロジック
```

### API
```
app/api/trust-map/share/[userId]/
  └── route.ts                    # ユーザーデータ取得API
```

### コンポーネント
```
components/trust-map/
  └── ShareableTrustMap.tsx       # シェア機能付き信頼マップ
hooks/
  └── useTrustMapExport.ts        # 画像エクスポートフック
```

## API仕様

### GET /api/trust-map/share/[userId]

ユーザーの信頼ネットワークデータを取得

**レスポンス**:
```json
{
  "me": {
    "id": "...",
    "name": "ユーザー名",
    "profileImage": "..."
  },
  "companies": [
    { "id": "...", "name": "企業名", ... }
  ],
  "users": [
    { "id": "...", "name": "接続ユーザー名", ... }
  ]
}
```

### GET /trust-map/share/[userId]/opengraph-image

動的にOGP画像を生成

**パラメータ**:
- `userId`: ユーザーID

**レスポンス**:
- Content-Type: `image/png`
- サイズ: 1200x630px
- キャッシュ: デフォルトで有効

## チェックリスト

デプロイ前:
- [ ] `.env.local` に環境変数を設定
- [ ] ローカルでシェアボタンが表示されることを確認
- [ ] ローカルでOGP画像が生成されることを確認

デプロイ後:
- [ ] Vercelに環境変数を設定
- [ ] 再デプロイを実行
- [ ] `verify-ogp.sh` スクリプトで検証
- [ ] Twitter Card Validatorで検証
- [ ] 実際のSNS投稿でテスト

## 関連リンク

- [Open Graph Protocol 公式](https://ogp.me/)
- [Twitter Cards Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/opengraph-image)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)

## サポート

問題が解決しない場合は、以下の情報と共にお問い合わせください:
1. エラーメッセージまたはスクリーンショット
2. Vercelのデプロイログ
3. `verify-ogp.sh` の実行結果
4. 環境変数の設定内容（値は伏せて）
