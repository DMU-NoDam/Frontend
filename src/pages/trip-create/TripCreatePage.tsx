import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import { useCreateTrip } from '@/features/trip/hooks/use-create-trip'
import { mapFormToRequest } from '@/features/trip/api/trip-mapper'
import { tripFormSchema } from '@/features/trip/types/trip-schema'
import type { TripCreateFormValues } from '@/features/trip/types/trip-types'
import { CountryStep } from './steps/CountryStep'
import { CityStep } from './steps/CityStep'
import { DateStep } from './steps/DateStep'
import { PersonStep } from './steps/PersonStep'
import { HotelStep } from './steps/HotelStep'
import { FlightStep } from './steps/FlightStep'
import { PlaceStep } from './steps/PlaceStep'
import { BudgetStep } from './steps/BudgetStep'
import { StyleStep } from './steps/StyleStep'
import './TripCreatePage.css'

const TOTAL_STEPS = 9
const PENDING_KEY = 'trip_form_pending'
const REDIRECT_KEY = 'pending_redirect'

const STEP_FIELDS: Partial<Record<number, (keyof TripCreateFormValues)[]>> = {
  1: ['country'],
  2: ['region'],
  3: ['startDate', 'endDate'],
  4: ['personCount'],
}

function readPending(): Partial<TripCreateFormValues> | null {
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return null
  try {
    sessionStorage.removeItem(PENDING_KEY)
    return JSON.parse(raw) as Partial<TripCreateFormValues>
  } catch {
    return null
  }
}

export function TripCreatePage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Read and clear pending values once on mount via lazy initializer
  const [pending] = useState<Partial<TripCreateFormValues> | null>(readPending)
  const [step, setStep] = useState(pending ? TOTAL_STEPS : 1)

  const { control, setValue, getValues, watch, trigger, handleSubmit } =
    useForm<TripCreateFormValues>({
      resolver: zodResolver(tripFormSchema),
      defaultValues: pending ?? {
        uuid: crypto.randomUUID(),
        country: '',
        region: [],
        startDate: '',
        endDate: '',
        personCount: 1,
        hotel: [],
        selectedPlace: [],
      },
    })

  const { mutate, isPending, isError } = useCreateTrip()

  const goNext = async (fields?: (keyof TripCreateFormValues)[]) => {
    if (fields) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep((s) => s + 1)
  }

  const goBack = () => setStep((s) => s - 1)

  const onSubmit = (values: TripCreateFormValues) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(values))
      sessionStorage.setItem(REDIRECT_KEY, '/trip/create')
      navigate('/login')
      return
    }
    mutate(mapFormToRequest(values))
  }

  return (
    <main className="trip-create-page">
      <div className="trip-create-progress" aria-label={`${TOTAL_STEPS}단계 중 ${step}단계`}>
        <div
          className="trip-create-progress-bar"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="trip-create-content">
        {step === 1 && (
          <CountryStep
            control={control}
            onNext={() => goNext(STEP_FIELDS[1])}
          />
        )}
        {step === 2 && (
          <CityStep
            control={control}
            setValue={setValue}
            getValues={getValues}
            onNext={() => goNext(STEP_FIELDS[2])}
            onBack={goBack}
          />
        )}
        {step === 3 && (
          <DateStep
            watch={watch}
            setValue={setValue}
            onNext={() => goNext(STEP_FIELDS[3])}
            onBack={goBack}
          />
        )}
        {step === 4 && (
          <PersonStep
            control={control}
            onNext={() => goNext(STEP_FIELDS[4])}
            onBack={goBack}
          />
        )}
        {step === 5 && (
          <HotelStep
            watch={watch}
            setValue={setValue}
            getValues={getValues}
            onNext={() => goNext()}
            onBack={goBack}
          />
        )}
        {step === 6 && (
          <FlightStep
            setValue={setValue}
            onNext={() => goNext()}
            onBack={goBack}
          />
        )}
        {step === 7 && (
          <PlaceStep
            watch={watch}
            setValue={setValue}
            getValues={getValues}
            onNext={() => goNext()}
            onBack={goBack}
          />
        )}
        {step === 8 && (
          <BudgetStep
            control={control}
            onNext={() => goNext()}
            onBack={goBack}
          />
        )}
        {step === 9 && (
          <StyleStep
            control={control}
            onSubmit={handleSubmit(onSubmit)}
            onBack={goBack}
            isPending={isPending}
            isError={isError}
          />
        )}
      </div>
    </main>
  )
}
