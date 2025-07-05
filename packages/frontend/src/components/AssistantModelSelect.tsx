import { ListItemAvatar, ListItemText, Select, SelectProps, Stack } from "@mui/material"
import {
  AssistantModel,
  AVAILABLE_MODELS,
} from "privatefolio-backend/src/settings/assistant-models"
import React from "react"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { formatContextWindow } from "src/utils/formatting-utils"

import { AssistantModelAvatar } from "./AssistantModelIcon"
import { MenuItemWithTooltip } from "./MenuItemWithTooltip"
import { QuoteAmountBlock } from "./QuoteAmountBlock"

function ModelTooltip({ model }: { model: AssistantModel }) {
  return (
    <Stack>
      <strong>{model.label}</strong>
      <span>{model.description}</span>
      <br />
      <span>{model.capabilities?.map(getFilterValueLabel).join(", ")}</span>
      <span className="secondary">Context window: {formatContextWindow(model.contextWindow)}</span>
      <span className="secondary">
        Input cost:{" "}
        <QuoteAmountBlock
          amount={model.costPer1kTokens.input}
          formatting="price"
          hideTooltip
          disableTruncate
        />
      </span>
      <span className="secondary">
        Output cost:{" "}
        <QuoteAmountBlock
          amount={model.costPer1kTokens.output}
          formatting="price"
          hideTooltip
          disableTruncate
        />
      </span>
    </Stack>
  )
}

export type AssistantModelSelectProps = SelectProps<string>

export function AssistantModelSelect(props: AssistantModelSelectProps) {
  const { ...rest } = props

  return (
    <Select size="small" sx={{ minWidth: 320 }} inputProps={{ name: "model-select" }} {...rest}>
      {AVAILABLE_MODELS.map((model) => (
        <MenuItemWithTooltip
          key={model.id}
          value={model.id}
          tooltipProps={{
            placement: "right",
            title: <ModelTooltip model={model} />,
          }}
        >
          <Stack direction="row" alignItems="center">
            <ListItemAvatar>
              <AssistantModelAvatar model={model} size="small" />
            </ListItemAvatar>
            <ListItemText primary={model.label} />
          </Stack>
        </MenuItemWithTooltip>
      ))}
    </Select>
  )
}
