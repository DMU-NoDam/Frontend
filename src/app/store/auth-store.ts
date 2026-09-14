import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PersistStorage, StorageValue } from 'zustand/middleware'
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
  updateUser: (partial: Partial<AuthUser>) => void
  logout: () => void
}

type PersistedAuthState = Pick<
  AuthState,
  'accessToken' | 'refreshToken' | 'user' | 'authMode' | 'isAuthenticated'
>

// 이전 버전(sessionStorage)과 같은 키를 그대로 쓴다.
const AUTH_STORAGE_KEY = 'arubi-auth-session'
const AUTH_MODES: readonly AuthMode[] = ['oauth', 'test', 'dev-token']

const loggedOutState: PersistedAuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  authMode: null,
  isAuthenticated: false,
}

// 브라우저 설정·프라이버시 모드에 따라 저장소 접근이 예외를 던질 수 있다.
// 저장소를 못 쓰더라도 앱은 메모리 상태로 계속 동작해야 하므로 예외를 밖으로 내보내지 않는다.
const getBrowserStorage = (type: 'localStorage' | 'sessionStorage'): Storage | null => {
  try {
    return window[type]
  } catch {
    return null
  }
}

const readItem = (storage: Storage | null, key: string): string | null => {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

const writeItem = (storage: Storage | null, key: string, value: string): boolean => {
  if (!storage) return false
  try {
    storage.setItem(key, value)
    return true
  } catch {
    return false
  }
}

const removeItem = (storage: Storage | null, key: string) => {
  try {
    storage?.removeItem(key)
  } catch {
    // 지우지 못해도 다음 로그아웃/이전 시 다시 시도된다.
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const isNullableString = (value: unknown) => value === null || typeof value === 'string'

// 인증 흐름이 의존하는 필드의 형태만 확인한다. authMode가 없는 과거 데이터는 null로 취급된다.
const isPersistedAuthState = (value: unknown): value is PersistedAuthState =>
  isRecord(value) &&
  isNullableString(value.accessToken) &&
  isNullableString(value.refreshToken) &&
  typeof value.isAuthenticated === 'boolean' &&
  (value.user === null || isRecord(value.user)) &&
  (value.authMode === undefined ||
    value.authMode === null ||
    AUTH_MODES.some((mode) => mode === value.authMode))

// 잘못된 JSON이나 예상과 다른 형태는 저장된 값이 없는 것으로 본다(로그아웃 상태로 시작).
const parseAuthStorageValue = (raw: string | null): StorageValue<PersistedAuthState> | null => {
  if (raw === null) return null
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isPersistedAuthState(parsed.state)) return null
    return {
      state: parsed.state,
      version: typeof parsed.version === 'number' ? parsed.version : undefined,
    }
  } catch {
    return null
  }
}

const removeLegacySessionAuth = () =>
  removeItem(getBrowserStorage('sessionStorage'), AUTH_STORAGE_KEY)

// sessionStorage에 인증을 저장하던 이전 버전의 데이터를 localStorage로 한 번 옮긴다.
// localStorage에 유효한 데이터가 있으면 그쪽을 우선하고, 과거 데이터는 이전에 성공했을 때만 지운다.
const migrateLegacySessionAuth = () => {
  const legacyRaw = readItem(getBrowserStorage('sessionStorage'), AUTH_STORAGE_KEY)
  if (legacyRaw === null) return

  const localStore = getBrowserStorage('localStorage')
  if (parseAuthStorageValue(readItem(localStore, AUTH_STORAGE_KEY)) !== null) {
    removeLegacySessionAuth()
    return
  }

  if (parseAuthStorageValue(legacyRaw) === null) return

  if (writeItem(localStore, AUTH_STORAGE_KEY, legacyRaw)) {
    removeLegacySessionAuth()
  }
}

const authStorage: PersistStorage<PersistedAuthState> = {
  getItem: (name) => parseAuthStorageValue(readItem(getBrowserStorage('localStorage'), name)),
  setItem: (name, value) => {
    writeItem(getBrowserStorage('localStorage'), name, JSON.stringify(value))
  },
  removeItem: (name) => removeItem(getBrowserStorage('localStorage'), name),
}

// persist가 store 생성 중에 hydration하므로 그 전에 이전을 끝낸다.
migrateLegacySessionAuth()

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...loggedOutState,

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

      updateUser: (partial) =>
        set((s) => ({ user: s.user ? { ...s.user, ...partial } : s.user })),

      // 키를 지우지 않고 로그아웃 상태를 localStorage에 기록한다. 다른 탭의 sessionStorage에
      // 남은 과거 인증 데이터가 새로고침 때 이전되어 로그인이 되살아나는 것을 막기 위해서다.
      logout: () => {
        set(loggedOutState)
        removeLegacySessionAuth()
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: authStorage,
      // 주의: localStorage는 보안 저장소가 아니다. 같은 origin에서 실행되는 스크립트(XSS 등)는
      // accessToken·refreshToken을 읽을 수 있고, 값은 로그아웃하기 전까지 브라우저를 닫아도 남는다.
      // 창을 닫았다 다시 열어도 로그인을 유지하기 위한 절충이다. 장기적으로는 백엔드가 refreshToken을
      // HttpOnly Secure SameSite 쿠키로 발급해 JS가 접근할 수 없게 하는 것이 바람직하다.
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        authMode: state.authMode,
        isAuthenticated: state.isAuthenticated,
      }),
      // 저장된 값이 없으면(다른 탭에서 키가 삭제된 경우 포함) 로그아웃 상태로 맞춘다.
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(isPersistedAuthState(persistedState) ? persistedState : loggedOutState),
      }),
    },
  ),
)

// 다른 탭에서 로그인·로그아웃·토큰 갱신으로 인증 키가 바뀌면 이 탭의 메모리 상태를 다시 읽는다.
// storage 이벤트는 값을 바꾼 탭 자신에게는 발생하지 않고, rehydrate는 저장소에 다시 쓰지 않으므로
// 탭 사이에서 저장 이벤트가 반복되지 않는다.
const handleAuthStorageChange = (event: StorageEvent) => {
  // key가 null이면 다른 탭에서 localStorage.clear()가 호출된 경우다.
  if (event.key !== null && event.key !== AUTH_STORAGE_KEY) return
  if (event.storageArea !== getBrowserStorage('localStorage')) return

  void useAuthStore.persist.rehydrate()
  if (!useAuthStore.getState().isAuthenticated) {
    removeLegacySessionAuth()
  }
}

window.addEventListener('storage', handleAuthStorageChange)

// HMR로 이 모듈이 다시 실행될 때 이전 리스너가 중복으로 남지 않게 한다.
import.meta.hot?.dispose(() => {
  window.removeEventListener('storage', handleAuthStorageChange)
})
