// eslint-disable-next-line no-restricted-globals
const worker = self

worker.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("privatefolio").then((cache) => {
      return cache.addAll(["/", "index.html", "/manifest.json", "/privatefolio.svg"])
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
