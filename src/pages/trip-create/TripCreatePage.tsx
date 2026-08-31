import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { LuSparkle } from 'react-icons/lu'
import { PiStarFourBold } from 'react-icons/pi'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import { useTripCreationStore } from '@/app/store/trip-creation-store'
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
import { useThemeColor } from '@/shared/hooks/use-theme-color'
import './TripCreatePage.css'

const TOTAL_STEPS = 9
const PENDING_KEY = 'trip_form_pending'
const REDIRECT_KEY = 'pending_redirect'
const SKIPPABLE_STEPS = new Set([5, 6, 7, 8])

const STEP_FIELDS: Partial<Record<number, (keyof TripCreateFormValues)[]>> = {
  1: ['country'],
  2: ['region'],
  3: ['startDate', 'endDate'],
  4: ['personCount'],
}

const sparkleFloat = {
  y: [0, -8, 0],
  rotate: [-2, 3, -2],
}

const sparklePulse = {
  scale: [0.92, 1.08, 0.92],
  opacity: [0.72, 1, 0.72],
}

type PendingReadResult =
  | { ok: true; values: Partial<TripCreateFormValues> }
  | { ok: false; hadData: boolean }

function readPending(): PendingReadResult {
  const raw = sessionStorage.getItem(PENDING_KEY)
  if (!raw) return { ok: true, values: {} }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return { ok: false, hadData: true }
  }

  const result = tripFormSchema.safeParse(parsed)
  if (!result.success) return { ok: false, hadData: true }

  return { ok: true, values: result.data }
}

