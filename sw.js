/* Castelo da Memória · service worker
   Faz três coisas: guarda o app para abrir sem internet, recebe push e trata o toque na notificação.
   Ao publicar uma versão nova do app, aumente VERSION para os aparelhos atualizarem. */
const VERSION = 'v2';
const SHELL = 'castelo-shell-' + VERSION;
const CDN = 'castelo-cdn-v1';
const SHELL_FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
const CDN_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => Promise.all(SHELL_FILES.map((f) => c.add(f).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('castelo-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Bibliotecas e fontes: usa o que já está guardado e atualiza em segundo plano.
  if (CDN_HOSTS.includes(url.hostname)) {
    e.respondWith(
      caches.open(CDN).then((cache) =>
        cache.match(req).then((hit) => {
          const net = fetch(req).then((res) => {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            return res;
          }).catch(() => hit);
          return hit || net;
        })
      )
    );
    return;
  }

  if (url.origin !== self.location.origin) return; // Supabase e o resto passam direto

  // Páginas: tenta a rede e cai para o que está guardado.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }

  // Arquivos do próprio app: guardado primeiro, atualizando em segundo plano.
  e.respondWith(
    caches.open(SHELL).then((cache) =>
      cache.match(req).then((hit) => {
        const net = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    )
  );
});

self.addEventListener('push', (e) => {
  let data = {};
  try { data = e.data ? e.data.json() : {}; } catch (err) { data = { title: 'Castelo da Memória', body: e.data ? e.data.text() : '' }; }
  const title = data.title || 'Castelo da Memória';
  e.waitUntil((async () => {
    // Se o app está aberto e visível, ele mesmo mostra o alarme na tela.
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const visible = wins.some((c) => c.visibilityState === 'visible');
    if (visible && data.kind !== 'test') {
      wins.forEach((c) => c.postMessage({ type: 'push', data }));
      return;
    }
    await self.registration.showNotification(title, {
      body: data.body || '',
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: data.key || 'castelo',
      renotify: true,
      requireInteraction: data.kind === 'alert',
      vibrate: [250, 120, 250],
      data: { key: data.key || '', kind: data.kind || '' },
      actions: [{ action: 'open', title: 'Abrir' }],
    });
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const key = (e.notification.data && e.notification.data.key) || '';
  const target = new URL('./' + (key ? '?run=' + encodeURIComponent(key) : ''), self.registration.scope).href;
  e.waitUntil((async () => {
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of wins) {
      if ('focus' in c) {
        c.postMessage({ type: 'open', key });
        return c.focus();
      }
    }
    return self.clients.openWindow(target);
  })());
});

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
