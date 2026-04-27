const CACHE_PREFIX = 'arl-static-'
const CACHE_VERSION = (
  new URL(self.location.href).searchParams.get('v') || 'dev'
).replace(/[^a-zA-Z0-9._-]/g, '-')
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`
const DEFAULT_LOCALE = 'en'
const LOCALES = ['en', 'fr', 'mfe']
const OFFLINE_PATH = '/offline'
const LOCAL_DEV_HOSTS = new Set(['localhost', '127.0.0.1'])
const IS_LOCAL_DEV = LOCAL_DEV_HOSTS.has(self.location.hostname)

const PUBLIC_ROUTES = [
  '/',
  OFFLINE_PATH,
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

function localePath(path, locale) {
  return path === '/' ? `/${locale}` : `/${locale}${path}`
}

function getLocaleFromPath(pathname) {
  const segment = pathname.split('/').filter(Boolean)[0]
  return LOCALES.includes(segment) ? segment : null
}

function stripLocalePrefix(pathname) {
  const locale = getLocaleFromPath(pathname)
  if (!locale) return pathname

  const stripped = pathname.slice(locale.length + 1)
  return stripped || '/'
}

function getOfflineFallbackUrl(pathname) {
  const locale = getLocaleFromPath(pathname) ?? DEFAULT_LOCALE
  return localePath(OFFLINE_PATH, locale)
}

const PRECACHE_URLS = LOCALES.flatMap((locale) =>
  PUBLIC_ROUTES.map((route) => localePath(route, locale)),
)

const EXCLUDED_PREFIXES = ['/admin', '/dashboard']
const LIVE_API_ROUTES = ['/api/flight-board', '/api/weather']
const CACHEABLE_ASSET_RE = /\.(js|css|woff2?|ttf|png|jpg|jpeg|svg|webp|ico)(\?|$)/

async function deleteAirportCaches() {
  const keys = await caches.keys()
  await Promise.all(
    keys
      .filter((key) => key.startsWith(CACHE_PREFIX))
      .map((key) => caches.delete(key)),
  )
}

function createOfflineResponse() {
  return new Response('Offline content unavailable.', {
    status: 503,
    statusText: 'Offline',
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

async function matchCached(request, fallbackKey) {
  const cached = await caches.match(request, { ignoreSearch: true })
  if (cached) return cached

  if (fallbackKey) {
    const fallback = await caches.match(fallbackKey)
    if (fallback) return fallback
  }

  return null
}

function hasNoStoreDirective(response) {
  const cacheControl = response?.headers?.get('Cache-Control') ?? ''
  return /(?:^|,)\s*no-store\s*(?:,|$)/i.test(cacheControl)
}

function isCacheableResponse(response) {
  return (
    Boolean(response?.ok) &&
    !response.redirected &&
    response.type !== 'opaqueredirect' &&
    !hasNoStoreDirective(response)
  )
}

function isQuotaExceededError(error) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'QuotaExceededError'
  )
}

async function safeCachePut(request, response) {
  if (!isCacheableResponse(response)) return

  try {
    const responseToCache = response.clone()
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, responseToCache)
  } catch (error) {
    if (isQuotaExceededError(error)) {
      console.warn('[sw] Cache quota exceeded')
      return
    }

    console.warn('[sw] Failed to cache response', error)
  }
}

function cacheResponse(request, response) {
  void safeCachePut(request, response)
}

async function precacheUrl(cache, url) {
  try {
    await cache.add(url)
  } catch (error) {
    console.warn(`[sw] Failed to precache ${url}`, error)
  }
}

async function precacheUrls(urls) {
  try {
    const cache = await caches.open(CACHE_NAME)
    await Promise.all(urls.map((url) => precacheUrl(cache, url)))
  } catch (error) {
    console.warn('[sw] Failed to open precache cache', error)
  }
}

self.addEventListener('install', (event) => {
  if (IS_LOCAL_DEV) {
    self.skipWaiting()
    return
  }

  event.waitUntil(precacheUrls(PRECACHE_URLS))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  if (IS_LOCAL_DEV) {
    event.waitUntil(
      deleteAirportCaches().then(() => self.registration.unregister()),
    )
    return
  }

  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (IS_LOCAL_DEV) return

  const { request } = event
  const url = new URL(request.url)
  const pathname = url.pathname
  const normalizedPathname = stripLocalePrefix(pathname)

  if (request.method !== 'GET') return
  if (url.origin !== self.location.origin) return

  if (EXCLUDED_PREFIXES.some((prefix) => normalizedPathname.startsWith(prefix))) {
    return
  }

  if (LIVE_API_ROUTES.some((route) => pathname.startsWith(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(request, response)
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (!cached) return Response.error()

          const headers = new Headers(cached.headers)
          headers.set('X-SW-Stale', 'true')
          return new Response(cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers,
          })
        }),
    )
    return
  }

  if (pathname.startsWith('/api/')) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheResponse(request, response)
          return response
        })
        .catch(async () => {
          const cached = await matchCached(request)
          if (cached) return cached
          return (await caches.match(getOfflineFallbackUrl(pathname))) || createOfflineResponse()
        }),
    )
    return
  }

  if (CACHEABLE_ASSET_RE.test(pathname)) {
    event.respondWith(
      caches.match(request, { ignoreSearch: true }).then((cached) => {
        if (cached) return cached
        return fetch(request)
          .then((response) => {
            cacheResponse(request, response)
            return response
          })
          .catch(() => Response.error())
      }),
    )
    return
  }

  if (PRECACHE_URLS.includes(pathname)) {
    event.respondWith(
      matchCached(request, pathname).then((cached) => {
        if (cached) return cached

        return fetch(request)
          .then((response) => {
            cacheResponse(request, response)
            return response
          })
          .catch(async () => {
            return (await caches.match(getOfflineFallbackUrl(pathname))) || createOfflineResponse()
          })
      }),
    )
  }
})
