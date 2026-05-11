import { useEffect, useRef, useState } from 'react'

export type PlacePrediction = {
  placeId: string
  name: string
  description: string
}

type GoogleAutocompleteService = {
  fetchAutocompleteSuggestions: (
    request: {
      input: string
      includedPrimaryTypes?: string[]
      includedRegionCodes?: string[]
    },
  ) => Promise<{
    suggestions: Array<{
      placePrediction?: {
        placeId: string
        mainText?: { text: string }
        secondaryText?: { text: string }
        text: { text: string }
      }
    }>
  }>
}

type GooglePlacesLibrary = {
  AutocompleteSuggestion: GoogleAutocompleteService
}

declare global {
  interface Window {
    google?: {
      maps: {
        importLibrary: (library: 'places') => Promise<GooglePlacesLibrary>
      }
    }
  }
}

let scriptLoaded = false
let scriptLoading = false
let placesLibraryPromise: Promise<GooglePlacesLibrary> | null = null
const loadCallbacks: Array<() => void> = []

function loadGoogleMapsScript(apiKey: string) {
  if (scriptLoaded || scriptLoading) return
  scriptLoading = true

  const script = document.createElement('script')
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`
  script.async = true
  script.onload = () => {
    scriptLoaded = true
    scriptLoading = false
    loadCallbacks.forEach((cb) => cb())
    loadCallbacks.length = 0
  }
  document.head.appendChild(script)
}

function getPlacesLibrary() {
  if (!window.google?.maps?.importLibrary) return null

  placesLibraryPromise ??= window.google.maps.importLibrary('places')
  return placesLibraryPromise
}

function waitForPlacesLibrary() {
  return new Promise<GooglePlacesLibrary | null>((resolve) => {
    const startedAt = Date.now()

    const check = () => {
      const placesLibrary = getPlacesLibrary()
      if (placesLibrary) {
        placesLibrary.then(resolve).catch(() => resolve(null))
        return
      }

      if (Date.now() - startedAt > 10000) {
        resolve(null)
        return
      }

      window.setTimeout(check, 100)
    }

    check()
  })
}

export function usePlacesAutocomplete() {
  const [isReady, setIsReady] = useState(false)
  const serviceRef = useRef<GoogleAutocompleteService | null>(null)

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    if (!apiKey) return

    const init = async () => {
      const placesLibrary = await waitForPlacesLibrary()
      if (!placesLibrary) return

      const { AutocompleteSuggestion } = placesLibrary

      serviceRef.current = AutocompleteSuggestion
      setIsReady(true)
    }

    if (scriptLoaded) {
      init()
      return
    }

    loadCallbacks.push(init)
    loadGoogleMapsScript(apiKey)
  }, [])

  const getPredictions = (
    input: string,
    options?: { types?: string[]; countryCode?: string },
  ): Promise<PlacePrediction[]> => {
    if (!serviceRef.current || !input.trim()) return Promise.resolve([])

    return serviceRef.current
      .fetchAutocompleteSuggestions({
        input,
        includedPrimaryTypes: options?.types,
        includedRegionCodes: options?.countryCode
          ? [options.countryCode.toUpperCase()]
          : undefined,
      })
      .then(({ suggestions }) =>
        suggestions.flatMap((suggestion) => {
          const prediction = suggestion.placePrediction
          if (!prediction) return []

          return {
            placeId: prediction.placeId,
            name: prediction.mainText?.text ?? prediction.text.text,
            description:
              prediction.secondaryText?.text ?? prediction.text.text,
          }
        }),
      )
      .catch(() => [])
  }

  return { isReady, getPredictions }
}
