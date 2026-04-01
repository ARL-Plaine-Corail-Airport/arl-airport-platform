const CACHE_NAME = 'arl-static-v4'
const OFFLINE_URL = '/offline'

// Pages that should be available offline (precached on install)
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/passenger-guide',
  '/contact',
  '/faq',
  '/airport-map',
  '/accessibility',
  '/transport-parking',
  '/emergency-services',
  '/useful-links',
  '/notices',
  '/amenities',
  '/vip-lounge',
]

// Routes that should never be cached (admin/dashboard, API)
const EXCLUDED_PREFIXES = ['/admin', '/dashboard', '/api']

// Asset extensions to cache opportunistically on first visit
const CACHEABLE_ASSET_RE = /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)(\?|$)/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key)
          return Promise.resolve()
        }),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  const pathname = url.pathname

  if (request.method !== 'GET') return

  // Never cache admin, dashboard, or API routes
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses for offline use
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          // Try cached version first, then offline page
          const cache = await caches.open(CACHE_NAME)
          const cached = await cache.match(request)
          if (cached) return cached
          return cache.match(OFFLINE_URL)
        }),
    )
    return
  }

  // Static assets: cache-first (JS, CSS, fonts, images)
  if (CACHEABLE_ASSET_RE.test(pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
      }),
    )
    return
  }

  // Precached pages: cache-first
  if (PRECACHE_URLS.includes(pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request)),
    )
  }
})
