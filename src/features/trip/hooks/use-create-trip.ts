import { useMutation } from '@tanstack/react-query'
import { tripApi } from '../api/trip-api'

export const useCreateTrip = () => {
  return useMutation({
    mutationFn: tripApi.createTrip,
  })
}
