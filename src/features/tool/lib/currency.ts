const CURRENCY_INFO: Record<string, { name: string; symbol: string }> = {
  KRW: { name: '대한민국 원화', symbol: '₩' },
  JPY: { name: '일본 엔화', symbol: '¥' },
  USD: { name: '미국 달러', symbol: '$' },
  EUR: { name: '유로', symbol: '€' },
}

export function getCurrencyName(code: string): string {
  return CURRENCY_INFO[code]?.name ?? code
}

export function formatMoney(code: string, amount: number): string {
  const symbol = CURRENCY_INFO[code]?.symbol ?? `${code} `
  return `${symbol}${Math.round(amount).toLocaleString('ko-KR')}`
}

export function formatRelativeTime(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`
  return `${Math.floor(minutes / 60)}시간 전`
}
