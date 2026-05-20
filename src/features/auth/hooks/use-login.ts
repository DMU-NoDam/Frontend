import { useMutation } from '@tanstack/react-query'
import type { UseMutationOptions } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import type { AuthSession, OAuthLoginRequest } from '../types/auth-types'
import { authApi } from '../api/auth-api'

type LoginMutationOptions = Pick<
  UseMutationOptions<AuthSession, Error, OAuthLoginRequest | void>,
  'mutationFn'
>

export const useLogin = (options?: LoginMutationOptions) => {
  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  return useMutation({
    mutationFn: options?.mutationFn ?? ((request) => authApi.login(request as OAuthLoginRequest)),
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
