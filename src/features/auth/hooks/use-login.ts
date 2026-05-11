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
      const redirect = sessionStorage.getItem('pending_redirect')
      if (redirect) {
        sessionStorage.removeItem('pending_redirect')
        navigate(redirect)
      } else {
        navigate('/dashboard')
      }
    },
  })
}
