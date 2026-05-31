import axios from 'axios'
import { useAuthStore } from '@/app/store/auth-store'
import type {
  AuthSession,
  AuthTokens,
  TestUserRequest,
  TestUserResponse,
} from '../types/auth-types'

const TEST_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_AUTH === 'true'
const TEST_AUTH_REFRESH_ENABLED =
  TEST_AUTH_ENABLED && import.meta.env.VITE_ENABLE_TEST_AUTH_REFRESH === 'true'
const DEV_ACCESS_TOKEN =
  import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_TOKEN_LOGIN === 'true'
    ? import.meta.env.VITE_DEV_ACCESS_TOKEN
    : undefined
const DEV_TOKEN_LOGIN_ENABLED = Boolean(DEV_ACCESS_TOKEN)
const TEST_USER_ROLE = 'USER'

const testAuthClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 5000,
})

const requestTestUser = async (request: TestUserRequest): Promise<TestUserResponse['body']> => {
  const { data } = await testAuthClient.post<TestUserResponse>('/test/user', request)

  return data.body
}

const login = async (): Promise<AuthSession> => {
  if (!TEST_AUTH_ENABLED) {
    throw new Error('Test auth is disabled.')
  }

  const { accessToken, refreshToken, userId } = await requestTestUser({
    role: TEST_USER_ROLE,
  })

  return {
    accessToken,
    refreshToken,
    authMode: 'test',
    user: {
      id: userId,
      email: `test-user-${userId}@arubi.dev`,
      name: `Test User ${userId}`,
      provider: 'test',
      oauthUser: false,
    },
  }
}

const refresh = async (): Promise<AuthTokens> => {
  if (!TEST_AUTH_ENABLED) {
    throw new Error('Test auth is disabled.')
  }

  const userId = useAuthStore.getState().user?.id
  if (!userId) {
    throw new Error('Test user id is missing.')
  }

  const { accessToken, refreshToken } = await requestTestUser({
    id: userId,
  })
  return { accessToken, refreshToken }
}

const loginWithDevToken = async (): Promise<AuthSession> => {
  if (!DEV_ACCESS_TOKEN) {
    throw new Error('Dev token login is disabled.')
  }

  return {
    accessToken: DEV_ACCESS_TOKEN,
    refreshToken: '',
    authMode: 'dev-token',
    user: {
      email: 'dev-token-user@arubi.dev',
      name: 'Dev Token User',
      provider: 'test',
      oauthUser: false,
    },
  }
}

export const testAuthApi = {
  enabled: TEST_AUTH_ENABLED,
  refreshEnabled: TEST_AUTH_REFRESH_ENABLED,
  devTokenEnabled: DEV_TOKEN_LOGIN_ENABLED,
  login,
  loginWithDevToken,
  refresh,
}
