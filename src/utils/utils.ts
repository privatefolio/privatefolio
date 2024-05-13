import { CsvData } from "src/interfaces"

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

export async function wait(interval: number) {
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

export const SITE_DOMAIN = "https://privatefolio.app"
export const isServer = typeof window === "undefined"
export const isProduction = isServer
  ? false
  : Boolean(window.location.toString().includes(SITE_DOMAIN))
export const isNode = typeof process !== "undefined" && process.versions && process.versions.node
export const isWebWorker = isServer && !isNode

export function getExplorerLink(networkIndex: number, addr: string, type: string) {
  if (networkIndex === 0) return `https://etherscan.io/${type}/${addr}`
  if (networkIndex === 1) return `https://arbiscan.io/${type}/${addr}`
  if (networkIndex === 2) return `https://polygonscan.com/${type}/${addr}`
  if (networkIndex === 3) return `https://basescan.org/${type}/${addr}`

  return ""
}

export function formatHex(addr: string) {
  return `${addr.slice(0, 5)}...${addr.slice(-3)}`
}

export function formatCamelCase(str: string) {
  return str
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

export function createCsvString(data: CsvData) {
  return data
    .map((row) =>
      row
        .map((value) => `"${value === undefined ? "" : String(value).replace(/"/g, '""')}"`) // Escape double quotes
        .join(",")
    )
    .join("\n")
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
