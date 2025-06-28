import { isAddress } from "ethers"
import { isSpamToken } from "src/extensions/utils/etherscan-utils"
import {
  AuditLog,
  AuditLogOperation,
  ParserResult,
  Transaction,
  TransactionType,
} from "src/interfaces"
import { formatAddress } from "src/utils/assets-utils"
import { extractColumnsFromRow } from "src/utils/csv-utils"
import { asUTC } from "src/utils/formatting-utils"

export const extensionId = "etherscan-file-import"
export const parserId = "etherscan-erc20"
export const platformId = "c/ethereum"

export const HEADERS = [
  '"Txhash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"',
  '"Transaction Hash","Blockno","UnixTimestamp","DateTime (UTC)","From","To","TokenValue","USDValueDayOfTx","ContractAddress","TokenName","TokenSymbol"',
]

export const requirements = ["userAddress"]

export function parse(
  csvRow: string,
  index: number,
  fileImportId: string,
  parserContext: Record<string, unknown>
): ParserResult {
  // ----------------------------------------------------------------- Parse
  let userAddress = parserContext.userAddress as string
  if (!userAddress) {
    throw new Error("'userAddress' is required for this type of file import")
  }
  if (!isAddress(userAddress)) {
    throw new Error("'userAddress' is not valid.")
  }
  userAddress = formatAddress(userAddress)
  const columns = extractColumnsFromRow(csvRow, 11)
  //
  const txHash = columns[0]
  // const blockNumber = columns[1]
  // const unixTimestamp = columns[2]
  const datetimeUtc = columns[3]
  const from = formatAddress(columns[4])
  const to = formatAddress(columns[5])
  const tokenValue = columns[6].replaceAll(",", "")
  // const tokenValueHistorical = columns[7]
  const contractAddress = formatAddress(columns[8])
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
  const operation: AuditLogOperation = to === userAddress ? "Deposit" : "Withdraw"
  const type: TransactionType = operation
  const wallet = operation === "Deposit" ? to : from
  const assetId = `${platformId}:${contractAddress}:${symbol}`
  const importId = fileImportId
  const importIndex = index

  let incoming: string | undefined, incomingAsset: string | undefined
  let outgoing: string | undefined, outgoingAsset: string | undefined

  if (operation === "Deposit") {
    incoming = tokenValue
    incomingAsset = assetId
  } else {
    outgoing = tokenValue
    outgoingAsset = assetId
  }

  const change = operation === "Deposit" ? tokenValue : `-${tokenValue}`

  const logs: AuditLog[] = [
    {
      assetId,
      change,
      fileImportId: importId,
      id: `${txId}_TRANSFER_${index}`,
      importIndex,
      operation,
      platformId,
      timestamp,
      txId,
      wallet,
    },
  ]

  const tx: Transaction = {
    fileImportId: importId,
    id: txId,
    importIndex,
    incoming: incoming === "0" ? undefined : incoming,
    incomingAsset: incoming === "0" ? undefined : incomingAsset,
    metadata: {
      contractAddress: contractAddress || undefined,
      txHash,
    },
    outgoing: outgoing === "0" ? undefined : outgoing,
    outgoingAsset: outgoing === "0" ? undefined : outgoingAsset,
    platformId,
    timestamp,
    type,
    wallet,
  }

  return { logs, txns: [tx] }
}
