import { mockLogin, mockTokenRefresh } from '@/mocks/auth'
import { apiClient, refreshClient } from '@/shared/api/client'
import type {
  AuthSession,
  AuthTokens,
  OAuthLoginRequest,
  OAuthLoginResponse,
  OAuthProvider,
  TokenRefreshResponse,
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

const tokenRefresh = async (refreshToken: string): Promise<AuthTokens> => {
  if (useMockAuth) {
    return mockTokenRefresh(refreshToken)
  }

  const { data } = await refreshClient.post<TokenRefreshResponse>(
    '/user/public/token-refresh',
    { token: refreshToken },
  )

  return data.body
}

export const authApi = {
  getOAuthStartUrl,
  login,
  tokenRefresh,
}
