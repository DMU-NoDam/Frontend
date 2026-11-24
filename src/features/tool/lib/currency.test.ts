import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { formatMoney, formatRelativeTime, getCurrencyName, getCurrencySymbol } from './currency'

describe('getCurrencyName', () => {
  it('아는 통화는 한국어 이름', () => {
    expect(getCurrencyName('KRW')).toBe('대한민국 원화')
    expect(getCurrencyName('JPY')).toBe('일본 엔화')
    expect(getCurrencyName('USD')).toBe('미국 달러')
    expect(getCurrencyName('EUR')).toBe('유로')
  })

  it('모르는 통화는 코드를 그대로', () => {
    expect(getCurrencyName('GBP')).toBe('GBP')
  })
})

describe('getCurrencySymbol', () => {
  it('아는 통화는 기호', () => {
    expect(getCurrencySymbol('KRW')).toBe('₩')
    expect(getCurrencySymbol('JPY')).toBe('¥')
  })

  it('모르는 통화는 코드를 그대로', () => {
    expect(getCurrencySymbol('GBP')).toBe('GBP')
  })
})

describe('formatMoney', () => {
  it('기호 + 천 단위 쉼표', () => {
    expect(formatMoney('KRW', 1234567)).toBe('₩1,234,567')
    expect(formatMoney('JPY', 980)).toBe('¥980')
  })

  it('소수점은 반올림한다', () => {
    expect(formatMoney('JPY', 99.5)).toBe('¥100')
    expect(formatMoney('KRW', 1000.4)).toBe('₩1,000')
  })

  it('모르는 통화는 코드 뒤에 한 칸 띄운다', () => {
    expect(formatMoney('GBP', 1500)).toBe('GBP 1,500')
  })
})

describe('formatRelativeTime', () => {
  const NOW = new Date('2026-11-24T12:00:00+09:00').getTime()

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('1분이 안 지났으면 방금 전', () => {
    expect(formatRelativeTime(NOW)).toBe('방금 전')
    expect(formatRelativeTime(NOW - 59_000)).toBe('방금 전')
  })

  it('1시간 전까지는 분 단위', () => {
    expect(formatRelativeTime(NOW - 60_000)).toBe('1분 전')
    expect(formatRelativeTime(NOW - 59 * 60_000)).toBe('59분 전')
  })

  it('1시간부터는 시간 단위 (내림)', () => {
    expect(formatRelativeTime(NOW - 60 * 60_000)).toBe('1시간 전')
    expect(formatRelativeTime(NOW - 150 * 60_000)).toBe('2시간 전')
  })
})
