import { ExpandMore, Visibility, VisibilityOff } from "@mui/icons-material"
import {
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { enqueueSnackbar } from "notistack"
import React, { useEffect, useState } from "react"
import { AssistantModelSelect } from "src/components/AssistantModelSelect"
import { LearnMore } from "src/components/LearnMore"
import { SectionTitle } from "src/components/SectionTitle"

import { DEFAULT_SETTINGS } from "../../settings"
import { $activeAccount } from "../../stores/account-store"
import { $rpc } from "../../workers/remotes"
import { ModelComparisonTable } from "./ModelComparisonTable"

export function AssistantSettings() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)

  useEffect(() => {
    document.title = `Assistant settings - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [isLoading, setIsLoading] = useState(true)
  const [assistantModel, setAssistantModel] = useState(DEFAULT_SETTINGS.assistantModel)
  const [assistantApiKey, setAssistantApiKey] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const savedSettings = await rpc.getSettings(activeAccount)
        const settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)

        setAssistantModel(settings.assistantModel)

        const openAiApiKeyEncrypted = await rpc.getValue(activeAccount, "assistant_openai_key", "")
        setAssistantApiKey(openAiApiKeyEncrypted ? "encrypted" : "")
      } catch (error) {
        console.error("Failed to load assistant settings:", error)
        enqueueSnackbar("Failed to load assistant settings", { variant: "error" })
      } finally {
        setIsLoading(false)
      }
    }

    loadSettings()
  }, [activeAccount, rpc])

  const handleSave = async () => {
    if (!activeAccount) return

    setIsSaving(true)

    try {
      await rpc.updateSettings(activeAccount, { assistantModel })
      if (assistantApiKey !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_openai_key", assistantApiKey)
      }
      enqueueSnackbar("Assistant settings saved successfully", { variant: "success" })
    } catch (error) {
      console.error("Failed to save assistant settings:", error)
      enqueueSnackbar("Failed to save assistant settings", { variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const [showPassword, setShowPassword] = useState(false)
  const handleClickShowPassword = () => {
    setShowPassword((show) => !show)
  }

  const [showModelComparison, setShowModelComparison] = useState(false)
  const handleToggleModelComparison = () => {
    setShowModelComparison((show) => !show)
  }

  const passwordAdornment = (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={handleClickShowPassword}
        edge="end"
        size="small"
        color="secondary"
      >
        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Stack gap={2}>
        <div>
          <LearnMore title={`Choose which LLM model to use for the assistant.`}>
            <SectionTitle>Default AI Model</SectionTitle>
          </LearnMore>
          <AssistantModelSelect
            value={assistantModel}
            onChange={(event) => setAssistantModel(event.target.value)}
            disabled={isLoading}
          />
          <Button
            size="small"
            color="secondary"
            onClick={handleToggleModelComparison}
            endIcon={
              <ExpandMore
                sx={{
                  transform: showModelComparison ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.5s",
                }}
                fontSize="inherit"
              />
            }
            sx={{
              display: "flex",
              marginY: 1,
              paddingX: 2,
            }}
          >
            <span>AI Model Comparison</span>
          </Button>
          <Collapse in={showModelComparison}>
            <ModelComparisonTable />
          </Collapse>
        </div>
        <div>
          <LearnMore
            title={
              <>
                The API key which will be used to call OpenAI. You can get one from
                platform.openai.com.
                <br />
                <br />
                The key is stored securely (with encryption) and only used for API calls.
              </>
            }
          >
            <SectionTitle>OpenAI API Key</SectionTitle>
          </LearnMore>
          <TextField
            type={showPassword ? "text" : "password"}
            size="small"
            value={assistantApiKey}
            onChange={(e) => setAssistantApiKey(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="sk-..."
            InputProps={{
              endAdornment: passwordAdornment,
            }}
          />
        </div>
        <div>
          <Button variant="contained" onClick={handleSave} disabled={isLoading || isSaving}>
            Save
          </Button>
        </div>
      </Stack>
    </Paper>
  )
}
