/*
  Service Worker básico para Next.js
  - Navegações: network-first com fallback para /offline.html
  - Assets estáticos: cache-first com atualização em segundo plano
*/

const CACHE_NAME = 'elisha-pwa-v2';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // Pré-cache mínimo para offline
      await cache.addAll([OFFLINE_URL]);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Limpa caches antigos
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );

      // Habilita navigation preload quando disponível
      if ('navigationPreload' in self.registration) {
        try { await self.registration.navigationPreload.enable(); } catch (_) {}
      }

      await self.clients.claim();
    })()
  );
});

function isNavigateRequest(request) {
  return request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept')?.includes('text/html'));
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return; // ignora POST/PUT/...

  // Não interceptar manifest para evitar desatualização de ícones/metadata
  if (request.destination === 'manifest') {
    event.respondWith(
      (async () => {
        try { return await fetch(request); } 
        catch (_) { return await caches.match(request) || Response.error(); }
      })()
    );
    return;
  }

  // Navegações: network-first com fallback offline
  if (isNavigateRequest(request)) {
    event.respondWith(
      (async () => {
        try {
          const preload = await event.preloadResponse;
          if (preload) return preload;
          const networkResponse = await fetch(request);
          return networkResponse;
        } catch (err) {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(OFFLINE_URL);
          return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
    return;
  }

  // Assets da mesma origem: cache-first com atualização em segundo plano
  const url = new URL(request.url);
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) {
          // atualiza em segundo plano
          event.waitUntil(
            (async () => {
              try {
                const res = await fetch(request);
                const cache = await caches.open(CACHE_NAME);
                await cache.put(request, res.clone());
              } catch (_) {}
            })()
          );
          return cached;
        }

        try {
          const res = await fetch(request);
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, res.clone());
          return res;
        } catch (err) {
          // Sem cache e sem rede
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        }
      })()
    );
  }
});
