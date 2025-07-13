import { access } from "fs/promises"
import { join } from "path"
import { DATABASES_LOCATION } from "src/settings/settings"

export function sql(strings: TemplateStringsArray, ...values: unknown[]): string {
  // This function doesn't need to do anything special
  return strings.raw.reduce((prev, curr, i) => prev + curr + (values[i] || ""), "")
}

export function isReadQuery(query: string): boolean {
  const q = query
    .trim()
    .replace(/--.*$/gm, "") // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim()
    .toUpperCase()

  const multipleStatements = q.includes(";")
  if (multipleStatements) {
    // console.log("📜 LOG > multiple statements:", q)
    return false
  }

  if (!/^(SELECT|PRAGMA|EXPLAIN|WITH)\b/.test(q)) {
    // console.log("📜 LOG > write query:", query)
    return false
  }

  // console.log("📜 LOG > read query:", query)
  return true
}

export async function isMarkedForDeletion(accountName: string): Promise<boolean> {
  return access(join(DATABASES_LOCATION, `${accountName}.deleting`))
    .then(() => true)
    .catch(() => false)
}

export async function ensureActiveAccount(
  accountName: string,
  closeDatabase?: () => Promise<void>
) {
  if (await isMarkedForDeletion(accountName)) {
    await closeDatabase?.()
    throw new Error("Account is marked for deletion")
  }
}
