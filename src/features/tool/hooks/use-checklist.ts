import { useMemo } from 'react'
import { createDefaultChecklist, useChecklistStore } from '@/app/store/checklist-store'

// 체크리스트 API가 생기면 이 훅만 react-query(useQuery + useMutation)로 바꾸면 된다.
// 반환 모양({ items, addItem, toggleItem, removeItem })은 그대로 유지할 것.
export function useChecklist(tripId: string) {
  const stored = useChecklistStore((s) => s.itemsByTrip[tripId])
  const addItem = useChecklistStore((s) => s.addItem)
  const toggleItem = useChecklistStore((s) => s.toggleItem)
  const removeItem = useChecklistStore((s) => s.removeItem)

  const items = useMemo(() => stored ?? createDefaultChecklist(), [stored])

  return {
    items,
    addItem: (label: string) => addItem(tripId, label),
    toggleItem: (itemId: string) => toggleItem(tripId, itemId),
    removeItem: (itemId: string) => removeItem(tripId, itemId),
  }
}
