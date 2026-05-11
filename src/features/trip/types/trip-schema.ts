import { z } from 'zod'

export const tripFormSchema = z
  .object({
    uuid: z.string().length(36),
    country: z.string().min(1, '나라를 선택해 주세요'),
    region: z
      .array(z.string())
      .min(1, '도시를 1개 이상 선택해 주세요')
      .max(2, '도시는 최대 2개까지 선택할 수 있어요'),
    startDate: z.string().min(1, '출발일을 선택해 주세요'),
    endDate: z.string().min(1, '귀국일을 선택해 주세요'),
    personCount: z.number().min(1, '인원은 1명 이상이어야 해요').max(6, '인원은 최대 6명이에요'),
    scheduleType: z.enum(['TIGHT', 'NORMAL', 'LOOSE']).optional(),
    priceType: z.enum(['CHEEP', 'NORMAL', 'LUXURY']).optional(),
    hotel: z.array(z.object({ id: z.string(), name: z.string() })),
    departFlight: z
      .object({
        departureAirport: z.string(),
        departureTime: z.string(),
      })
      .optional(),
    arriveFlight: z
      .object({
        arrivalAirport: z.string(),
        arrivalTime: z.string(),
      })
      .optional(),
    selectedPlace: z.array(z.object({ id: z.string(), name: z.string() })),
  })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    message: '귀국일은 출발일 이후여야 해요',
    path: ['endDate'],
  })
