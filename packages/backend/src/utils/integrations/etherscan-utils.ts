import spamTokens from "src/config/spam-tokens.json"
import { EtherscanTransaction, Transaction } from "src/interfaces"

import { trimTxId } from "../test-utils"

function toTitleCase(text: string): string {
  return (
    text
      // First, insert a space before all caps (except for a sequence of uppercase letters considered as acronyms)
      .replace(/([A-Z]+)([A-Z][a-z])/g, " $1 $2")
      // Then, insert a space before any capital letters followed by lowercase letters
      .replace(/([a-z\d])([A-Z])/g, "$1 $2")
      // Finally, capitalize the first letter of the resulting string
      .replace(/^./, (str) => str.toUpperCase())
  )
}

export function extractMethodFromFunctionName(functionName: string) {
  const parts = functionName.split("(")
  const methodName = toTitleCase(parts[0])

  if (methodName === "0x") {
    return "Transfer"
  }

  return toTitleCase(parts[0])
}

function validTransactionGrouping(transactions: EtherscanTransaction[]) {
  if (transactions.length > 3) {
    return false
  }

  if (transactions.filter((tx) => tx.incoming !== undefined).length > 1) {
    return false
  }
  if (transactions.filter((tx) => tx.outgoing !== undefined).length > 1) {
    return false
  }
  if (transactions.filter((tx) => tx.fee !== undefined).length > 1) {
    return false
  }

  return true
}

export function sortTransactions(
  a: Pick<Transaction, "timestamp" | "platform" | "id">,
  b: Pick<Transaction, "timestamp" | "platform" | "id">
) {
  const delta = b.timestamp - a.timestamp

  if (delta === 0 && a.platform === "ethereum") {
    return trimTxId(a.id, a.platform).localeCompare(trimTxId(b.id, b.platform))
  }

  return delta
}

export function mergeTransactions(transactions: EtherscanTransaction[]) {
  const sorted = transactions.sort(sortTransactions)

  const merged: EtherscanTransaction[] = []
  const deduplicateMap: Record<string, EtherscanTransaction[]> = {}

  const groups: Record<string, EtherscanTransaction[]> = {}
  for (const tx of sorted) {
    const key = tx.metadata.txHash
    if (!groups[key]) {
      groups[key] = [tx]
    } else {
      groups[key].push(tx)
    }
  }

  for (const i in groups) {
    const group = groups[i]
    const validGrouping = validTransactionGrouping(group)

    if (group.length > 1 && validGrouping) {
      const tx = Object.assign({}, group[0])

      tx.id = `${tx.fileImportId || tx.connectionId}_${tx.metadata.txHash}_MERGED`

      const incomingTx = group.find((tx) => tx.incoming !== undefined)
      tx.incoming = incomingTx?.incoming
      tx.incomingAsset = incomingTx?.incomingAsset

      const outgoingTx = group.find((tx) => tx.outgoing !== undefined)
      tx.outgoing = outgoingTx?.outgoing
      tx.outgoingAsset = outgoingTx?.outgoingAsset

      const feeTx = group.find((tx) => tx.fee !== undefined)
      tx.fee = feeTx?.fee
      tx.feeAsset = feeTx?.feeAsset

      if (tx.incomingAsset && tx.outgoingAsset) {
        tx.type = "Swap"
      }

      merged.push(tx)
      deduplicateMap[tx.id] = group
    }
  }
  return { deduplicateMap, merged }
}

export function isSpamToken(contractAddress: string, symbol: string) {
  const token = symbol.toLocaleLowerCase()

  return (
    contractAddress in spamTokens ||
    token.includes("http") ||
    token.includes(".com") ||
    token.includes(".org") ||
    token.includes(".net") ||
    token.includes(".io") ||
    token.includes("visit") ||
    token.includes("claim")
  )
}
