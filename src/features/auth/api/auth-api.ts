import { mockLogin } from '@/mocks/auth'
import { apiClient } from '@/shared/api/client'
import type {
  AuthSession,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
} from '../types/auth-types'

export const useMockAuth = import.meta.env.VITE_USE_MOCK_AUTH === 'true'

const getOAuthStartUrl = (provider: OAuthProvider) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''

  return `${baseUrl}/user/public/oauth?provider=${provider}`
}

const login = async ({
  provider,
  code,
}: OAuthLoginRequest): Promise<AuthSession> => {
  if (useMockAuth) {
    return mockLogin({ provider, code })
  }

  const { data } = await apiClient.get<OAuthLoginResponse>(
    `/user/public/oauth/${provider}`,
    {
      params: { code },
    },
  )

  return data.body
}

export const authApi = {
  getOAuthStartUrl,
  login,
}
