export type ScheduleType = 'LOOSE' | 'TIGHT'
export type TransportType = 'PUBLIC' | 'PRIVATE'
export type PersonType = 'FRIEND' | 'FAMILY' | 'COUPLE' | 'SOLO'

export type Trip = {
  id: number
  name: string
  personCount: number
  site: string
  scheduleType: ScheduleType
  transportType: TransportType
  personType: PersonType
  startDate: string
  endDate: string
  price: number
}

export type TripListResponse = {
  message: string
  body: Trip[]
}
