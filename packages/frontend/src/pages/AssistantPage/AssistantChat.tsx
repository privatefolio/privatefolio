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
import { Box, Button, Input, Paper, Stack, Tooltip, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AssistantModelSelect } from "src/components/AssistantModelSelect"
import { CircularSpinner } from "src/components/CircularSpinner"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { ExternalLink } from "src/components/ExternalLink"
import { $activeAccount } from "src/stores/account-store"
import { $assistantModel } from "src/stores/device-settings-store"
import { colorArray, yellowBright } from "src/utils/color-utils"
import { extractRootUrl } from "src/utils/utils"
import { $rest, $rpc } from "src/workers/remotes"

import { CustomMarkdown } from "./CustomMarkdown"

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

        const messages: Message[] = chatHistory.map((msg) => ({
          annotations: msg.metadata ? Object.values(JSON.parse(msg.metadata)) : undefined,
          content: msg.message,
          createdAt: new Date(msg.timestamp),
          id: msg.id,
          parts: msg.parts ? JSON.parse(msg.parts) : undefined,
          role: msg.role,
        }))

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
    id: existingConversationId || window.crypto.randomUUID(),
    initialMessages,
    onError: async (error) => {
      try {
        await rpc.upsertChatMessage(activeAccount, {
          conversationId: existingConversationId || id,
          message: error.message,
          metadata: JSON.stringify({ modelId, severity: "error" }),
          parts: undefined,
          role: "system",
          timestamp: Date.now(),
        })
      } catch {}
    },
    onFinish: async (message) => {
      try {
        await rpc.upsertChatMessage(activeAccount, {
          conversationId: existingConversationId || id,
          id: message.id,
          message: message.content,
          metadata: JSON.stringify({ modelId }),
          parts: message.parts ? JSON.stringify(message.parts) : undefined,
          role: message.role as "assistant",
          timestamp: Date.now(),
        })
      } catch {}
    },
    onToolCall: (toolCall) => {
      console.log("📜 LOG > onToolCall > toolCall:", toolCall)
    },
  })

  const isWaiting = status === "submitted"
  const isStreaming = status === "streaming"
  const isLoading = isWaiting || isStreaming

  const handleSubmitRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isLoading) return

    handleSubmit(event)
    setTimeout(() => inputRef.current?.focus(), 10)

    try {
      await rpc.upsertChatMessage(activeAccount, {
        conversationId: existingConversationId || id,
        message: input,
        role: "user",
        timestamp: Date.now(),
      })

      searchParams.set("new", "false")
      setSearchParams(searchParams, { replace: true })
    } catch (error) {
      console.error("Failed to save user message:", error)
    }
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

  if (isLoadingHistory) return <DefaultSpinner />

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
                startIcon={<LeaderboardRounded sx={{ color: colorArray[4] }} />}
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
                startIcon={<TipsAndUpdatesRounded sx={{ color: yellowBright }} />}
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
                startIcon={<TextSnippetRounded sx={{ color: colorArray[3] }} />}
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
                startIcon={<TravelExploreRounded sx={{ color: colorArray[6] }} />}
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
                    const toolPart = part as Extract<typeof part, { type: "tool-invocation" }>
                    const tool = toolPart.toolInvocation
                    const toolName = (
                      <Tooltip
                        title={
                          <Stack alignItems="center">
                            <span className="secondary">Call arguments</span>
                            <span>{JSON.stringify(tool.args, null, 2)}</span>
                          </Stack>
                        }
                      >
                        <Box
                          sx={{
                            backgroundColor: "action.hover",
                            borderRadius: 2,
                            letterSpacing: "0.05rem",
                            paddingX: 0.75,
                          }}
                          component="span"
                        >
                          {tool.toolName}
                        </Box>
                      </Tooltip>
                    )

                    return (
                      <Stack key={tool.toolCallId} alignItems="flex-start">
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          component={Stack}
                          direction="row"
                          alignItems="center"
                          gap={1}
                          sx={{
                            backgroundColor: "var(--mui-palette-background-paper)",
                            borderRadius: 3,
                            marginBottom: 0.5,
                            marginRight: 0.5,
                            paddingX: 1,
                            paddingY: 0.5,
                          }}
                        >
                          {tool.state === "call" && <CircularSpinner size={14} />}
                          {tool.state === "result" && <HandymanOutlined fontSize="inherit" />}
                          {tool.state === "partial-call" && <CircularSpinner size={14} />}
                          {tool.state === "call" && <>Using {toolName}...</>}
                          {tool.state === "result" && <>Used {toolName}</>}
                          {tool.state === "partial-call" && `Calling ${toolName}...`}
                        </Typography>
                      </Stack>
                    )
                  })}
                {message.parts
                  .filter((part) => part.type === "reasoning")
                  .map((part, index) => {
                    const reasoningPart = part as Extract<typeof part, { type: "reasoning" }>
                    return (
                      <Box
                        key={index}
                        sx={{
                          backgroundColor: "action.hover",
                          borderRadius: 2,
                          mb: 1,
                          px: 2,
                          py: 1,
                        }}
                      >
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontStyle: "italic" }}
                        >
                          Reasoning:
                        </Typography>
                        <Typography variant="body2" color="text.primary">
                          {reasoningPart.reasoning}
                        </Typography>
                        {reasoningPart.details.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {reasoningPart.details.map((detail, detailIndex) => (
                              <Typography
                                key={detailIndex}
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mt: 0.5 }}
                              >
                                {detail.type === "text" ? detail.text : "[Redacted]"}
                                {detail.type === "text" && detail.signature && (
                                  <Typography
                                    component="span"
                                    variant="caption"
                                    color="primary.main"
                                    sx={{ ml: 1 }}
                                  >
                                    {detail.signature}
                                  </Typography>
                                )}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
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
                        target="_blank"
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
                      (x) => typeof x === "string" && x.includes("error")
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
          </Box>
        ))}
        {isWaiting && (
          <Stack direction="row" alignItems="center" gap={1}>
            <CircularSpinner size={14} />
            <Typography variant="body2" color="text.secondary">
              Thinking...
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
