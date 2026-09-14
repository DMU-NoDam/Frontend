import { useMutation } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useNavigate } from 'react-router-dom'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
import { tripApi } from '../api/trip-api'

export const useCreateTrip = () => {
  const navigate = useNavigate()
  return useMutation({
    mutationFn: tripApi.createTrip,
    onError: (error) => {
      if (!isAxiosError(error) || error.response?.data?.code !== '0002') return
      useTripCreationStore.getState().clear()
      sessionStorage.removeItem('trip_form_pending')
      navigate('/trips/create', { replace: true, state: { restartTripCreation: true } })
    },
  })
}
