import { CsvParser } from "src/interfaces"

import * as binance from "./binance"
// import * as binanceSpot from "./binance-spot-history"
import * as blockpit from "./blockpit"
import * as coinmama from "./coinmama"
import * as etherscan from "./etherscan"
import * as etherscanBlockRewards from "./etherscan-block-reward"
import * as etherscanErc20 from "./etherscan-erc20"
import * as etherscanInternal from "./etherscan-internal"
import * as etherscanStakingWithdrawals from "./etherscan-staking-withdrawals"
import * as mexc from "./mexc"
import * as privatefolioTxns from "./privatefolio-transactions"

export const HEADER_MATCHER: Record<string, string> = {
  [binance.HEADERS[0]]: binance.parserId,
  [binance.HEADERS[1]]: binance.parserId,
  [mexc.HEADER]: mexc.parserId,
  [privatefolioTxns.HEADER]: privatefolioTxns.parserId,
  [coinmama.HEADER]: coinmama.parserId,
  [etherscan.HEADERS[0]]: etherscan.parserId,
  [etherscan.HEADERS[1]]: etherscan.parserId,
  [etherscanInternal.HEADERS[0]]: etherscanInternal.parserId,
  [etherscanInternal.HEADERS[1]]: etherscanInternal.parserId,
  [etherscanErc20.HEADERS[0]]: etherscanErc20.parserId,
  [etherscanErc20.HEADERS[1]]: etherscanErc20.parserId,
  [blockpit.HEADER]: blockpit.parserId,
  [etherscanBlockRewards.HEADER]: etherscanBlockRewards.parserId,
  [etherscanStakingWithdrawals.HEADER]: etherscanStakingWithdrawals.parserId,
}

export const PARSER_MATCHER: Record<string, CsvParser> = {
  [binance.parserId]: binance,
  [mexc.parserId]: mexc,
  [coinmama.parserId]: coinmama,
  [etherscan.parserId]: etherscan,
  [etherscanInternal.parserId]: etherscanInternal,
  [etherscanErc20.parserId]: etherscanErc20,
  [privatefolioTxns.parserId]: privatefolioTxns,
  [blockpit.parserId]: blockpit,
  [etherscanBlockRewards.parserId]: etherscanBlockRewards,
  [etherscanStakingWithdrawals.parserId]: etherscanStakingWithdrawals,
}
