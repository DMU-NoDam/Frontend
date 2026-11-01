import { useQuery } from '@tanstack/react-query'
import { waitForGoogleMaps } from '@/shared/lib/google-maps-loader'

export type PlaceAuthor = { displayName: string; uri?: string }
type PlacePhoto = {
  authorAttributions: PlaceAuthor[]
  getURI(options: { maxWidth: number; maxHeight: number }): string
}
type PlaceReview = {
  authorAttribution?: PlaceAuthor
  rating?: number
  text?: string
  relativePublishTimeDescription?: string
}
type PlaceDetails = {
  displayName?: string | null
  formattedAddress?: string | null
  rating?: number | null
  userRatingCount?: number | null
  regularOpeningHours?: { weekdayDescriptions: string[] } | null
  photos?: PlacePhoto[]
  reviews?: PlaceReview[]
  attributions?: { provider?: string; providerURI?: string }[]
}
type GooglePlace = PlaceDetails & {
  fetchFields(options: { fields: string[] }): Promise<unknown>
}
type PlacesLibrary = {
  Place: new (options: { id: string; requestedLanguage: string }) => GooglePlace
}

export function usePlaceDetails(googleId: string | undefined) {
  return useQuery({
    queryKey: ['google-place-details', googleId, 'ko'],
    enabled: Boolean(googleId),
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!googleId) throw new Error('Missing place ID')
      await waitForGoogleMaps()
      if (!window.google) throw new Error('Google Maps unavailable')
      const { Place } = await window.google.maps.importLibrary('places') as PlacesLibrary
      const place = new Place({ id: googleId, requestedLanguage: 'ko' })
      await place.fetchFields({
        fields: ['displayName', 'formattedAddress', 'rating', 'userRatingCount', 'regularOpeningHours', 'photos', 'reviews'],
      })
      return {
        name: place.displayName,
        address: place.formattedAddress,
        rating: place.rating,
        ratingCount: place.userRatingCount,
        hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
        photos: (place.photos ?? []).slice(0, 6).map((photo) => ({
          url: photo.getURI({ maxWidth: 800, maxHeight: 600 }),
          authors: photo.authorAttributions,
        })),
        reviews: place.reviews ?? [],
        attributions: place.attributions ?? [],
      }
    },
  })
}
