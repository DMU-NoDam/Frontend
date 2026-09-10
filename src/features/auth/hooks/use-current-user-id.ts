import { useMemo } from 'react'
import { useAuthStore } from '@/app/store/auth-store'
import { getUserIdFromToken } from '@/shared/lib/jwt'

/**
 * 현재 로그인한 사용자의 userId.
 *
 * 백엔드 UserInfoDto에는 id가 없어서 OAuth 로그인 응답만으로는 알 수 없다.
 * test 모드는 store의 user.id를 쓰고, 그 외에는 액세스 토큰 sub에서 읽는다.
 * 토큰이 없거나 형식이 다르면(mock auth 등) null을 반환한다.
 */
export function useCurrentUserId(): number | null {
  const storedUserId = useAuthStore((s) => s.user?.id)
  const accessToken = useAuthStore((s) => s.accessToken)

  return useMemo(
    () => storedUserId ?? getUserIdFromToken(accessToken),
    [storedUserId, accessToken],
  )
}
