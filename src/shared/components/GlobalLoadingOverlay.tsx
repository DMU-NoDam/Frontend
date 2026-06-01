import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import './GlobalLoadingOverlay.css'

const isGlobalLoading = (meta: unknown) =>
  Boolean(meta && typeof meta === 'object' && 'globalLoading' in meta && meta.globalLoading)

export function GlobalLoadingOverlay() {
  const mutatingCount = useIsMutating({
    predicate: (mutation) => isGlobalLoading(mutation.options.meta),
  })
  const fetchingCount = useIsFetching({
    predicate: (query) => isGlobalLoading(query.options.meta),
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
