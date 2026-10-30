import { useState } from 'react'
import { useMemos } from '../hooks/use-memos'
import { getMemoIconImage } from '../lib/memo-icon'
import type { Memo } from '../types/tool-types'
import { MemoEditorSheet } from './MemoEditorSheet'
import './ToolCard.css'
import './MemoCard.css'

type Props = {
  tripId: string
}

export function MemoCard({ tripId }: Props) {
  const { data: memos = [], isLoading, isError } = useMemos(tripId)
  // null = 닫힘, 'new' = 새 메모, Memo = 수정
  const [editing, setEditing] = useState<Memo | 'new' | null>(null)

  return (
    <section className="tool-card" aria-labelledby="memo-card-title">
      <h2 id="memo-card-title" className="tool-card__title">메모장</h2>

      {isLoading ? (
        <p className="tool-card__status">메모를 불러오는 중...</p>
      ) : isError ? (
        <p className="tool-card__status">메모를 불러오지 못했어요.</p>
      ) : memos.length === 0 ? (
        <p className="tool-card__status">호텔 예약 번호, 픽업 정보처럼 기억할 내용을 적어두세요.</p>
      ) : (
        <ul className="memo-card__list">
          {memos.map((memo) => (
            <li key={memo.id}>
              <button
                type="button"
                className="tool-card__panel memo-card__item"
                onClick={() => setEditing(memo)}
                aria-label={`${memo.title} 메모 수정`}
              >
                <span className="memo-card__icon" aria-hidden="true">
                  <img src={getMemoIconImage(memo.icon)} alt="" />
                </span>
                <span className="memo-card__text">
                  <span className="memo-card__title">{memo.title}</span>
                  {memo.content && <span className="memo-card__content">{memo.content}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" className="tool-card__add" onClick={() => setEditing('new')}>
        + 메모 추가하기
      </button>

      {editing && (
        <MemoEditorSheet
          tripId={tripId}
          memo={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
