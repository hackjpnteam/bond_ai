#!/bin/bash

# OGP検証スクリプト
# 使い方: ./scripts/verify-ogp.sh <URL> [userId]

set -e

# 色の定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "  Bond OGP検証スクリプト"
echo "========================================="
echo ""

# URLの取得
if [ -z "$1" ]; then
  echo -e "${RED}エラー: URLを指定してください${NC}"
  echo "使い方: $0 <base-url> [userId]"
  echo "例: $0 https://bond.vercel.app 6907dd732c1f7abff64f0667"
  exit 1
fi

BASE_URL=$1
USER_ID=${2:-""}

# userIdが指定されている場合
if [ -n "$USER_ID" ]; then
  SHARE_URL="${BASE_URL}/trust-map/share/${USER_ID}"
  IMAGE_URL="${BASE_URL}/trust-map/share/${USER_ID}/opengraph-image"
  API_URL="${BASE_URL}/api/trust-map/share/${USER_ID}"
else
  SHARE_URL="${BASE_URL}"
  IMAGE_URL=""
  API_URL=""
fi

echo "対象URL: $SHARE_URL"
echo ""

# 1. ページの存在確認
echo "📄 ページの存在確認..."
STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SHARE_URL")
if [ "$STATUS_CODE" = "200" ]; then
  echo -e "${GREEN}✓${NC} ページが存在します (HTTP $STATUS_CODE)"
else
  echo -e "${RED}✗${NC} ページが見つかりません (HTTP $STATUS_CODE)"
  exit 1
fi
echo ""

# 2. OGPメタタグの確認
echo "🏷️  OGPメタタグの確認..."
META_TAGS=$(curl -sL "$SHARE_URL" | grep -E 'og:|twitter:' | head -20)

if [ -z "$META_TAGS" ]; then
  echo -e "${RED}✗${NC} OGPメタタグが見つかりません"
else
  echo -e "${GREEN}✓${NC} OGPメタタグが見つかりました:"
  echo "$META_TAGS" | sed 's/^/  /'
fi
echo ""

# 3. 必須タグのチェック
echo "✅ 必須タグのチェック..."
check_tag() {
  TAG_NAME=$1
  TAG_PATTERN=$2

  if echo "$META_TAGS" | grep -q "$TAG_PATTERN"; then
    TAG_VALUE=$(echo "$META_TAGS" | grep "$TAG_PATTERN" | sed -n 's/.*content="\([^"]*\)".*/\1/p' | head -1)
    echo -e "${GREEN}✓${NC} $TAG_NAME: $TAG_VALUE"
    return 0
  else
    echo -e "${RED}✗${NC} $TAG_NAME: 見つかりません"
    return 1
  fi
}

check_tag "og:title" 'property="og:title"'
check_tag "og:image" 'property="og:image"'
check_tag "og:url" 'property="og:url"'
check_tag "twitter:card" 'name="twitter:card"'
check_tag "twitter:image" 'name="twitter:image"'
echo ""

# 4. OGP画像の確認（userIdが指定されている場合のみ）
if [ -n "$IMAGE_URL" ]; then
  echo "🖼️  OGP画像の確認..."
  IMAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$IMAGE_URL")

  if [ "$IMAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} 画像が生成されます (HTTP $IMAGE_STATUS)"
    echo "  URL: $IMAGE_URL"

    # Content-Typeの確認
    CONTENT_TYPE=$(curl -sI "$IMAGE_URL" | grep -i "content-type" | awk '{print $2}' | tr -d '\r')
    echo "  Content-Type: $CONTENT_TYPE"

    # 画像サイズの確認（wgetがある場合）
    if command -v wget &> /dev/null; then
      TMP_FILE="/tmp/ogp-test-$$.png"
      wget -q -O "$TMP_FILE" "$IMAGE_URL"
      if command -v file &> /dev/null; then
        IMAGE_INFO=$(file "$TMP_FILE")
        echo "  画像情報: $IMAGE_INFO"
      fi
      rm -f "$TMP_FILE"
    fi
  else
    echo -e "${RED}✗${NC} 画像が生成されません (HTTP $IMAGE_STATUS)"
  fi
  echo ""
fi

# 5. APIエンドポイントの確認（userIdが指定されている場合のみ）
if [ -n "$API_URL" ]; then
  echo "🔌 APIエンドポイントの確認..."
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

  if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} APIが正常に動作しています (HTTP $API_STATUS)"

    # JSONレスポンスの確認
    if command -v jq &> /dev/null; then
      API_RESPONSE=$(curl -s "$API_URL" | jq -r '.me.name // "N/A"')
      echo "  ユーザー名: $API_RESPONSE"
    fi
  else
    echo -e "${RED}✗${NC} APIエラー (HTTP $API_STATUS)"
  fi
  echo ""
fi

# 6. Twitter Card Validatorのリンク
echo "🐦 次のステップ:"
echo "  1. Twitter Card Validator で検証:"
echo "     https://cards-dev.twitter.com/validator"
echo ""
echo "  2. Facebook Sharing Debugger で検証:"
echo "     https://developers.facebook.com/tools/debug/"
echo ""
echo "  3. 検証URL:"
echo "     $SHARE_URL"
echo ""

# 7. 結果のサマリー
echo "========================================="
echo "  検証完了"
echo "========================================="
