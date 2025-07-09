export interface MyAsset {
    id: string;
    symbol: string;
    name: string;
    logoUrl: string;
    priceApiId?: string;
    coingeckoId?: string;
}

export interface PlanCoin {
  id?: number
  planId: number
  coinId: string
  percentage: number | null
  amount: number | null
}

export interface Plan {
  id: number
  name: string
  budget: number
  coins: PlanCoin[]
  createdAt?: string
  updatedAt?: string
  lastCalculatedAt?: string
  calculationStatus?: "idle" | "in_progress" | "completed" | "failed"
} 