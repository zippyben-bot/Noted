import { useEffect, useState } from 'react'

// Surfaces whether Blunderlist can be installed as an app, and how.
// - Chromium fires `beforeinstallprompt`; we stash it and trigger it on demand.
// - iOS Safari has no such event — installing is manual (Share → Add to Home
//   Screen), so we detect iOS and signal that the UI should show instructions.
// - Once installed (or already running standalone) there's nothing to offer.
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(null)
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
  )

  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault() // stop Chrome's mini-infobar; we drive it ourselves
      setDeferred(e)
    }
    const onInstalled = () => {
      setInstalled(true)
      setDeferred(null)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream
  const canPrompt = !!deferred

  const promptInstall = async () => {
    if (!deferred) return
    deferred.prompt()
    await deferred.userChoice
    setDeferred(null) // a prompt can only be used once
  }

  return {
    // show an install affordance when not already installed and either the
    // browser offered a prompt or it's iOS (needs the manual instructions)
    canInstall: !installed && (canPrompt || isIOS),
    canPrompt,
    isIOS,
    promptInstall
  }
}
