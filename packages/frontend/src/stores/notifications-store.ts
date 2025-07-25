import { atom } from "nanostores"

export const $serviceWorker = atom<ServiceWorkerRegistration | undefined>()
export const $pushSubscription = atom<PushSubscription | null>(null)

export function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function getDeviceId() {
  let deviceId = localStorage.getItem("privatefolio-device-uuid")

  if (!deviceId) {
    deviceId = crypto.randomUUID()
    localStorage.setItem("privatefolio-device-uuid", deviceId)
  }

  return deviceId
}

// TODO9
// export async function disableWebPushOnDevice() {
//   await $pushSubscription.get()?.unsubscribe()
//   $pushSubscription.set(null)
// }
