import { CsvParser } from "src/interfaces"
import { ParserId, PlatformId } from "src/settings"

import * as binance from "./binance"
import * as binanceSpot from "./binance-spot-history"
import * as blockpit from "./blockpit"
import * as coinmama from "./coinmama"
import * as etherscan from "./etherscan"
import * as etherscanBeaconWithdrawals from "./etherscan-beacon-withdrawals"
import * as etherscanBlockRewards from "./etherscan-block-reward"
import * as etherscanErc20 from "./etherscan-erc20"
import * as etherscanInternal from "./etherscan-internal"
import * as mexc from "./mexc"
import * as privatefolioTxns from "./privatefolio-transactions"

export const HEADER_MATCHER: Record<string, ParserId> = {
  [binance.HEADERS[0]]: binance.Identifier,
  [binance.HEADERS[1]]: binance.Identifier,
  [binanceSpot.HEADER]: binanceSpot.Identifier,
  [mexc.HEADER]: mexc.Identifier,
  [privatefolioTxns.HEADER]: privatefolioTxns.Identifier,
  [coinmama.HEADER]: coinmama.Identifier,
  [etherscan.HEADERS[0]]: etherscan.Identifier,
  [etherscan.HEADERS[1]]: etherscan.Identifier,
  [etherscanInternal.HEADERS[0]]: etherscanInternal.Identifier,
  [etherscanInternal.HEADERS[1]]: etherscanInternal.Identifier,
  [etherscanErc20.HEADERS[0]]: etherscanErc20.Identifier,
  [etherscanErc20.HEADERS[1]]: etherscanErc20.Identifier,
  [blockpit.HEADER]: blockpit.Identifier,
  [etherscanBlockRewards.HEADER]: etherscanBlockRewards.Identifier,
  [etherscanBeaconWithdrawals.HEADER]: etherscanBeaconWithdrawals.Identifier,
}

export const PARSER_MATCHER: Record<ParserId, CsvParser> = {
  [binance.Identifier]: binance.parser,
  [mexc.Identifier]: mexc.parser,
  [coinmama.Identifier]: coinmama.parser,
  [etherscan.Identifier]: etherscan.parser,
  [etherscanInternal.Identifier]: etherscanInternal.parser,
  [etherscanErc20.Identifier]: etherscanErc20.parser,
  [privatefolioTxns.Identifier]: privatefolioTxns.parser,
  [binanceSpot.Identifier]: binanceSpot.parser,
  [blockpit.Identifier]: blockpit.parser,
  [etherscanBlockRewards.Identifier]: etherscanBlockRewards.parser,
  [etherscanBeaconWithdrawals.Identifier]: etherscanBeaconWithdrawals.parser,
}

export const PLATFORM_MATCHER: Record<ParserId, PlatformId> = {
  [binance.Identifier]: binance.platform,
  [mexc.Identifier]: mexc.platform,
  [coinmama.Identifier]: coinmama.platform,
  [etherscan.Identifier]: etherscan.platform,
  [etherscanInternal.Identifier]: etherscanInternal.platform,
  [etherscanErc20.Identifier]: etherscanErc20.platform,
  [privatefolioTxns.Identifier]: privatefolioTxns.platform,
  [binanceSpot.Identifier]: binanceSpot.platform,
  [blockpit.Identifier]: blockpit.platform,
  [etherscanBlockRewards.Identifier]: etherscanBlockRewards.platform,
  [etherscanBeaconWithdrawals.Identifier]: etherscanBeaconWithdrawals.platform,
}

export const PARSER_REQUIREMENTS: Partial<Record<ParserId, string[]>> = {
  [etherscanErc20.Identifier]: ["userAddress"],
}
