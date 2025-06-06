/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable prettier/prettier */
export type CoingeckoExchangeId = string;

export interface RawCoingeckoExchange {
  id: string;                                   // exchange id
  name: string;                                 // exchange name
  year_established: number;                     // exchange established year
  country: string;                              // exchange country
  description: string;                          // exchange description
  url: string;                                  // exchange website url
  image: string;                                // exchange image url
  has_trading_incentive: boolean;               // exchange trading incentive
  trust_score?: number;                         // exchange trust score
  trust_score_rank?: number;                    // exchange trust score rank
  trade_volume_24h_btc: number;                 // exchange trade volume in BTC in 24 hours
  trade_volume_24h_btc_normalized: number;      // normalized trading volume by traffic in BTC in 24 hours
}

export interface CoingeckoExchange {
  id: string;                                   // exchange id
  name: string;                                 // exchange name
  year_established?: number;                     // exchange established year
  country?: string;                             // exchange country
  description: string;                          // exchange description
  url: string;                                  // exchange website url
  image: string;                                // exchange image url
  trust_score?: number;                         // exchange trust score
  trust_score_rank?: number;                    // exchange trust score rank
}
export type CoingeckoAssetPlatformId = string

export interface RawCoingeckoAssetPlatform {
  id: CoingeckoAssetPlatformId; // asset platform id
  chain_identifier: number | null; // chainlist's chain id
  name: string; // chain name
  shortname: string; // chain shortname
  native_coin_id: string; // chain native coin id
  image: {
    thumb: string; // image of the asset platform (thumb)
    small: string; // image of the asset platform (small)
    large: string; // image of the asset platform (large)
  };
}

export interface CoingeckoAssetPlatform {
  id: CoingeckoAssetPlatformId; // asset platform id
  chain_identifier?: number; // chainlist's chain id
  name: string; // chain name
  native_coin_id: string; // chain native coin id
  image?: string; // image of the asset platform
}

export type CoingeckoEvmAssetPlatform = CoingeckoAssetPlatform & {
  chain_identifier: number; 
}

export type CoingeckoCoinId = string

export type RawCoingeckoCoin = {
  id: CoingeckoCoinId // coin id
  name: string // coin name
  platforms: Record<CoingeckoAssetPlatformId, string> // coin asset platform and contract address
  symbol: string // coin symbol
}

export type CoingeckoCoinMarketData = {
  ath: number
  ath_change_percentage: number
  ath_date: string
  atl: number
  atl_change_percentage: number
  atl_date: string
  circulating_supply: number
  current_price: number
  high_24h: number
  id: CoingeckoCoinId
  image: string
  last_updated: string
  low_24h: number
  market_cap: number
  market_cap_change_24h: number
  market_cap_change_percentage_24h: number
  market_cap_rank?: number
  max_supply: number
  name: string
  price_change_24h: number
  price_change_percentage_24h: number
  roi: null
  symbol: string
  total_supply: number
  total_volume: number
}

/**
 * @deprecated
 */
export interface CoinData {
  id: CoingeckoCoinId
  image: string
  name: string
  symbol?: string
}

export type CoingeckoCoin = {
  id: CoingeckoCoinId
  name: string
  platforms: Record<CoingeckoAssetPlatformId, string>
  symbol: string
  image: string
  market_cap_rank?: number
  // circulating_supply: number
  // total_supply: number
  // max_supply: number
  // last_updated: string
}
