import { AuditLog, Transaction } from "src/interfaces"

export async function getCoinstatsPortfolio(
  apiKey: string,
  since: number,
  until: number
): Promise<{
  auditLogs: AuditLog[]
  transactions: Transaction[]
}> {
  const url = `https://openapi.coinstats.app/api/v1/portfolio/history?from=${since}&to=${until}`
  const res = await fetch(url, {
    headers: {
      "X-API-KEY": apiKey,
    },
  })
  if (!res.ok) {
    throw new Error(`CoinStats API: ${res.status}`)
  }
  const data = await res.json()
  return {
    auditLogs: (data.auditLogs || []) as AuditLog[],
    transactions: (data.transactions || []) as Transaction[],
  }
}
