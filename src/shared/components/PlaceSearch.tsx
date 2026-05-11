import { useEffect, useRef, useState } from 'react'
import { usePlacesAutocomplete } from '@/shared/hooks/use-places-autocomplete'
import type { PlacePrediction } from '@/shared/hooks/use-places-autocomplete'
import './PlaceSearch.css'

export type PlaceItem = {
  id: string
  name: string
}

type Props = {
  placeholder?: string
  selected: PlaceItem[]
  maxItems?: number
  types?: string[]
  countryCode?: string
  onAdd: (item: PlaceItem) => void
  onRemove: (id: string) => void
}

export function PlaceSearch({
  placeholder = '장소 검색',
  selected,
  maxItems,
  types,
  countryCode,
  onAdd,
  onRemove,
}: Props) {
  const [input, setInput] = useState('')
  const [predictions, setPredictions] = useState<PlacePrediction[]>([])
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { isReady, getPredictions } = usePlacesAutocomplete()
  const isMaxReached = maxItems !== undefined && selected.length >= maxItems

  // Derive display predictions — avoids synchronous setState inside effect
  const visiblePredictions = input.trim() && !isMaxReached ? predictions : []
  const isDropdownOpen = open && visiblePredictions.length > 0

  useEffect(() => {
    if (!input.trim() || isMaxReached) return

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const results = await getPredictions(input, { types, countryCode })
      setPredictions(results)
      setOpen(results.length > 0)
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  // getPredictions reads from a stable ref; types/countryCode are stable props from parent
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, isMaxReached])

  const handleSelect = (prediction: PlacePrediction) => {
    onAdd({ id: prediction.placeId, name: prediction.name })
    setInput('')
    setPredictions([])
    setOpen(false)
  }

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
          <input
            type="text"
            className="place-search-input"
            placeholder={isReady ? placeholder : `${placeholder} (API 키 필요)`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onFocus={() => visiblePredictions.length > 0 && setOpen(true)}
            aria-autocomplete="list"
            aria-expanded={isDropdownOpen}
          />
          {isDropdownOpen && (
            <ul className="place-search-dropdown" role="listbox">
              {visiblePredictions.map((p) => (
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
        </div>
      )}
    </div>
  )
}
