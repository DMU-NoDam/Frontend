export const OAUTH_PROVIDERS = ['google', 'kakao', 'naver'] as const

export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number]

export type AuthUser = {
  email: string
  name: string
  provider: OAuthProvider
  oauthUser: boolean
}

export type AuthSession = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export type OAuthLoginRequest = {
  provider: OAuthProvider
  code: string
}

export type OAuthLoginResponse = {
  message: string
  body: AuthSession
}
