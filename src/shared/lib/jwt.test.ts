import { describe, expect, it } from 'vitest'
import { decodeJwtPayload, getUserIdFromToken } from './jwt'

// 서명은 검증하지 않으므로 아무 값이나 붙인다
function token(payload: unknown): string {
  const base64Url = (value: string) => {
    const binary = Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join('')
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  }
  return `${base64Url(JSON.stringify({ alg: 'HS256' }))}.${base64Url(JSON.stringify(payload))}.signature`
}

describe('decodeJwtPayload', () => {
  it('payload 를 객체로', () => {
    expect(decodeJwtPayload(token({ sub: '7', role: 'USER' }))).toEqual({ sub: '7', role: 'USER' })
  })

  it('한글 같은 UTF-8 값도 깨지지 않는다', () => {
    expect(decodeJwtPayload(token({ name: '아루비 여행자' }))?.name).toBe('아루비 여행자')
  })

  it('base64url 문자(-, _)와 padding 없는 길이를 처리한다', () => {
    // '>>>' / '???' 는 base64 로 '+' / '/' 가 나오는 값
    const payload = { a: '>>>', b: '???', c: 'x' }

    expect(decodeJwtPayload(token(payload))).toEqual(payload)
  })

  it('점이 세 조각이 아니면 null', () => {
    expect(decodeJwtPayload('abc')).toBeNull()
    expect(decodeJwtPayload('a.b')).toBeNull()
    expect(decodeJwtPayload('a.b.c.d')).toBeNull()
  })

  it('payload 가 JSON 이 아니면 null', () => {
    expect(decodeJwtPayload('header.bm90LWpzb24.signature')).toBeNull()
  })
})

describe('getUserIdFromToken', () => {
  it('sub 문자열의 userId', () => {
    expect(getUserIdFromToken(token({ sub: '42' }))).toBe(42)
  })

  it('sub 가 숫자여도 된다', () => {
    expect(getUserIdFromToken(token({ sub: 42 }))).toBe(42)
  })

  it('토큰이 없으면 null', () => {
    expect(getUserIdFromToken(null)).toBeNull()
    expect(getUserIdFromToken(undefined)).toBeNull()
    expect(getUserIdFromToken('')).toBeNull()
  })

  it('sub 가 없거나 정수가 아니면 null', () => {
    expect(getUserIdFromToken(token({ role: 'USER' }))).toBeNull()
    expect(getUserIdFromToken(token({ sub: 'kakao_123' }))).toBeNull()
    expect(getUserIdFromToken(token({ sub: '1.5' }))).toBeNull()
    expect(getUserIdFromToken(token({ sub: true }))).toBeNull()
  })

  it('안전한 정수 범위를 넘으면 null', () => {
    expect(getUserIdFromToken(token({ sub: '9007199254740993' }))).toBeNull()
  })

  it('형식이 깨진 토큰은 null', () => {
    expect(getUserIdFromToken('not-a-jwt')).toBeNull()
  })
})
