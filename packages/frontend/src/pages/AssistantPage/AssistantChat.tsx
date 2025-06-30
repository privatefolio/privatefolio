import { useChat } from "@ai-sdk/react"
import { ArrowUpwardRounded, StopRounded } from "@mui/icons-material"
import { Box, Button, Container, Input, Paper, Stack, Typography } from "@mui/material"
import { useStore } from "@nanostores/react"
import React, { useEffect, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import { useSearchParams } from "react-router-dom"
import remarkGfm from "remark-gfm"
import { AiModelSelect } from "src/components/AiModelSelect"
import { CircularSpinner } from "src/components/CircularSpinner"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { DEFAULT_SETTINGS } from "src/settings"
import { $activeAccount } from "src/stores/account-store"
import { $rest, $rpc } from "src/workers/remotes"

export function AssistantChat() {
  const rpc = useStore($rpc)
  const activeAccount = useStore($activeAccount)
  const [searchParams] = useSearchParams()
  const existingConversationId = searchParams.get("conversation")

  useEffect(() => {
    document.title = `Assistant chat - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const rest = useStore($rest)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false)
  const [model, setModel] = useState(DEFAULT_SETTINGS.assistantModel)
  const [initialMessages, setInitialMessages] = useState<any[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(!!existingConversationId)

  // Load existing conversation messages if conversationId is provided
  useEffect(() => {
    if (!existingConversationId || !activeAccount) return

    const loadConversationHistory = async () => {
      try {
        setIsLoadingHistory(true)
        const chatHistory = await rpc.getChatHistoryByConversation(
          activeAccount,
          existingConversationId
        )

        // Transform chat history to useChat message format
        const messages = chatHistory.map((msg) => ({
          content: msg.message,
          createdAt: new Date(msg.timestamp),
          id: msg.id,
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
  }, [existingConversationId, activeAccount, rpc])

  const { messages, input, handleInputChange, handleSubmit, error, status, stop, id } = useChat({
    api: `${rest.baseUrl}/assistant-chat`,
    body: { accountName: activeAccount, model },
    headers: { Authorization: `Bearer ${localStorage.getItem(rest.jwtKey)}` },
    id: existingConversationId || undefined,
    initialMessages,
    onFinish: async (message) => {
      try {
        await rpc.upsertChatMessage(activeAccount, {
          conversationId: existingConversationId || id,
          id: message.id,
          message: message.content,
          metadata: JSON.stringify({ model }),
          role: message.role as "assistant",
          timestamp: Date.now(),
        })
      } catch (error) {
        console.error("Failed to save assistant message:", error)
      }
    },
  })

  const isWaiting = status === "submitted"
  const isStreaming = status === "streaming"
  const isLoading = isWaiting || isStreaming

  useEffect(() => {
    if (!userHasScrolledUp) {
      window.scrollTo({ behavior: "instant", top: document.body.scrollHeight })
    }
  }, [messages, isLoading, userHasScrolledUp])

  useEffect(() => {
    const handleScroll = () => {
      const isAtBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 10 // 10px threshold
      setUserHasScrolledUp(!isAtBottom)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    } catch (error) {
      console.error("Failed to save user message:", error)
    }
  }

  const handleStop = () => {
    stop()
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  useEffect(() => {
    if (!activeAccount) return

    const loadSettings = async () => {
      const savedSettings = await rpc.getSettings(activeAccount)
      const settings = Object.assign({}, DEFAULT_SETTINGS, savedSettings)

      setModel(settings.assistantModel)
    }

    loadSettings()
  }, [activeAccount, rpc])

  const hasMessages = initialMessages.length > 0 || messages.length > 0

  if (isLoadingHistory) return <DefaultSpinner />

  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
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
          <Typography variant="h4" textAlign="center" marginTop={10}>
            What&apos;s on the agenda today?
          </Typography>
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
                paddingX: 3,
                paddingY: 0,
              }),
            }}
          >
            <Typography
              variant="body1"
              component="div"
              sx={{
                "& a": {
                  "&:hover": {
                    textDecoration: "underline",
                  },
                  color: "primary.main",
                  textDecoration: "none",
                },
                "& code": {
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  borderRadius: 1,
                  px: 0.5,
                  py: 0.125,
                },

                "& h3": {
                  marginY: 1,
                },
                "& li": {
                  marginY: 0.25,
                },
                "& ul, & ol": {
                  marginY: 1,
                },
              }}
            >
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </Typography>
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
            <AiModelSelect
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
              value={model}
              onChange={(event) => setModel(event.target.value)}
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
    </Container>
  )
}
