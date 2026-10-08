# PWA_Project — 台灣股票工具 PWA 發佈版

`workproject/bj-tools/台灣股票.html` 的 PWA 版本，用 GitHub Pages 發佈，給手機「加入主畫面」使用。
本 repo 是獨立 repo（`blackjackx7/PWA_Project`，branch `main`），不在 workproject 的共用 remote 底下。

## 最重要的規則

- **來源只有一份：`../bj-tools/台灣股票.html`**。功能一律改那邊；`index.html`、`tailwind.css`、`tailwind.config.js` 都是 `scripts/sync.js` 產生的，**不要手改**，下次同步會被蓋掉。
- 更新流程：改完來源 → `npm run sync` → commit 並 push 到 `main`，Pages 自動更新。手機要開第二次才會看到新版（service worker 先回快取、背景更新）。
- `sync.js` 找不到預期的來源結構（Tailwind CDN、`tailwind.config`、字型 CDN 連結）會直接報錯，代表來源 HTML 結構改了，要同步調整 `sync.js`，不要硬跳過。

## 設計決策

- **為什麼 Tailwind 要預先建置**：來源用 Tailwind CDN（瀏覽器即時編譯），離線與首次載入都不可靠，PWA 版改用建好的 `tailwind.css`。程式裡用字串拼出來的 class 若沒有完整出現在 HTML 原文，建置時掃不到，樣式會缺。
- **為什麼 Font Awesome、Chart.js 放 `vendor/`**：離線也要能開；Google 字型體積大，改由 service worker 執行期快取。
- **service worker 不快取報價與歷史股價 API**（證交所、CORS 代理）：價格必須是新的，失敗時的備援邏輯由頁面自己處理。`sw.js` 的 `BUILD` 由 `sync.js` 依檔案內容雜湊改寫，內容有變才會換新快取。
- 所有路徑都用相對路徑，因為 Pages 網址帶 repo 名稱子路徑（`/PWA_Project/`）。
- 資料存在各瀏覽器 `localStorage`，綁這個網址；網址一變（例如改 repo 名稱）資料就看不到，改名前先匯出。
