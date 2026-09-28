/* CACHE_VERSION را workflow دیپلوی خودکار (با کد کامیت) عوض می‌کند؛ لازم نیست دستی دست بزنی. */
const CACHE_VERSION = 'auto';
const CACHE_NAME = 'faravani-cache-' + CACHE_VERSION;

self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* همه‌چیز (صفحه، JS، CSS، manifest، آیکون‌ها) اول از شبکه گرفته می‌شود تا همیشه آخرین نسخه بیاید.
   فقط اگر آفلاین بود، آخرین نسخه‌ی ذخیره‌شده استفاده می‌شود. پس دیگه هیچ‌وقت نسخه‌ی قدیمی گیر نمی‌کند. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(req, { cache: 'no-store' })
      .then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then(hit => hit || caches.match('./')))
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
