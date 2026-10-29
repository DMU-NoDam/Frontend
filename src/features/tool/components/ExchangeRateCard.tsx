import { useExchangeRate } from '../hooks/use-exchange-rate'
import { formatMoney, formatRelativeTime, getCurrencyName } from '../lib/currency'
import './ToolCard.css'
import './ExchangeRateCard.css'

const BASE_CURRENCY = 'KRW'
const BASE_AMOUNT = 10_000

type Props = {
  // 여행지 통화 (예: JPY)
  target: string
}

export function ExchangeRateCard({ target }: Props) {
  const { data, isLoading } = useExchangeRate(BASE_CURRENCY, target)

  return (
    <section className="tool-card" aria-labelledby="exchange-card-title">
      <h2 id="exchange-card-title" className="tool-card__title">환율</h2>

      <div className="tool-card__panel exchange-card__panel">
        <span className="exchange-card__pair">
          {getCurrencyName(BASE_CURRENCY)} ({BASE_CURRENCY}) → {getCurrencyName(target)} ({target})
        </span>

        {data ? (
          <>
            <strong className="exchange-card__main">
              {formatMoney(BASE_CURRENCY, BASE_AMOUNT)} ={' '}
              <span className="exchange-card__target">{formatMoney(target, BASE_AMOUNT * data.rate)}</span>
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
