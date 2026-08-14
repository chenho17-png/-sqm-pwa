# HII 監造品質管理系統 — 前端 PWA

供建築師事務所監造／品管人員在工地現場使用的手機網頁應用程式。
後端為 Google Apps Script（`Code.gs` / `Report.gs` / `Notion.gs` / `SpecImport.gs`），
本 repo 只放前端，託管於 GitHub Pages。

---

## 檔案結構

```
sqm-pwa/
├─ index.html      主程式（UI、離線佇列、EXIF 解析、影像壓縮，全部在這一個檔案）
├─ config.js       ★ 唯一需要你修改的檔案（API 網址、OAuth ID、網域）
├─ manifest.json   PWA 設定（加到主畫面、圖示、捷徑）
├─ sw.js           Service Worker（離線快取）
├─ icons/          應用程式圖示（HII 標誌，白色置於深藍底）
├─ brand/          HII 標誌向量檔
│    ├─ logo-white.svg    深色背景用（App Bar、登入頁）
│    ├─ logo-dark.svg     淺色背景用
│    ├─ logo-current.svg  fill=currentColor，可用 CSS 直接換色
│    └─ logo-*.png        1600px 去背 PNG（給 Word、簡報等用）
├─ .nojekyll       讓 GitHub Pages 不要跑 Jekyll
└─ deploy.sh       一鍵部署腳本
```

---

## 部署（三步）

### 1. 填入設定

編輯 `config.js`：

```js
API_URL:   'https://script.google.com/macros/s/AKfy……/exec',   // GAS 部署網址
CLIENT_ID: '1234-abcd.apps.googleusercontent.com',            // OAuth 用戶端 ID
HOSTED_DOMAIN: 'hii.archi',
```

### 2. 推上 GitHub

```bash
./deploy.sh <你的GitHub帳號>
```

或手動：

```bash
git init && git add . && git commit -m "SQM PWA v1.0.0"
git branch -M main
git remote add origin https://github.com/<帳號>/sqm-pwa.git
git push -u origin main
```

然後到 repo → **Settings → Pages → Source 選 `main` / `/ (root)`** → 儲存。
約 1 分鐘後網址會是：

```
https://<帳號>.github.io/sqm-pwa/
```

### 3. 授權登入來源

Google Cloud Console → **API 和服務 → 憑證 → 你的 OAuth 用戶端 ID**
→ **已授權的 JavaScript 來源** 加入（注意：**不含 repo 路徑**）：

```
https://<帳號>.github.io
```

本機測試時再加一行 `http://localhost:8080`。

> 這一步沒做，登入按鈕會顯示但點下去無反應，Console 會出現 `origin_mismatch`。

---

## 本機測試

Service Worker 與 Google 登入都不能在 `file://` 下運作，一定要起一個本機伺服器：

```bash
python3 -m http.server 8080
# 開 http://localhost:8080
```

---

## 手機安裝

**Android（Chrome）**：開啟網址 → 網址列右側「安裝」圖示，或選單 →「安裝應用程式」
**iPhone（Safari）**：開啟網址 → 分享 → **加入主畫面**

> iOS 必須用 **Safari**，Chrome for iOS 不支援加入主畫面。
> 加到主畫面後會全螢幕執行、有自己的圖示，跟原生 App 幾乎一樣。

---

## 版本更新流程

改完 `index.html` 之後：

1. 把 `config.js` 的 `VERSION` 與 `sw.js` 的 `CACHE_VERSION` 都改成新版本號
2. `git commit && git push`

使用者下次開啟時會看到「有新版本，點擊更新」的提示條，點一下就會套用。
**若忘記改 `CACHE_VERSION`，舊版會一直被 Service Worker 快取住，使用者拿不到新檔。**

---

## 現場行為說明（給使用者的話）

| 情境 | 系統行為 |
|---|---|
| 工地沒訊號 | 表單照常填、照片照常拍，全部存在手機本機（IndexedDB），畫面上方顯示橘色「離線模式」 |
| 訊號恢復 | 自動嘗試同步；也可到「離線暫存與同步」按一鍵上傳 |
| 同一筆重送 | 每筆帶 `client_uuid`，後端去重，不會產生兩筆 |
| 照片很大 | 上傳前自動壓到長邊 1600px、約 250～450KB；EXIF 在壓縮前先讀出來另存，稽核資訊不會遺失 |
| 登入逾時 | 自動靜默續期；真的失效才會回登入頁 |

---

## 技術決策備忘

**為什麼不用 Tailwind / React CDN**
工地訊號差時外部 CDN 載不到，整個畫面會白掉。CSS 與 JS 全部內嵌在 `index.html`，
Service Worker 一併快取，離線也開得起來。

**字體：Noto Sans TC（＝Noto Sans CJK TC）**
唯一保留的外部資源。Google Fonts 把 CJK 切成上百個 `unicode-range` 子集，
只下載實際用到的片段，首次約幾十 KB 而不是數 MB；`sw.js` 用獨立的字體快取
（`hii-fonts-v1`）存起來，之後離線一樣是這個字體，而且改版清 App 快取時
字體不會被一起清掉。萬一完全載不到，會退回系統內建的 Noto Sans CJK
（Android 本來就是這一套）或 PingFang TC（iOS），字形極接近，不影響使用。

**標誌用 SVG 不用 PNG**
`logo-white.svg` 只有 637 bytes，任何尺寸都銳利，且 `logo-current.svg`
可以用 CSS `color` 直接換色，日後要做深色模式不必重新出圖。

**為什麼自己寫 EXIF 解析器**
同上 —— 不依賴外部套件。只解析拍攝時間與 GPS 三個欄位，程式碼在 `index.html`
的「【5】影像處理」區塊，約 200 行。

**為什麼 API 用 `Content-Type: text/plain`**
送 `application/json` 會觸發 CORS preflight（`OPTIONS`），而 Google Apps Script
無法回應 `OPTIONS` 請求，會直接失敗。同理也不能加 `Authorization` header，
所以 id_token 放在 request body 傳送。

**為什麼用 IndexedDB 而不是 LocalStorage**
LocalStorage 只有 5MB 且是同步 API。壓縮後單張照片仍有 200～450KB，
排隊十幾張就爆了，而且寫入時會卡住主執行緒。

**表單欄位為什麼都做雙向繫結**
這些表單會因為切換「合格／不合格」、天氣、離線狀態而重繪。
若不把輸入即時寫回狀態，使用者打好的文字會在重繪時消失 ——
現場填到一半整段說明不見，是最讓人火大的 bug。
