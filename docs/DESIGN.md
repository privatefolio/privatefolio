# Design

## API rate limits

### Asset price API

We use these APIs to get historical price data for assets, usually in a candlestick format.

| Provider  | Rate limit (public endpoint) | Normalized value      | Minimum call interval | Maximum data points per call | Docs                                                                                                           |
| --------- | ---------------------------- | --------------------- | --------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Binance   | 2400 calls per minute        | 2400 calls per minute | 25ms                  | 1000                         | [link](https://www.binance.com/en/support/faq/rate-limits-on-binance-futures-281596e222414cdd9051664ea621cdc3) |
| Coinbase  | 10 calls per second          | 600 calls per minute  | 100ms                 | 300                          | [link](https://docs.cloud.coinbase.com/advanced-trade-api/docs/rest-api-rate-limits)                           |
| DefiLlama | ???                          | ???                   | ???                   | ???                          | [link](https://defillama.com/docs/api)                                                                         |

### Asset metadata API

We use these APIs to get asset metadata such as logo image, website url, asset description, etc.
Because of the stinginess of the free tier, this app makes use of a local cache.

| Provider  | Rate limit (free tier) | Normalized value    | Minimum call interval | Docs                                            |
| --------- | ---------------------- | ------------------- | --------------------- | ----------------------------------------------- |
| Coingecko | 30 calls per minute    | 30 calls per minute | 2000ms                | [link](https://coingecko.com/api/documentation) |

### User data API

We use these APIs to get user data such as deposits, withdrawals, transaction history, etc.

#### Etherscan

| Provider              | Rate limit ([free tier](https://docs.etherscan.io/support/rate-limits)) | Normalized value     | Minimum call interval | Maximum data points per call | Docs                                                                                                             |
| --------------------- | ----------------------------------------------------------------------- | -------------------- | --------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Normal transactions   | 5 calls per second                                                      | 300 calls per minute | 200ms                 | 10000                        | [link](https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-normal-transactions-by-address)            |
| Internal transactions | 5 calls per second                                                      | 300 calls per minute | 200ms                 | 10000                        | [link](https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-internal-transactions-by-address)          |
| ERC-20 transfers      | 5 calls per second                                                      | 300 calls per minute | 200ms                 | None                         | [link](https://docs.etherscan.io/api-endpoints/accounts#get-a-list-of-erc20-token-transfer-events-by-address)    |
| Block rewards         | 5 calls per second                                                      | 300 calls per minute | 200ms                 | None                         | [link](https://docs.etherscan.io/api-endpoints/accounts#get-list-of-blocks-validated-by-address)                 |
| Staking withdrawals   | 5 calls per second                                                      | 300 calls per minute | 200ms                 | None                         | [link](https://docs.etherscan.io/api-endpoints/accounts#get-beacon-chain-withdrawals-by-address-and-block-range) |

#### Binance

| Endpoint                            | Weight       | Real Weight | Weight limit             | Second rate limit      | Calculated Rate limit | Minimum call interval | Docs                                                                                                           |
| ----------------------------------- | ------------ | ----------- | ------------------------ | ---------------------- | --------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------- |
| Deposits `/sapi/*`                  | 1 (IP)       | 1           | 12.000 per minute (IP)   | None                   | 200 calls per second  | 5ms                   | [link](https://binance-docs.github.io/apidocs/spot/en/#deposit-history-supporting-network-user_data)           |
| Withdrawals `/sapi/*`               | 18.000 (UID) | 18.000      | 180.000 per minute (UID) | 10 requests per second | 1 calls per 6 seconds | 6_000ms               | [link](https://binance-docs.github.io/apidocs/spot/en/#withdraw-history-supporting-network-user_data)          |
| Exchange Info `/api/*`              | 20 (IP)      | 20          | 6.000 per minute (IP)    | None                   | 300 calls per minute  | 200ms                 | [link](https://binance-docs.github.io/apidocs/spot/en/#exchange-information)                                   |
| Spot Trades `/api/*`                | 20 (IP)      | 20          | 6.000 per minute (IP)    | None                   | 300 calls per minute  | 200ms                 | [link](https://binance-docs.github.io/apidocs/spot/en/#account-trade-list-user_data)                           |
| Flexible rewards `/sapi/*`          | 150 (IP)     | 50          | 12.000 per minute (IP)   | None                   | 240 calls per minute  | 250ms                 | [link](https://binance-docs.github.io/apidocs/spot/en/#get-flexible-rewards-history-user_data)                 |
| Locked rewards `/sapi/*`            | 150 (IP)     | 50          | 12.000 per minute (IP)   | None                   | 240 calls per minute  | 250ms                 | [link](https://binance-docs.github.io/apidocs/spot/en/#get-locked-rewards-history-user_dataa)                  |
| Margin Borrow-repay `/sapi/*`       | 10 (IP)      | 1           | 12.000 per minute (IP)   | None                   | 200 calls per second  | 5ms                   | [link](https://binance-docs.github.io/apidocs/spot/en/#query-borrow-repay-records-in-margin-account-user_data) |
| Margin Trades `/sapi/*`             | 10 (IP)      | 1           | 12.000 per minute (IP)   | None                   | 200 calls per second  | 5ms                   | [link](https://binance-docs.github.io/apidocs/spot/en/#query-margin-account-39-s-trade-list-user_data)         |
| Margin Transfer `/sapi/*`           | 1 (IP)       | 1           | 12.000 per minute (IP)   | None                   | 200 calls per second  | 5ms                   | [link](https://binance-docs.github.io/apidocs/spot/en/#get-cross-margin-transfer-history-user_data)            |
| Margin Liquidation Record `/sapi/*` | 1 (IP)       | 1           | 12.000 per minute (IP)   | None                   | 200 calls per second  | 5ms                   | [link](https://binance-docs.github.io/apidocs/spot/en/#get-cross-margin-transfer-history-user_data)            |
| Future USD-M ExchangeInfo `/fapi/*` | 1 (IP)       | 1           | 2.400 per minute (IP)    | None                   | 40 calls per second   | 25ms                  | [link](https://binance-docs.github.io/apidocs/futures/en/#exchange-information)                                |
| Future USD-M Trades `/fapi/*`       | 5 (IP)       | 5           | 2.400 per minute (IP)    | None                   | 8 calls per second    | 125ms                 | [link](https://binance-docs.github.io/apidocs/futures/en/#account-trade-list-user_data)                        |
| Future USD-M Income `/fapi/*`       | 30 (IP)      | 30          | 2.400 per minute (IP)    | None                   | 1,3 calls per second  | 751ms                 | [link](https://binance-docs.github.io/apidocs/futures/en/#get-income-history-user_data)                        |
| Future COIN-M ExchangeInfo`/dapi/*` | 1 (IP)       | 1           | 2.400 per minute (IP)    | None                   | 40 calls per second   | 25ms                  | [link](https://binance-docs.github.io/apidocs/delivery/en/#exchange-information)                               |
| Future COIN-M Trades `/dapi/*`      | 20/40 (IP)   | 20/40       | 2.400 per minute (IP)    | None                   | 2/1 calls per second  | 500/1_000ms           | [link](https://binance-docs.github.io/apidocs/delivery/en/#account-trade-list-user_data)                       |
| Future COIN-M Income `/dapi/*`      | 20 (IP)      | 30          | 2.400 per minute (IP)    | None                   | 1.3 calls per second  | 751ms                 | [link](https://binance-docs.github.io/apidocs/delivery/en/#get-income-history-user_data)                       |

Current number of pairs/symbols: ~2600

[Limits docs](https://binance-docs.github.io/apidocs/spot/en/#limits)

IP Limits
Every request will contain X-MBX-USED-WEIGHT-(intervalNum)(intervalLetter) in the response headers which has the current used weight for the IP for all request rate limiters defined.
Each route has a weight which determines for the number of requests each endpoint counts for. Heavier endpoints and endpoints that do operations on multiple symbols will have a heavier weight.
When a 429 is received, it's your obligation as an API to back off and not spam the API.
Repeatedly violating rate limits and/or failing to back off after receiving 429s will result in an automated IP ban (HTTP status 418).
IP bans are tracked and scale in duration for repeat offenders, from 2 minutes to 3 days.
A Retry-After header is sent with a 418 or 429 responses and will give the number of seconds required to wait, in the case of a 429, to prevent a ban, or, in the case of a 418, until the ban is over.
The limits on the API are based on the IPs, not the API keys.

/api/ and /sapi/ Limit Introduction
The /api/_ and /sapi/_ endpoints adopt either of two access limiting rules, IP limits or UID (account) limits.

Endpoints related to /api/\*:

According to the two modes of IP and UID (account) limit, each are independent.
Endpoints share the 6,000 per minute limit based on IP.
Responses contain the header X-MBX-USED-WEIGHT-(intervalNum)(intervalLetter), defining the weight used by the current IP.
Successful order responses contain the header X-MBX-ORDER-COUNT-(intervalNum)(intervalLetter), defining the order limit used by the UID.

Endpoints related to /sapi/\*:

Endpoints are marked according to IP or UID limit and their corresponding weight value.
Each endpoint with IP limits has an independent 12000 per minute limit, or per second limit if specified explicitly
Each endpoint with UID limits has an independent 180000 per minute limit, or per second limit if specified explicitly
Responses from endpoints with IP limits contain the header X-SAPI-USED-IP-WEIGHT-1M or X-SAPI-USED-IP-WEIGHT-1S, defining the weight used by the current IP.
Responses from endpoints with UID limits contain the header X-SAPI-USED-UID-WEIGHT-1M or X-SAPI-USED-UID-WEIGHT-1S, defining the weight used by the current UID.
