import etcImage from '@/assets/memo-icon/etc.png'
import foodImage from '@/assets/memo-icon/food.png'
import hotelImage from '@/assets/memo-icon/hotel.png'
import ideaImage from '@/assets/memo-icon/idea.png'
import importantImage from '@/assets/memo-icon/important.png'
import shoppingImage from '@/assets/memo-icon/shopping.png'
import sightseeingImage from '@/assets/memo-icon/sightseeing.png'
import transportImage from '@/assets/memo-icon/transport.png'
import type { MemoIconType } from '../types/tool-types'

// 이모지는 기기마다 모양이 달라 같은 그림(Microsoft Fluent Emoji 3D, MIT)을 이미지로 넣는다.
// 원본 256px을 128px로 줄인 PNG (src/assets/memo-icon, 라이선스 전문도 같은 폴더)
export const MEMO_ICONS: { type: MemoIconType; image: string; label: string }[] = [
  { type: 'HOTEL', image: hotelImage, label: '숙소' },
  { type: 'FOOD', image: foodImage, label: '음식' },
  { type: 'TRANSPORT', image: transportImage, label: '교통' },
  { type: 'SHOPPING', image: shoppingImage, label: '쇼핑' },
  { type: 'SIGHTSEEING', image: sightseeingImage, label: '관광' },
  { type: 'IMPORTANT', image: importantImage, label: '중요' },
  { type: 'IDEA', image: ideaImage, label: '아이디어' },
  { type: 'ETC', image: etcImage, label: '기타' },
]

export function getMemoIconImage(type: MemoIconType): string {
  return MEMO_ICONS.find((icon) => icon.type === type)?.image ?? etcImage
}
