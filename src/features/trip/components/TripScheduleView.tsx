import { useEffect, useMemo, useRef, useState } from 'react'
import { LuSparkles, LuTrash2 } from 'react-icons/lu'
import type { PlacePlan, Transport } from '../types/plan-types'
import './TripScheduleView.css'

function formatDistance(meters: number): string {
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}km` : `${meters}m`
}

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}분`
  const h = Math.floor(m / 60)
  const rem = m % 60
  return rem === 0 ? `${h}시간` : `${h}시간 ${rem}분`
}

function getSortedDates(plans: PlacePlan[]): string[] {
  return [...new Set(plans.map((p) => p.date))].sort()
}

function groupByDate(plans: PlacePlan[]): Map<string, PlacePlan[]> {
  const map = new Map<string, PlacePlan[]>()
  for (const plan of plans) {
    const arr = map.get(plan.date) ?? []
    arr.push(plan)
    map.set(plan.date, arr)
  }
  return map
}

function sortByStartTime(plans: PlacePlan[]): PlacePlan[] {
  return [...plans].sort((a, b) => a.startTime.localeCompare(b.startTime))
}

function formatDateLabel(date: string): string {
  const d = new Date(date + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function TransportRow({
  transport,
  focused,
  onClick,
}: {
  transport: Transport
  focused?: boolean
  onClick?: () => void
}) {
  const focusedClass = focused ? ' trip-schedule-view__transport-row--focused' : ''
  const inner = (
    <>
      <div className="trip-schedule-view__transport-line" aria-hidden="true" />
      <span className="trip-schedule-view__transport-info">
        {formatDuration(transport.takeTime)} · {formatDistance(transport.totalDistanceMeters)}
      </span>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        className={`trip-schedule-view__transport-row trip-schedule-view__transport-row--clickable${focusedClass}`}
        onClick={onClick}
        aria-label="이동 경로 보기"
        aria-pressed={focused}
      >
        {inner}
      </button>
    )
  }
  return (
    <div className={`trip-schedule-view__transport-row${focusedClass}`} aria-label="이동 정보">
      {inner}
    </div>
  )
}

function PlaceCard({
  plan,
  index,
  focused,
  onClick,
}: {
  plan: PlacePlan
  index: number
  focused?: boolean
  onClick?: () => void
}) {
  const { placeInfo } = plan
  const focusedClass = focused ? ' trip-schedule-view__place-card--focused' : ''
  const inner = (
    <>
      <div className="trip-schedule-view__place-num" aria-hidden="true">
        {index + 1}
      </div>
      <div className="trip-schedule-view__place-body">
        <span className="trip-schedule-view__place-name">{placeInfo.name}</span>
        <span className="trip-schedule-view__place-type">
          {placeInfo.placeType}
        </span>
      </div>
    </>
  )
  if (onClick) {
    return (
      <button
        type="button"
        className={`trip-schedule-view__place-card trip-schedule-view__place-card--clickable${focusedClass}`}
        onClick={onClick}
      >
        {inner}
      </button>
    )
  }
  return <div className={`trip-schedule-view__place-card${focusedClass}`}>{inner}</div>
}

function EditActions({
  onAIRecommend,
  onDelete,
}: {
  onAIRecommend: () => void
  onDelete: () => void
}) {
  return (
    <div className="trip-schedule-view__edit-actions">
      <button
        type="button"
        className="trip-schedule-view__ai-btn"
        onClick={onAIRecommend}
      >
        <LuSparkles size={13} aria-hidden="true" />
        AI 추천 장소 변경
      </button>
      <button
        type="button"
        className="trip-schedule-view__delete-btn"
        onClick={onDelete}
        aria-label="일정 삭제"
      >
        <LuTrash2 size={15} />
      </button>
    </div>
  )
}

export type TripScheduleViewProps = {
  plans: PlacePlan[]
  initialDate?: string
  emptyMessage?: string
  selectedDate?: string
  onDateChange?: (date: string) => void
  onPlaceClick?: (plan: PlacePlan) => void
  focusedPlanId?: number | null
  onTransportClick?: (transportId: number) => void
  focusedTransportId?: number | null
  editMode?: boolean
  onEditToggle?: () => void
  onEditCancel?: () => void
  onEditCardClick?: (plan: PlacePlan) => void
  onAIRecommendClick?: (plan: PlacePlan) => void
  onDeletePlan?: (plan: PlacePlan) => void
}

export function TripScheduleView({
  plans,
  initialDate,
  emptyMessage,
  selectedDate: controlledDate,
  onDateChange,
  onPlaceClick,
  focusedPlanId,
  onTransportClick,
  focusedTransportId,
  editMode,
  onEditToggle,
  onEditCancel,
  onEditCardClick,
  onAIRecommendClick,
  onDeletePlan,
}: TripScheduleViewProps) {
  const sortedDates = useMemo(() => getSortedDates(plans), [plans])
  const grouped     = useMemo(() => groupByDate(plans),    [plans])

  const isControlled = controlledDate !== undefined

  const [userSelectedDate, setUserSelectedDate] = useState<string | null>(null)

  const selectedDate = useMemo(() => {
    if (isControlled) {
      return (controlledDate && sortedDates.includes(controlledDate))
        ? controlledDate
        : (sortedDates[0] ?? null)
    }
    if (userSelectedDate && sortedDates.includes(userSelectedDate)) return userSelectedDate
    if (initialDate && sortedDates.includes(initialDate)) return initialDate
    return sortedDates[0] ?? null
  }, [isControlled, controlledDate, userSelectedDate, sortedDates, initialDate])

  function handleDateClick(date: string) {
    if (!isControlled) setUserSelectedDate(date)
    onDateChange?.(date)
  }

  const selectedDayIndex = selectedDate ? sortedDates.indexOf(selectedDate) : 0

  const plansForDay = useMemo(() => {
    if (!selectedDate) return []
    return sortByStartTime(grouped.get(selectedDate) ?? [])
  }, [grouped, selectedDate])

  // Refs for each list item — used to scroll focused item into view
  const itemRefsMap = useRef<Map<number, HTMLElement>>(new Map())

  useEffect(() => {
    if (focusedPlanId == null) return
    itemRefsMap.current.get(focusedPlanId)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [focusedPlanId])

  if (sortedDates.length === 0) {
    return (
      <div className="trip-schedule-view__status">
        {emptyMessage ?? '일정이 없습니다.'}
      </div>
    )
  }

  return (
    <>
      <nav className="trip-schedule-view__day-tabs" role="tablist" aria-label="날짜 선택">
        {sortedDates.map((date, i) => (
          <button
            key={date}
            role="tab"
            type="button"
            aria-selected={i === selectedDayIndex}
            className={`trip-schedule-view__day-tab${i === selectedDayIndex ? ' trip-schedule-view__day-tab--active' : ''}`}
            onClick={() => handleDateClick(date)}
          >
            <span className="trip-schedule-view__day-label">Day {i + 1}</span>
          </button>
        ))}
      </nav>

      <div className="trip-schedule-view__list">
        {selectedDate && (
          <header className="trip-schedule-view__section-header">
            <div className="trip-schedule-view__section-left">
              <h2 className="trip-schedule-view__section-title">
                {selectedDayIndex + 1}일차
              </h2>
              <span className="trip-schedule-view__section-date">
                {formatDateLabel(selectedDate)}
              </span>
            </div>
            {onEditToggle && (
              editMode ? (
                <div className="trip-schedule-view__edit-controls">
                  <button
                    type="button"
                    className="trip-schedule-view__cancel-btn"
                    onClick={onEditCancel ?? onEditToggle}
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    className="trip-schedule-view__edit-btn"
                    onClick={onEditToggle}
                  >
                    저장
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="trip-schedule-view__edit-btn"
                  onClick={onEditToggle}
                >
                  편집
                </button>
              )
            )}
          </header>
        )}
        {plansForDay.map((plan, i) => (
          <div
            key={plan.id}
            className={`trip-schedule-view__item${editMode || !plan.fromTransport ? ' trip-schedule-view__item--no-transport' : ''}`}
            ref={(el) => {
              if (el) itemRefsMap.current.set(plan.id, el)
              else itemRefsMap.current.delete(plan.id)
            }}
          >
            <PlaceCard
              plan={plan}
              index={i}
              focused={plan.id === focusedPlanId}
              onClick={
                editMode
                  ? () => onEditCardClick?.(plan)
                  : (onPlaceClick ? () => onPlaceClick(plan) : undefined)
              }
            />
            {editMode && plan.id === focusedPlanId && onAIRecommendClick && onDeletePlan && (
              <EditActions
                onAIRecommend={() => onAIRecommendClick(plan)}
                onDelete={() => onDeletePlan(plan)}
              />
            )}
            {!editMode && plan.fromTransport && (
              <TransportRow
                transport={plan.fromTransport}
                focused={plan.fromTransport.id === focusedTransportId}
                onClick={onTransportClick ? () => onTransportClick(plan.fromTransport!.id) : undefined}
              />
            )}
          </div>
        ))}
      </div>
    </>
  )
}
