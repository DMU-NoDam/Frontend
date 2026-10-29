import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'
import { LuTrash2, LuX } from 'react-icons/lu'
import { useCreateMemo, useDeleteMemo, useUpdateMemo } from '../hooks/use-memos'
import { MEMO_ICONS } from '../lib/memo-icon'
import type { Memo, MemoIconType } from '../types/tool-types'
import './MemoEditorSheet.css'

type Props = {
  tripId: string
  // null이면 새 메모
  memo: Memo | null
  onClose: () => void
}

// 백엔드 MemoCreateRequestDto 제약과 맞춘다
const TITLE_MAX = 50
const CONTENT_MAX = 2000

// 화면 가운데 뜨는 메모 작성/수정 팝업
export function MemoEditorSheet({ tripId, memo, onClose }: Props) {
  const [icon, setIcon] = useState<MemoIconType>(memo?.icon ?? 'ETC')
  const [title, setTitle] = useState(memo?.title ?? '')
  const [content, setContent] = useState(memo?.content ?? '')
  // 삭제는 되돌릴 수 없으므로 한 번 더 확인받는다
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const titleId = useId()
  const contentId = useId()

  const createMutation = useCreateMemo(tripId)
  const updateMutation = useUpdateMemo(tripId)
  const deleteMutation = useDeleteMemo(tripId)

  const isSaving = createMutation.isPending || updateMutation.isPending
  const isBusy = isSaving || deleteMutation.isPending
  const isError = createMutation.isError || updateMutation.isError || deleteMutation.isError

  // Esc로 닫기
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isBusy) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isBusy, onClose])

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
        tabIndex={-1}
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
        <header className="memo-editor__header">
          <h2 id="memo-editor-title" className="memo-editor__title">
            {memo ? '메모 수정' : '새 메모'}
          </h2>
          <button
            type="button"
            className="memo-editor__close"
            aria-label="닫기"
            onClick={handleClose}
            disabled={isBusy}
          >
            <LuX aria-hidden="true" />
          </button>
        </header>

        <fieldset className="memo-editor__section">
          <legend className="memo-editor__label">종류</legend>
          <div className="memo-editor__icons">
            {MEMO_ICONS.map(({ type, Icon, label }) => (
              <label
                key={type}
                className={clsx('memo-editor__icon', icon === type && 'memo-editor__icon--active')}
              >
                <input
                  type="radio"
                  name="memo-icon"
                  value={type}
                  className="memo-editor__radio"
                  checked={icon === type}
                  onChange={() => setIcon(type)}
                  disabled={isBusy}
                />
                <Icon className="memo-editor__icon-svg" aria-hidden="true" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="memo-editor__section">
          <div className="memo-editor__label-row">
            <label htmlFor={titleId} className="memo-editor__label">
              제목
            </label>
            <span
              className={clsx('memo-editor__count', title.length >= TITLE_MAX && 'memo-editor__count--full')}
            >
              {title.length}/{TITLE_MAX}
            </span>
          </div>
          <input
            id={titleId}
            className="memo-editor__input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={TITLE_MAX}
            placeholder="예: 호텔 체크인"
            disabled={isBusy}
            required
            // 새 메모는 바로 입력할 수 있게, 수정은 키보드가 갑자기 올라오지 않게
            autoFocus={!memo}
          />
        </div>

        <div className="memo-editor__section">
          <div className="memo-editor__label-row">
            <label htmlFor={contentId} className="memo-editor__label">
              내용
            </label>
            <span
              className={clsx('memo-editor__count', content.length >= CONTENT_MAX && 'memo-editor__count--full')}
            >
              {content.length}/{CONTENT_MAX}
            </span>
          </div>
          <textarea
            id={contentId}
            className="memo-editor__textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={CONTENT_MAX}
            placeholder="예: 체크인 번호 3458208629"
            rows={4}
            disabled={isBusy}
          />
        </div>

        {isError && (
          <p className="memo-editor__error" role="alert">
            저장하지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        )}

        {confirmingDelete ? (
          <div className="memo-editor__confirm">
            <p>이 메모를 삭제할까요? 삭제하면 되돌릴 수 없어요.</p>
            <div className="memo-editor__actions">
              <button
                type="button"
                className="memo-editor__secondary"
                onClick={() => setConfirmingDelete(false)}
                disabled={isBusy}
              >
                취소
              </button>
              <button type="button" className="memo-editor__danger" onClick={handleDelete} disabled={isBusy}>
                {deleteMutation.isPending ? '삭제 중...' : '삭제'}
              </button>
            </div>
          </div>
        ) : (
          <div className="memo-editor__actions">
            {memo && (
              <button
                type="button"
                className="memo-editor__delete"
                aria-label="메모 삭제"
                onClick={() => setConfirmingDelete(true)}
                disabled={isBusy}
              >
                <LuTrash2 aria-hidden="true" />
              </button>
            )}
            <button type="submit" className="memo-editor__primary" disabled={isBusy || !title.trim()}>
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
      </form>
    </div>,
    document.body,
  )
}
