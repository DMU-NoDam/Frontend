import type {
  AuthSession,
  AuthTokens,
  OAuthLoginRequest,
} from '@/features/auth/types/auth-types'

export const mockLogin = async ({
  provider,
}: OAuthLoginRequest): Promise<AuthSession> => {
  return Promise.resolve({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: {
      email: 'test@example.com',
      name: 'Mock User',
      provider,
      oauthUser: true,
    },
  })
}

export const mockTokenRefresh = async (refreshToken: string): Promise<AuthTokens> => {
  void refreshToken
  return Promise.resolve({
    accessToken: 'mock-access-token-refreshed',
    refreshToken: 'mock-refresh-token-refreshed',
  })
}
