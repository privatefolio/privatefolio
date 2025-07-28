// eslint-disable-next-line no-restricted-globals
const worker = self as unknown as ServiceWorkerGlobalScope

type PayloadShape = {
  options: NotificationOptions
  title: string
}

worker.addEventListener("push", (event) => {
  const payload: PayloadShape = event.data.json()
  const { title, options } = payload

  event.waitUntil(worker.registration.showNotification(title, options))
})

// Notification click event listener
worker.addEventListener("notificationclick", (event) => {
  // Close the notification popout
  event.notification.close()
  // Get all the Window clients
  event.waitUntil(
    worker.clients.matchAll({ type: "window" }).then((clientsArr) => {
      // If a Window tab matching the targeted URL already exists, focus that;
      const hadWindowToFocus = clientsArr.some((windowClient) =>
        windowClient.url === event.notification.data.url ? (windowClient.focus(), true) : false
      )
      // Otherwise, open a new tab to the applicable URL and focus it.
      if (!hadWindowToFocus) {
        worker.clients
          .openWindow(event.notification.data.url)
          .then((windowClient) => (windowClient ? windowClient.focus() : null))
      }
    })
  )
})

worker.addEventListener("install", () => {
  worker.skipWaiting()
})
