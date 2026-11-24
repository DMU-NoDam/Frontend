import { describe, expect, it } from 'vitest'
import type { MemoIconType } from '../types/tool-types'
import { MEMO_ICONS, getMemoIconImage } from './memo-icon'

// 백엔드 MemoIconType 과 같은 목록
const ALL_TYPES: MemoIconType[] = ['HOTEL', 'FOOD', 'TRANSPORT', 'SHOPPING', 'SIGHTSEEING', 'IMPORTANT', 'IDEA', 'ETC']

describe('MEMO_ICONS', () => {
  it('모든 아이콘 종류가 한 번씩 있다', () => {
    expect(MEMO_ICONS.map((icon) => icon.type).sort()).toEqual([...ALL_TYPES].sort())
  })

  it('이름과 그림이 모두 있고 서로 겹치지 않는다', () => {
    const labels = MEMO_ICONS.map((icon) => icon.label)
    const images = MEMO_ICONS.map((icon) => icon.image)

    expect(labels.every(Boolean)).toBe(true)
    expect(new Set(labels).size).toBe(labels.length)
    expect(new Set(images).size).toBe(images.length)
  })
})

describe('getMemoIconImage', () => {
  it.each(ALL_TYPES)('%s 는 자기 그림', (type) => {
    expect(getMemoIconImage(type)).toBe(MEMO_ICONS.find((icon) => icon.type === type)?.image)
  })

  it('목록에 없는 값이 오면 기타 그림', () => {
    const etc = MEMO_ICONS.find((icon) => icon.type === 'ETC')?.image

    expect(getMemoIconImage('UNKNOWN' as MemoIconType)).toBe(etc)
  })
})
