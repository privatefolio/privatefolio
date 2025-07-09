import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material"
import React from "react"
import { QuoteAmountBlock } from "src/components/QuoteAmountBlock"
import { AttentionBlock } from "src/components/AttentionBlock"
import { InfoOutlined } from "@mui/icons-material"
import { AppLink } from "src/components/AppLink"

interface CalculationResultDialogProps {
    open: boolean
    onClose: () => void
    results: any | null
}

export function CalculationResultDialog({ open, onClose, results }: CalculationResultDialogProps) {
    if (!results) return null

    if(results.error) {
        return (
            <Dialog open={open} onClose={onClose}>
                <DialogTitle>Calculation Error</DialogTitle>
                <DialogContent>
                    <Typography color="error">{results.error}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose} variant="contained">Close</Button>
                </DialogActions>
            </Dialog>
        )
    }

    const { calculations, totalFixedAmount, remainingBudget, totalPercentage } = results;

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Calculation Results</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Coin</TableCell>
                                    <TableCell align="right">Current Price (USD)</TableCell>
                                    <TableCell align="right">Amount to Invest (USD)</TableCell>
                                    <TableCell align="right">Coins to Buy</TableCell>
                                    <TableCell>Error</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {calculations.map((res, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{res.name || res.coinId}</TableCell>
                                        <TableCell align="right"><QuoteAmountBlock amount={res.price} formatting="price" /></TableCell>
                                        <TableCell align="right"><QuoteAmountBlock amount={res.amountToInvest} /></TableCell>
                                        <TableCell align="right">{res.coinsToBuy?.toFixed(6)}</TableCell>
                                        <TableCell>{res.error}</TableCell>
                                    </TableRow>
                                ))}
                                 <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                                    <TableCell component="th" scope="row" colSpan={2} align="right">
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total Fixed Amount:</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <QuoteAmountBlock amount={totalFixedAmount} />
                                    </TableCell>
                                    <TableCell colSpan={2}></TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell colSpan={2} align="right">
                                         <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Remaining Budget for Percentages:</Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <QuoteAmountBlock amount={remainingBudget} />
                                    </TableCell>
                                    <TableCell colSpan={2} align="right">
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Total: {totalPercentage}%</Typography>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <AttentionBlock>
                        <InfoOutlined sx={{ mr: 1, color: "warning.main" }} />
                        <span>
                            Warning: The budget calculation relies on the public CoinGecko API. If you are unable to retrieve data, you may have hit the rate limit. Please try again in a few minutes. For more details, see the{" "}
                            <AppLink href="https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan">
                            CoinGecko API documentation
                            </AppLink>.
                        </span>
                    </AttentionBlock>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} variant="contained">Close</Button>
            </DialogActions>
        </Dialog>
    )
} 