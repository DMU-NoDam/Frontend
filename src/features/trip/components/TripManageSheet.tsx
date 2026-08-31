import { useState } from 'react'
import { useAuthStore } from '@/app/store/auth-store'
import { useTripMembers } from '../hooks/use-trip-members'
import { useDeleteTrip } from '../hooks/use-delete-trip'
import { useLeaveTrip } from '../hooks/use-leave-trip'
import { useInvitationLink } from '../hooks/use-invitation-link'
import './TripManageSheet.css'

type Props = {
  tripId: string
  onClose: () => void
}

const ROLE_LABEL = { OWNER: '소유자', MEMBER: '멤버' } as const

export function TripManageSheet({ tripId, onClose }: Props) {
  const [mode, setMode] = useState<'menu' | 'confirm-delete'>('menu')
  const [notice, setNotice] = useState<string | null>(null)

  const currentUserId = useAuthStore((s) => s.user?.id)
  const { data: members = [], isLoading } = useTripMembers(tripId)
  const deleteMutation = useDeleteTrip()
  const leaveMutation = useLeaveTrip()
  const linkMutation = useInvitationLink()

  const isBusy = deleteMutation.isPending || leaveMutation.isPending || linkMutation.isPending
  const isOwner = members.find((m) => m.userId === currentUserId)?.role === 'OWNER'

  const handleClose = () => {
    if (isBusy) return
    onClose()
  }

  const handleCreateInvitation = () => {
    linkMutation.mutate(tripId, {
      onSuccess: (token) => {
        const url = `${window.location.origin}/invitations/${token}`
        void navigator.clipboard.writeText(url)
        setNotice('초대 링크가 복사되었습니다')
        setTimeout(() => setNotice(null), 3000)
      },
      onError: () => {
        setNotice('초대 링크 생성에 실패했습니다')
        setTimeout(() => setNotice(null), 3000)
      },
    })
  }

  const handleLeave = () => {
    leaveMutation.mutate({ tripId })
  }

  return (
    <>
      <button
        type="button"
        className="trip-manage__backdrop"
        aria-label="여행 관리 팝업 닫기"
        onClick={handleClose}
        disabled={isBusy}
      />
      <section className="trip-manage" role="dialog" aria-modal="true" aria-labelledby="trip-manage-title">
        {mode === 'menu' ? (
          <>
            <p id="trip-manage-title" className="trip-manage__title">여행 관리</p>

            <div className="trip-manage__members">
              {isLoading && <p className="trip-manage__hint">멤버 정보를 불러오는 중...</p>}
              {!isLoading && members.map((member) => (
                <div className="trip-manage__member" key={member.userId}>
                  <span className="trip-manage__member-id">사용자 #{member.userId}</span>
                  <span className="trip-manage__member-role">{ROLE_LABEL[member.role]}</span>
                </div>
              ))}
            </div>

            {notice && <p className="trip-manage__notice">{notice}</p>}

            <div className="trip-manage__actions">
              <button
                type="button"
                className="trip-manage__action"
                onClick={handleCreateInvitation}
                disabled={isBusy}
              >
                {linkMutation.isPending ? '링크 생성 중...' : '초대 링크 만들기'}
              </button>

              {isOwner ? (
                <button
                  type="button"
                  className="trip-manage__action trip-manage__action--danger"
                  onClick={() => setMode('confirm-delete')}
                  disabled={isBusy}
                >
                  여행 삭제
                </button>
              ) : (
                <button
                  type="button"
                  className="trip-manage__action trip-manage__action--danger"
                  onClick={handleLeave}
                  disabled={isBusy}
                >
                  {leaveMutation.isPending ? '나가는 중...' : '여행 나가기'}
                </button>
              )}

              <button type="button" className="trip-manage__cancel" onClick={handleClose} disabled={isBusy}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <p id="trip-manage-title" className="trip-manage__title">이 여행을 삭제할까요?</p>
            <p className="trip-manage__hint">멤버, 초대, 모든 일정이 함께 삭제되며 되돌릴 수 없습니다.</p>

            {deleteMutation.isError && (
              <p className="trip-manage__error">삭제에 실패했습니다. 다시 시도해 주세요.</p>
            )}

            <div className="trip-manage__actions">
              <button
                type="button"
                className="trip-manage__action trip-manage__action--danger"
                onClick={() => deleteMutation.mutate(tripId)}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? '삭제 중...' : '삭제하기'}
              </button>
              <button
                type="button"
                className="trip-manage__cancel"
                onClick={() => setMode('menu')}
                disabled={deleteMutation.isPending}
              >
                취소
              </button>
            </div>
          </>
        )}
      </section>
    </>
  )
}
