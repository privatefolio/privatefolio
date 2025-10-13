import { AddRounded, ArrowForward } from "@mui/icons-material"
import {
  Box,
  Button,
  ButtonProps,
  Paper,
  Stack,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material"
import { useStore } from "@nanostores/react"
import { atom } from "nanostores"
import {
  etherscanConnExtension,
  etherscanFileExtension,
} from "privatefolio-backend/src/extensions/connections/etherscan/etherscan-settings"
import React, { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { AppLink } from "src/components/AppLink"
import { DefaultSpinner } from "src/components/DefaultSpinner"
import { ExtensionAvatar } from "src/components/ExtensionAvatar"
import { FileDrop } from "src/components/FileDrop"
import { NoFilterMatch } from "src/components/NoDataButton"
import { PlatformAvatar } from "src/components/PlatformAvatar"
import { SupportedCheckmark } from "src/components/SupportedCheckmark"
import { Truncate } from "src/components/Truncate"
import { Platform, RichExtension } from "src/interfaces"
import { PlatformPrefix } from "src/settings"
import { $activeAccount, $activeAccountPath } from "src/stores/account-store"
import { getFilterValueLabel } from "src/stores/metadata-store"
import { resolveUrl } from "src/utils/utils"
import { $rpc } from "src/workers/remotes"

import { AddTransactionDrawer } from "../TransactionsPage/AddTransactionDrawer"
import { AddConnectionDrawer } from "./connections/AddConnectionDrawer"
import { ImportHelp } from "./ImportHelp"
import { TrackProgressStep } from "./wizard/TrackProgressStep"

const steps = [
  {
    label: "Where is your data?",
  },
  {
    label: "How do you wish to import?",
  },
  {
    label: "Import",
  },
]

const PLATFORMS_PER_PAGE = 22

const customPlatforms: Platform[] = [
  {
    extensionsIds: [etherscanConnExtension, etherscanFileExtension],
    id: "all",
    image: resolveUrl("$STATIC_ASSETS/extensions/all-platforms.svg")!,
    name: "All EVMs",
    supported: true,
  },
]

const customExtensions: RichExtension[] = [
  {
    authorGithub: "privatefolio",
    description: "Add transaction",
    extensionLogoUrl: resolveUrl("$STATIC_ASSETS/extensions/privatefolio.svg")!,
    extensionName: "Add transaction",
    extensionType: "manual-import",
    extensionVersion: "1.0.0",
    githubUrl: "https://github.com/privatefolio/privatefolio",
    id: "privatefolio-manual-tx",
    platformIds: [],
    publishedAt: 0,
    sources: [],
    updatedAt: 0,
  },
]

interface OptionButtonProps extends ButtonProps {
  selected: boolean
}

function OptionButton({ selected, ...rest }: OptionButtonProps) {
  return (
    <Button
      variant="outlined"
      color="secondary"
      sx={{
        backgroundColor: selected
          ? "rgba(var(--mui-palette-accent-mainChannel) / 0.15) !important"
          : undefined,
        borderColor: selected ? "var(--mui-palette-accent-dark) !important" : undefined,
        borderRadius: 1,
        minHeight: 90,
        paddingY: 1.25,
        transition: "all 0.1s ease-in-out !important",
        width: 140,
      }}
      {...rest}
    />
  )
}

const $addConnectionDrawer = atom(false)
const $addTransactionDrawer = atom(false)

export function ImportDataWizard() {
  const activeAccount = useStore($activeAccount)
  useEffect(() => {
    document.title = `Import data wizard - ${activeAccount} - Privatefolio`
  }, [activeAccount])

  const [searchParams, setSearchParams] = useSearchParams()
  const platformId = searchParams.get("platformId") || undefined
  const extensionId = searchParams.get("extensionId") || undefined
  const activeStep = searchParams.get("step") ? Number(searchParams.get("step")) : 0

  const rpc = useStore($rpc)
  const activeAccountPath = useStore($activeAccountPath)

  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [extensions, setExtensions] = useState<RichExtension[]>([])

  const [searchQuery, setSearchQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState<PlatformPrefix | null>(null)

  const [visiblePlatformsCount, setVisiblePlatformsCount] = useState(PLATFORMS_PER_PAGE - 1)
  const [loading, setLoading] = useState(true)
  const groupId = searchParams.get("groupId") || undefined

  useEffect(() => {
    setLoading(true)
    Promise.all([
      rpc.getAllPlatforms().then((x) => {
        const platforms = [...customPlatforms, ...x]
        return platforms
      }),
      rpc.getExtensions().then((x) => {
        const importExtensions = x.filter(
          (x) => x.extensionType === "connection" || x.extensionType === "file-import"
        )
        const allExtensions = [...importExtensions, ...customExtensions]
        allExtensions.sort((a, b) => {
          // Sort connections before file imports
          if (a.extensionType === "connection" && b.extensionType === "file-import") {
            return -1
          }
          if (a.extensionType === "file-import" && b.extensionType === "connection") {
            return 1
          }
          // Sort by name
          if (a.extensionName && b.extensionName) {
            return a.extensionName.localeCompare(b.extensionName)
          }
          return 0
        })
        return allExtensions
      }),
    ])
      .then(([platforms, extensions]) => {
        // We only care about import extensions
        platforms = platforms.map((x) => {
          x.extensionsIds = x.extensionsIds?.filter((id) => extensions.some((e) => e.id === id))
          return x
        })
        platforms.sort((a, b) => (b.extensionsIds?.length ?? 0) - (a.extensionsIds?.length ?? 0))
        setPlatforms(platforms)
        setExtensions(extensions)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [rpc, activeAccount])

  const platform = useMemo(() => {
    return platforms.find((x) => x.id === platformId)
  }, [platforms, platformId])
  const extension = useMemo(() => {
    return extensions.find((x) => x.id === extensionId)
  }, [extensions, extensionId])

  const setActiveStep = useCallback(
    (activeStep: number) => {
      searchParams.set("step", String(activeStep))
      setSearchParams(searchParams)
    },
    [searchParams, setSearchParams]
  )

  const compatibleExtensions = useMemo(() => {
    if (!platform) return []
    return [
      ...extensions.filter((ext) => platform.extensionsIds?.includes(ext.id)),
      ...customExtensions,
    ]
  }, [platform, extensions])

  const filteredPlatforms = useMemo(() => {
    let filtered = platforms

    if (searchQuery) {
      filtered = filtered.filter((platform) =>
        platform.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    if (platformFilter) {
      filtered = filtered.filter((platform) => platform.id.startsWith(platformFilter))
    }

    return filtered
  }, [platforms, searchQuery, platformFilter])

  useEffect(() => {
    if (platform && !compatibleExtensions.find((x) => x.id === extensionId)) {
      searchParams.delete("extensionId")
      setSearchParams(searchParams)
    }
  }, [compatibleExtensions, extensionId, platform, searchParams, setSearchParams])

  useEffect(() => {
    setVisiblePlatformsCount(PLATFORMS_PER_PAGE - 1)
  }, [searchQuery, platformFilter])

  const handleNext = () => {
    setActiveStep(activeStep + 1)
  }

  const handleBack = () => {
    setActiveStep(activeStep - 1)
  }

  const handleReset = () => {
    setSearchParams(new URLSearchParams())
    setSearchQuery("")
    setPlatformFilter(null)
    setVisiblePlatformsCount(PLATFORMS_PER_PAGE - 1)
  }

  const handleShowMore = () => {
    setVisiblePlatformsCount((prev) => prev + PLATFORMS_PER_PAGE)
  }

  const handleSuccess = (groupId: string) => {
    searchParams.set("groupId", groupId)
    searchParams.set("step", "2")
    setSearchParams(searchParams)
  }

  if (loading) return <DefaultSpinner wrapper />

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Stack gap={2} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Select the blockchain, exchange or app that has your data.
            </Typography>
            <Stack gap={1}>
              <TextField
                placeholder="Search for blockchains, exchanges or apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
                sx={(theme) => ({
                  [theme.breakpoints.up("sm")]: {
                    minWidth: 360,
                  },
                })}
                InputProps={{
                  inputProps: {
                    // sx: { paddingY: "4px !important" },
                  },
                  sx: { borderRadius: 3 },
                }}
              />
              <Stack
                direction="row"
                flexWrap="wrap"
                gap={1}
                sx={{
                  "& .MuiButton-colorPrimary": {
                    borderColor: "primary.main",
                  },
                  "& .MuiButton-root": {
                    paddingX: 2,
                    paddingY: 0.5,
                  },
                }}
              >
                <Button
                  variant="outlined"
                  color={platformFilter === null ? "primary" : "secondary"}
                  onClick={() => setPlatformFilter(null)}
                  size="small"
                >
                  All
                </Button>
                <Button
                  variant="outlined"
                  color={platformFilter === PlatformPrefix.Chain ? "primary" : "secondary"}
                  onClick={() => setPlatformFilter(PlatformPrefix.Chain)}
                  size="small"
                >
                  Blockchains
                </Button>
                <Button
                  variant="outlined"
                  color={platformFilter === PlatformPrefix.Exchange ? "primary" : "secondary"}
                  onClick={() => setPlatformFilter(PlatformPrefix.Exchange)}
                  size="small"
                >
                  Exchanges
                </Button>
                <Button
                  variant="outlined"
                  color={platformFilter === PlatformPrefix.App ? "primary" : "secondary"}
                  onClick={() => setPlatformFilter(PlatformPrefix.App)}
                  size="small"
                >
                  Apps
                </Button>
              </Stack>
            </Stack>
            {filteredPlatforms.length > 0 ? (
              <Stack direction="row" gap={1} flexWrap="wrap">
                {filteredPlatforms.slice(0, visiblePlatformsCount).map((platform) => (
                  <Tooltip
                    key={platform.id}
                    title={
                      platform.extensionsIds && platform.extensionsIds.length > 0
                        ? `Supported by ${platform.extensionsIds.length} extensions`
                        : `Supports manual transactions only`
                    }
                  >
                    <span>
                      <OptionButton
                        selected={platformId === platform.id}
                        onClick={() => {
                          if (platformId === platform.id) {
                            searchParams.delete("platformId")
                          } else {
                            searchParams.set("platformId", platform.id)
                          }
                          setSearchParams(searchParams)
                        }}
                      >
                        <Stack direction="column" alignItems="center" gap={1}>
                          <PlatformAvatar src={platform.image} alt={platform.name} size="medium" />
                          <Stack direction="row" alignItems="center" gap={0.5}>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              component={Truncate}
                              sx={{ maxWidth: 100 }}
                            >
                              {platform.name}
                            </Typography>
                            <SupportedCheckmark extensions={platform?.extensionsIds} />
                          </Stack>
                        </Stack>
                      </OptionButton>
                    </span>
                  </Tooltip>
                ))}
                {filteredPlatforms.length > visiblePlatformsCount && (
                  <Button
                    variant="text"
                    color="secondary"
                    onClick={handleShowMore}
                    size="small"
                    sx={{
                      borderRadius: 1,
                      height: 90,
                      width: 140,
                    }}
                  >
                    Show more
                    <br />({filteredPlatforms.length - visiblePlatformsCount})
                  </Button>
                )}
              </Stack>
            ) : (
              <NoFilterMatch sx={{ marginX: 2 }} />
            )}
          </Stack>
        )
      case 1:
        return (
          <Stack gap={2} alignItems="flex-start">
            <Typography variant="body2" color="text.secondary">
              Choose how you want to{" "}
              {platform ? (
                <>
                  connect to <b>{platform?.name}</b>
                </>
              ) : (
                <>import your data</>
              )}
              .
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {(platform ? compatibleExtensions : extensions).map((extension) => (
                <OptionButton
                  key={extension.id}
                  selected={extensionId === extension.id}
                  onClick={() => {
                    if (extensionId === extension.id) {
                      searchParams.delete("extensionId")
                    } else {
                      searchParams.set("extensionId", extension.id)
                    }
                    setSearchParams(searchParams)
                  }}
                >
                  <Stack direction="column" alignItems="center" gap={1}>
                    <ExtensionAvatar
                      src={extension.extensionLogoUrl}
                      alt={extension.extensionName}
                      size="medium"
                    />
                    <Stack direction="column" alignItems="center" gap={0.5}>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        component={Truncate}
                        sx={{ maxWidth: 100 }}
                      >
                        {extension.extensionName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getFilterValueLabel(extension.extensionType)}
                      </Typography>
                    </Stack>
                  </Stack>
                </OptionButton>
              ))}
            </Stack>
            {extension && (
              <ImportHelp extensionType={extension.extensionType} extension={extension} />
            )}
          </Stack>
        )
      case 2:
        return <TrackProgressStep extension={extension!} groupId={groupId!} />
      default:
        return null
    }
  }

  const getStepActionButton = (step: number) => {
    let label = "Continue"
    let Icon = ArrowForward
    let direction: "start" | "end" = "end"
    let disabled = false
    let onClick: () => void = () => handleNext()

    switch (step) {
      case 0:
        return (
          <Stack direction="row" gap={1}>
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward />}
              disabled={!platform}
            >
              Continue
            </Button>
            <Button
              onClick={() => {
                searchParams.delete("platformId")
                setSearchParams(searchParams)
                handleNext()
              }}
              sx={{ paddingX: 2 }}
            >
              Skip this step
            </Button>
          </Stack>
        )
      case 1:
        disabled = !extension

        if (groupId) {
          onClick = () => handleNext()
        } else if (extension?.extensionType === "connection") {
          onClick = () => $addConnectionDrawer.set(true)
        } else if (extension?.extensionType === "manual-import") {
          onClick = () => $addTransactionDrawer.set(true)
        } else if (extension?.extensionType === "file-import") {
          return (
            <FileDrop
              variant="contained"
              color="primary"
              sx={{
                "&:hover": {},

                paddingX: 1,
                paddingY: 0.5,
              }}
              suggestedPlatformId={platformId}
              suggestedExtensionId={extensionId}
              onSuccess={handleSuccess}
            >
              <Stack direction="row" alignItems="center" gap={1} marginX={0.5}>
                <AddRounded
                  sx={{
                    color: "primary.contrastText",
                    fontSize: 20,
                    marginBottom: "-2px",
                  }}
                />
                <Typography variant="body2" color="primary.contrastText" fontWeight={500}>
                  Add files
                </Typography>
              </Stack>
            </FileDrop>
          )
        }
        if (extension?.extensionType === "connection") {
          label = "Add connection"
          Icon = AddRounded
          direction = "start"
        } else if (extension?.extensionType === "manual-import") {
          label = "Add data manually"
          Icon = AddRounded
          direction = "start"
        }
        break
      case 2:
        return (
          <>
            <Button
              variant="contained"
              component={AppLink}
              href={`${activeAccountPath}/server?tab=tasks&groupId=${groupId}`}
              endIcon={<ArrowForward />}
            >
              Track progress
            </Button>
            <Button onClick={handleReset} sx={{ paddingX: 2 }}>
              Import again
            </Button>
          </>
        )
    }

    return (
      <Button
        variant="contained"
        onClick={onClick}
        startIcon={direction === "start" ? <Icon /> : undefined}
        endIcon={direction === "end" ? <Icon /> : undefined}
        disabled={disabled}
      >
        {label}
      </Button>
    )
  }

  return (
    <Paper sx={{ paddingX: 2, paddingY: 1 }} component={Stack} gap={1}>
      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          This wizard will guide you through the process of importing your data into Privatefolio.
        </Typography>
        <Typography variant="body2" color="text.secondary" component="div">
          There are three ways to import your data:
          <Box component="ul" sx={{ marginY: 0.5, paddingLeft: 4 }}>
            <li>Connections</li>
            <li>File imports</li>
            <li>Manual transactions</li>
          </Box>
        </Typography>
      </Box>

      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((step, index) => (
          <Step key={step.label}>
            <StepLabel>{step.label}</StepLabel>
            <StepContent>
              {renderStepContent(index)}
              <Box sx={{ marginTop: 2 }}>
                <Stack direction="row" gap={1}>
                  {getStepActionButton(index)}
                  {index > 0 && index < 2 && (
                    <Button onClick={handleBack} sx={{ paddingX: 2 }}>
                      Back
                    </Button>
                  )}
                </Stack>
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
      <AddConnectionDrawer
        atom={$addConnectionDrawer}
        initialPlatformId={platformId}
        initialExtensionId={extensionId}
        onSuccess={handleSuccess}
      />
      <AddTransactionDrawer
        atom={$addTransactionDrawer}
        initialPlatformId={platformId}
        onSuccess={handleSuccess}
      />
    </Paper>
  )
}
