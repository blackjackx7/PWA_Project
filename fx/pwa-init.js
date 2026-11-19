// 只在 https 或 localhost 註冊 service worker（file:// 不支援）
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('service worker 註冊失敗', e));
  });
}
