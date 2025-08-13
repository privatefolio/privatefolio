import { accessSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { access, mkdir, readFile, writeFile } from "fs/promises"
import { join } from "path"

export function ensureDirectorySync(dir: string) {
  try {
    accessSync(dir)
  } catch {
    mkdirSync(dir, { recursive: true })
  }
}

export async function ensureDirectory(dir: string) {
  try {
    await access(dir)
  } catch {
    await mkdir(dir, { recursive: true })
  }
}

export async function getOrInitialize(dir: string, filename: string, initFn: () => string) {
  await ensureDirectory(dir)

  const filePath = join(dir, filename)
  try {
    await access(filePath)
    const value = await readFile(filePath, "utf8")
    return value
  } catch {
    const value = initFn()
    await writeFile(filePath, value, "utf8")
    return value
  }
}

export function getOrInitializeSync(dir: string, filename: string, initFn: () => string) {
  ensureDirectorySync(dir)

  const filePath = join(dir, filename)
  try {
    accessSync(filePath)
    const value = readFileSync(filePath, "utf8")
    return value
  } catch {
    const value = initFn()
    writeFileSync(filePath, value, "utf8")
    return value
  }
}
