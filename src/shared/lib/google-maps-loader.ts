declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary: (library: string) => Promise<unknown>
        event: {
          removeListener(listener: unknown): void
          trigger(instance: unknown, eventName: string): void
        }
      }
    }
  }
}

let scriptLoaded = false
let scriptPromise: Promise<void> | null = null

export function loadGoogleMapsScript(): Promise<void> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return Promise.reject(new Error('Missing VITE_GOOGLE_MAPS_API_KEY'))
  }

  if (window.google?.maps?.importLibrary) {
    scriptLoaded = true
    return Promise.resolve()
  }

  if (scriptLoaded) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
    script.async = true
    script.onload = () => {
      scriptLoaded = true
      resolve()
    }
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Failed to load Google Maps script'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

export async function waitForGoogleMaps(timeoutMs = 10_000): Promise<void> {
  await loadGoogleMapsScript()

  if (window.google?.maps?.importLibrary) return

  return new Promise((resolve, reject) => {
    const start = Date.now()
    const id = window.setInterval(() => {
      if (window.google?.maps?.importLibrary) {
        window.clearInterval(id)
        resolve()
        return
      }

      if (Date.now() - start > timeoutMs) {
        window.clearInterval(id)
        reject(new Error('Google Maps load timeout'))
      }
    }, 100)
  })
}
