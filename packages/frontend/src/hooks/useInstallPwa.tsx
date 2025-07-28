import { useMediaQuery } from "@mui/material"
import { useCallback, useEffect, useState } from "react"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>
}

export function useInstallPwa() {
  const isInstalled = useMediaQuery("(display-mode: standalone)")
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const promptInstall = useCallback(async () => {
    if (!installPrompt) throw new Error("Something went wrong")

    installPrompt.prompt()
    const choiceResult = await installPrompt.userChoice
    setInstallPrompt(null)
    return choiceResult.outcome === "accepted"
  }, [installPrompt])

  return { isInstalled, promptInstall }
}
