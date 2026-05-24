import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { LuSparkles } from 'react-icons/lu'
import { useTripPlanningStatus } from '@/features/trip/hooks/use-trip-planning-status'
import './TripPlanningPage.css'

export function TripPlanningPage() {
  const { tripId } = useParams()
  const navigate = useNavigate()

  // startedAt=null: skip timeout, poll until isPlanning turns false
  const { status } = useTripPlanningStatus(tripId ?? null, null)

  useEffect(() => {
    if (status === 'done' && tripId) {
      navigate(`/trips/${tripId}/select`, { replace: true })
    }
  }, [status, tripId, navigate])

  if (!tripId) {
    return (
      <main className="trip-planning-page">
        <p className="trip-planning-page__error">잘못된 여행 정보입니다.</p>
      </main>
    )
  }

  const isTimedOut = status === 'timeout'

  return (
    <main className="trip-planning-page">
      <div className="trip-planning-page__content">
        <div className="trip-planning-page__icon-wrap" aria-hidden="true">
          <LuSparkles className="trip-planning-page__icon" />
        </div>

        <h1 className="trip-planning-page__title">
          {isTimedOut ? '생성 지연 중' : 'AI 일정 생성중...'}
        </h1>

        <p className="trip-planning-page__desc">
          {isTimedOut
            ? '일정 생성이 예상보다 오래 걸리고 있어요.\n잠시 후 다시 확인해주세요.'
            : 'AI가 완벽한 일정을 마법처럼 짜고 있어요.\n잠시만 기다려주세요 ✈️'}
        </p>

        {isTimedOut && (
          <button
            type="button"
            className="trip-planning-page__back-btn"
            onClick={() => navigate('/trips')}
          >
            여행 목록으로 돌아가기
          </button>
        )}
      </div>
    </main>
  )
}
