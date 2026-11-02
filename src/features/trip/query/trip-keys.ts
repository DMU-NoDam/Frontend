export const tripKeys = {
  all: ['trips'] as const,
  list: () => [...tripKeys.all, 'list'] as const,
  detail: (tripId: string) => [...tripKeys.all, 'detail', tripId] as const,
  schedule: (tripId: string) => [...tripKeys.all, 'schedule', tripId] as const,
  plans: (tripId: string) => [...tripKeys.all, 'plans', tripId] as const,
  // 변경 감지용 version 조회. prefix(tripId까지)로 한꺼번에 취소할 수 있게 두 단계로 나눈다
  planVersions: (tripId: string) => [...tripKeys.all, 'plan-versions', tripId] as const,
  planVersionProbe: (tripId: string, datePlanIdsKey: string) =>
    [...tripKeys.planVersions(tripId), datePlanIdsKey] as const,
  // 계산 중인 이동 구간 조회. version을 key에 넣어 편집 전 세대의 응답이 섞이지 않게 한다
  placePlanTransports: (tripId: string) =>
    [...tripKeys.all, 'place-plan-transport', tripId] as const,
  placePlanTransport: (
    tripId: string,
    datePlanId: number,
    datePlanVersion: number,
    placePlanId: number,
  ) =>
    [...tripKeys.placePlanTransports(tripId), datePlanId, datePlanVersion, placePlanId] as const,
  transportPlanDetail: (tripId: string, transportPlanId: number) =>
    [...tripKeys.all, 'transport-plan', tripId, transportPlanId] as const,
  status: (tripId: string) => [...tripKeys.all, 'status', tripId] as const,
  flight: (iata: string, date: string) =>
    [...tripKeys.all, 'flight', iata, date] as const,
  members: (tripId: string) => [...tripKeys.all, 'members', tripId] as const,
  invitationPreview: (token: string) => [...tripKeys.all, 'invitation', token] as const,
}
