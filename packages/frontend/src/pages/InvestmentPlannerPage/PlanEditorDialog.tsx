import { Autocomplete, Button, Dialog, DialogActions, DialogContent, DialogTitle, FormHelperText, IconButton, Stack, TextField } from "@mui/material"
import React, { useCallback, useEffect, useState } from "react"
import { MyAsset, Plan, PlanCoin } from "../../../../backend/src/extensions/investment-planner/types"
import { useStore } from "@nanostores/react"
import { $rpc } from "../../workers/remotes"
import { $activeAccount } from "../../stores/account-store"
import { AddCircleOutline, DeleteOutline } from "@mui/icons-material"

interface PlanEditorDialogProps {
    open: boolean
    onClose: () => void
    onSave: (plan: Omit<Plan, "id" | "createdAt" | "updatedAt"> | Plan) => void
    plan: Plan | null
}

interface ValidationErrors {
    name?: string;
    budget?: string;
    coins?: (string | undefined)[];
    global?: string;
}

export function PlanEditorDialog({ open, onClose, onSave, plan }: PlanEditorDialogProps) {
    const [name, setName] = useState("")
    const [budget, setBudget] = useState(0)
    const [coins, setCoins] = useState<Partial<PlanCoin>[]>([{ coinId: "", percentage: null, amount: null }])
    const [allAssets, setAllAssets] = useState<MyAsset[]>([])
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isFormValid, setFormValid] = useState(false);
    const rpc = useStore($rpc)
    const accountName = useStore($activeAccount)

    useEffect(() => {
        rpc.getAssets().then(assets => {
            const uniqueAssets = [...new Map(assets.map(item => [item.id, item])).values()];
            setAllAssets(uniqueAssets as any)
        })
    }, [rpc])

    const validate = useCallback(() => {
        const newErrors: ValidationErrors = { coins: [] };
        let isValid = true;
    
        if (!name) {
            newErrors.name = "Plan name is required.";
            isValid = false;
        }

        if (budget <= 0) {
            newErrors.budget = "Budget must be greater than zero.";
            isValid = false;
        }
    
        let totalPercentage = 0;
        let totalAmount = 0;
    
        coins.forEach((coin, index) => {
            if (!coin.coinId && (coin.percentage || coin.amount)) {
                newErrors.coins![index] = "Please select a coin.";
                isValid = false;
            }
            if (coin.percentage && coin.amount) {
                newErrors.coins![index] = "Fill either percentage or amount, not both.";
                isValid = false;
            }
            if (coin.percentage) {
                totalPercentage += coin.percentage;
            }
            if (coin.amount) {
                totalAmount += coin.amount;
            }
        });
    
        if (totalPercentage > 100) {
            newErrors.global = `Total percentage (${totalPercentage}%) cannot exceed 100%.`;
            isValid = false;
        } else if (totalAmount > budget) {
            newErrors.global = `Total amount (${totalAmount}) cannot exceed budget (${budget}).`;
            isValid = false;
        }
    
        setErrors(newErrors);
        return isValid;
    }, [name, budget, coins]);

    useEffect(() => {
        if (open) {
            const isValid = validate();
            setFormValid(isValid);
        }
    }, [name, budget, coins, open, validate])

    useEffect(() => {
        if (plan) {
            setName(plan.name)
            setBudget(plan.budget)
            setCoins(plan.coins.length > 0 ? plan.coins : [{ coinId: "", percentage: null, amount: null }])
        } else {
            setName("")
            setBudget(0)
            setCoins([{ coinId: "", percentage: null, amount: null }])
        }
    }, [plan])

    const handleSave = () => {
        if (!validate()) {
            return;
        }
        const planData = { name, budget, coins: coins.filter(c => c.coinId) as PlanCoin[] }
        if (plan && plan.id) {
            onSave({ ...planData, id: plan.id, createdAt: plan.createdAt, updatedAt: plan.updatedAt })
        } else {
            onSave(planData)
        }
    }

    const handleCoinChange = (index: number, field: keyof PlanCoin, value: any) => {
        const newCoins = [...coins]
        newCoins[index][field] = value
        setCoins(newCoins)
    }

    const addCoinRow = () => {
        setCoins([...coins, { coinId: "", percentage: null, amount: null }])
    }

    const removeCoinRow = (index: number) => {
        const newCoins = coins.filter((_, i) => i !== index)
        setCoins(newCoins)
    }

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>{plan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Plan Name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        fullWidth
                        error={!!errors.name}
                        helperText={errors.name}
                    />
                    <TextField
                        label="Budget"
                        type="number"
                        value={budget}
                        onChange={e => setBudget(Number(e.target.value))}
                        fullWidth
                        error={!!errors.budget}
                        helperText={errors.budget}
                    />
                    <Stack spacing={1}>
                        {coins.map((coin, index) => (
                            <Stack direction="row" spacing={1} key={index} alignItems="flex-start">
                                <Autocomplete
                                    options={allAssets}
                                    getOptionLabel={option => option.name || ""}
                                    value={allAssets.find(a => a.id === coin.coinId) || null}
                                    onChange={(e, newValue) => handleCoinChange(index, "coinId", newValue?.id || "")}
                                    renderInput={params => <TextField {...params} label="Coin" error={!!errors.coins?.[index]} />}
                                    fullWidth
                                />
                                <TextField
                                    label="Percentage (%)"
                                    type="number"
                                    value={coin.percentage || ""}
                                    onChange={e => handleCoinChange(index, "percentage", Number(e.target.value) || null)}
                                    error={!!errors.coins?.[index]}
                                />
                                <TextField
                                    label="Or Amount"
                                    type="number"
                                    value={coin.amount || ""}
                                    onChange={e => handleCoinChange(index, "amount", Number(e.target.value) || null)}
                                    error={!!errors.coins?.[index]}
                                />
                                <IconButton onClick={() => removeCoinRow(index)} sx={{ mt: 1 }}>
                                    <DeleteOutline />
                                </IconButton>
                                {errors.coins?.[index] && <FormHelperText error sx={{position: 'absolute', bottom: -20, left: '40%'}}>{errors.coins[index]}</FormHelperText>}
                            </Stack>
                        ))}
                        <Button startIcon={<AddCircleOutline />} onClick={addCoinRow}>Add Coin</Button>
                    </Stack>
                    {errors.global && <FormHelperText error>{errors.global}</FormHelperText>}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained" disabled={!isFormValid}>Save</Button>
            </DialogActions>
        </Dialog>
    )
}

// NOTE: We also need to add MyAsset to the shared types
/*
declare module "privatefolio-backend/src/extensions/investment-planner/types" {
    interface MyAsset {
        id: string;
        symbol: string;
        name: string;
        logoUrl: string;
        priceApiId?: string;
        coingeckoId?: string;
    }
}
*/ 