import type { IconType } from 'react-icons'
import {
  LuBedDouble,
  LuCamera,
  LuCarTaxiFront,
  LuLightbulb,
  LuShoppingBag,
  LuStar,
  LuStickyNote,
  LuUtensils,
} from 'react-icons/lu'
import type { MemoIconType } from '../types/tool-types'

// 이모지는 기기마다 모양이 달라 앱 아이콘 세트(Lucide)로 통일한다
export const MEMO_ICONS: { type: MemoIconType; Icon: IconType; label: string }[] = [
  { type: 'HOTEL', Icon: LuBedDouble, label: '숙소' },
  { type: 'FOOD', Icon: LuUtensils, label: '음식' },
  { type: 'TRANSPORT', Icon: LuCarTaxiFront, label: '교통' },
  { type: 'SHOPPING', Icon: LuShoppingBag, label: '쇼핑' },
  { type: 'SIGHTSEEING', Icon: LuCamera, label: '관광' },
  { type: 'IMPORTANT', Icon: LuStar, label: '중요' },
  { type: 'IDEA', Icon: LuLightbulb, label: '아이디어' },
  { type: 'ETC', Icon: LuStickyNote, label: '기타' },
]

export function getMemoIcon(type: MemoIconType): IconType {
  return MEMO_ICONS.find((icon) => icon.type === type)?.Icon ?? LuStickyNote
}