function createUuid(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

function PlanningSparkle() {
  return (
    <motion.div
      className="trip-create-planning-sparkles"
      aria-hidden="true"
      animate={sparkleFloat}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    >
      <motion.span
        className="trip-create-planning-sparkle trip-create-planning-sparkle--main"
        animate={sparklePulse}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LuSparkle />
      </motion.span>

      {['left', 'right'].map((position, index) => (
        <motion.span
          key={position}
          className={`trip-create-planning-sparkle trip-create-planning-sparkle--${position}`}
          animate={sparklePulse}
          transition={{
            duration: 1.55,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: index === 0 ? 0.25 : 0.55,
          }}
        >
          <PiStarFourBold />
        </motion.span>
      ))}
    </motion.div>
  )
}

export function TripCreatePage() {
  useThemeColor('#ffffff', '#ffffff')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const [pendingResult] = useState<PendingReadResult>(readPending)
  const pendingValues = pendingResult.ok ? pendingResult.values : {}
  const hasPendingData = pendingResult.ok && Object.keys(pendingValues).length > 0

  const [step, setStep] = useState(hasPendingData ? TOTAL_STEPS : 1)
  const [toast, setToast] = useState(!pendingResult.ok && pendingResult.hadData)
  const [freshUuid] = useState(createUuid)

  // trip creation pipeline state lives in a shared store (see TripGenerationWatcher) so
  // it keeps advancing even if the user navigates away from this page
  const tripId = useTripCreationStore((s) => s.tripId)
  const planningStatus = useTripCreationStore((s) => s.status)
  const isPollError = useTripCreationStore((s) => s.isError)
  const startTripCreation = useTripCreationStore((s) => s.start)
  const clearTripCreation = useTripCreationStore((s) => s.clear)
  const [retryCount, setRetryCount] = useState(0)

  const { control, setValue, getValues, watch, trigger, handleSubmit } =
    useForm<TripCreateFormValues>({
      resolver: zodResolver(tripFormSchema),
      defaultValues: hasPendingData
        ? (pendingValues as TripCreateFormValues)
        : {
            uuid: freshUuid,
            country: '',
            region: [],
            startDate: '',
            endDate: '',
            personCount: 1,
            hotel: [],
            selectedPlace: [],
          },
    })

  const queryClient = useQueryClient()
  const { mutate, isPending: isCreating, isError: isCreateError, reset: resetMutation } = useCreateTrip()

  // toast auto-dismiss
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!toast) return
    toastTimerRef.current = setTimeout(() => setToast(false), 4000)
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [toast])

  // navigate-on-done is handled globally by TripGenerationWatcher (root layout)

  // navigate to dashboard after second failure
  const showPlanningFailureRaw = (isCreateError || isPollError || planningStatus === 'timeout' || planningStatus === 'failed') && !isCreating
  useEffect(() => {
    if (showPlanningFailureRaw && retryCount >= 1) {
      navigate('/trips')
    }
  }, [showPlanningFailureRaw, retryCount, navigate])

  const goNext = async (fields?: (keyof TripCreateFormValues)[]) => {
    if (fields) {
      const valid = await trigger(fields)
      if (!valid) return
    }
    setStep((s) => s + 1)
  }

  const clearStepValues = (targetStep: number) => {
    if (targetStep === 5) setValue('hotel', [])
    if (targetStep === 6) {
      setValue('departFlight', undefined)
      setValue('arriveFlight', undefined)
    }
    if (targetStep === 7) setValue('selectedPlace', [])
    if (targetStep === 8) setValue('priceType', undefined)
  }

  const goSkip = () => {
    clearStepValues(step)
    void goNext()
  }

  const goBack = () => setStep((s) => s - 1)

  const onSubmit = (values: TripCreateFormValues) => {
    if (!isAuthenticated) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(values))
      sessionStorage.setItem(REDIRECT_KEY, '/trips/create')
      navigate('/login')
      return
    }

    mutate(mapFormToRequest(values), {
      onSuccess: (res) => {
        sessionStorage.removeItem(PENDING_KEY)
        const id = String(res.body.id)
        if (!id) return
        startTripCreation(id)
      },
    })
  }

  const handleRetry = () => {
    setRetryCount((c) => c + 1)
    resetMutation()
    clearTripCreation()
    queryClient.removeQueries({ queryKey: ['trip-status'] })
    const values = getValues()
    mutate(mapFormToRequest(values), {
      onSuccess: (res) => {
        const id = String(res.body.id)
        if (!id) return
        startTripCreation(id)
      },
    })
  }

  // Show full-screen overlay when POST is pending or polling is in progress
  const isPolling = tripId !== null && planningStatus === 'pending'
  const showPlanningOverlay = isCreating || isPolling
  const showPlanningFailure = showPlanningFailureRaw && retryCount < 1

  if (showPlanningOverlay) {
    return (
      <main className="trip-create-page trip-create-planning" aria-live="polite">
        <motion.div
          className="trip-create-planning-content"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
        >
          <PlanningSparkle />
          <motion.h1
            className="trip-create-planning-title"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut', delay: 0.12 }}
          >
            <span>AI가 완벽한 일정을</span>
            <span>마법처럼 짜고 있어요</span>
          </motion.h1>
        </motion.div>
      </main>
    )
  }

  if (showPlanningFailure) {
    return (
      <main className="trip-create-page trip-create-planning">
        <div className="trip-create-planning-failure">
          <p className="trip-create-planning-text trip-create-planning-error">AI 일정 생성이 실패했어요</p>
          <button type="button" className="trip-create-planning-retry-btn" onClick={handleRetry}>
            재생성 하기
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="trip-create-page">
      {toast && (
        <div className="trip-create-toast" role="alert">
          이전 작성 내용을 불러오지 못했어요. 처음부터 다시 작성해 주세요.
        </div>
      )}

      <header className="trip-create-header">
        <button
          type="button"
          className={`trip-create-back${step === 1 ? ' trip-create-back--hidden' : ''}`}
          onClick={goBack}
          disabled={isCreating}
          aria-label="이전 단계"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        <span className="trip-create-step-counter" aria-label={`${TOTAL_STEPS}단계 중 ${step}단계`}>
          <span className="trip-create-step-current">{step}</span>
          <span className="trip-create-step-total">/{TOTAL_STEPS}</span>
        </span>

        <button
          type="button"
          className={`trip-create-skip${!SKIPPABLE_STEPS.has(step) ? ' trip-create-skip--hidden' : ''}`}
          onClick={goSkip}
          disabled={!SKIPPABLE_STEPS.has(step) || isCreating}
          aria-hidden={!SKIPPABLE_STEPS.has(step)}
        >
          건너뛰기
        </button>
      </header>

      <div className="trip-create-progress">
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
            onNext={() => goNext(STEP_FIELDS[2])}
          />
        )}
        {step === 3 && (
          <DateStep
            watch={watch}
            setValue={setValue}
            onNext={() => goNext(STEP_FIELDS[3])}
          />
        )}
        {step === 4 && (
          <PersonStep
            control={control}
            onNext={() => goNext(STEP_FIELDS[4])}
          />
        )}
        {step === 5 && (
          <HotelStep
            watch={watch}
            setValue={setValue}
            getValues={getValues}
            onNext={() => goNext()}
          />
        )}
        {step === 6 && (
          <FlightStep
            watch={watch}
            setValue={setValue}
            onNext={() => goNext()}
          />
        )}
        {step === 7 && (
          <PlaceStep
            watch={watch}
            setValue={setValue}
            getValues={getValues}
            onNext={() => goNext()}
          />
        )}
        {step === 8 && (
          <BudgetStep
            control={control}
            onNext={() => goNext()}
          />
        )}
        {step === 9 && (
          <StyleStep
            control={control}
            onSubmit={handleSubmit(onSubmit)}
            isPending={isCreating}
            isError={isCreateError}
          />
        )}
      </div>
    </main>
  )
}
