// TODO5
// "use client"

// import { Box, Stack, Typography } from "@mui/material"
// // import icons from "base64-cryptocurrency-icons";
// import React from "react"

// import { Transaction } from "../../interfaces"
// import { formatNumber } from "../../utils/formatting-utils"

// interface AssetInfoProps {
//   amountBought: number
//   amountSold: number
//   assetSymbol: string
//   costBasis: number
//   holdings: number
//   moneyIn: number
//   moneyOut: number
//   tradeHistory: Transaction[]
// }

// const headCells = [
//   {
//     disablePadding: true,
//     id: "id",
//     label: "Id",
//   },
//   {
//     id: "datetime",
//     label: "Datetime",
//   },
//   {
//     id: "side",
//     label: "Side",
//   },
//   {
//     id: "filledPrice",
//     label: "Price",
//     numeric: true,
//   },
//   {
//     id: "amount",
//     label: "Amount",
//     numeric: true,
//   },
//   {
//     id: "total",
//     label: "Total",
//     numeric: true,
//   },
// ]

// export function AssetInfo(props: AssetInfoProps) {
//   const {
//     costBasis,
//     moneyIn,
//     moneyOut,
//     tradeHistory,
//     assetSymbol,
//     // amountBought,
//     // amountSold,
//     holdings,
//   } = props

//   return (
//     <Box sx={{ width: "100%" }}>
//       <Stack
//         marginX={2}
//         direction="row"
//         marginBottom={2}
//         flexWrap="wrap"
//         justifyContent="space-between"
//         alignItems="center"
//       >
//         <Typography variant="h3" fontWeight={700}>
//           {assetSymbol}
//         </Typography>
//         <Stack gap={4} flexWrap="wrap" direction="row">
//           {/* <Typography variant="body1">
//           <span>No. of trades</span> <span>{tradeHistory.length}</span>
//         </Typography> */}
//           <Stack>
//             <Typography variant="body1" color="text.secondary">
//               Avg. buy price
//             </Typography>
//             <Typography variant="body1">{formatNumber(costBasis)} USDT</Typography>
//           </Stack>
//           {/* <Stack>
//           <Typography variant="body1" color="text.secondary">
//             Amount bought
//           </Typography>
//           <Typography variant="body1">
//             {amountBought} {assetSymbol}
//           </Typography>
//         </Stack>
//         <Stack>
//           <Typography variant="body1" color="text.secondary">
//             Amount sold
//           </Typography>
//           <Typography variant="body1">
//             {amountSold} {assetSymbol}
//           </Typography>
//         </Stack> */}
//           <Stack>
//             <Typography variant="body1" color="text.secondary">
//               Holdings
//             </Typography>
//             <Typography variant="body1">
//               {holdings} {assetSymbol}
//             </Typography>
//           </Stack>
//           <Stack>
//             <Typography variant="body1" color="text.secondary">
//               Cost
//             </Typography>
//             <Typography variant="body1">{formatNumber(moneyIn - moneyOut)} USDT</Typography>
//           </Stack>
//           {/* <Stack>
//           <Typography variant="body1" color="text.secondary">
//             Money in
//           </Typography>
//           <Typography variant="body1">{formatNumber(moneyIn)} USDT</Typography>
//         </Stack>
//         <Stack>
//           <Typography variant="body1" color="text.secondary">
//             Money out
//           </Typography>
//           <Typography variant="body1">{formatNumber(moneyOut)} USDT</Typography>
//         </Stack> */}
//         </Stack>
//       </Stack>
//       <Stack gap={4} marginX={2}>
//         {/* <MemoChart
//           data={tradeHistory
//             .map((x) => ({
//               value: x.filledPrice,
//             }))
//             .reverse()}
//         /> */}
//         {/* <Chart
//           data={tradeHistory.map((x) => ({
//             time: new Date(x.datetime).getTime() / 1000,
//             value: x.filledPrice,
//           }))}
//         /> */}
//       </Stack>
//     </Box>
//   )
// }
