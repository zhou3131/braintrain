// BrainTrain Service Worker —— 应用外壳离线缓存
const CACHE = 'braintrain-v14';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './js/app.js',
  './js/store.js',
  './js/utils.js',
  './js/ui.js',
  './js/modules/dashboard.js',
  './js/modules/numberPegs.js',
  './js/data/numberPegsData.js',
  './js/data/cardCodes.js',
  './js/data/locations.js',
  './js/data/pegEmoji.js',
  './js/data/pegImages.js',
  './js/data/wordPegsData.js',
  './js/data/vocabLib.js',
  './js/modules/playingCards.js',
  './js/modules/wordPegs.js',
  './js/modules/schulte.js',
  './js/modules/focus.js',
  './js/modules/auditory.js',
  './js/modules/visual.js',
  './js/modules/progress.js',
  './js/data/locationPegs.js',
  './js/modules/locationPegs.js',
  './js/modules/daily.js',
  './assets/favicon.ico',
  './assets/pegs/main/5.svg',
  ...(function () { const a = []; for (let i = 0; i < 20; i++) { const n = String(i).padStart(2, '0'); a.push('./assets/locations/orig/' + n + '.jpg', './assets/locations/named/' + n + '.jpg'); } return a; })(),
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 缓存优先，回退网络（导航请求始终尝试网络以获最新外壳）
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
