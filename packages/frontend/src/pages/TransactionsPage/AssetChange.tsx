// import { Stack, Typography } from "@mui/material"
// import React from "react"

// import { AssetAvatar } from "../../components/AssetAvatar"
// import { Truncate } from "../../components/Truncate"
// import { MonoFont } from "../../theme"

// interface AssetChangeProps {
//   amount: string
//   imageSrc?: string
//   label: string
//   negative?: boolean
//   symbol: string
//   valueAmount: string
// }

// export function AssetChange(props: AssetChangeProps) {
//   const { label, amount, negative = false, valueAmount, imageSrc, symbol } = props

//   return (
//     <>
//       <Stack alignItems="flex-start" gap={1}>
//         <Typography color="text.secondary" variant="caption">
//           {label}
//         </Typography>
//         <Stack direction="row" gap={1}>
//           <AssetAvatar src={imageSrc} alt={symbol} />
//           <Stack alignSelf="center">
//             <Typography
//               fontFamily={MonoFont}
//               component="div"
//               variant="inherit"
//               sx={{ display: "flex" }}
//             >
//               <Truncate style={{ maxWidth: 140 }}>
//                 {negative ? "-" : "+"}
//                 {amount} {symbol}
//               </Truncate>
//             </Typography>
//             <Typography
//               fontFamily={MonoFont}
//               component="span"
//               variant="caption"
//               color="text.secondary"
//             >
//               ${valueAmount} USD
//             </Typography>
//           </Stack>
//         </Stack>
//       </Stack>
//     </>
//   )
// }
