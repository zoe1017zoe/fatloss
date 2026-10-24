// 減脂追蹤 Service Worker：快取 APP 外殼，讓離線也能開啟與查看紀錄
const CACHE = 'fatloss-v2';
const SHELL = [
  './', './index.html', './manifest.webmanifest',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
  'https://cdn.jsdelivr.net/npm/dexie@4/dist/dexie.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.includes('generativelanguage.googleapis.com')) return; // AI 請求不快取
  // 頁面：網路優先（取得更新），失敗時用快取
  if (req.mode === 'navigate' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
    return;
  }
  // 其他資源：快取優先
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
