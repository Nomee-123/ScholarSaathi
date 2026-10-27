const CACHE_NAME = 'scholarsaathi-shell-v3'
const APP_SHELL = ['./', './index.html']

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME)
    await cache.addAll(APP_SHELL)
    const index = await cache.match('./index.html')
    const html = await index?.text()
    if (!html) throw new Error('Could not read the application shell for offline caching')
    const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+)"/g)].map((match) => match[1])
    await Promise.all(assets.map(async (asset) => {
      const response = await fetch(asset)
      if (!response.ok) throw new Error(`Could not cache application asset: ${asset}`)
      await cache.put(asset, response)
    }))
  })())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put('./index.html', copy))
          return response
        })
        .catch(async () => (await caches.match('./index.html')) ?? Response.error()),
    )
    return
  }

  if (url.pathname.includes('/assets/')) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached
        const response = await fetch(request)
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
        }
        return response
      }),
    )
  }
})
