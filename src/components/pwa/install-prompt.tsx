'use client'

import { useEffect, useState } from 'react'

import { useI18n } from '@/i18n/provider'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const { t } = useI18n()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session or already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferredPrompt || dismissed) return null

  const handleInstall = async () => {
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setDismissed(true)
  }

  return (
    <div className="install-prompt" role="banner">
      <p className="install-prompt__text">{t('pwa.install_prompt')}</p>
      <button className="install-prompt__install" onClick={handleInstall} type="button">
        {t('pwa.install_button')}
      </button>
      <button
        className="install-prompt__dismiss"
        onClick={() => setDismissed(true)}
        type="button"
        aria-label={t('pwa.dismiss')}
      >
        ✕
      </button>
    </div>
  )
}
