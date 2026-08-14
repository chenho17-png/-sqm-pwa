/* ============================================================================
 *  SQM Service Worker
 * ----------------------------------------------------------------------------
 *  策略：
 *    · App Shell（HTML/CSS/JS/圖示）→ Cache First，離線也開得起來
 *    · API 請求（GAS）             → 一律 Network Only，絕不快取
 *      理由：品管資料錯一筆就是責任問題，寧可顯示「離線」也不給過期資料。
 *      離線時的資料呈現由前端 IndexedDB 快取負責，並明確標示「離線快取」。
 *    · Google 登入相關            → 不攔截，交給瀏覽器
 *
 *  改版流程：改 CACHE_VERSION → 使用者下次開啟時會下載新檔，
 *            並由前端跳出「有新版本，點擊更新」提示。
 * ==========================================================================*/

const CACHE_VERSION = 'hii-sqm-v1.4.0';
const FONT_CACHE = 'hii-fonts-v1';
const SHELL = [
  './',
  './index.html',
  './config.js',
  './manifest.json',
  './brand/logo-white.svg',
  './brand/logo-dark.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png'
];

/* ---------- 安裝：預先快取 App Shell ---------- */
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((c) => c.addAll(SHELL))
      // 單一檔案 404 不該讓整個 SW 安裝失敗
      .catch((err) => console.warn('[SW] 預快取部分失敗', err))
      .then(() => self.skipWaiting())
  );
});

/* ---------- 啟用：清掉舊版快取 ---------- */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION && k !== FONT_CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ---------- 攔截 ---------- */
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // 只處理 GET
  if (req.method !== 'GET') return;

  // ---- 字體（Noto Sans TC）：快取優先，背景更新 ----
  // 放進獨立快取，改版清 App 快取時字體不會被一起清掉，
  // 使用者不必為了一次改版重新下載字型。
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(FONT_CACHE).then((c) =>
        c.match(req).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && (res.status === 200 || res.type === 'opaque')) c.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  // GAS API、Google 登入、Drive 圖片 → 不攔截
  if (url.hostname.indexOf('script.google.com') >= 0 ||
      url.hostname.indexOf('googleusercontent.com') >= 0 ||
      url.hostname.indexOf('accounts.google.com') >= 0 ||
      url.hostname.indexOf('drive.google.com') >= 0 ||
      url.hostname.indexOf('gstatic.com') >= 0) {
    return;
  }

  // 導覽請求：網路優先，失敗回快取的 index（離線也進得去 App）
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 其餘同源靜態資源：快取優先，背景更新
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && res.status === 200) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});

/* ---------- 前端要求立即套用新版 ---------- */
self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
