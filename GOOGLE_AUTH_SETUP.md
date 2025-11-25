# Google OAuth ログイン設定ガイド

## エラー内容
`https://bondai-mu.vercel.app/auth/login?error=Configuration`

このエラーは、NextAuthの環境変数が正しく設定されていないことを示しています。

## 必要な環境変数

Vercelに以下の環境変数を設定する必要があります：

### 1. GOOGLE_CLIENT_ID
- **形式**: `数字-文字列.apps.googleusercontent.com`
- **例**: `770946554968-xxx.apps.googleusercontent.com`
- **取得方法**: Google Cloud Console → 認証情報 → OAuth 2.0 クライアント ID

### 2. GOOGLE_CLIENT_SECRET
- **形式**: `GOCSPX-文字列`
- **例**: `GOCSPX-xxxxxxxxxxxxx`
- **取得方法**: Google Cloud Console → 認証情報 → OAuth 2.0 クライアント ID → シークレット

### 3. NEXTAUTH_SECRET
- **形式**: ランダムな文字列（32文字以上推奨）
- **生成方法**:
  ```bash
  openssl rand -base64 32
  ```

### 4. NEXTAUTH_URL
- **形式**: `https://your-domain.vercel.app`
- **例**: `https://bondai-mu.vercel.app`

## Vercelへの設定手順

### ステップ1: Vercel Dashboardにアクセス
1. https://vercel.com にログイン
2. プロジェクト `bondai-mu` を選択
3. **Settings** → **Environment Variables** に移動

### ステップ2: 環境変数を追加
各環境変数を以下のように追加：

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| GOOGLE_CLIENT_ID | (Google Consoleから取得) | Production, Preview, Development |
| GOOGLE_CLIENT_SECRET | (Google Consoleから取得) | Production, Preview, Development |
| NEXTAUTH_SECRET | (生成したランダム文字列) | Production, Preview, Development |
| NEXTAUTH_URL | https://bondai-mu.vercel.app | Production |

**注意**:
- Preview/Developmentには異なるURLを設定する場合は個別に設定
- Productionのみの場合は "Production" のみ選択

### ステップ3: Google Cloud Consoleの設定確認

1. **Google Cloud Console** にアクセス
   https://console.cloud.google.com/

2. **認証情報** → **OAuth 2.0 クライアント ID** を選択

3. **承認済みのリダイレクト URI** に以下を追加:
   ```
   https://bondai-mu.vercel.app/api/auth/callback/google
   ```

4. **承認済みの JavaScript 生成元** に以下を追加:
   ```
   https://bondai-mu.vercel.app
   ```

5. **保存** をクリック

### ステップ4: Vercelで再デプロイ

環境変数を追加後、必ず再デプロイが必要です：

**方法1: Vercel Dashboardから**
1. **Deployments** タブに移動
2. 最新のデプロイメントの **⋯** メニューをクリック
3. **Redeploy** を選択

**方法2: GitHubからプッシュ**
```bash
git commit --allow-empty -m "Trigger redeploy for Google OAuth"
git push origin main
```

## 設定の確認

### ローカル環境で確認
`.env.local` に以下が設定されているか確認：
```bash
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-secret
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
```

### 本番環境で確認
1. https://bondai-mu.vercel.app/auth/login にアクセス
2. 「Googleでログイン」ボタンをクリック
3. エラーが出ずにGoogle認証画面が表示されればOK

## トラブルシューティング

### エラー: `error=Configuration`
**原因**: 環境変数が設定されていない、または間違っている
**解決策**:
1. Vercelの環境変数を確認
2. 再デプロイを実行
3. ブラウザのキャッシュをクリア

### エラー: `error=OAuthCallback`
**原因**: Google Cloud Consoleのリダイレクト URIが設定されていない
**解決策**:
1. Google Cloud Console → 認証情報
2. リダイレクト URI に `https://bondai-mu.vercel.app/api/auth/callback/google` を追加

### エラー: `error=AccessDenied`
**原因**:
- Google OAuth同意画面が未公開
- テストユーザーに登録されていない
**解決策**:
1. Google Cloud Console → OAuth同意画面
2. 「公開ステータス」を確認
3. テスト中の場合は、テストユーザーにメールアドレスを追加

## よくある間違い

### ❌ CLIENT_IDとSECRETを逆に設定
```bash
# 間違い
GOOGLE_CLIENT_ID=GOCSPX-xxxxx  # これはSECRET!
GOOGLE_CLIENT_SECRET=xxx.apps.googleusercontent.com  # これはID!

# 正しい
GOOGLE_CLIENT_ID=770946554968-xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

### ❌ リダイレクトURIが間違っている
```bash
# 間違い
https://bondai-mu.vercel.app/api/auth/google

# 正しい
https://bondai-mu.vercel.app/api/auth/callback/google
```

### ❌ 環境変数追加後に再デプロイしていない
環境変数を追加しただけでは反映されません。必ず再デプロイが必要です。

## 参考リンク

- [NextAuth.js Documentation](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
