const CACHE_NAME = 'elwageh-shell-v12';
const APP_SHELL = [
  '/',
  '/repair-booking',
  '/app-launch.wav',
  '/app-launch.aac',
  '/manifest.webmanifest',
  '/pwa-icon.svg',
  '/pwa-icon-192.png',
  '/pwa-icon-512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/install-banner-logo-v2.png',
  '/truck-brands/mercedes.svg',
  '/truck-brands/volvo.svg',
  '/truck-brands/scania.svg',
  '/truck-brands/man.svg',
  '/truck-brands/kenworth.png',
  '/truck-brands/daf.svg',
  '/truck-brands/iveco.svg',
  '/truck-brands/mack.png',
  '/truck-brands/renault.svg',
  '/truck-brands/isuzu.svg',
  '/truck-brands/hino.svg',
  '/truck-brands/mitsubishi.svg',
  '/truck-brands/yutong.png',
  '/truck-brands/peterbilt.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(APP_SHELL);
      try {
        const response = await fetch('/precache-manifest.json', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Precache manifest request failed (${response.status})`);
        const manifest = await response.json();
        const assets = new Set(['/precache-manifest.json']);
        for (const entry of Object.values(manifest)) {
          if (entry.file) assets.add(`/${entry.file}`);
          for (const asset of [...(entry.css || []), ...(entry.assets || [])]) assets.add(`/${asset}`);
        }
        await Promise.all([...assets].map(url => cache.add(url).catch(error => {
          console.warn(`Unable to precache ${url}`, error);
        })));
      } catch (error) {
        console.warn('Unable to precache the production asset manifest', error);
      }
    })
      .then(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

self.addEventListener('push', event => {
  let payload = {};
  try {
    payload = event.data?.json() || {};
  } catch (error) {
    console.error('Unable to parse app update push payload', error);
  }

  const title = typeof payload.title === 'string' ? payload.title : 'تحديث جديد من الوجيه';
  const options = {
    body: typeof payload.body === 'string' ? payload.body : 'يوجد تحديث جديد للتطبيق. اضغط لفتحه.',
    icon: '/pwa-icon-192.png',
    badge: '/pwa-icon-192.png',
    tag: 'elwageh-app-update',
    data: { url: typeof payload.url === 'string' ? payload.url : '/home' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/home', self.location.origin);
  if (target.origin !== self.location.origin) target.href = new URL('/home', self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
      const existingClient = clients.find(client => 'focus' in client);
      if (existingClient) {
        if ('navigate' in existingClient) await existingClient.navigate(target.href);
        return existingClient.focus();
      }
      return self.clients.openWindow(target.href);
    }),
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreVary: true })) || (await caches.match('/', { ignoreVary: true })) || (await caches.match('/repair-booking', { ignoreVary: true })))
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreVary: true }).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          void caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
