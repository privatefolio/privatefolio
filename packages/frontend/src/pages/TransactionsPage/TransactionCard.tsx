// import React from "react"

// import { Asset, Transaction, TransactionType } from "../../interfaces"
// import { BuyTransaction } from "./Transactions/BuyTransaction"
// import { SellTransaction } from "./Transactions/SellTransaction"
// import { SwapTransaction } from "./Transactions/SwapTransaction"

// interface TransactionCardProps {
//   assetMap: Record<string, Asset>
//   tx: Transaction
// }

// const COMPONENTS: Record<TransactionType, React.ElementType> = {
//   Buy: BuyTransaction,
//   Sell: SellTransaction,
//   Swap: SwapTransaction,
// }

// export function TransactionCard(props: TransactionCardProps) {
//   const Component = COMPONENTS[props.tx.type]
//   return <Component {...props} />
// }
