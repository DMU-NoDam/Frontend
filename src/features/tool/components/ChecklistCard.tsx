import { useState } from 'react'
import type { FormEvent } from 'react'
import clsx from 'clsx'
import { LuCheck, LuX } from 'react-icons/lu'
import { useChecklist } from '../hooks/use-checklist'
import './ToolCard.css'
import './ChecklistCard.css'

type Props = {
  tripId: string
}

const LABEL_MAX = 30

export function ChecklistCard({ tripId }: Props) {
  const { items, addItem, toggleItem, removeItem } = useChecklist(tripId)
  const [draft, setDraft] = useState('')
  const doneCount = items.filter((item) => item.checked).length

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const label = draft.trim()
    if (!label) return
    addItem(label)
    setDraft('')
  }

  return (
    <section className="tool-card" aria-labelledby="checklist-card-title">
      <div className="checklist-card__header">
        <h2 id="checklist-card-title" className="tool-card__title">체크리스트</h2>
        <span className="checklist-card__progress">
          {doneCount} / {items.length} 완료
        </span>
      </div>

      {items.length === 0 ? (
        <p className="tool-card__status">챙길 준비물을 추가해 보세요.</p>
      ) : (
        <ul className="checklist-card__list">
          {items.map((item) => (
            <li key={item.id} className="checklist-card__item">
              <button
                type="button"
                role="checkbox"
                aria-checked={item.checked}
                className="checklist-card__toggle"
                onClick={() => toggleItem(item.id)}
              >
                <span
                  className={clsx('checklist-card__box', item.checked && 'checklist-card__box--checked')}
                  aria-hidden="true"
                >
                  {item.checked && <LuCheck size={12} strokeWidth={3} />}
                </span>
                <span
                  className={clsx('checklist-card__label', item.checked && 'checklist-card__label--checked')}
                >
                  {item.label}
                </span>
              </button>
              <button
                type="button"
                className="checklist-card__remove"
                aria-label={`${item.label} 삭제`}
                onClick={() => removeItem(item.id)}
              >
                <LuX size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form className="checklist-card__add" onSubmit={handleSubmit}>
        <input
          className="checklist-card__input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={LABEL_MAX}
          placeholder="준비물 입력"
          aria-label="추가할 준비물"
        />
        <button type="submit" className="checklist-card__add-btn" disabled={!draft.trim()}>
          추가
        </button>
      </form>
    </section>
  )
}
