import type { MemoIconType } from '../types/tool-types'

export const MEMO_ICONS: { type: MemoIconType; emoji: string; label: string }[] = [
  { type: 'HOTEL', emoji: '🏨', label: '숙소' },
  { type: 'FOOD', emoji: '🍜', label: '음식' },
  { type: 'TRANSPORT', emoji: '🚕', label: '교통' },
  { type: 'SHOPPING', emoji: '🛍️', label: '쇼핑' },
  { type: 'SIGHTSEEING', emoji: '📸', label: '관광' },
  { type: 'IMPORTANT', emoji: '⭐', label: '중요' },
  { type: 'IDEA', emoji: '💡', label: '아이디어' },
  { type: 'ETC', emoji: '📝', label: '기타' },
]

export function getMemoEmoji(type: MemoIconType): string {
  return MEMO_ICONS.find((icon) => icon.type === type)?.emoji ?? '📝'
}
