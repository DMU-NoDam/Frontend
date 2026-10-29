import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { ChecklistItem } from '@/features/tool/types/tool-types'

const DEFAULT_LABELS = ['여권', '충전기', '세면도구', '어댑터', '상비약']

// id를 고정해 두어야 저장 전(기본 목록)과 저장 후의 항목이 같은 항목으로 취급된다
export const createDefaultChecklist = (): ChecklistItem[] =>
  DEFAULT_LABELS.map((label, index) => ({ id: `default-${index}`, label, checked: false }))

type ChecklistState = {
  // 여행을 한 번도 수정하지 않았으면 키가 없고, 화면은 기본 목록을 보여준다
  itemsByTrip: Record<string, ChecklistItem[]>
  addItem: (tripId: string, label: string) => void
  toggleItem: (tripId: string, itemId: string) => void
  removeItem: (tripId: string, itemId: string) => void
}

// 체크리스트 백엔드 API가 생기기 전까지 브라우저(localStorage)에만 저장한다.
// 다른 기기/브라우저와는 공유되지 않는다. 화면은 이 store를 직접 쓰지 않고
// useChecklist 훅만 쓰므로, API가 생기면 훅 내부만 교체하면 된다.
export const useChecklistStore = create<ChecklistState>()(
  persist(
    (set) => {
      const update = (tripId: string, fn: (items: ChecklistItem[]) => ChecklistItem[]) =>
        set((s) => ({
          itemsByTrip: {
            ...s.itemsByTrip,
            [tripId]: fn(s.itemsByTrip[tripId] ?? createDefaultChecklist()),
          },
        }))

      return {
        itemsByTrip: {},

        addItem: (tripId, label) =>
          update(tripId, (items) => [...items, { id: crypto.randomUUID(), label, checked: false }]),

        toggleItem: (tripId, itemId) =>
          update(tripId, (items) =>
            items.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item)),
          ),

        removeItem: (tripId, itemId) =>
          update(tripId, (items) => items.filter((item) => item.id !== itemId)),
      }
    },
    {
      name: 'arubi-checklist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)
