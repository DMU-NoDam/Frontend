export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]
export type AuthProvider = OAuthProvider | 'test'
export type AuthMode = 'oauth' | 'test' | 'dev-token'

export type AuthUser = {
  id?: number
  email: string
  name: string
  provider: AuthProvider
  oauthUser: boolean
}

export type AuthTokens = {
  accessToken: string
  refreshToken: string
}

export type AuthSession = AuthTokens & {
  user: AuthUser
  authMode?: AuthMode
}

export type OAuthLoginRequest = {
  provider: OAuthProvider
  code: string
}

export type OAuthLoginResponse = {
  message: string
  body: AuthSession
}

export type TokenRefreshRequest = {
  token: string
}

export type TokenRefreshResponse = {
  message: string
  body: AuthTokens
}

export type TestUserRequest = { role: 'USER' } | { id: number }

export type TestUserResponse = {
  message: string
  body: AuthTokens & {
    userId: number
  }
}
