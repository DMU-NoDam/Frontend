import type {
  PlacePlan,
  PlanListBody,
  PlanListResponse,
  PlanThemeCard,
  RawPlacePlan,
  RawPlacePlanTimeObj,
  RawPlanListResponse,
  RawRecommendedPlaceItem,
  RawRouteInfo,
  RawRouteStep,
  RawTimeObject,
  RawTransport,
  RawTransportTimeObj,
  RecommendedPlaceItem,
  RouteInfo,
  RouteStep,
  Transport,
  TripThemeType,
} from '../types/plan-types'

const THEME_ORDER: TripThemeType[] = ['FOOD', 'HEALING', 'LANDMARK', 'ACTIVITY']

const THEME_META: Record<TripThemeType, {
  title: string
  subtitle: string
  emojis: string[]
  summary: string
}> = {
  FOOD: {
    title: '미식 집중 코스',
    subtitle: '맛집과 카페를 놓치지 않는 일정',
    emojis: ['🍽️', '☕', '🍰'],
    summary: '입맛과 동선을 함께 고려해 하루를 맛있게 채운 코스예요',
  },
  HEALING: {
    title: '힐링 여유 코스',
    subtitle: '천천히 쉬어가는 편안한 일정',
    emojis: ['🌿', '🛌', '☁️'],
    summary: '무리하지 않고 여유롭게 머물 수 있는 장소를 중심으로 구성했어요',
  },
  LANDMARK: {
    title: '랜드마크 필수 코스',
    subtitle: '대표 명소를 놓치지 않는 여행',
    emojis: ['📍', '🏛️', '📸'],
    summary: '처음 방문해도 아쉽지 않도록 핵심 명소를 균형 있게 담았어요',
  },
  ACTIVITY: {
    title: '액티비티 코스',
    subtitle: '움직이며 즐기는 활기찬 여행',
    emojis: ['🚶', '🎒', '✨'],
    summary: '체험과 이동의 흐름을 살려 여행의 에너지를 높인 코스예요',
  },
}

const getUniqueDayCount = (plans: PlacePlan[]) =>
  new Set(plans.map((p) => p.date)).size

const getTransports = (plans: PlacePlan[]): Transport[] =>
  plans.map((p) => p.fromTransport).filter(Boolean) as Transport[]

const getTotalMoveMinutes = (plans: PlacePlan[]) => {
  const totalSeconds = getTransports(plans).reduce((sum, t) => sum + t.takeTime, 0)
  return Math.round(totalSeconds / 60)
}

const getTotalDistanceMeters = (plans: PlacePlan[]) =>
  getTransports(plans).reduce((sum, t) => sum + t.totalDistanceMeters, 0)

// ── Raw API → Domain mapping ──────────────────────────────────

function mapRouteStep(raw: RawRouteStep): RouteStep {
  return {
    method: raw.methodType,
    path: [
      raw.start.coordinate,
      ...raw.polygon.map((p) => p.coordinate),
      raw.end.coordinate,
    ],
  }
}

function mapRouteInfo(raw: RawRouteInfo | null): RouteInfo | null {
  if (!raw) return null
  return {
    totalDistanceMeters: raw.totalDistanceMeters,
    totalDurationSeconds: raw.totalDurationSeconds,
    steps: raw.steps.map(mapRouteStep),
  }
}

function mapTransport(raw: RawTransport): Transport {
  return {
    id: raw.id,
    startTime: raw.startTime,
    endTime: raw.endTime,
    takeTime: raw.takeTime,
    totalDistanceMeters: raw.totalDistanceMeters,
    fromPlacePlanId: raw.fromPlacePlanId,
    toPlacePlanId: raw.toPlacePlanId,
    transportPlanId: raw.transportPlanId,
    routeInfo: mapRouteInfo(raw.routeInfo),
  }
}

function mapPlacePlan(raw: RawPlacePlan): PlacePlan {
  return {
    id: raw.id,
    date: raw.date,
    startTime: raw.startTime,
    endTime: raw.endTime,
    placeInfo: raw.placeInfo,
    fromTransport: raw.fromTransport ? mapTransport(raw.fromTransport) : null,
  }
}

export function mapPlanListResponse(raw: RawPlanListResponse): PlanListResponse {
  const body = {} as PlanListBody
  for (const [theme, plans] of Object.entries(raw.body)) {
    (body as Record<string, PlacePlan[]>)[theme] = plans.map(mapPlacePlan)
  }
  return { message: raw.message, body }
}

// ── Theme card mapping ────────────────────────────────────────

// ── Edit / Recommend mappers ──────────────────────────────────

export function mapTimeObject(t: RawTimeObject): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(t.hour)}:${pad(t.minute)}:${pad(t.second)}`
}

function mapTransportTimeObj(raw: RawTransportTimeObj): Transport {
  return {
    id: raw.id,
    startTime: mapTimeObject(raw.startTime),
    endTime: mapTimeObject(raw.endTime),
    takeTime: raw.takeTime,
    totalDistanceMeters: raw.totalDistanceMeters,
    fromPlacePlanId: raw.fromPlacePlanId,
    toPlacePlanId: raw.toPlacePlanId,
    transportPlanId: raw.transportPlanId,
    routeInfo: mapRouteInfo(raw.routeInfo),
  }
}

export function mapReplacedPlacePlan(raw: RawPlacePlanTimeObj): PlacePlan {
  return {
    id: raw.id,
    date: raw.date,
    startTime: mapTimeObject(raw.startTime),
    endTime: mapTimeObject(raw.endTime),
    placeInfo: raw.placeInfo,
    fromTransport: raw.fromTransport ? mapTransportTimeObj(raw.fromTransport) : null,
  }
}

export function mapRecommendedPlaceItems(raw: RawRecommendedPlaceItem[]): RecommendedPlaceItem[] {
  return raw.map((item) => ({
    place: item.place,
    travelDurationSeconds: item.travelDurationSeconds,
    travelDistanceMeters: item.travelDistanceMeters,
    startTime: mapTimeObject(item.startTime),
    endTime: mapTimeObject(item.endTime),
  }))
}

export const mapPlanListToThemeCards = (body: PlanListBody): PlanThemeCard[] =>
  THEME_ORDER.map((theme) => {
    const plans = body[theme] ?? []
    const dayCount = getUniqueDayCount(plans)
    const meta = THEME_META[theme]

    return {
      theme,
      title: meta.title,
      subtitle: meta.subtitle,
      emojis: meta.emojis,
      plans,
      dayCount,
      nightCount: Math.max(dayCount - 1, 0),
      scheduleCount: plans.length,
      totalMoveMinutes: getTotalMoveMinutes(plans),
      totalDistanceMeters: getTotalDistanceMeters(plans),
      summary: meta.summary,
    }
  })
