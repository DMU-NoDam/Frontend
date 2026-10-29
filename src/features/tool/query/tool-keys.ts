export const toolKeys = {
  all: ['tools'] as const,
  weather: (cityName: string, date: string) =>
    [...toolKeys.all, 'weather', cityName, date] as const,
  exchangeRate: (base: string, target: string) =>
    [...toolKeys.all, 'exchange-rate', base, target] as const,
}
