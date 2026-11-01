import { useEffect, useMemo, useRef, useState } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { LuGripVertical, LuSparkles, LuTrash2 } from 'react-icons/lu'
import { sortPlansByOrder } from '../lib/plan-order'
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

// 아직 계산되지 않은 이동 구간. 자리는 이동 경로 줄과 같게 두고 상태만 다르게 보여준다.
function TransportPendingRow() {
  return (
    <div className="trip-schedule-view__transport-row" role="status">
      <div className="trip-schedule-view__transport-line" aria-hidden="true" />
      <span className="trip-schedule-view__transport-info trip-schedule-view__transport-info--pending">
        이동 경로를 계산하고 있어요
      </span>
    </div>
  )
}

function PlaceCard({
  plan,
  index,
  focused,
  onClick,
  onLongPress,
}: {
  plan: PlacePlan
  index: number
  focused?: boolean
  onClick?: () => void
  onLongPress?: () => void
}) {
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pressStart = useRef<{ x: number; y: number; pointerId: number } | null>(null)
  const suppressClick = useRef(false)

  function cancelPress() {
    if (pressTimer.current !== null) clearTimeout(pressTimer.current)
    pressTimer.current = null
    pressStart.current = null
  }

  useEffect(() => () => {
    if (pressTimer.current !== null) clearTimeout(pressTimer.current)
  }, [])

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
  if (onClick || onLongPress) {
    return (
      <button
        type="button"
        className={`trip-schedule-view__place-card trip-schedule-view__place-card--clickable${focusedClass}${onLongPress ? ' trip-schedule-view__place-card--long-press' : ''}`}
        title={onLongPress ? '길게 눌러 장소 정보 보기 (키보드: Shift+Enter)' : undefined}
        aria-keyshortcuts={onLongPress ? 'Shift+Enter' : undefined}
        onPointerDown={(event) => {
          if (!onLongPress) return
          cancelPress()
          if (!event.isPrimary || event.button !== 0) return
          suppressClick.current = false
          pressStart.current = { x: event.clientX, y: event.clientY, pointerId: event.pointerId }
          pressTimer.current = setTimeout(() => {
            pressTimer.current = null
            suppressClick.current = true
            onLongPress()
          }, 500)
        }}
        onPointerMove={(event) => {
          const start = pressStart.current
          if (!start || event.pointerId !== start.pointerId) return
          if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > 10) {
            suppressClick.current = true
            cancelPress()
          }
        }}
        onPointerUp={cancelPress}
        onPointerCancel={cancelPress}
        onPointerLeave={cancelPress}
        onLostPointerCapture={cancelPress}
        onBlur={cancelPress}
        onContextMenu={(event) => {
          if (onLongPress) event.preventDefault()
        }}
        onKeyDown={(event) => {
          if (onLongPress && event.shiftKey && event.key === 'Enter') {
            event.preventDefault()
            cancelPress()
            if (!event.repeat) onLongPress()
          }
        }}
        onClick={(event) => {
          // 길게 누른 뒤 발생하는 click으로 지도 포커싱이 다시 토글되지 않게 한다.
          if (event.detail !== 0 && suppressClick.current) {
            event.preventDefault()
            return
          }
          onClick?.()
        }}
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
        <LuSparkles size={20} aria-hidden="true" />
        AI 추천 장소 변경
      </button>
      <button
        type="button"
        className="trip-schedule-view__delete-btn"
        onClick={onDelete}
        aria-label="일정 삭제"
      >
        <LuTrash2 size={14} />
      </button>
    </div>
  )
}

