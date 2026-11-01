import { LuX, LuExternalLink, LuStar, LuClock, LuMapPin } from 'react-icons/lu'
import { usePlaceDetails } from '../hooks/use-place-details'
import type { PlaceAuthor } from '../hooks/use-place-details'
import type { PlaceInfo } from '../types/plan-types'
import './PlaceDetailsPanel.css'

type Props = { place: PlaceInfo; onClose: () => void }

function safeWebURL(value?: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) ? url.href : undefined
  } catch {
    return undefined
  }
}

function Author({ author }: { author: PlaceAuthor }) {
  const href = safeWebURL(author.uri)
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer">{author.displayName}</a>
    : <span>{author.displayName}</span>
}

export function PlaceDetailsPanel({ place, onClose }: Props) {
  const googleId = place.googleId?.trim()
  const { data, isLoading, isError, refetch } = usePlaceDetails(googleId)
  const linkParams = new URLSearchParams({ api: '1', query: `${place.name} ${place.address}` })
  if (googleId) linkParams.set('query_place_id', googleId)

  return (
    <section className="place-details-panel" aria-label={`${place.name} 장소 상세 정보`}>
      <header className="place-details-panel__header" data-sheet-drag-handle>
        <div className="place-details-panel__heading">
          <span className="place-details-panel__eyebrow">장소 정보</span>
          <h2>{data?.name || place.name}</h2>
        </div>
        <button type="button" className="place-details-panel__close" onClick={onClose} aria-label="장소 정보 닫기">
          <LuX size={22} aria-hidden="true" />
        </button>
      </header>
      <div className="place-details-panel__body" tabIndex={0} aria-label="장소 상세 내용">
        {isLoading && <div className="place-details-panel__status" role="status">장소 정보를 불러오는 중...</div>}
        {isError && (
          <div className="place-details-panel__status" role="alert">
            <p>추가 정보를 불러오지 못했어요.</p>
            <button type="button" onClick={() => void refetch()}>다시 시도</button>
          </div>
        )}
        {!googleId && <p className="place-details-panel__muted">등록된 기본 정보만 제공되는 장소예요.</p>}
        {Boolean(data?.photos.length) && (
          <div className="place-details-panel__photos" aria-label="장소 사진">
            {data?.photos.map((photo, index) => (
              <figure key={index}>
                <img src={safeWebURL(photo.url)} alt={`${place.name} 사진 ${index + 1}`} loading="lazy" />
                <figcaption>{photo.authors.map((author, i) => <Author key={i} author={author} />)}</figcaption>
              </figure>
            ))}
          </div>
        )}
        {data && (
          <div className="place-details-panel__rating">
            <LuStar aria-hidden="true" />
            {data.rating != null
              ? <><strong>{data.rating.toFixed(1)}</strong><span>평가 {(data.ratingCount ?? 0).toLocaleString('ko-KR')}개</span></>
              : <span>아직 등록된 평점이 없어요.</span>}
          </div>
        )}
        {place.summary && <p className="place-details-panel__summary">{place.summary}</p>}
        <section className="place-details-panel__section">
          <h3><LuMapPin aria-hidden="true" /> 주소</h3>
          <p>{data?.address || place.address || '등록된 주소가 없어요.'}</p>
        </section>
        {data && (
          <>
            <section className="place-details-panel__section">
              <h3><LuClock aria-hidden="true" /> 영업시간</h3>
              {data.hours.length
                ? <ul className="place-details-panel__hours">{data.hours.map((hours) => <li key={hours}>{hours}</li>)}</ul>
                : <p className="place-details-panel__muted">등록된 영업시간이 없어요.</p>}
            </section>
            <section className="place-details-panel__section">
              <h3>리뷰</h3>
              <p className="place-details-panel__muted">Google Maps에서 제공하는 일부 리뷰예요.</p>
              {data.reviews.length ? data.reviews.map((review, index) => (
                <article key={index} className="place-details-panel__review">
                  {review.authorAttribution && <Author author={review.authorAttribution} />}
                  <div className="place-details-panel__review-meta">
                    {review.rating != null && <span>★ {review.rating}</span>}
                    <span>{review.relativePublishTimeDescription}</span>
                  </div>
                  {review.text && <p>{review.text}</p>}
                </article>
              )) : <p className="place-details-panel__muted">표시할 리뷰가 없어요.</p>}
            </section>
            <footer className="place-details-panel__attributions">
              <span>Google Maps</span>
              {data.attributions.map((attribution, index) => (
                <Author key={index} author={{ displayName: attribution.provider ?? '', uri: attribution.providerURI }} />
              ))}
            </footer>
          </>
        )}
      </div>
      <a className="place-details-panel__link" href={`https://www.google.com/maps/search/?${linkParams}`} target="_blank" rel="noopener noreferrer">
        구글맵에서 전체 정보 보기 <LuExternalLink size={15} aria-hidden="true" />
      </a>
    </section>
  )
}
