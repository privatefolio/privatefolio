import { atom } from "nanostores"
import { randomUUID } from "src/utils/utils"

export const $serviceWorker = atom<ServiceWorkerRegistration | undefined>()

const DEVICE_ID_KEY = "privatefolio-device-uuid"

export function getDeviceId() {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY)

  if (!deviceId) {
    deviceId = randomUUID()
    localStorage.setItem(DEVICE_ID_KEY, deviceId)
  }

  return deviceId
}
