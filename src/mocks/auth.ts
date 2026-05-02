import type {
  AuthSession,
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
