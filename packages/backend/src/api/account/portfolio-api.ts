import { setValue } from "./kv-api"
import { getTransactions } from "./transactions-api"

export async function computeGenesis(accountName: string) {
  const res = await getTransactions(
    accountName,
    "SELECT * FROM transactions ORDER BY timestamp ASC LIMIT 1"
  )
  const genesis = res.length === 0 ? 0 : res[0].timestamp
  await setValue("genesis", genesis, accountName)
}

export async function computeLastTx(accountName: string) {
  const res = await getTransactions(
    accountName,
    "SELECT * FROM transactions ORDER BY timestamp DESC LIMIT 1"
  )
  const lastTx = res.length === 0 ? 0 : res[0].timestamp
  await setValue("lastTx", lastTx, accountName)
}