// 편집 모드의 한 줄. 손잡이를 잡았을 때만 끌리도록 dragListener를 끄고 dragControls로
// 넘긴다 — 카드 본문을 잡으면 목록이 세로로 스크롤되어야 하기 때문이다.
function ReorderableItem({
  plan,
  focused,
  disabled,
  children,
  itemRef,
  onMoveByOffset,
  onDragStart,
  onDragEnd,
}: {
  plan: PlacePlan
  focused: boolean
  disabled: boolean
  children: React.ReactNode
  itemRef: (el: HTMLElement | null) => void
  onMoveByOffset: (offset: number) => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const controls = useDragControls()

  return (
    <Reorder.Item
      as="div"
      value={plan}
      dragListener={false}
      dragControls={controls}
      className="trip-schedule-view__item trip-schedule-view__item--no-transport trip-schedule-view__item--draggable"
      animate={{ scale: 1, boxShadow: '0 0px 0px rgba(0, 0, 0, 0)' }}
      whileDrag={{ scale: 1.02, zIndex: 1, boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)' }}
      ref={itemRef}
      onDragStart={onDragStart}
      // 순서는 드래그 도중 계속 바뀌지만, 서버에는 손을 뗀 시점에 한 번만 보낸다
      onDragEnd={onDragEnd}
    >
      <div
        className={`trip-schedule-view__drag-row${focused ? ' trip-schedule-view__drag-row--focused' : ''}`}
      >
        <div className="trip-schedule-view__drag-content">{children}</div>
        <button
          type="button"
          className="trip-schedule-view__drag-handle"
          aria-label={`${plan.placeInfo.name} 순서 바꾸기`}
          aria-disabled={disabled}
          // 터치에서도 손잡이를 잡는 순간부터 드래그로 넘긴다
          onPointerDown={(event) => {
            // 앞선 순서 변경이 아직 저장 중이면 새 드래그를 받지 않는다 — 응답이 뒤바뀐
            // 순서로 도착하면 화면이 한 단계 전 순서로 되돌아가 보인다
            if (disabled) return
            controls.start(event)
          }}
          // 드래그만 두면 키보드로는 순서를 바꿀 수 없다. 손잡이에 포커스한 채 위아래 방향키로
          // 한 칸씩 옮긴다.
          onKeyDown={(event) => {
            const offset = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0
            if (offset === 0 || disabled) return
            event.preventDefault()
            onMoveByOffset(offset)
          }}
        >
          <LuGripVertical size={18} aria-hidden="true" />
        </button>
      </div>
    </Reorder.Item>
  )
}

export type TripScheduleViewProps = {
  plans: PlacePlan[]
  initialDate?: string
  emptyMessage?: string
  selectedDate?: string
  onDateChange?: (date: string) => void
  onPlaceClick?: (plan: PlacePlan) => void
  onPlaceLongPress?: (plan: PlacePlan) => void
  focusedPlanId?: number | null
  onTransportClick?: (transportId: number) => void
  focusedTransportId?: number | null
  editMode?: boolean
  onEditToggle?: () => void
  onEditCancel?: () => void
  onEditCardClick?: (plan: PlacePlan) => void
  onAIRecommendClick?: (plan: PlacePlan) => void
  onDeletePlan?: (plan: PlacePlan) => void
  // 순서가 바뀌어 확정된 시점에 한 번 호출된다. 위치는 인덱스가 아니라 최종 목록에서의
  // 앞/뒤 이웃으로 알려준다 (백엔드 move-place가 그렇게 받는다).
  onReorderPlan?: (args: {
    plan: PlacePlan
    previousPlacePlanId: number | null
    nextPlacePlanId: number | null
  }) => void
  // 서버가 끊긴 이동 구간을 다시 계산하는 중. 빈 구간에 "계산 중"을 보여준다
  isTransportPending?: boolean
  // 저장 중에는 다음 순서 변경을 받지 않는다
  reorderDisabled?: boolean
  // 드래그를 시작/끝낼 때 알린다. 호출부는 드래그 중에 일정 재조회를 멈춘다
  onDragStateChange?: (dragging: boolean) => void
  // 값이 바뀌면 화면 순서를 서버 순서로 되돌린다 (저장 실패 롤백용)
  resetOrderSignal?: number
  // 넘기면 일정 목록 대신 이 내용(조회 중/실패)을 보여준다. 날짜 탭은 dates로 그대로 남긴다
  statusContent?: React.ReactNode
  // 날짜 탭에 쓸 날짜. 생략하면 plans에서 뽑는다
  dates?: string[]
}

export function TripScheduleView({
  plans,
  initialDate,
  emptyMessage,
  selectedDate: controlledDate,
  onDateChange,
  onPlaceClick,
  onPlaceLongPress,
  focusedPlanId,
  onTransportClick,
  focusedTransportId,
  editMode,
  onEditToggle,
  onEditCancel,
  onEditCardClick,
  onAIRecommendClick,
  onDeletePlan,
  onReorderPlan,
  isTransportPending,
  reorderDisabled,
  onDragStateChange,
  resetOrderSignal,
  statusContent,
  dates,
}: TripScheduleViewProps) {
  const sortedDates = useMemo(() => dates ?? getSortedDates(plans), [dates, plans])
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
    return sortPlansByOrder(grouped.get(selectedDate) ?? [])
  }, [grouped, selectedDate])

  // 드래그 중에는 화면 순서를 지역 상태로 들고 간다. 서버 데이터(plansForDay)가 새로 오면
  // 그때 다시 맞춘다 — TripDetailPage가 서버 값으로 input을 되돌리는 것과 같은 패턴이다.
  const [orderedPlans, setOrderedPlans] = useState(plansForDay)

  // 서버 일정의 "내용" 지문. 다른 멤버의 편집을 따라잡으려고 주기적으로 다시 읽으면 내용이
  // 같아도 새 배열이 올 수 있어서, 참조로 비교하면 폴링 주기마다 지역 순서가 서버 순서로
  // 되돌아간다. 편집 모드에서 그리는 것은 순서와 장소뿐이므로 그 둘만 본다.
  const serverSignature = useMemo(
    () => plansForDay.map((plan) => `${plan.id}:${plan.placeInfo.id}`).join(','),
    [plansForDay],
  )

  // 렌더 중에 읽어야 하므로(아래 지문 비교) ref가 아니라 state로 둔다. 드래그 시작과 끝에
  // 한 번씩만 바뀌어서 프레임마다 다시 그리지는 않는다.
  const [isDragging, setIsDragging] = useState(false)
  // 드래그 도중에 들어온 서버 변경. 끌고 있는 카드를 서버 순서가 밀어내면 조작이 끊기므로
  // 손을 뗀 뒤에 반영한다.
  const [pendingServerSync, setPendingServerSync] = useState(false)

  const [prevServerSignature, setPrevServerSignature] = useState(serverSignature)
  if (serverSignature !== prevServerSignature) {
    setPrevServerSignature(serverSignature)
    if (isDragging) setPendingServerSync(true)
    else setOrderedPlans(plansForDay)
  }

  // 저장에 실패하면 호출부가 이 값을 올린다. 화면에만 반영돼 있던 순서를 서버 순서로 되돌린다.
  const [prevResetSignal, setPrevResetSignal] = useState(resetOrderSignal)
  if (resetOrderSignal !== prevResetSignal) {
    setPrevResetSignal(resetOrderSignal)
    setPendingServerSync(false)
    setOrderedPlans(plansForDay)
  }

  // 편집 모드를 드나들면 드래그 상태를 초기화한다. 드래그 도중에 모드가 바뀌면 onDragEnd가
  // 오지 않아서, 보류 상태가 남으면 그 뒤로 서버 변경이 화면에 반영되지 않는다.
  const [prevEditMode, setPrevEditMode] = useState(editMode)
  if (editMode !== prevEditMode) {
    setPrevEditMode(editMode)
    setIsDragging(false)
    setPendingServerSync(false)
    setOrderedPlans(plansForDay)
  }

  // 이번 드래그로 순서가 실제로 바뀌었는지 판단할 기준. 제자리에 놓으면 요청을 보내지 않는다.
  const dragStartIdsRef = useRef<number[] | null>(null)

  // 드래그 중 마지막으로 확정된 순서. onDragEnd가 state 클로저를 읽으면 마지막 onReorder가
  // 아직 렌더에 반영되기 전일 수 있어, 바뀐 순서를 못 알아보고 요청을 건너뛸 수 있다.
  const orderedPlansRef = useRef(orderedPlans)
  useEffect(() => {
    orderedPlansRef.current = orderedPlans
  }, [orderedPlans])

  const applyOrder = (next: PlacePlan[]) => {
    orderedPlansRef.current = next
    setOrderedPlans(next)
  }

  // 드래그 때문에 미뤄둔 서버 변경을 지금 반영한다
  const applyPendingServerSync = () => {
    if (!pendingServerSync) return
    setPendingServerSync(false)
    applyOrder(plansForDay)
  }

  // 최종 목록에서 자기 앞/뒤에 있는 항목이 그대로 previous/next가 된다. 자기 자신은 이미
  // 목표 위치에 들어가 있으므로 따로 제외할 필요가 없다.
  const notifyReorder = (plan: PlacePlan, list: PlacePlan[]) => {
    const index = list.findIndex((p) => p.id === plan.id)
    if (index < 0) return

    onReorderPlan?.({
      plan,
      previousPlacePlanId: list[index - 1]?.id ?? null,
      nextPlacePlanId: list[index + 1]?.id ?? null,
    })
  }

  // Refs for each list item — used to scroll focused item into view
  const itemRefsMap = useRef<Map<number, HTMLElement>>(new Map())

  // 키보드로 한 칸 이동. 드래그(onReorder)와 같은 지역 상태를 고친다.
  const movePlanByOffset = (planId: number, offset: number) => {
    const from = orderedPlans.findIndex((p) => p.id === planId)
    const to = from + offset
    if (from < 0 || to < 0 || to >= orderedPlans.length) return

    const next = [...orderedPlans]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)

    applyOrder(next)
    notifyReorder(moved, next)
  }

  const registerItemRef = (planId: number) => (el: HTMLElement | null) => {
    if (el) itemRefsMap.current.set(planId, el)
    else itemRefsMap.current.delete(planId)
  }

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
        {statusContent ?? (
        <>
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
        {editMode ? (
          <Reorder.Group as="div" axis="y" values={orderedPlans} onReorder={applyOrder}>
            {orderedPlans.map((plan, i) => {
              const isFocusedPlan = plan.id === focusedPlanId
              const showEditActions = isFocusedPlan && onAIRecommendClick && onDeletePlan

              return (
                <ReorderableItem
                  key={plan.id}
                  plan={plan}
                  focused={isFocusedPlan}
                  disabled={Boolean(reorderDisabled)}
                  itemRef={registerItemRef(plan.id)}
                  onMoveByOffset={(offset) => movePlanByOffset(plan.id, offset)}
                  onDragStart={() => {
                    setIsDragging(true)
                    onDragStateChange?.(true)
                    dragStartIdsRef.current = orderedPlansRef.current.map((p) => p.id)
                  }}
                  onDragEnd={() => {
                    setIsDragging(false)
                    onDragStateChange?.(false)
                    const before = dragStartIdsRef.current
                    const after = orderedPlansRef.current
                    dragStartIdsRef.current = null
                    // 제자리에 놓았으면 보낼 것이 없다 — 미뤄둔 서버 변경만 반영한다
                    if (before && before.join() === after.map((p) => p.id).join()) {
                      applyPendingServerSync()
                      return
                    }
                    // 여기서는 미뤄둔 변경을 직접 반영하지 않는다. 저장이 성공하면 응답으로 온
                    // DatePlan이, 실패하면 resetOrderSignal이 서버 상태로 맞춰준다 — 지금
                    // 반영하면 아직 저장 전인 서버 순서로 한 번 되돌아가 보인다.
                    setPendingServerSync(false)
                    notifyReorder(plan, after)
                  }}
                >
                  {showEditActions ? (
                    <div className="trip-schedule-view__edit-card">
                      <PlaceCard plan={plan} index={i} onClick={() => onEditCardClick?.(plan)} />
                      <EditActions
                        onAIRecommend={() => onAIRecommendClick(plan)}
                        onDelete={() => onDeletePlan(plan)}
                      />
                    </div>
                  ) : (
                    <PlaceCard
                      plan={plan}
                      index={i}
                      focused={isFocusedPlan}
                      onClick={() => onEditCardClick?.(plan)}
                    />
                  )}
                </ReorderableItem>
              )
            })}
          </Reorder.Group>
        ) : (
          plansForDay.map((plan, i) => (
            <div
              key={plan.id}
              className={`trip-schedule-view__item${!plan.fromTransport ? ' trip-schedule-view__item--no-transport' : ''}`}
              ref={registerItemRef(plan.id)}
            >
              <PlaceCard
                plan={plan}
                index={i}
                focused={plan.id === focusedPlanId}
                onClick={onPlaceClick ? () => onPlaceClick(plan) : undefined}
                onLongPress={onPlaceLongPress ? () => onPlaceLongPress(plan) : undefined}
              />
              {plan.fromTransport ? (
                <TransportRow
                  transport={plan.fromTransport}
                  focused={plan.fromTransport.id === focusedTransportId}
                  onClick={onTransportClick ? () => onTransportClick(plan.fromTransport!.id) : undefined}
                />
              ) : (
                // 하루의 마지막 일정은 나가는 구간이 없다 — 그 자리는 비워둔다
                isTransportPending && i < plansForDay.length - 1 && <TransportPendingRow />
              )}
            </div>
          ))
        )}
        </>
        )}
      </div>
    </>
  )
}
