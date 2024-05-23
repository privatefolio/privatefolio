import { isAddress } from "ethers"
import {
  AuditLog,
  AuditLogOperation,
  EtherscanTransaction,
  ParserResult,
  TransactionType,
} from "src/interfaces"
import { PlatformId } from "src/settings"
import { asUTC } from "src/utils/formatting-utils"
import { isSpamToken } from "src/utils/integrations/etherscan-utils"

import { extractColumnsFromRow } from "../csv-utils"
export const Identifier = "etherscan-erc20"
export const platform: PlatformId = "ethereum"

export const HEADER =
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"'

export function parser(
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
): ParserResult {
  // ----------------------------------------------------------------- Parse
  const userAddress = parserContext.userAddress as string
  if (!userAddress) {
    throw new Error("'userAddress' is required for this type of file import")
  }
  if (!isAddress(userAddress)) {
    throw new Error("'userAddress' is not valid.")
  }
  const columns = extractColumnsFromRow(csvRow, 11)
  //
  const txHash = columns[0]
  // const blockNumber = columns[1]
  // const unixTimestamp = columns[2]
  const datetimeUtc = columns[3]
  const from = columns[4]
  const to = columns[5]
  const tokenValue = columns[6].replaceAll(",", "")
  // const tokenValueHistorical = columns[7]
  const contractAddress = columns[8]
  // const tokenName = columns[9]
  const symbol = columns[10].trim()
  if (tokenValue === "0") {
    return { logs: [] }
  }
  if (isSpamToken(contractAddress, symbol)) {
    return { logs: [] }
  }
  // ----------------------------------------------------------------- Derive
  const timestamp = asUTC(new Date(datetimeUtc))
  if (isNaN(timestamp)) {
    throw new Error(`Invalid timestamp: ${datetimeUtc}`)
  }
  const txId = `${fileImportId}_${txHash}_ERC20_${index}`
  const operation: AuditLogOperation =
    to.toLowerCase() === userAddress.toLowerCase() ? "Deposit" : "Withdraw"
  const type: TransactionType = operation
  const wallet = operation === "Deposit" ? to : from
  const assetId = `${platform}:${contractAddress}:${symbol}`
  const importId = fileImportId
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined, incomingN: number | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined, outgoingN: number | undefined

  if (operation === "Deposit") {
    incoming = tokenValue
    incomingN = parseFloat(incoming)
    incomingAsset = assetId
  } else {
    outgoing = tokenValue
    outgoingN = parseFloat(outgoing)
    outgoingAsset = assetId
  }

  const change = operation === "Deposit" ? tokenValue : `-${tokenValue}`
  const changeN = parseFloat(change)

  const logs: AuditLog[] = [
    {
      _id: `${txId}_TRANSFER_${index}`,
      assetId,
      change,
      changeN,
      importId,
      importIndex,
      operation,
      platform,
      timestamp,
      txId,
      wallet,
    },
  ]

  const tx: EtherscanTransaction = {
    _id: txId,
    contractAddress: contractAddress || undefined,
    importId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    incomingN: incoming === "0" ? undefined : incomingN,
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    outgoingN: outgoing === "0" ? undefined : outgoingN,
    platform,
    timestamp,
    txHash,
    type,
    wallet,
  }

  return { logs, txns: [tx] }
}
