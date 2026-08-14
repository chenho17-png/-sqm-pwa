#!/usr/bin/env bash
# ============================================================================
#  SQM PWA 一鍵部署到 GitHub Pages
#  用法： ./deploy.sh <GitHub帳號> [repo名稱]
# ============================================================================
set -e
USER="${1:-}"
REPO="${2:-sqm-pwa}"

if [ -z "$USER" ]; then
  echo "用法：./deploy.sh <你的GitHub帳號> [repo名稱，預設 sqm-pwa]"
  exit 1
fi

# --- 部署前檢查：設定沒填就擋下來，免得推上去才發現登不進去 ---
if grep -q "請貼上" config.js; then
  echo "✗ config.js 尚未填寫完成。請先填入："
  echo "    API_URL   ← GAS 部署網址（結尾 /exec）"
  echo "    CLIENT_ID ← Google OAuth 用戶端 ID"
  exit 1
fi
echo "✓ config.js 已設定"

if [ ! -d .git ]; then
  git init -q
  git branch -M main
fi

git add -A
git commit -q -m "SQM PWA $(date '+%Y-%m-%d %H:%M')" || echo "（沒有新變更）"

if ! git remote | grep -q origin; then
  git remote add origin "https://github.com/$USER/$REPO.git"
fi

echo "→ 推送到 https://github.com/$USER/$REPO"
git push -u origin main

cat <<TXT

────────────────────────────────────────────────
推送完成。還剩兩件事要在瀏覽器做：

1. 開啟 GitHub Pages
   https://github.com/$USER/$REPO/settings/pages
   Source 選 [main] / [/ (root)] → Save
   約 1 分鐘後網址生效：
   https://$USER.github.io/$REPO/

2. 授權登入來源
   https://console.cloud.google.com/apis/credentials
   點你的 OAuth 用戶端 ID → 「已授權的 JavaScript 來源」新增：
   https://$USER.github.io
   （只要網域，不含 /$REPO 路徑）

漏掉第 2 步的話，登入按鈕點下去不會有反應。
────────────────────────────────────────────────
TXT
