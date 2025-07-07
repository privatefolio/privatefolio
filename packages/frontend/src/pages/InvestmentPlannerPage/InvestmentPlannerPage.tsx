import { Button, Paper, Stack } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useState } from "react"
import { MemoryTable } from "../../components/EnhancedTable/MemoryTable"
import { SectionTitle } from "../../components/SectionTitle"
import { Plan } from "privatefolio-backend/src/extensions/investment-planner/types"
import { $activeAccount } from "../../stores/account-store"
import { HeadCell } from "../../utils/table-utils"
import { $rpc } from "../../workers/remotes"
import { CalculationResultDialog } from "./CalculationResultDialog"
import { PlanEditorDialog } from "./PlanEditorDialog"
import { PlanTableRow } from "./PlanTableRow"
import { AttentionBlock } from "src/components/AttentionBlock"
import { InfoOutlined } from "@mui/icons-material"
import { AppLink } from "src/components/AppLink"

const headCells: HeadCell<Plan>[] = [
  { key: "name", label: "Name", sortable: true },
  { key: "budget", label: "Budget", numeric: true, sortable: true },
  { key: "updatedAt", label: "Last Updated", timestamp: true, sortable: true },
  { label: "Actions", numeric: true, sortable: false },
]

export default function InvestmentPlannerPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [isEditorOpen, setEditorOpen] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [calculationResult, setCalculationResult] = useState<any[] | null>(null)
  const rpc = useStore($rpc)
  const accountName = useStore($activeAccount)

  useEffect(() => {
    document.title = `Investment Planner - ${accountName} - Privatefolio`
    if (accountName) {
        rpc.initialize(accountName).then(() => {
            loadPlans()
        })
    }
  }, [accountName])

  const loadPlans = async () => {
    if (!accountName) return
    const data = await rpc.getPlans(accountName)
    setPlans(data as any)
  }

  const handleSave = async (plan: Omit<Plan, "id"> | Plan) => {
    if ("id" in plan && plan.id) {
      await rpc.updatePlan(accountName, plan.id, plan)
    } else {
      await rpc.createPlan(accountName, plan)
    }
    loadPlans()
    setEditorOpen(false)
  }

  const handleCreateNew = () => {
    setSelectedPlan(null)
    setEditorOpen(true)
  }

  const handleEdit = async (plan: Plan) => {
    const fullPlan = await rpc.getPlan(accountName, plan.id)
    if (fullPlan) {
      setSelectedPlan(fullPlan as any)
      setEditorOpen(true)
    } else {
      console.error("Could not find plan details to edit.")
    }
  }

  const handleDelete = async (id: number) => {
    await rpc.deletePlan(accountName, id)
    loadPlans()
  }

  const handleDuplicate = async (id: number) => {
    await rpc.duplicatePlan(accountName, id)
    loadPlans()
  }

  const handleCalculate = async (id: number) => {
    const results = await rpc.calculatePlan(accountName, id)
    setCalculationResult(results)
  }

  return (
    <main>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <SectionTitle>My Investment Plans</SectionTitle>
        <Button variant="contained" onClick={handleCreateNew}>
          New Plan
        </Button>
      </Stack>
      <AttentionBlock sx={{ mb: 2 }}>
          <InfoOutlined sx={{ mr: 1, color: "warning.main" }} />
          <span>
            Warning: The budget calculation relies on the public CoinGecko API. If you are unable to retrieve data, you may have hit the rate limit. Please try again in a few minutes. For more details, see the{" "}
            <AppLink href="https://support.coingecko.com/hc/en-us/articles/4538771776153-What-is-the-rate-limit-for-CoinGecko-API-public-plan">
              CoinGecko API documentation
            </AppLink>.
          </span>
      </AttentionBlock>
      <Paper>
        <MemoryTable<Plan>
          rows={plans}
          headCells={headCells}
          TableRowComponent={(props) => (
            <PlanTableRow
              {...props}
              onCalculate={handleCalculate}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          )}
          initOrderBy="updatedAt"
          initOrderDir="desc"
        />
      </Paper>
      <PlanEditorDialog
        open={isEditorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        plan={selectedPlan}
      />
      <CalculationResultDialog
        open={!!calculationResult}
        onClose={() => setCalculationResult(null)}
        results={calculationResult}
      />
    </main>
  )
} 