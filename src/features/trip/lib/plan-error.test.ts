import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  PLAN_TARGET_MISSING_MESSAGE,
  getPlanEditErrorKind,
  getPlanEditErrorMessage,
  shouldRefetchAfter,
} from './plan-error'

// 백엔드 오류 응답 : { code, message } (HTTP status는 code와 따로 논다)
function apiError(status: number, data: unknown): AxiosError {
  return new AxiosError('request failed', 'ERR_BAD_REQUEST', undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: { headers: new AxiosHeaders() },
    data,
  })
}

describe('getPlanEditErrorKind', () => {
  it('같은 409라도 body code로 conflict / api-fail을 가른다', () => {
    expect(getPlanEditErrorKind(apiError(409, { code: '0003' }))).toBe('conflict')
    expect(getPlanEditErrorKind(apiError(409, { code: '0007' }))).toBe('api-fail')
  })

  it('0002 는 not-found', () => {
    expect(getPlanEditErrorKind(apiError(404, { code: '0002' }))).toBe('not-found')
  })

  it('모르는 code 는 unknown', () => {
    expect(getPlanEditErrorKind(apiError(500, { code: '0008' }))).toBe('unknown')
  })

  it('code 가 문자열이 아니거나 body 가 없으면 unknown', () => {
    expect(getPlanEditErrorKind(apiError(409, { code: 3 }))).toBe('unknown')
    expect(getPlanEditErrorKind(apiError(409, undefined))).toBe('unknown')
    expect(getPlanEditErrorKind(apiError(409, 'Conflict'))).toBe('unknown')
  })

  it('응답이 없는 네트워크 오류는 unknown', () => {
    expect(getPlanEditErrorKind(new AxiosError('Network Error', 'ERR_NETWORK'))).toBe('unknown')
  })

  it('axios 오류가 아니면 unknown', () => {
    expect(getPlanEditErrorKind(new Error('boom'))).toBe('unknown')
    expect(getPlanEditErrorKind({ response: { data: { code: '0003' } } })).toBe('unknown')
    expect(getPlanEditErrorKind(null)).toBe('unknown')
  })
})

describe('getPlanEditErrorMessage', () => {
  it('conflict 는 다른 사람이 먼저 수정했다고 알린다', () => {
    expect(getPlanEditErrorMessage(apiError(409, { code: '0003' }))).toContain('다른 사람이 먼저')
  })

  it('not-found 와 대상을 못 찾은 경우는 같은 문구', () => {
    expect(getPlanEditErrorMessage(apiError(404, { code: '0002' }))).toBe(PLAN_TARGET_MISSING_MESSAGE)
  })

  it('api-fail 과 unknown 은 잠시 후 다시 시도 안내', () => {
    expect(getPlanEditErrorMessage(apiError(409, { code: '0007' }))).toContain('잠시 후 다시 시도')
    expect(getPlanEditErrorMessage(new Error('boom'))).toContain('잠시 후 다시 시도')
  })
})

describe('shouldRefetchAfter', () => {
  it('conflict / not-found 는 최신 일정을 다시 읽는다', () => {
    expect(shouldRefetchAfter('conflict')).toBe(true)
    expect(shouldRefetchAfter('not-found')).toBe(true)
  })

  it('api-fail / unknown 은 다시 읽지 않는다', () => {
    expect(shouldRefetchAfter('api-fail')).toBe(false)
    expect(shouldRefetchAfter('unknown')).toBe(false)
  })
})
