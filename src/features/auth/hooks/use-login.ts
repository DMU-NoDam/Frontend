import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import { authApi } from '../api/auth-api'

export const useLogin = () => {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (session) => {
      login(session)
      navigate('/dashboard')
    },
  })
}
