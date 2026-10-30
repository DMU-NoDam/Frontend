import { useState } from 'react'
import { LuArrowLeftRight } from 'react-icons/lu'
import { useExchangeRate } from '../hooks/use-exchange-rate'
import { formatMoney, formatRelativeTime, getCurrencyName, getCurrencySymbol } from '../lib/currency'
import './ToolCard.css'
import './ExchangeRateCard.css'

const BASE_CURRENCY = 'KRW'
const DEFAULT_AMOUNT = '10000'
// 원화·엔화 모두 소수 단위를 쓰지 않으므로 숫자만 받는다
const AMOUNT_MAX_DIGITS = 12

type Props = {
  // 여행지 통화 (예: JPY)
  target: string
}

// 입력값에서 숫자만 남기고 앞자리 0을 지운다 ('0012,000' → '12000')
function toAmountDigits(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, AMOUNT_MAX_DIGITS)
}

export function ExchangeRateCard({ target }: Props) {
  const { data, isLoading } = useExchangeRate(BASE_CURRENCY, target)
  // false = 원화 → 여행지 통화, true = 여행지 통화 → 원화
  const [isReversed, setIsReversed] = useState(false)
  // 숫자만 담은 문자열. 비어 있으면 0으로 계산한다
  const [amount, setAmount] = useState(DEFAULT_AMOUNT)

  const from = isReversed ? target : BASE_CURRENCY
  const to = isReversed ? BASE_CURRENCY : target
  const value = Number(amount || '0')
  // rate = 원화 1당 여행지 통화
  const converted = data ? (isReversed ? value / data.rate : value * data.rate) : null

  return (
    <section className="tool-card" aria-labelledby="exchange-card-title">
      <h2 id="exchange-card-title" className="tool-card__title">환율</h2>

      <div className="tool-card__panel exchange-card__panel">
        <div className="exchange-card__pair-row">
          <span className="exchange-card__pair" aria-live="polite">
            {getCurrencyName(from)} ({from}) → {getCurrencyName(to)} ({to})
          </span>
          <button
            type="button"
            className="exchange-card__swap"
            aria-label="환전 방향 바꾸기"
            onClick={() => setIsReversed((prev) => !prev)}
          >
            <LuArrowLeftRight aria-hidden="true" />
          </button>
        </div>

        {data && converted !== null ? (
          <>
            {/* 칸 어디를 눌러도 입력되도록 label로 감싼다. 시트(TripMapSheet)의 드래그가
                포인터를 가로채면 label 클릭이 입력칸에 전달되지 않으므로 여기서 막는다 */}
            <label className="exchange-card__field" onPointerDown={(event) => event.stopPropagation()}>
              <span className="exchange-card__symbol" aria-hidden="true">
                {getCurrencySymbol(from)}
              </span>
              <input
                className="exchange-card__input"
                aria-label={`${getCurrencyName(from)} 금액`}
                inputMode="numeric"
                autoComplete="off"
                placeholder="0"
                value={amount ? Number(amount).toLocaleString('ko-KR') : ''}
                onChange={(event) => setAmount(toAmountDigits(event.target.value))}
                // 새 금액을 바로 칠 수 있게 전체 선택
                onFocus={(event) => event.target.select()}
              />
            </label>
            <strong className="exchange-card__main">
              = <span className="exchange-card__target">{formatMoney(to, converted)}</span>
            </strong>
            <span className="exchange-card__sub">
              1 {target} = {(1 / data.rate).toFixed(2)} {BASE_CURRENCY} · 최근 업데이트{' '}
              {formatRelativeTime(data.fetchedAt)}
            </span>
          </>
        ) : (
          <span className="exchange-card__sub">
            {isLoading ? '환율을 불러오는 중...' : '환율을 불러오지 못했어요.'}
          </span>
        )}
      </div>
    </section>
  )
}
