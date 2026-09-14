import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import './GlobalLoadingOverlay.css'

const isGlobalLoading = (meta: unknown) =>
  Boolean(meta && typeof meta === 'object' && 'globalLoading' in meta && meta.globalLoading)

export function GlobalLoadingOverlay() {
  const mutatingCount = useIsMutating({
    predicate: (mutation) => isGlobalLoading(mutation.options.meta),
  })
  // 이미 보여줄 데이터가 있는 재조회(경로 폴링 등)에는 띄우지 않는다 — 화면을 가릴 이유가
  // 없고, 주기적으로 도는 조회라면 그때마다 오버레이가 번쩍인다.
  const fetchingCount = useIsFetching({
    predicate: (query) => isGlobalLoading(query.options.meta) && query.state.data === undefined,
  })

  if (mutatingCount + fetchingCount === 0) return null

  return (
    <div className="global-loading-overlay" role="status" aria-live="polite" aria-label="Loading">
      <div className="three-body" aria-hidden="true">
        <div className="three-body__dot" />
        <div className="three-body__dot" />
        <div className="three-body__dot" />
      </div>
    </div>
  )
}
