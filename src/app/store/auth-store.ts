import { create } from 'zustand'
import type { AuthSession, AuthTokens, AuthUser } from '@/features/auth/types/auth-types'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  isAuthenticated: boolean
  login: (payload: AuthSession) => void
  setTokens: (tokens: AuthTokens) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,

  login: ({ accessToken, refreshToken, user }) =>
    set({
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    }),

  setTokens: ({ accessToken, refreshToken }) =>
    set({ accessToken, refreshToken }),

  logout: () =>
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    }),
}))
