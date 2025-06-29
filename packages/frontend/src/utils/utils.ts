import { createCsvString } from "privatefolio-backend/build/src/utils/csv-utils"
import { STATIC_ASSET_LOCATION } from "src/env"

import { CsvData, ProgressLog } from "../interfaces"

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {String}    A string hash
 * @see http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 * @see https://stackoverflow.com/questions/6122571/simple-non-secure-hash-function-for-javascript
 * @see https://devdocs.io/openjdk~8/java/lang/string#hashCode--
 */
export function hashString(str: string): string {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = ((hash << 5) - hash + chr) >>> 0 // Convert to 32bit unsigned integer
  }
  return hash.toString()
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
export function noop() {}

export const SPRING_CONFIGS = {
  quick: { clamp: true, friction: 200, mass: 5, tension: 2000 },
  quicker: { clamp: true, friction: 200, mass: 5, tension: 3000 },
  slow: { clamp: true, friction: 200, mass: 5, tension: 1500 },
  ultra: { clamp: true, friction: 200, mass: 5, tension: 6000 },
  veryQuick: { clamp: true, friction: 200, mass: 5, tension: 4000 },
  verySlow: { clamp: true, friction: 200, mass: 50, tension: 250 },
}

export async function sleep(interval: number) {
  return new Promise((resolve) => setTimeout(resolve, interval))
}

export function timeQueue<T extends (...args: never[]) => void>(
  this: unknown,
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  const queue: (() => void)[] = []
  let timerId: ReturnType<typeof setInterval> | null = null

  function processQueue() {
    if (queue.length === 0) {
      if (timerId !== null) {
        clearInterval(timerId)
        timerId = null
      }
    } else {
      const call = queue.shift()
      call?.()
    }
  }

  return function (this: unknown, ...args: Parameters<T>) {
    queue.push(() => func.apply(this, args))

    if (timerId === null) {
      timerId = setInterval(processQueue, delay)
    }
  }
}

export const EMPTY_OBJECT = Object.freeze({})

export * from "./environment-utils"

/**
 * Removes the protocol from a URL and www. as well as the trailing slash
 */
export function formatWebsiteLink(url: string) {
  return url
    .replace(/(^\w+:|^)\/\//, "")
    .replace("www.", "")
    .replace(/\/$/, "")
}

export function formatHex(addr: string, long = false) {
  const digits = long ? 6 : 4
  return `${addr.slice(0, 2 + digits)}...${addr.slice(-digits)}`
}

export function formatCamelCase(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function base64ToBlob(base64Data: string, mimeType: string): Blob {
  // Decode the base64 string
  const byteCharacters = atob(base64Data)

  // Convert each character to a byte
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }

  // Convert to Uint8Array and create a Blob
  const byteArray = new Uint8Array(byteNumbers)
  return new Blob([byteArray], { type: mimeType })
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64String = reader.result?.toString().split(",")[1] // Strip the data URL part
      resolve(base64String || "")
    }
    reader.onerror = reject
    reader.readAsDataURL(blob) // Read the Blob as Data URL
  })
}

export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.setAttribute("download", filename)
  document.body.appendChild(link) // Required for Firefox
  link.click()
  document.body.removeChild(link) // Clean up
  URL.revokeObjectURL(url) // Free up resources
}

export function downloadCsv(data: CsvData, filename: string) {
  const blob = new Blob([createCsvString(data)], { type: "text/csv;charset=utf-8;" })
  downloadFile(blob, filename)
}

export function requestFile(allowedFileExtensions: string[], multiple = false): Promise<FileList> {
  return new Promise((resolve, reject) => {
    const fileInput = document.createElement("input")
    fileInput.type = "file"
    fileInput.accept = allowedFileExtensions.join(",")
    fileInput.multiple = multiple
    fileInput.style.display = "none"

    fileInput.addEventListener("change", () => {
      if (fileInput.files && fileInput.files.length > 0) {
        resolve(fileInput.files)
      } else {
        reject(new Error("No file selected"))
      }
    })

    // Simulate a click to open the file dialog
    document.body.appendChild(fileInput)
    fileInput.click()
    document.body.removeChild(fileInput)

    // Handle the case where the user cancels the file selection
    fileInput.addEventListener("click", () => {
      // Use a timeout to check if the input dialog was cancelled
      setTimeout(() => {
        if (fileInput.files === null || fileInput.files.length === 0) {
          reject(new Error("File selection was canceled"))
        }
      }, 0)
    })
  })
}

export function parseProgressLog(logEntry: string): ProgressLog {
  const isoDate = logEntry.slice(0, 24)
  const timestamp = new Date(isoDate).getTime()
  const progressUpdate = JSON.parse(logEntry.slice(25))
  return [timestamp, progressUpdate] satisfies ProgressLog
}

export function resolveUrl(url?: string) {
  if (!url) return url

  if (url.includes("$STATIC_ASSETS")) {
    return url.replace("$STATIC_ASSETS", STATIC_ASSET_LOCATION)
  }

  return url
}

export function prettifyUrl(url: string) {
  url = url.replaceAll("https://", "")
  url = url.replaceAll("http://", "")
  url = url.replaceAll("www.", "")
  url = url.replace("github.com/privatefolio/privatefolio/tree/main/", "")
  return url
}

export function extractRootUrl(url: string) {
  url = url.replaceAll("https://", "")
  url = url.replaceAll("http://", "")
  url = url.replaceAll("www.", "")
  url = url.endsWith("/") ? url.slice(0, -1) : url
  url = url.split("/")[0] // remove anything beyond the root tld
  return url
}
