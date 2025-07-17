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
import { $assistantModel } from "src/stores/device-settings-store"
import { logAndReportError } from "src/utils/error-utils"

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
  const [openaiApiKey, setOpenaiApiKey] = useState("")
  const [perplexityApiKey, setPerplexityApiKey] = useState("")
  const [anthropicApiKey, setAnthropicApiKey] = useState("")
  const [customApiKey, setCustomApiKey] = useState("")
  const [customApiUrl, setCustomApiUrl] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      setIsLoading(true)
      try {
        const savedSettings = await rpc.getSettings(activeAccount)
        const settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)

        setAssistantModel(settings.assistantModel)

        // Load all API keys
        const openaiKeyEncrypted = await rpc.getValue(activeAccount, "assistant_openai_key", "")
        const perplexityKeyEncrypted = await rpc.getValue(
          activeAccount,
          "assistant_perplexity_key",
          ""
        )
        const anthropicKeyEncrypted = await rpc.getValue(
          activeAccount,
          "assistant_anthropic_key",
          ""
        )
        const localApiKeyEncrypted = await rpc.getValue(
          activeAccount,
          "assistant_custom_api_key",
          ""
        )
        const localApiUrlEncrypted = await rpc.getValue(
          activeAccount,
          "assistant_custom_api_url",
          ""
        )

        setOpenaiApiKey(openaiKeyEncrypted ? "encrypted" : "")
        setPerplexityApiKey(perplexityKeyEncrypted ? "encrypted" : "")
        setAnthropicApiKey(anthropicKeyEncrypted ? "encrypted" : "")
        setCustomApiKey(localApiKeyEncrypted ? "encrypted" : "")
        setCustomApiUrl(localApiUrlEncrypted ? "encrypted" : "")
      } catch (error) {
        logAndReportError(error, "Failed to load assistant settings")
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
      $assistantModel.set(assistantModel)

      // Save API keys only if they were changed
      if (openaiApiKey !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_openai_key", openaiApiKey)
      }
      if (perplexityApiKey !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_perplexity_key", perplexityApiKey)
      }
      if (anthropicApiKey !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_anthropic_key", anthropicApiKey)
      }
      if (customApiKey !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_custom_api_key", customApiKey)
      }
      if (customApiUrl !== "encrypted") {
        await rpc.setEncryptedValue(activeAccount, "assistant_custom_api_url", customApiUrl)
      }

      enqueueSnackbar("Assistant settings saved", { variant: "success" })
    } catch (error) {
      logAndReportError(error, "Failed to save assistant settings")
      enqueueSnackbar("Failed to save assistant settings", { variant: "error" })
    } finally {
      setIsSaving(false)
    }
  }

  const [showPasswords, setShowPasswords] = useState({
    anthropic: false,
    custom: false,
    openai: false,
    perplexity: false,
  })

  const handleTogglePassword = (provider: keyof typeof showPasswords) => {
    setShowPasswords((prev) => ({
      ...prev,
      [provider]: !prev[provider],
    }))
  }

  const [showModelComparison, setShowModelComparison] = useState(true)
  const handleToggleModelComparison = () => {
    setShowModelComparison((show) => !show)
  }

  const createPasswordAdornment = (provider: keyof typeof showPasswords) => (
    <InputAdornment position="end">
      <IconButton
        aria-label="toggle password visibility"
        onClick={() => handleTogglePassword(provider)}
        edge="end"
        size="small"
        color="secondary"
      >
        {showPasswords[provider] ? (
          <VisibilityOff fontSize="small" />
        ) : (
          <Visibility fontSize="small" />
        )}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }}>
      <Stack gap={2}>
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
            type={showPasswords.openai ? "text" : "password"}
            size="small"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="sk-..."
            InputProps={{
              endAdornment: createPasswordAdornment("openai"),
            }}
          />
        </div>
        <div>
          <LearnMore
            title={
              <>
                The API key which will be used to call Perplexity. You can get one from
                perplexity.ai.
                <br />
                <br />
                The key is stored securely (with encryption) and only used for API calls.
              </>
            }
          >
            <SectionTitle>Perplexity API Key</SectionTitle>
          </LearnMore>
          <TextField
            type={showPasswords.perplexity ? "text" : "password"}
            size="small"
            value={perplexityApiKey}
            onChange={(e) => setPerplexityApiKey(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="pplx-..."
            InputProps={{
              endAdornment: createPasswordAdornment("perplexity"),
            }}
          />
        </div>
        <div>
          <LearnMore
            title={
              <>
                The API key which will be used to call Anthropic. You can get one from
                console.anthropic.com.
                <br />
                <br />
                The key is stored securely (with encryption) and only used for API calls.
              </>
            }
          >
            <SectionTitle>Anthropic API Key</SectionTitle>
          </LearnMore>
          <TextField
            type={showPasswords.anthropic ? "text" : "password"}
            size="small"
            value={anthropicApiKey}
            onChange={(e) => setAnthropicApiKey(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="sk-ant-..."
            InputProps={{
              endAdornment: createPasswordAdornment("anthropic"),
            }}
          />
        </div>
        <div>
          <LearnMore
            title={
              <>
                The base URL for your custom API server. This should be an OpenAI-compatible
                endpoint.
                <br />
                <br />
                Example: http://localhost:12434/engines/v1
              </>
            }
          >
            <SectionTitle>Custom API URL</SectionTitle>
          </LearnMore>
          <TextField
            type="text"
            size="small"
            value={customApiUrl}
            onChange={(e) => setCustomApiUrl(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="http://localhost:12434/engines/v1"
          />
        </div>
        <div>
          <LearnMore
            title={
              <>
                The API key for your custom API server (if required). Leave empty if no
                authentication is needed.
                <br />
                <br />
                The key is stored securely (with encryption) and only used for API calls.
              </>
            }
          >
            <SectionTitle>Custom API Key</SectionTitle>
          </LearnMore>
          <TextField
            type={showPasswords.custom ? "text" : "password"}
            size="small"
            value={customApiKey}
            onChange={(e) => setCustomApiKey(e.target.value)}
            disabled={isLoading}
            sx={{ minWidth: 320 }}
            placeholder="optional..."
            InputProps={{
              endAdornment: createPasswordAdornment("custom"),
            }}
          />
        </div>
        <div>
          <LearnMore title={`Choose which LLM model to use for the assistant.`}>
            <SectionTitle>Deep research AI Model</SectionTitle>
          </LearnMore>
          <AssistantModelSelect
            value={assistantModel}
            onChange={(event) => setAssistantModel(event.target.value)}
            disabled={isLoading}
          />
          <div>
            <Button
              size="small"
              color="secondary"
              onClick={handleToggleModelComparison}
              endIcon={
                <ExpandMore
                  sx={{
                    transform: showModelComparison ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                  fontSize="inherit"
                />
              }
              sx={{
                display: "flex",
                marginX: -1,
                marginY: 1,
                paddingX: 1.5,
              }}
            >
              <SectionTitle>AI Model Comparison</SectionTitle>
            </Button>
            <Collapse in={showModelComparison}>
              <ModelComparisonTable />
            </Collapse>
          </div>
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
