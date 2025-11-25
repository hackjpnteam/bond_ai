# OGPサムネイル表示確認チェックリスト

## 前提条件の確認

- [ ] Vercelデプロイが完了している
- [ ] 環境変数 `NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED=true` がVercelに設定されている
- [ ] 最新のコミットがデプロイされている

## 1. ローカル環境での確認

### 画像生成エンドポイントの確認
```bash
# 開発サーバーを起動
npm run dev

# ブラウザで以下のURLにアクセス（userIdは実際のIDに置き換え）
http://localhost:3000/trust-map/share/[userId]/opengraph-image
```

**期待される結果**: 1200x630の信頼ネットワーク画像が表示される

### APIエンドポイントの確認
```bash
curl http://localhost:3000/api/trust-map/share/[userId]
```

**期待される結果**: ユーザーデータのJSON（me, companies, users）が返る

## 2. 本番環境での確認

### 直接画像URLにアクセス
```
https://your-domain.vercel.app/trust-map/share/[userId]/opengraph-image
```

**チェックポイント**:
- [ ] 画像が正しく生成される
- [ ] ユーザー名が表示される
- [ ] 企業数とつながり数が正しい
- [ ] ネットワークの線とノードが表示される
- [ ] 「Powered by Bond」が表示される

### metaタグの確認
ターミナルで以下を実行:
```bash
curl -sL "https://your-domain.vercel.app/trust-map/share/[userId]" | grep -E 'og:|twitter:' | head -20
```

**確認すべきタグ**:
- [ ] `og:title` - タイトルが含まれている
- [ ] `og:image` - 画像URLが含まれている
- [ ] `og:url` - ページURLが含まれている
- [ ] `twitter:card` - "summary_large_image"が設定されている
- [ ] `twitter:image` - 画像URLが含まれている

## 3. SNS検証ツールでの確認

### Twitter Card Validator
1. https://cards-dev.twitter.com/validator にアクセス
2. URLを入力: `https://your-domain.vercel.app/trust-map/share/[userId]`
3. 「Preview card」をクリック

**チェックポイント**:
- [ ] Card preview が正しく表示される
- [ ] 画像が1200x630で表示される
- [ ] タイトルと説明が表示される
- [ ] エラーメッセージがない

### Facebook Sharing Debugger
1. https://developers.facebook.com/tools/debug/ にアクセス
2. URLを入力
3. 「デバッグ」をクリック

**チェックポイント**:
- [ ] OGP画像が表示される
- [ ] 警告やエラーがない
- [ ] キャッシュを更新できる

## 4. 実際のSNS投稿テスト

### Xでテスト
1. 本番URLをXに投稿（下書き保存でOK）
2. カードプレビューが表示されることを確認

**チェックポイント**:
- [ ] 画像が自動的に展開される
- [ ] タイトルとURLが表示される
- [ ] 画像のアスペクト比が正しい

### Slackでテスト
1. SlackのDMやチャンネルにURLを貼り付け
2. プレビューが展開されることを確認

**チェックポイント**:
- [ ] プレビューが表示される
- [ ] 画像が表示される
- [ ] タイトルが表示される

## 5. シェアボタンの動作確認

1. `/trust-map` ページにアクセス
2. シェアボタンが表示されることを確認

**表示されるべきボタン**:
- [ ] 「画像で保存」ボタン
- [ ] 「X でシェア」ボタン
- [ ] 「URLをコピー」ボタン

### 各ボタンの動作テスト
- [ ] 「画像で保存」: PNG画像がダウンロードされる
- [ ] 「X でシェア」: Twitter投稿ウィンドウが開く
- [ ] 「URLをコピー」: URLがクリップボードにコピーされる

## トラブルシューティング

### シェアボタンが表示されない場合
```bash
# Vercelの環境変数を確認
# Vercel Dashboard → Settings → Environment Variables
# NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED が true に設定されているか確認

# 設定後、必ず再デプロイ
# Deployments → 最新のデプロイ → ... → Redeploy
```

### OGP画像が表示されない場合
1. APIエンドポイント `/api/trust-map/share/[userId]` が正しくデータを返すか確認
2. `opengraph-image.tsx` のエラーログをVercelで確認
3. userIdが正しいか確認

### キャッシュ問題
SNSプラットフォームは画像をキャッシュすることがあります:
- Twitter: Card Validatorの「Preview card」を再度クリック
- Facebook: Sharing Debuggerの「Scrape Again」をクリック
- 画像URLにクエリパラメータを追加: `?v=2` など

## 最終チェック

- [ ] 本番環境でシェアボタンが表示される
- [ ] OGP画像が正しく生成される
- [ ] Twitter Card Validatorで検証済み
- [ ] 実際のSNS投稿でプレビューが表示される
- [ ] すべてのシェアボタンが動作する

## 参考情報

### OGP画像生成ファイル
`/app/trust-map/share/[userId]/opengraph-image.tsx`

### シェアコンポーネント
`/components/trust-map/ShareableTrustMap.tsx`

### 環境変数
```
NEXT_PUBLIC_TRUSTMAP_SHARE_ENABLED=true
NEXT_PUBLIC_BASE_URL=https://your-domain.vercel.app
```
