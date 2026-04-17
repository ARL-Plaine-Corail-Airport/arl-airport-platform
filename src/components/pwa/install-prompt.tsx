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

  const visible = !!deferredPrompt && !dismissed

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
    setDismissed(true)
  }

  return (
    <div
      className={`install-prompt${visible ? '' : ' install-prompt--dismissed'}`}
      role="banner"
      style={{ display: visible ? undefined : 'none' }}
    >
      <div className="install-prompt__icon" aria-hidden="true">
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </svg>
      </div>
      <div className="install-prompt__copy">
        <p className="install-prompt__text">{t('pwa.install_prompt')}</p>
      </div>
      <div className="install-prompt__actions">
        <button className="install-prompt__install" onClick={handleInstall} type="button">
          {t('pwa.install_button')}
        </button>
        <button
          className="install-prompt__dismiss"
          onClick={() => setDismissed(true)}
          type="button"
          aria-label={t('pwa.dismiss')}
        >
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
