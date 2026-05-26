import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AuthSession, AuthTokens, AuthUser } from '@/features/auth/types/auth-types'
import type { AuthMode } from '@/features/auth/types/auth-types'

type AuthState = {
  accessToken: string | null
  refreshToken: string | null
  user: AuthUser | null
  authMode: AuthMode | null
  isAuthenticated: boolean
  login: (payload: AuthSession) => void
  setTokens: (tokens: AuthTokens) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      authMode: null,
      isAuthenticated: false,

      login: ({ accessToken, refreshToken, user, authMode = 'oauth' }) =>
        set({
          accessToken,
          refreshToken,
          user,
          authMode,
          isAuthenticated: true,
        }),

      setTokens: ({ accessToken, refreshToken }) =>
        set({ accessToken, refreshToken }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          authMode: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'arubi-auth-session',
      storage: createJSONStorage(() => sessionStorage),
      // SECURITY NOTE: refreshToken is stored in sessionStorage (accessible to JS).
      // XSS on this origin can read it. sessionStorage limits exposure to the current
      // tab session (unlike localStorage which persists across sessions).
      // Long-term fix: backend should issue refreshToken as HttpOnly Secure SameSite
      // cookie so JS cannot access it at all. Until then, this is the least-bad
      // client-side option for OAuth session survival across page reloads.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        authMode: state.authMode,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
