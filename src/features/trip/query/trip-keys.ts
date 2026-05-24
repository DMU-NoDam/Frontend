export const tripKeys = {
  all: ['trips'] as const,
  list: () => [...tripKeys.all, 'list'] as const,
  detail: (tripId: string) => [...tripKeys.all, 'detail', tripId] as const,
  schedule: (tripId: string) => [...tripKeys.all, 'schedule', tripId] as const,
  plans: (tripId: string) => [...tripKeys.all, 'plans', tripId] as const,
  status: (tripId: string) => [...tripKeys.all, 'status', tripId] as const,
  flight: (iata: string, date: string) =>
    [...tripKeys.all, 'flight', iata, date] as const,
}
