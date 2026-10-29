# PWA_Project — 個人 PWA 集中放置處

用 GitHub Pages 發佈的 PWA 集合，給手機「加入主畫面」使用。每個 PWA 一個子資料夾，網址是
`https://blackjackx7.github.io/PWA_Project/<應用>/`。
本 repo 是獨立 repo（`blackjackx7/PWA_Project`，branch `main`）。

| 資料夾 | 應用 | 來源（唯一的程式碼來源） |
|---|---|---|
| `stock/` | 台灣股票監控工具 | `../bj-tools/台灣股票.html` |
| `route/` | 路線規劃（依直線距離排最短順序、標示完成） | 不在本 repo，規則同上 |
| `drama/` | 追劇記錄（各季集數進度、季完結、演員搜尋） | `../bj-tools/追劇記錄.html`，規則同上 |
| `elements/` | 繁體中文版元素週期表（非 PWA，純網頁） | `Periodic-Table/Future-Style-Periodic-Table/`（Vite 專案，fork 自 SeanWong17，MIT），不走 `sync.js` |

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
- **`route/` 不用 Tailwind**：`sync.js` 的 `APPS` 以 `tailwind: false` 略過 Tailwind 步驟，改在 `cdn` 清單把 Leaflet、SheetJS 的 CDN 連結換成 `vendor/` 內的檔案；Leaflet 圖層切換鈕的圖示放在 `images/`。`localStorage` key 前綴是 `route_`。
- **`route/` 的地圖圖磚**：圖磚在 `sw.js` 另開 `route-tiles` 快取（換版不清掉），上限 300 張、超過刪最舊的；沒看過的區域離線時沒有底圖，路徑規劃與完成標記不受影響。圖磚來源要新增網域時，同步改 `sw.js` 的 `TILE_HOSTS`。
- **`drama/` 純單檔、無外部資源**：`APPS` 設 `tailwind: false`、`cdn: []`，`sw.js` 只快取同源檔案。`localStorage` key 前綴 `drama_`（資料 `drama_v1`、`drama_last_backup`、`drama_collapsed`）；資料只存在瀏覽器，靠 JSON 匯出／匯入備份（匯入以 id 合併、較新者勝，不會覆蓋整份）。
- **`elements/` 是 build 產物，不是 sync 產生的**：來源是 `Periodic-Table/Future-Style-Periodic-Table/`（不進本 repo，目前也沒有獨立版控），更新流程是改來源 → 在該資料夾 `npm run check` → 把 `dist/` 整個複製到 `elements/`（含 `img/`，約 58 MB）→ commit。`elements/LICENSE` 是上游 MIT 授權，要保留。**資料夾不能叫 `periodic-table/`**：Windows 不分大小寫，會和 `Periodic-Table/` 原始碼資料夾撞名。兩個圖片 `<img>`（`#element-image`、`#bohr-image`）**不可加 `loading="lazy"`**：它們在 `display:none` 容器裡，瀏覽器不會載入，而程式要等 `onload` 才顯示容器，會死結並一律「載入超時」（上游原本就有此 bug）。61 號鉕的實物圖上游已 404，手動找的替代圖授權不明，所以 `elements.json` 的 61 號 `image` 設為 `null`（UI 會停用「載入實物圖片」按鈕）；找到授權明確的圖才補回（放 `public/img/real/061-pm.<ext>` 並填 `image` 與正確的 `attribution`）。
- **公開 repo 不放測試資料**：`route/` 只放程式與圖示，測試用的清單不進版控。
- 所有路徑都用相對路徑，因為 Pages 網址帶 repo 名稱與子資料夾路徑。
- 資料存在各瀏覽器 `localStorage`，依網域（不含路徑）區分：改 repo 名稱或搬子資料夾時網域不變、桌面瀏覽器資料還在，但已安裝到主畫面的圖示會因路徑變了而失效，要重新安裝；iOS 主畫面 app 的資料與 Safari 分頁分開，搬家前先匯出備份。
