import { Message, useChat } from "@ai-sdk/react"
import {
  ArrowUpwardRounded,
  HandymanOutlined,
  LanguageRounded,
  LeaderboardRounded,
  StopRounded,
  TextSnippetRounded,
  TipsAndUpdatesRounded,
  TravelExploreRounded,
} from "@mui/icons-material"
import {
  Avatar,
  AvatarGroup,
  Box,
  Button,
  Chip,
  Input,
  ListItemText,
  Paper,
  Select,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import {
  AVAILABLE_MODELS,
  AVAILABLE_MODES,
} from "privatefolio-backend/src/settings/assistant-models"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AssistantModelSelect } from "src/components/AssistantModelSelect"
import { BrainSvg } from "src/components/BrainSvg"
import { CircularSpinner } from "src/components/CircularSpinner"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { ExternalLink } from "src/components/ExternalLink"
import { MenuItemWithTooltip } from "src/components/MenuItemWithTooltip"
import { $activeAccount } from "src/stores/account-store"
import { $assistantMode, $assistantModel } from "src/stores/device-settings-store"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { extractRootUrl } from "src/utils/utils"
import { $rest, $rpc } from "src/workers/remotes"

import { ChatMessageToolbar } from "./ChatMessageToolbar"
import { CustomMarkdown } from "./CustomMarkdown"
import { ToolComponent } from "./ToolComponent"

