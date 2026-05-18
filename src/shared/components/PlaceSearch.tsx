import { useEffect, useRef, useState } from 'react'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { usePlacesAutocomplete } from '@/shared/hooks/use-places-autocomplete'
import type {
  PlacePrediction,
  PlacesSessionToken,
} from '@/shared/hooks/use-places-autocomplete'
import './PlaceSearch.css'

export type PlaceItem = {
  id: string
  name: string
  location?: {
    lat: number
    lng: number
  }
}

type Props = {
  placeholder?: string
  selected: PlaceItem[]
  maxItems?: number
  types?: string[]
  countryCode?: string
  onAdd: (item: PlaceItem) => void
  onRemove: (id: string) => void
  onLocationError?: (message: string) => void
  onLocationErrorClear?: () => void
}

export function PlaceSearch({
  placeholder = '장소 검색',
  selected,
  maxItems,
  types,
  countryCode,
  onAdd,
  onRemove,
  onLocationError,
  onLocationErrorClear,
}: Props) {
  const [input, setInput] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [open, setOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionTokenRef = useRef<PlacesSessionToken | null>(null)
  const requestIdRef = useRef(0)
  const {
    isReady,
    getPredictions,
    createSessionToken,
    getPlaceLocation,
  } = usePlacesAutocomplete()
  const isMaxReached = maxItems !== undefined && selected.length >= maxItems

  const hasInput = input.trim().length > 0

  useEffect(() => {
    if (!hasInput || isMaxReached || !isReady) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const currentId = ++requestIdRef.current

    debounceRef.current = setTimeout(async () => {
      sessionTokenRef.current ??= createSessionToken()
      try {
        const results = await getPredictions(input, {
          types,
          countryCode,
          sessionToken: sessionTokenRef.current,
        })
        if (currentId !== requestIdRef.current) return
        setPredictions(results)
        setOpen(true)
        setIsSearching(false)
      } catch {
        if (currentId !== requestIdRef.current) return
        setPredictions([])
        setSearchError(true)
        setOpen(false)
        setIsSearching(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // getPredictions reads from a stable ref; types/countryCode are stable props from parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isMaxReached, isReady])

  const handleSelect = async (prediction: PlacePrediction) => {
    setOpen(false)
    setPredictions([])
    setInput('')
    sessionTokenRef.current = null

    const location = await getPlaceLocation(prediction)

    if (!location) {
      onLocationError?.('위치 정보를 찾을 수 없어요')
      return
    }

    onLocationErrorClear?.()
    onAdd({
      id: prediction.placeId,
      name: prediction.name,
      location,
    })
  }

  const handleBlur = () => {
    setTimeout(() => {
      setOpen(false)
      sessionTokenRef.current = null
    }, 150)
  }

  const showDropdown = open && predictions.length > 0 && !isSearching && !searchError
  const showEmpty = hasInput && !isMaxReached && !isSearching && !searchError && predictions.length === 0
  const showStatus = hasInput && !isMaxReached && (isSearching || searchError || showEmpty)

  return (
    <div className="place-search">
      {selected.length > 0 && (
        <ul className="place-search-chips" aria-label="선택된 장소">
          {selected.map((item) => (
            <li key={item.id} className="place-search-chip">
              <span>{item.name}</span>
              <button
                type="button"
                className="place-search-chip-remove"
                onClick={() => onRemove(item.id)}
                aria-label={`${item.name} 제거`}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {!isMaxReached && (
        <div className="place-search-input-wrap">
          <FaMagnifyingGlass
            className="place-search-icon"
            size={15}
            color="#FF6F9F"
            aria-hidden="true"
          />
          <input
            type="text"
            className="place-search-input"
            placeholder={placeholder}
            value={input}
            disabled={!isReady}
            onChange={(e) => {
              const val = e.target.value
              setInput(val)
              if (!val.trim()) {
                setPredictions([])
                setOpen(false)
                setIsSearching(false)
                setSearchError(false)
              } else if (isReady && !isMaxReached) {
                setIsSearching(true)
                setSearchError(false)
              }
            }}
            onBlur={handleBlur}
            onFocus={() => predictions.length > 0 && setOpen(true)}
            aria-autocomplete="list"
            aria-expanded={showDropdown}
          />
          {showDropdown && (
            <ul className="place-search-dropdown" role="listbox">
              {predictions.map((p) => (
                <li
                  key={p.placeId}
                  role="option"
                  aria-selected={false}
                  className="place-search-option"
                  onMouseDown={() => handleSelect(p)}
                >
                  <span className="place-search-option-name">{p.name}</span>
                  <span className="place-search-option-desc">{p.description}</span>
                </li>
              ))}
            </ul>
          )}
          {showStatus && (
            <div className="place-search-status" role="status" aria-live="polite">
              {isSearching && '찾는 중...'}
              {!isSearching && searchError && '장소 검색에 실패했어요'}
              {showEmpty && '검색 결과가 없어요'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
