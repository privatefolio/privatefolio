import { isHexString } from "ethers"

export function normalizeTxHash(txHash: string) {
  if (typeof txHash !== "string") {
    throw new Error("Invalid txHash type")
  }

  const trimmed = txHash.trim()

  if (!isHexString(trimmed)) {
    throw new Error("Invalid hex string")
  }

  if (trimmed.length !== 66) {
    throw new Error("Invalid txHash length")
  }

  return trimmed.startsWith("0x") ? trimmed : `0x${trimmed}`
}
