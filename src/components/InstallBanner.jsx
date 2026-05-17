import { useState, useEffect } from 'react'

const DISMISS_KEY = 'piczone_install_dismissed'

export default function InstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return
    const prompt = window._pwaInstallPrompt
    if (!prompt) return
    const timer = setTimeout(() => setShow(true), 45_000)
    return () => clearTimeout(timer)
  }, [])

  async function handleInstall() {
    const prompt = window._pwaInstallPrompt
    if (!prompt) return
    prompt.prompt()
    await prompt.userChoice
    dismiss()
  }

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="install-banner">
      <span className="install-banner-text">📱 Installez PicZone sur votre téléphone !</span>
      <div className="install-banner-actions">
        <button className="install-btn-primary" onClick={handleInstall}>Installer</button>
        <button className="install-btn-later" onClick={dismiss}>Plus tard</button>
      </div>
    </div>
  )
}
