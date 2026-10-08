#!/usr/bin/env node
// 把 bj-tools/台灣股票.html 轉成 PWA 用的 index.html：
//   1. 換掉 Tailwind CDN（改用預先建好的 tailwind.css）、Font Awesome 與 Chart.js 改用自己放的檔案
//   2. 加上 manifest / apple 相關 meta 與 service worker 註冊
//   3. 重建 tailwind.css，並更新 sw.js 的 BUILD 版本號（內容有變才會讓手機換新快取）
// 用法：node scripts/sync.js [來源 HTML 路徑]
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const src = path.resolve(process.argv[2] || path.join(root, '..', 'bj-tools', '台灣股票.html'));
let html = fs.readFileSync(src, 'utf8');

function mustReplace(label, re, replacement) {
  if (!re.test(html)) throw new Error(`來源 HTML 找不到「${label}」，來源結構可能改了，請檢查 scripts/sync.js`);
  html = html.replace(re, replacement);
}

// 1. 擷取 tailwind.config 物件，產生 tailwind.config.js，並從 HTML 移除
const cfgRe = /\n[ \t]*tailwind\.config = (\{[\s\S]*?\n[ \t]*\})\s*\n(?=[ \t]*<\/script>)/;
const cfgMatch = html.match(cfgRe);
if (!cfgMatch) throw new Error('來源 HTML 找不到 tailwind.config 區塊');
const twConfig = new Function(`return (${cfgMatch[1]})`)();
fs.writeFileSync(
  path.join(root, 'tailwind.config.js'),
  `// 由 scripts/sync.js 從來源 HTML 的 tailwind.config 自動產生，請勿手改\nmodule.exports = ${JSON.stringify({ content: ['./index.html'], ...twConfig }, null, 2)};\n`
);
html = html.replace(cfgRe, '\n');

// 2. 資源改用本地檔案
mustReplace('Tailwind CDN', /[ \t]*<script src="https:\/\/cdn\.tailwindcss\.com"><\/script>/, '  <link rel="stylesheet" href="tailwind.css">');
mustReplace('Font Awesome CDN', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/font-awesome\/[\d.]+\/css\/all\.min\.css/, 'vendor/fontawesome/css/all.min.css');
mustReplace('Chart.js CDN', /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/Chart\.js\/[\d.]+\/chart\.umd\.min\.js/, 'vendor/chart.umd.min.js');

// 3. PWA meta 與 service worker 註冊
const pwaHead = `
  <!-- PWA -->
  <link rel="manifest" href="manifest.webmanifest">
  <meta name="theme-color" content="#dc2626">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="台股監控">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
  <link rel="icon" type="image/png" href="icons/icon-192.png">`;
mustReplace('</title>', /<\/title>/, `</title>${pwaHead}`);
mustReplace('</body>', /<\/body>/, '  <script src="pwa-init.js"></script>\n</body>');

fs.writeFileSync(path.join(root, 'index.html'), html);

// 4. 建 Tailwind CSS
const twBin = path.join(root, 'node_modules', 'tailwindcss', 'lib', 'cli.js');
execFileSync(process.execPath, [twBin, '-c', 'tailwind.config.js', '-i', 'src/input.css', '-o', 'tailwind.css', '--minify'], { cwd: root, stdio: 'inherit' });

// 5. 以內容雜湊更新 sw.js 的 BUILD
const hash = crypto.createHash('sha1');
for (const f of ['index.html', 'tailwind.css', 'pwa-init.js', 'manifest.webmanifest']) hash.update(fs.readFileSync(path.join(root, f)));
const build = hash.digest('hex').slice(0, 10);
const swPath = path.join(root, 'sw.js');
const sw = fs.readFileSync(swPath, 'utf8');
if (!/const BUILD = '[^']*';/.test(sw)) throw new Error('sw.js 找不到 BUILD 常數');
fs.writeFileSync(swPath, sw.replace(/const BUILD = '[^']*';/, `const BUILD = '${build}';`));

console.log(`同步完成：來源 ${src}\nBUILD=${build}`);
