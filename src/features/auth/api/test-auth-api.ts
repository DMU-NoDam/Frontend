import axios from 'axios'
import type {
  AuthSession,
  AuthTokens,
  TestUserRequest,
  TestUserResponse,
} from '../types/auth-types'

const TEST_AUTH_ENABLED = import.meta.env.DEV && import.meta.env.VITE_ENABLE_TEST_AUTH === 'true'
const TEST_USER_ID = Number(import.meta.env.VITE_TEST_USER_ID ?? 10001)
const TEST_USER_ROLE: TestUserRequest['role'] = 'USER'

const testAuthClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 5000,
})

const requestTestUser = async (): Promise<TestUserResponse['body']> => {
  const { data } = await testAuthClient.post<TestUserResponse>('/test/user', {
    id: TEST_USER_ID,
    role: TEST_USER_ROLE,
  } satisfies TestUserRequest)

  return data.body
}

const login = async (): Promise<AuthSession> => {
  if (!TEST_AUTH_ENABLED) {
    throw new Error('Test auth is disabled.')
  }

  const { accessToken, refreshToken, userId } = await requestTestUser()

  return {
    accessToken,
    refreshToken,
    authMode: 'test',
    user: {
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

  const { accessToken, refreshToken } = await requestTestUser()
  return { accessToken, refreshToken }
}

export const testAuthApi = {
  enabled: TEST_AUTH_ENABLED,
  login,
  refresh,
}