export function AssistantChat() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const [searchParams, setSearchParams] = useSearchParams()
  const existingConversationId = searchParams.get("conversation")
  const isNewConversation = searchParams.get("new") === "true"

  useEffect(() => {
    document.title = `Assistant chat - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const rest = useStore($rest)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const modelId = useStore($assistantModel)
  const modeId = useStore($assistantMode)
  const model = useMemo(() => AVAILABLE_MODELS.find((x) => x.id === modelId), [modelId])
  const [initialMessages, setInitialMessages] = useState<Message[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!existingConversationId)

  // Load existing conversation messages if conversationId is provided
  useEffect(() => {
    if (!activeAccount) return
    if (!existingConversationId || isNewConversation) {
      setIsLoadingHistory(false)
      setInitialMessages([])
      return
    }

    const loadConversationHistory = async () => {
      try {
        setIsLoadingHistory(true)
        const chatHistory = await rpc.getChatHistoryByConversation(
          activeAccount,
          existingConversationId
        )

        const messages: Message[] = chatHistory.map((msg) => {
          const metadata = msg.metadata ? JSON.parse(msg.metadata) : undefined
          const annotations = metadata
            ? Object.keys(metadata).map((key) => ({
                key,
                value: metadata[key],
              }))
            : undefined

          return {
            annotations,
            content: msg.message,
            createdAt: new Date(msg.timestamp),
            id: msg.id,
            parts: msg.parts ? JSON.parse(msg.parts) : undefined,
            role: msg.role,
          }
        })

        setInitialMessages(messages)
      } catch (error) {
        console.error("Failed to load conversation history:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    }

    loadConversationHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingConversationId, activeAccount, rpc])

  const { messages, input, handleInputChange, handleSubmit, error, status, stop, id } = useChat({
    api: `${rest.baseUrl}/assistant-chat`,
    body: { accountName: activeAccount, modelId },
    headers: { Authorization: `Bearer ${localStorage.getItem(rest.jwtKey)}` },
    id:
      existingConversationId ||
      (function generateId() {
        if (existingConversationId) return existingConversationId
        searchParams.set("new", "true")
        setSearchParams(searchParams, { replace: true })
        return window.crypto.randomUUID()
      })(),
    initialMessages,
  })

  const latestMessage = messages[messages.length - 1]
  const isWaiting = status === "submitted" || (status === "streaming" && !latestMessage.content)
  const isStreaming = status === "streaming"
  const isReady = status === "ready"
  const isLoading = isWaiting || isStreaming

  const handleSubmitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    handleSubmit(event)
    setTimeout(() => inputRef.current?.focus(), 10)

    searchParams.set("new", "false")
    setSearchParams(searchParams, { replace: true })
  }

  const handleStop = () => {
    stop()
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const hasMessages = initialMessages.length > 0 || messages.length > 0

  useEffect(() => {
    if (existingConversationId === id) return

    searchParams.set("conversation", id)
    setSearchParams(searchParams, { replace: true })
  }, [existingConversationId, id, hasMessages, searchParams, setSearchParams])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 10)
  }, [id])

  if (isLoadingHistory) return <DefaultSpinner wrapper />

  return (
    <Stack
      gap={2}
      sx={{
        height: "calc(100vh - 170px)",
        marginTop: 4,
      }}
    >
      <Box
        ref={messagesContainerRef}
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          flexGrow: hasMessages ? 1 : 0,
          gap: 1,
          paddingBottom: 2,
          paddingX: 2,
        }}
      >
        {!hasMessages && (
          <Stack alignItems="center">
            <Typography variant="h4" textAlign="center" marginTop={10}>
              What can I help you with?
            </Typography>
            <Stack
              direction="row"
              justifyContent="center"
              gap={1}
              marginTop={2}
              maxWidth={500}
              flexWrap="wrap"
            >
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<LeaderboardRounded sx={{ color: "var(--mui-palette-color-cyan)" }} />}
                onClick={() => {
                  handleInputChange({
                    target: { value: "Analyze my latest trade" },
                  } as React.ChangeEvent<HTMLInputElement>)
                  inputRef.current?.focus()
                }}
              >
                Analyze my latest trade
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={
                  <TipsAndUpdatesRounded sx={{ color: "var(--mui-palette-color-yellow)" }} />
                }
                onClick={() => {
                  handleInputChange({
                    target: { value: "Make a plan for reducing exposure" },
                  } as React.ChangeEvent<HTMLInputElement>)
                  inputRef.current?.focus()
                }}
              >
                Make a plan for reducing exposure
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<TextSnippetRounded sx={{ color: "var(--mui-palette-color-green)" }} />}
                onClick={() => {
                  handleInputChange({
                    target: { value: "Create a monthly report" },
                  } as React.ChangeEvent<HTMLInputElement>)
                  inputRef.current?.focus()
                }}
              >
                Create a monthly report
              </Button>
              <Button
                variant="outlined"
                color="secondary"
                startIcon={
                  <TravelExploreRounded sx={{ color: "var(--mui-palette-color-indigo)" }} />
                }
                onClick={() => {
                  handleInputChange({
                    target: { value: "Research my top holding" },
                  } as React.ChangeEvent<HTMLInputElement>)
                  inputRef.current?.focus()
                }}
              >
                Research my top holding
              </Button>
            </Stack>
          </Stack>
        )}
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              ...(message.role === "user" && {
                alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                backgroundColor: "background.paper",
                borderRadius: 3.5,
                maxWidth: "60%",
                paddingX: 2.5,
                paddingY: 1.5,
              }),
            }}
          >
            {message.parts && (
              <>
                {message.parts
                  .filter((part) => part.type === "tool-invocation")
                  .map((part) => {
                    const x = part as Extract<typeof part, { type: "tool-invocation" }>
                    const { toolCallId, toolName, args, state } = x.toolInvocation

                    return (
                      <ToolComponent key={toolCallId} args={args} state={state}>
                        {toolName}
                      </ToolComponent>
                    )
                  })}
                {message.parts
                  .filter((part) => part.type === "reasoning")
                  .map((part, index) => {
                    const { reasoning, details: _details } = part as Extract<
                      typeof part,
                      { type: "reasoning" }
                    >

                    return (
                      <CustomMarkdown
                        key={index}
                        variant="body2"
                      >{`<think>${reasoning}</think>`}</CustomMarkdown>
                    )
                  })}
                {message.parts
                  .filter((part) => part.type === "source")
                  .map((part) => {
                    const { source } = part as Extract<typeof part, { type: "source" }>
                    return (
                      <ExternalLink
                        key={source.id}
                        href={source.url}
                        variant="body2"
                        sx={{
                          backgroundColor: "var(--mui-palette-background-paper)",
                          borderRadius: 3,
                          display: "inline-block",
                          marginBottom: 0.5,
                          marginRight: 0.5,
                          paddingX: 1,
                          paddingY: 0.5,
                        }}
                      >
                        <LanguageRounded
                          fontSize="inherit"
                          sx={{ marginRight: 1, verticalAlign: "middle" }}
                        />
                        {source.title || extractRootUrl(source.url)}
                      </ExternalLink>
                    )
                  })}
                {message.parts
                  .filter((part) => part.type === "file")
                  .map((part, index) => {
                    const filePart = part as Extract<typeof part, { type: "file" }>
                    const isImage = filePart.mimeType.startsWith("image/")
                    const isText = filePart.mimeType.startsWith("text/")

                    return (
                      <Box
                        key={index}
                        sx={{
                          backgroundColor: "grey.100",
                          borderRadius: 2,
                          mt: 1,
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: "bold", mb: 1 }}
                        >
                          File ({filePart.mimeType}):
                        </Typography>
                        {isImage && (
                          <Box
                            component="img"
                            src={filePart.data}
                            alt="File attachment"
                            sx={{
                              borderRadius: 1,
                              maxHeight: 400,
                              maxWidth: "100%",
                            }}
                          />
                        )}
                        {isText && (
                          <Typography
                            variant="body2"
                            component="pre"
                            sx={{
                              backgroundColor: "grey.50",
                              borderRadius: 1,
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              overflow: "auto",
                              px: 1,
                              py: 0.5,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {filePart.data}
                          </Typography>
                        )}
                        {!isImage && !isText && (
                          <Typography variant="body2" color="text.secondary">
                            [File content - {filePart.mimeType}]
                          </Typography>
                        )}
                      </Box>
                    )
                  })}
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part, index) => {
                    const textPart = part as Extract<typeof part, { type: "text" }>
                    const isError = message.annotations?.find(
                      (x) =>
                        x !== null &&
                        typeof x === "object" &&
                        "key" in x &&
                        x.key === "severity" &&
                        x.value === "error"
                    )

                    return (
                      <CustomMarkdown
                        key={index}
                        variant="body2"
                        color={isError ? "error" : "text.primary"}
                      >
                        {isError ? `Error: ${textPart.text}` : textPart.text}
                      </CustomMarkdown>
                    )
                  })}
                {/* {message.parts
              ?.filter((part) => part.type === "step-start")
              .map((part, index) => (
                <Box
                  key={index}
                  sx={{
                    borderColor: "divider",
                    borderTop: "2px solid",
                    mt: 2,
                    pt: 1,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: "bold" }}>
                    Step {index + 1}
                  </Typography>
                </Box>
              ))} */}
              </>
            )}
            {isReady && !message.content && (
              <Typography variant="body2" color="text.secondary" marginX={1}>
                No response from the assistant.
              </Typography>
            )}
            <ChatMessageToolbar message={message} />
          </Box>
        ))}
        {isWaiting && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularSpinner size={14} />
            <Typography variant="body2" color="text.secondary">
              Processing...
            </Typography>
          </Stack>
        )}
        {error && (
          <Typography variant="body2" color="error">
            {String(error)}
          </Typography>
        )}
      </Box>
      <Box
        component="form"
        onSubmit={handleSubmitRequest}
        sx={{
          "&::after": {
            backgroundColor: "var(--mui-palette-background-default)",
            bottom: 0,
            content: "''",
            display: "block",
            height: 32 + 3 * 8,
            position: "absolute",
            width: "100%",
            zIndex: -1,
          },
          bottom: 0,
          left: 0,
          marginX: 2,
          position: "sticky",
          right: 0,
          zIndex: 1000,
        }}
      >
        <Paper
          elevation={1}
          transparent="off"
          component={Stack}
          gap={0.25}
          sx={{
            borderRadius: 3.5,
            marginBottom: 3,
            // marginX: "auto",
            // maxWidth: 720,
            padding: 1,
          }}
        >
          <Input
            inputRef={inputRef}
            sx={{ marginLeft: 1.5 }}
            disableUnderline
            name="prompt"
            fullWidth
            size="medium"
            placeholder="Ask anything..."
            multiline
            autoFocus
            maxRows={10}
            minRows={2}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault()
                event.currentTarget.form?.requestSubmit()
              }
            }}
          />
          <Stack direction="row" alignItems="flex-end" gap={1} justifyContent="space-between">
            <Stack direction="row" alignItems="center" gap={1}>
              <AssistantModelSelect
                size="small"
                variant="filled"
                disableUnderline
                color="secondary"
                sx={{
                  "& .MuiListItemAvatar-root": {
                    marginRight: 1,
                  },
                  "& .MuiSelect-select": {
                    borderRadius: "24px !important",
                    paddingX: 1.5,
                    paddingY: 0.5,
                  },
                  "& .MuiTypography-root": {
                    fontSize: "0.875rem",
                  },
                  "& input": {
                    borderRadius: 3,
                  },
                  background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
                  borderRadius: 3,
                }}
                value={modelId}
                onChange={(event) => $assistantModel.set(event.target.value)}
                disabled={isLoading}
              />
              <Select
                size="small"
                inputProps={{ name: "mode-select" }}
                variant="filled"
                disableUnderline
                color="secondary"
                sx={{
                  "& .MuiListItemAvatar-root": {
                    marginRight: 1,
                  },
                  "& .MuiSelect-select": {
                    borderRadius: "24px !important",
                    paddingX: 1.5,
                    paddingY: 0.5,
                  },
                  "& .MuiTypography-root": {
                    fontSize: "0.875rem",
                  },
                  "& input": {
                    borderRadius: 3,
                  },
                  background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
                  borderRadius: 3,
                }}
                value={modeId}
                onChange={(event) => $assistantMode.set(event.target.value)}
                disabled={isLoading}
              >
                {AVAILABLE_MODES.map((mode) => (
                  <MenuItemWithTooltip
                    key={mode.id}
                    value={mode.id}
                    tooltipProps={{
                      placement: "right",
                      title: mode.description,
                    }}
                    // disabled={mode.id !== "read"}
                  >
                    <ListItemText
                      primary={
                        <>
                          {mode.label}
                          {mode.id !== "read" && (
                            <Chip
                              size="small"
                              sx={{ fontSize: "0.625rem", height: 14, marginLeft: 1 }}
                              label="Coming soon"
                            />
                          )}
                        </>
                      }
                    />
                  </MenuItemWithTooltip>
                ))}
              </Select>
              <AvatarGroup sx={{ gap: 0.5 }}>
                {model?.capabilities?.map((x) => (
                  <Tooltip key={x} title={getFilterValueLabel(x)} placement="top">
                    <Avatar
                      sx={{
                        "& svg": { fontSize: 20 },
                        background: "rgba(var(--mui-palette-common-onBackgroundChannel) / 0.05)",
                        borderColor: "var(--mui-palette-background-paper) !important",
                        color: "text.secondary",
                        height: 30,
                        width: 30,
                      }}
                    >
                      {x === "web-search" && <LanguageRounded />}
                      {x === "reasoning" && <BrainSvg />}
                      {x === "tools" && <HandymanOutlined />}
                    </Avatar>
                  </Tooltip>
                ))}
              </AvatarGroup>
            </Stack>
            <Button
              variant="contained"
              type={isLoading ? "button" : "submit"}
              disabled={!input.trim() && !isLoading}
              color="primary"
              title={isLoading ? "Stop generation" : "Send message"}
              onClick={isLoading ? handleStop : undefined}
              sx={{
                alignSelf: "flex-end",
                color: "var(--mui-palette-primary-contrastText) !important",
                minWidth: "unset",
                padding: 1,
              }}
            >
              {isLoading ? (
                <StopRounded fontSize="small" />
              ) : (
                <ArrowUpwardRounded fontSize="small" />
              )}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}
