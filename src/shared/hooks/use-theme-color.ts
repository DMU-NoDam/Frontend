import { useLayoutEffect } from 'react'

export function useThemeColor(top: string, bottom: string) {
  useLayoutEffect(() => {
    // meta theme-color: Safari URL bar 틴트 (iOS 26 frosted glass에도 영향)
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    const prevMeta = meta.content

    // html/body 배경색: viewport-fit=cover로 확장된 safe area 실제 배경
    // iOS 26 frosted glass는 이 색을 투과해서 보여줌
    const prevHtml = document.documentElement.style.backgroundColor
    const prevBody = document.body.style.backgroundColor

    meta.content = top
    document.documentElement.style.backgroundColor = top
    document.body.style.backgroundColor = bottom

    // TabBar 등 CSS에서 참조
    document.documentElement.style.setProperty('--page-top-color', top)
    document.documentElement.style.setProperty('--page-bottom-color', bottom)

    return () => {
      meta!.content = prevMeta
      document.documentElement.style.backgroundColor = prevHtml
      document.body.style.backgroundColor = prevBody
      document.documentElement.style.removeProperty('--page-top-color')
      document.documentElement.style.removeProperty('--page-bottom-color')
    }
  }, [top, bottom])
}
