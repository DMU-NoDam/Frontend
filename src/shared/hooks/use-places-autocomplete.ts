import { useEffect, useRef, useState } from 'react'
import { loadGoogleMapsScript } from '@/shared/lib/google-maps-loader'

export type PlacePrediction = {
  placeId: string
  name: string
  description: string
  placePrediction?: GooglePlacePrediction
}

export type PlaceLocation = {
  lat: number
  lng: number
}

export type PlacesSessionToken = unknown

type GooglePlaceInstance = {
  location?: { lat(): number; lng(): number }
  fetchFields(opts: { fields: string[] }): Promise<unknown>
}

type GooglePlacePrediction = {
  placeId: string
  mainText?: { text: string }
  secondaryText?: { text: string }
  text: { text: string }
  toPlace(): GooglePlaceInstance
}

type GoogleAutocompleteService = {
  fetchAutocompleteSuggestions: (
    request: {
      input: string
      includedPrimaryTypes?: string[]
      includedRegionCodes?: string[]
      sessionToken?: PlacesSessionToken
    },
  ) => Promise<{
    suggestions: Array<{
      placePrediction?: GooglePlacePrediction
    }>
  }>
}

type GooglePlacesLibrary = {
  AutocompleteSuggestion: GoogleAutocompleteService
  AutocompleteSessionToken: new () => PlacesSessionToken
}

const MAX_AUTOCOMPLETE_TYPES = 5

let placesLibraryPromise: Promise<GooglePlacesLibrary> | null = null

function getPlacesLibrary() {
  if (!window.google?.maps?.importLibrary) return null

  placesLibraryPromise ??= window.google.maps.importLibrary('places') as Promise<GooglePlacesLibrary>
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

function chunkTypes(types: string[]) {
  const chunks: string[][] = []

  for (let i = 0; i < types.length; i += MAX_AUTOCOMPLETE_TYPES) {
    chunks.push(types.slice(i, i + MAX_AUTOCOMPLETE_TYPES))
  }

  return chunks
}

function mapSuggestions(
  suggestions: Array<{
    placePrediction?: GooglePlacePrediction
  }>,
) {
  return suggestions.flatMap((suggestion) => {
    const prediction = suggestion.placePrediction
    if (!prediction) return []

    return {
      placeId: prediction.placeId,
      name: prediction.mainText?.text ?? prediction.text.text,
      description:
        prediction.secondaryText?.text ?? prediction.text.text,
      placePrediction: prediction,
    }
  })
}

export function usePlacesAutocomplete() {
  const [isReady, setIsReady] = useState(false)
  const serviceRef = useRef<GoogleAutocompleteService | null>(null)
  const placesLibraryRef = useRef<GooglePlacesLibrary | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      await loadGoogleMapsScript().catch(() => undefined)
      if (cancelled) return

      const placesLibrary = await waitForPlacesLibrary()
      if (!placesLibrary || cancelled) return

      const { AutocompleteSuggestion } = placesLibrary

      placesLibraryRef.current = placesLibrary
      serviceRef.current = AutocompleteSuggestion
      setIsReady(true)
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  const getPredictions = (
    input: string,
    options?: { types?: string[]; countryCode?: string; sessionToken?: PlacesSessionToken },
  ): Promise<PlacePrediction[]> => {
    if (!serviceRef.current || !input.trim()) return Promise.resolve([])

    const typeGroups = options?.types?.length
      ? chunkTypes(options.types)
      : [undefined]

    return Promise.all(
      typeGroups.map((types) =>
        serviceRef.current!.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: types,
          includedRegionCodes: options?.countryCode
            ? [options.countryCode.toUpperCase()]
            : undefined,
          sessionToken: options?.sessionToken,
        }),
      ),
    )
      .then((responses) => {
        const uniquePredictions = new Map<string, PlacePrediction>()

        responses
          .flatMap(({ suggestions }) => mapSuggestions(suggestions))
          .forEach((prediction) => {
            if (!uniquePredictions.has(prediction.placeId)) {
              uniquePredictions.set(prediction.placeId, prediction)
            }
          })

        return Array.from(uniquePredictions.values())
      })
  }

  const createSessionToken = (): PlacesSessionToken | null => {
    if (!placesLibraryRef.current) return null
    return new placesLibraryRef.current.AutocompleteSessionToken()
  }

  const getPlaceLocation = async (
    prediction: PlacePrediction,
  ): Promise<PlaceLocation | undefined> => {
    if (!prediction.placePrediction) return undefined

    const place = prediction.placePrediction.toPlace()

    try {
      await place.fetchFields({ fields: ['location'] })
    } catch {
      return undefined
    }

    if (!place.location) return undefined

    return {
      lat: place.location.lat(),
      lng: place.location.lng(),
    }
  }

  return { isReady, getPredictions, createSessionToken, getPlaceLocation }
}
