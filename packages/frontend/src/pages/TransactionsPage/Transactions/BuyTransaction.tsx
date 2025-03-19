// import { AddRounded, EastRounded, SouthRounded } from "@mui/icons-material"
// import { alpha, Chip, Grid, Paper, Stack, Typography } from "@mui/material"
// import { green } from "@mui/material/colors"
// // import Grid from "@mui/material/Unstable_Grid2" // Grid version 2
// import React from "react"

// import { Asset, Transaction } from "../../../interfaces"
// import {
//   formatDate,
//   formatDateRelative,
//   formatHour,
//   formatNumber,
// } from "../../../utils/client-utils"
// import { AssetChange } from "../AssetChange"

// const COLUMN_GAP = 1

// interface TransactionCardProps {
//   assetMap: Record<string, Asset>
//   tx: Transaction
// }

// const color = green[500]

// export function BuyTransaction(props: TransactionCardProps) {
//   const { tx, assetMap } = props
//   const { symbol, type, amountN, totalN, feeN, quoteSymbol, feeAsset, timestamp } = tx

//   return (
//     <>
//       <Typography component="div" variant="body1">
//         <Paper elevation={0}>
//           <Grid container spacing={2} paddingY={1} paddingX={2}>
//             <Grid item xs={12} lg={3}>
//               <Stack alignItems="flex-start" gap={COLUMN_GAP}>
//                 <Typography color="text.secondary" variant="caption">
//                   {formatDateRelative(timestamp)}
//                 </Typography>
//                 <span>
//                   <span>{formatDate(timestamp)}</span>{" "}
//                   <Typography component="span" color="text.secondary" variant="body2">
//                     at {formatHour(timestamp)}
//                   </Typography>
//                 </span>
//                 <Chip
//                   size="small"
//                   label={
//                     <Typography variant="body2" component="div">
//                       <Stack direction="row" gap={0.5} alignItems="center" paddingRight={0.5}>
//                         {/* <SwapHorizRounded fontSize="small" /> */}
//                         <AddRounded sx={{ fontSize: "inherit" }} />
//                         <span>{type}</span>
//                         {/* <span>Trade</span> */}
//                       </Stack>
//                     </Typography>
//                   }
//                   sx={{ background: alpha(color, 0.2), color, letterSpacing: 0.5 }}
//                 />
//               </Stack>
//             </Grid>
//             <Grid item xs={12} lg={3}>
//               <AssetChange
//                 label="Paid"
//                 amount={formatNumber(totalN)}
//                 symbol={quoteSymbol}
//                 valueAmount={"0.1"}
//                 imageSrc={assetMap[quoteSymbol]?.image}
//                 negative
//               />
//             </Grid>
//             <Grid item xs={12} lg={0.5} sx={{ marginLeft: { lg: 0, xs: 1 }, marginTop: { lg: 4 } }}>
//               <SouthRounded
//                 sx={{ color: "text.secondary", display: { lg: "none", xs: "block" } }}
//               />
//               <EastRounded sx={{ color: "text.secondary", display: { lg: "block", xs: "none" } }} />
//             </Grid>
//             <Grid item xs={12} lg={3}>
//               <AssetChange
//                 label="Received"
//                 amount={formatNumber(amountN)}
//                 symbol={symbol}
//                 valueAmount={"0.1"}
//                 imageSrc={assetMap[symbol]?.image}
//               />
//             </Grid>
//             {typeof feeN === "number" && (
//               <Grid item xs={12} lg={2.5}>
//                 <AssetChange
//                   label="Fee"
//                   amount={formatNumber(feeN)}
//                   symbol={feeAsset as string}
//                   valueAmount={"0.1"}
//                   imageSrc={assetMap[feeAsset as string]?.image}
//                   negative
//                 />
//               </Grid>
//             )}
//           </Grid>
//         </Paper>
//       </Typography>
//     </>
//   )
// }
