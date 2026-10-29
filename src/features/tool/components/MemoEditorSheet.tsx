import { useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { useCreateMemo, useDeleteMemo, useUpdateMemo } from '../hooks/use-memos'
import { MEMO_ICONS } from '../lib/memo-icon'
import type { Memo, MemoIconType } from '../types/tool-types'
import './MemoCard.css'

type Props = {
  tripId: string
  // null이면 새 메모
  memo: Memo | null
  onClose: () => void
}

// 백엔드 MemoCreateRequestDto 제약과 맞춘다
const TITLE_MAX = 50
const CONTENT_MAX = 2000

export function MemoEditorSheet({ tripId, memo, onClose }: Props) {
  const [icon, setIcon] = useState<MemoIconType>(memo?.icon ?? 'ETC')
  const [title, setTitle] = useState(memo?.title ?? '')
  const [content, setContent] = useState(memo?.content ?? '')

  const createMutation = useCreateMemo(tripId)
  const updateMutation = useUpdateMemo(tripId)
  const deleteMutation = useDeleteMemo(tripId)

  const isBusy = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending
  const isError = createMutation.isError || updateMutation.isError || deleteMutation.isError

  const handleClose = () => {
    if (isBusy) return
    onClose()
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const request = { icon, title: title.trim(), content: content.trim() }
    if (!request.title) return

    if (memo) {
      updateMutation.mutate({ memoId: memo.id, request }, { onSuccess: onClose })
    } else {
      createMutation.mutate(request, { onSuccess: onClose })
    }
  }

  const handleDelete = () => {
    if (!memo) return
    deleteMutation.mutate(memo.id, { onSuccess: onClose })
  }

  // 시트(TripMapSheet) 안에서 열리지만 화면 전체를 덮어야 하므로 body로 띄운다.
  // React 이벤트는 포털이어도 부모 컴포넌트로 전파되므로, 시트의 드래그 핸들러가
  // 팝업 안의 포인터 입력을 가로채지 않게 막는다.
  return createPortal(
    <div onPointerDown={(event) => event.stopPropagation()}>
      <button
        type="button"
        className="memo-editor__backdrop"
        aria-label="메모 창 닫기"
        onClick={handleClose}
        disabled={isBusy}
      />
      <form
        className="memo-editor"
        role="dialog"
        aria-modal="true"
        aria-labelledby="memo-editor-title"
        onSubmit={handleSubmit}
      >
        <p id="memo-editor-title" className="memo-editor__title">
          {memo ? '메모 수정' : '새 메모'}
        </p>

        <div className="memo-editor__icons" role="radiogroup" aria-label="메모 아이콘">
          {MEMO_ICONS.map((option) => (
            <button
              key={option.type}
              type="button"
              role="radio"
              aria-checked={icon === option.type}
              className={clsx('memo-editor__icon', icon === option.type && 'memo-editor__icon--active')}
              onClick={() => setIcon(option.type)}
              disabled={isBusy}
            >
              <option.Icon aria-hidden="true" />
              <span className="memo-editor__icon-label">{option.label}</span>
            </button>
          ))}
        </div>

        <label className="memo-editor__field">
          <span>제목</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX}
            placeholder="예: 호텔 체크인"
            disabled={isBusy}
            required
            autoFocus
          />
        </label>

        <label className="memo-editor__field">
          <span>내용</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={CONTENT_MAX}
            placeholder="예: 체크인 번호 3458208629"
            rows={4}
            disabled={isBusy}
          />
        </label>

        {isError && <p className="memo-editor__error">저장하지 못했어요. 다시 시도해 주세요.</p>}

        <div className="memo-editor__actions">
          <button
            type="submit"
            className="memo-editor__submit"
            disabled={isBusy || !title.trim()}
          >
            {createMutation.isPending || updateMutation.isPending ? '저장 중...' : '저장'}
          </button>
          {memo && (
            <button
              type="button"
              className="memo-editor__delete"
              onClick={handleDelete}
              disabled={isBusy}
            >
              {deleteMutation.isPending ? '삭제 중...' : '삭제'}
            </button>
          )}
          <button type="button" className="memo-editor__cancel" onClick={handleClose} disabled={isBusy}>
            취소
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
