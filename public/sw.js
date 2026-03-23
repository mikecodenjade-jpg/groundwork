// ─── BuildMyGroundwork Service Worker ─────────────────────────────────────────
// Handles offline caching, background sync, and push notifications
// for construction worker wellness app.

// ─── Cache Names ─────────────────────────────────────────────────────────────
const CACHE_VERSION = 'v1';
const STATIC_CACHE = `groundwork-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `groundwork-runtime-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
// Clean up old caches when a new SW version takes over
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE && key !== RUNTIME_CACHE)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Check if a URL points to a static asset (fonts, images, CSS, JS bundles)
 */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.ico') ||
    /\.(css|js|woff2?|ttf|svg|png|jpg|jpeg|gif|webp)$/.test(url.pathname)
  );
}

/**
 * Check if a URL is an API call (internal or Supabase)
 */
function isApiCall(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.com')
  );
}

/**
 * Cache-first strategy: serve from cache, fall back to network.
 * Best for static assets that rarely change.
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

/**
 * Network-first strategy: try network, fall back to cache.
 * Best for API calls and dynamic content.
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'offline', cached: false }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Navigation handler: network-first with offline page fallback.
 * Used for HTML page navigations.
 */
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Serve the offline page as a fallback
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    return new Response('<h1>You are offline</h1>', {
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Fetch ───────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests over HTTP(S)
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Route to the appropriate caching strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (isApiCall(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Default: network-first for everything else
  event.respondWith(networkFirst(request));
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-logs') {
    event.waitUntil(syncQueuedActions());
  }
});

/**
 * Process queued actions from IndexedDB and send them to the server.
 * Failed items remain in the queue for the next sync attempt.
 */
async function syncQueuedActions() {
  try {
    const db = await openIDB();
    const tx = db.transaction('sync-queue', 'readonly');
    const store = tx.objectStore('sync-queue');
    const allRequest = store.getAll();

    await new Promise((resolve, reject) => {
      allRequest.onsuccess = async () => {
        const items = allRequest.result;
        for (const item of items) {
          try {
            const response = await fetch(item.url, {
              method: item.method || 'POST',
              headers: { 'Content-Type': 'application/json', ...item.headers },
              body: item.body,
            });
            if (response.ok) {
              // Remove successfully synced item from queue
              const delTx = db.transaction('sync-queue', 'readwrite');
              delTx.objectStore('sync-queue').delete(item.id);
            }
          } catch {
            // Leave in queue for next sync attempt
          }
        }
        resolve();
      };
      allRequest.onerror = reject;
    });
  } catch {
    // IndexedDB not available or empty queue — nothing to do
  }
}

/**
 * Open the groundwork-offline IndexedDB database.
 * Creates object stores on first open.
 */
function openIDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('groundwork-offline', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('sync-queue')) {
        const store = db.createObjectStore('sync-queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('tag', 'tag');
      }
      if (!db.objectStoreNames.contains('cache-data')) {
        db.createObjectStore('cache-data', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data = {};
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Groundwork', body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'Groundwork', {
      body: data.body || '',
      icon: '/icons/icon-192.svg',
      badge: '/icons/icon-192.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/dashboard' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus an existing window if one is open at the target URL
      const existing = clients.find((c) => c.url.includes(url));
      if (existing) return existing.focus();
      // Otherwise open a new window
      return self.clients.openWindow(url);
    })
  );
});
