/**
 * 액세스 토큰 payload 디코딩 유틸.
 *
 * 백엔드 JWTService.generateAccessToken이 subject(sub)에 userId를 담아 발급하므로,
 * 로그인 응답(UserInfoDto)에 id가 없어도 토큰에서 내 userId를 알아낼 수 있다.
 *
 * 서명 검증은 하지 않는다. 화면 표시(내 역할 판별)용일 뿐이고,
 * 실제 권한은 서버가 토큰을 검증해 강제한다.
 */

const decodeBase64Url = (value: string): string => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
  const binary = atob(padded)

  // atob 결과는 latin1이므로 UTF-8 문자가 깨지지 않게 되돌린다
  return decodeURIComponent(
    binary
      .split('')
      .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''),
  )
}

export const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  const parts = token.split('.')
  if (parts.length !== 3) return null

  try {
    return JSON.parse(decodeBase64Url(parts[1])) as Record<string, unknown>
  } catch {
    return null
  }
}

export const getUserIdFromToken = (token: string | null | undefined): number | null => {
  if (!token) return null

  const sub = decodeJwtPayload(token)?.sub
  const userId = typeof sub === 'string' ? Number(sub) : typeof sub === 'number' ? sub : Number.NaN

  return Number.isSafeInteger(userId) ? userId : null
}
