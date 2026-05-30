import { useEffect } from 'react'

type BrowserChromeColors = {
  safeTopColor?: string
  safeBottomColor?: string
}

function ensureThemeColorMeta(): HTMLMetaElement {
  const existing = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (existing) return existing

  const meta = document.createElement('meta')
  meta.name = 'theme-color'
  document.head.appendChild(meta)
  return meta
}

export function useBrowserChrome({
  safeTopColor = '#ffffff',
  safeBottomColor = safeTopColor,
}: BrowserChromeColors = {}) {
  useEffect(() => {
    const root = document.documentElement
    const meta = ensureThemeColorMeta()

    meta.content = safeTopColor
    root.style.setProperty('--browser-theme-color', safeTopColor)
    root.style.setProperty('--safe-top-bg', safeTopColor)
    root.style.setProperty('--safe-bottom-bg', safeBottomColor)
  }, [safeBottomColor, safeTopColor])
}
