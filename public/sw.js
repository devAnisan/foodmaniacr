const CACHE = 'foodmania-v2'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html').then((cached) => cached || fetch(event.request))
      )
    )
    return
  }
  if (/googleapis\.com|firestore\.googleapis/.test(event.request.url)) {
    return
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      if (response.ok && /\.(js|css|png|svg|woff2?)$/.test(event.request.url)) {
        const cloned = response.clone()
        caches.open(CACHE).then((cache) => cache.put(event.request, cloned))
      }
      return response
    }))
  )
})
