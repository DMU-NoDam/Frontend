import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { tripApi } from '../api/trip-api'

export const useCreateTrip = () => {
  const navigate = useNavigate()

  return useMutation({
    mutationFn: tripApi.createTrip,
    onSuccess: () => {
      navigate('/dashboard')
    },
  })
}
