import { describe, expect, it } from 'vitest'
import { PLAN_EDIT_META, isPlanEditMeta } from './plan-edit-meta'

describe('isPlanEditMeta', () => {
  it('일정 편집 meta 면 true', () => {
    expect(isPlanEditMeta(PLAN_EDIT_META)).toBe(true)
  })

  it('다른 meta 와 섞여 있어도 true (use-plan-edit 은 호출부 meta 를 펼쳐 합친다)', () => {
    expect(isPlanEditMeta({ ...PLAN_EDIT_META, toast: false })).toBe(true)
  })

  it('planEdit 가 정확히 true 가 아니면 false', () => {
    expect(isPlanEditMeta({ planEdit: 'true' })).toBe(false)
    expect(isPlanEditMeta({ planEdit: 1 })).toBe(false)
    expect(isPlanEditMeta({ planEdit: false })).toBe(false)
  })

  it('meta 가 없거나 객체가 아니면 false (일반 mutation)', () => {
    expect(isPlanEditMeta(undefined)).toBe(false)
    expect(isPlanEditMeta(null)).toBe(false)
    expect(isPlanEditMeta({})).toBe(false)
    expect(isPlanEditMeta('planEdit')).toBe(false)
  })
})
