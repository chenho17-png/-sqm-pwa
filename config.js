/* ============================================================================
 *  HII 監造品質管理系統 — 前端設定檔
 * ----------------------------------------------------------------------------
 *  部署後只要改這一個檔案，不必動 index.html。
 *  這裡的值都是「公開資訊」：OAuth Client ID 本來就會出現在網頁原始碼裡，
 *  真正的權限控管在後端（驗證 id_token 的 aud + email 網域）。
 * ==========================================================================*/
window.HII_CONFIG = {

  /* ① GAS Web App 部署網址（部署 → 管理部署作業 → 複製網址，結尾是 /exec） */
  API_URL: 'https://script.google.com/macros/s/AKfycbzaobMBEjlnxdIBe3vF1ILKhlrFw6Pwh3hzehcIuOx6y3oBcj__scQ4GlQgJ51NmoKgBw/exec',

  /* ② Google Cloud Console 建立的 OAuth 2.0 用戶端 ID */
  CLIENT_ID: 'AKfycbzaobMBEjlnxdIBe3vF1ILKhlrFw6Pwh3hzehcIuOx6y3oBcj__scQ4GlQgJ51NmoKgBw.apps.googleusercontent.com',

  /* ③ 限定登入網域。GIS 會用它做登入提示，後端會再驗一次（真正的關卡在後端） */
  HOSTED_DOMAIN: 'hii.archi',

  /* ④ 顯示用 */
  APP_NAME: '監造品質管理',
  ORG_NAME: 'HII 建築師事務所',

  /* ⑤ 影像壓縮設定
   *    工地照片以「看得清楚缺失」為準，不需要原尺寸。
   *    1600px / 0.82 大約 250–450KB，上傳快、Drive 也省。
   *    EXIF 一律從原始檔讀取後另存欄位，壓縮不影響稽核資訊。          */
  IMAGE_MAX_SIDE: 1600,
  IMAGE_QUALITY: 0.82,

  /* ⑥ 離線同步：每批送幾筆（照片是大宗，5 筆約 2MB，訊號差時較穩） */
  SYNC_BATCH_SIZE: 5,

  /* ⑦ 版本號。改版時一併改 sw.js 的 CACHE_VERSION（目前 hii-sqm-v1.1.0），使用者才會拿到新檔 */
  VERSION: '1.1.0'
};
