/**
 * Service Worker untuk Pizza Snack Play PWA.
 *
 * Strategi caching:
 * - Static assets (JS, CSS, images, fonts): Cache-First + background update
 * - API calls (/api/*): Network-First + 24h stale cache
 * - HTML navigation: Network-First dengan offline fallback ke cached shell
 */

const CACHE_VERSION = "v1";
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

const STATIC_EXTENSIONS = [
  ".js",
  ".css",
  ".woff2",
  ".woff",
  ".ttf",
  ".json",
  ".svg",
  ".png",
  ".ico",
];

const API_PREFIX = "/api/";

// Assets yang selalu diprecache (shell aplikasi)
const PRECACHE_URLS = ["/", "/index.html"];

// ─────────────────────────────────────────────────────────────
// Install — precache shell
// ─────────────────────────────────────────────────────────────

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

// ─────────────────────────────────────────────────────────────
// Activate — bersihkan cache lama
// ─────────────────────────────────────────────────────────────

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !key.endsWith(CACHE_VERSION))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

// ─────────────────────────────────────────────────────────────
// Fetch — routing strategi
// ─────────────────────────────────────────────────────────────

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Hanya handle GET requests
  if (request.method !== "GET") return;

  // API calls: Network-First dengan stale-while-revalidate
  if (url.pathname.startsWith(API_PREFIX)) {
    event.respondWith(networkFirst(request, API_CACHE, 24 * 60 * 60 * 1000));
    return;
  }

  // Static assets: Cache-First dengan background revalidate
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirstWithRevalidate(request, STATIC_CACHE));
    return;
  }

  // Images: Cache-First dengan expiration
  if (isImage(request)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // Navigation / HTML: Network-First dengan fallback ke shell
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(networkFirstWithFallback(request, STATIC_CACHE));
    return;
  }

  // Default: network with cache fallback
  event.respondWith(networkWithCacheFallback(request, STATIC_CACHE));
});

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────

function isStaticAsset(pathname) {
  return STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function isImage(request) {
  const dest = request.destination;
  return dest === "image" || /^\.(png|jpg|jpeg|gif|webp|avif|bmp)$/i.test(new URL(request.url).pathname);
}

/** Cache-First: ambil dari cache, bila miss baru fetch. */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

/** Cache-First + background revalidate (stale-while-revalidate). */
async function cacheFirstWithRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  if (cached) {
    // Background update cache tanpa blocking user
    networkFetch;
    return cached;
  }

  const response = await networkFetch;
  if (response) return response;

  return new Response("Offline", { status: 503 });
}

/** Network-First: coba fetch, fallback ke cache. */
async function networkFirst(request, cacheName, maxAgeMs) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const clone = networkResponse.clone();
      const headers = new Headers(clone.headers);
      headers.set("x-sw-cached-at", Date.now().toString());
      const cachedResponse = new Response(clone.body, {
        status: clone.status,
        statusText: clone.statusText,
        headers,
      });
      cache.put(request, cachedResponse);
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const cachedAt = cached.headers.get("x-sw-cached-at");
      if (cachedAt && Date.now() - Number(cachedAt) < maxAgeMs) {
        return cached;
      }
    }
    return new Response(
      JSON.stringify({ message: "Anda sedang offline", data: null }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

/** Network-First untuk navigation dengan fallback ke shell. */
async function networkFirstWithFallback(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    // Fallback ke index.html untuk SPA routing
    const shell = await cache.match("/index.html");
    if (shell) return shell;

    return new Response(
      `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>Offline</title></head>
<body style="font-family:sans-serif;text-align:center;padding:40px;color:#51277C;">
  <h1>Anda Offline</h1>
  <p>Periksa koneksi internet Anda dan coba lagi.</p>
</body>
</html>`,
      { headers: { "Content-Type": "text/html" } },
    );
  }
}

/** Network with cache fallback (default strategy). */
async function networkWithCacheFallback(request, cacheName) {
  const cache = await caches.open(cacheName);

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch {
    const cached = await cache.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}

// ─────────────────────────────────────────────────────────────
// Background Sync (opsional — untuk queue request saat offline)
// ─────────────────────────────────────────────────────────────

self.addEventListener("sync", (event) => {
  if (event.tag === "sync-schedules") {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  // Implementasi background sync bisa ditambahkan di sini
  // Simpan request yang gagal ke IndexedDB, lalu kirim ulang
}

// ─────────────────────────────────────────────────────────────
// Push Notification (placeholder)
// ─────────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "Pizza Snack Play", {
      body: data.body || "Ada pembaruan jadwal snack!",
      icon: "/pwa/icon-192x192.png",
      badge: "/pwa/icon-192x192.png",
      tag: data.tag || "snack-update",
      requireInteraction: false,
      data: data.url ? { url: data.url } : undefined,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
