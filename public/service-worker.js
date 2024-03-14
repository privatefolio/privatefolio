// eslint-disable-next-line no-restricted-globals
const worker = self

worker.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("my-cache").then((cache) => {
      return cache.addAll(["/", "index.html", "/manifest.json", "/favicon.png"])
    })
  )
})

worker.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
    })
  )
})
