# PWA_Project — 個人 PWA 集中放置處

用 GitHub Pages 發佈的 PWA 集合，給手機「加入主畫面」使用。每個 PWA 一個子資料夾，網址是
`https://blackjackx7.github.io/PWA_Project/<應用>/`。
本 repo 是獨立 repo（`blackjackx7/PWA_Project`，branch `main`）。

| 資料夾 | 應用 | 來源（唯一的程式碼來源） |
|---|---|---|
| `stock/` | 台灣股票監控工具 | `../bj-tools/台灣股票.html` |

## 最重要的規則

- **每個應用的來源只有一份，不在本 repo**：功能一律改來源檔；子資料夾裡的 `index.html`、`tailwind.css`、`tailwind.config.js` 都是 `scripts/sync.js` 產生的，**不要手改**，下次同步會被蓋掉。
- 更新流程：改完來源 → `npm run sync:stock` → commit 並 push 到 `main`，Pages 自動更新。手機要開第二次才會看到新版（service worker 先回快取、背景更新）。
- `sync.js` 找不到預期的來源結構（Tailwind CDN、`tailwind.config`、字型 CDN 連結）會直接報錯，代表來源 HTML 結構改了，要同步調整 `sync.js`，不要硬跳過。
- **公開 repo，不能放機密**：commit 前確認沒有帳密、token、個人資料、匯出的設定檔。commit 作者信箱用 GitHub noreply（`<id>+blackjackx7@users.noreply.github.com`，以 `git -c user.email=...` 帶入，不改 git 設定），避免公開真實信箱。

## 新增一個 PWA

1. 建同名子資料夾，放該應用的 `icons/`（可用 `scripts/make-icons.ps1 -App <名稱>` 產生）與 `vendor/` 等靜態資源。
2. 在 `scripts/sync.js` 的 `APPS` 加一行（來源 HTML 路徑），在 `package.json` 加 `sync:<名稱>` 指令。
3. 根目錄 `index.html`（應用清單）加一個連結，並更新上面的表格。
4. **`localStorage` key 要用該應用專屬的前綴**（股票是 `tw_stock_`）：同帳號所有 Pages 共用同一個網域 `blackjackx7.github.io`，`localStorage` 也共用，key 撞名會互相覆蓋。service worker 放在各自子資料夾，scope 只涵蓋自己，不會互相干擾。

## 設計決策

- **為什麼 Tailwind 要預先建置**：來源用 Tailwind CDN（瀏覽器即時編譯），離線與首次載入都不可靠，PWA 版改用建好的 `tailwind.css`。程式裡用字串拼出來的 class 若沒有完整出現在 HTML 原文，建置時掃不到，樣式會缺。
- **為什麼 Font Awesome、Chart.js 放 `vendor/`**：離線也要能開；Google 字型體積大，改由 service worker 執行期快取。
- **service worker 不快取報價與歷史股價 API**（證交所、CORS 代理）：價格必須是新的，失敗時的備援邏輯由頁面自己處理。`sw.js` 的 `BUILD` 由 `sync.js` 依檔案內容雜湊改寫，內容有變才會換新快取。
- 所有路徑都用相對路徑，因為 Pages 網址帶 repo 名稱與子資料夾路徑。
- 資料存在各瀏覽器 `localStorage`，依網域（不含路徑）區分：改 repo 名稱或搬子資料夾時網域不變、桌面瀏覽器資料還在，但已安裝到主畫面的圖示會因路徑變了而失效，要重新安裝；iOS 主畫面 app 的資料與 Safari 分頁分開，搬家前先匯出備份。
