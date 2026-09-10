import { useState } from 'react'
import { useCurrentUserId } from '@/features/auth/hooks/use-current-user-id'
import { useTripMembers } from '../hooks/use-trip-members'
import { useDeleteTrip } from '../hooks/use-delete-trip'
import { useLeaveTrip } from '../hooks/use-leave-trip'
import { useInvitationLink } from '../hooks/use-invitation-link'
import './TripManageSheet.css'

type Props = {
  tripId: string
  onClose: () => void
}

type Mode = 'menu' | 'confirm-delete' | 'confirm-leave' | 'delegate'

const ROLE_LABEL = { OWNER: '소유자', MEMBER: '멤버' } as const

export function TripManageSheet({ tripId, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('menu')
  const [notice, setNotice] = useState<string | null>(null)
  const [newOwnerUserId, setNewOwnerUserId] = useState<number | null>(null)

  const currentUserId = useCurrentUserId()
  const { data: members = [], isLoading, isError } = useTripMembers(tripId)
  const deleteMutation = useDeleteTrip()
  const leaveMutation = useLeaveTrip()
  const linkMutation = useInvitationLink()

  const isBusy = deleteMutation.isPending || leaveMutation.isPending || linkMutation.isPending

  // 내 역할은 멤버 목록 + 내 userId가 모두 있어야 판별된다.
  // 확정 전에는 삭제/나가기 같은 되돌릴 수 없는 동작을 노출하지 않는다
  // (특히 혼자인 OWNER의 "나가기"는 백엔드에서 여행 삭제로 처리된다).
  const myRole = currentUserId == null
    ? undefined
    : members.find((m) => m.userId === currentUserId)?.role
  const isRoleResolved = !isLoading && myRole !== undefined
  const isOwner = myRole === 'OWNER'
  const otherMembers = members.filter((m) => m.userId !== currentUserId)

  const showNotice = (message: string) => {
    setNotice(message)
    setTimeout(() => setNotice(null), 3000)
  }

  const handleClose = () => {
    if (isBusy) return
    onClose()
  }

  const backToMenu = () => {
    if (isBusy) return
    leaveMutation.reset()
    deleteMutation.reset()
    setNewOwnerUserId(null)
    setMode('menu')
  }

  const handleCreateInvitation = () => {
    linkMutation.mutate(tripId, {
      onSuccess: (token) => {
        const url = `${window.location.origin}/invitations/${token}`
        void navigator.clipboard.writeText(url)
        showNotice('초대 링크가 복사되었습니다')
      },
      onError: () => showNotice('초대 링크 생성에 실패했습니다'),
    })
  }

  const handleLeave = () => {
    leaveMutation.mutate({ tripId })
  }

  const handleDelegateAndLeave = () => {
    if (newOwnerUserId == null) return
    leaveMutation.mutate({ tripId, newOwnerUserId })
  }

  const roleHint = () => {
    if (isLoading) return '멤버 정보를 불러오는 중...'
    if (isError) return '멤버 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
    return '내 계정 정보를 확인할 수 없어 여행 관리 기능을 사용할 수 없습니다.'
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
        {mode === 'menu' && (
          <>
            <p id="trip-manage-title" className="trip-manage__title">여행 관리</p>

            <div className="trip-manage__members">
              {members.map((member) => (
                <div className="trip-manage__member" key={member.userId}>
                  <span className="trip-manage__member-id">
                    사용자 #{member.userId}
                    {member.userId === currentUserId && (
                      <span className="trip-manage__member-me"> (나)</span>
                    )}
                  </span>
                  <span className="trip-manage__member-role">{ROLE_LABEL[member.role]}</span>
                </div>
              ))}
            </div>

            {!isRoleResolved && <p className="trip-manage__hint">{roleHint()}</p>}
            {notice && <p className="trip-manage__notice">{notice}</p>}

            <div className="trip-manage__actions">
              {isRoleResolved && isOwner && (
                <>
                  <button
                    type="button"
                    className="trip-manage__action"
                    onClick={handleCreateInvitation}
                    disabled={isBusy}
                  >
                    {linkMutation.isPending ? '링크 생성 중...' : '초대 링크 만들기'}
                  </button>

                  {otherMembers.length > 0 && (
                    <button
                      type="button"
                      className="trip-manage__action"
                      onClick={() => setMode('delegate')}
                      disabled={isBusy}
                    >
                      소유자 넘기고 나가기
                    </button>
                  )}

                  <button
                    type="button"
                    className="trip-manage__action trip-manage__action--danger"
                    onClick={() => setMode('confirm-delete')}
                    disabled={isBusy}
                  >
                    여행 삭제
                  </button>
                </>
              )}

              {isRoleResolved && !isOwner && (
                <button
                  type="button"
                  className="trip-manage__action trip-manage__action--danger"
                  onClick={() => setMode('confirm-leave')}
                  disabled={isBusy}
                >
                  여행 나가기
                </button>
              )}

              <button type="button" className="trip-manage__cancel" onClick={handleClose} disabled={isBusy}>
                닫기
              </button>
            </div>
          </>
        )}

        {mode === 'confirm-leave' && (
          <>
            <p id="trip-manage-title" className="trip-manage__title">이 여행에서 나갈까요?</p>
            <p className="trip-manage__hint">
              나가면 이 여행의 일정을 더 이상 볼 수 없습니다. 초대 링크로 다시 참여할 수 있습니다.
            </p>

            {leaveMutation.isError && (
              <p className="trip-manage__error">나가기에 실패했습니다. 다시 시도해 주세요.</p>
            )}

            <div className="trip-manage__actions">
              <button
                type="button"
                className="trip-manage__action trip-manage__action--danger"
                onClick={handleLeave}
                disabled={isBusy}
              >
                {leaveMutation.isPending ? '나가는 중...' : '나가기'}
              </button>
              <button type="button" className="trip-manage__cancel" onClick={backToMenu} disabled={isBusy}>
                취소
              </button>
            </div>
          </>
        )}

        {mode === 'delegate' && (
          <>
            <p id="trip-manage-title" className="trip-manage__title">소유자를 넘길 멤버를 선택해 주세요</p>
            <p className="trip-manage__hint">
              선택한 멤버가 새 소유자가 되고, 나는 이 여행에서 나갑니다.
            </p>

            <div className="trip-manage__members">
              {otherMembers.map((member) => (
                <label
                  className="trip-manage__member trip-manage__member--selectable"
                  key={member.userId}
                >
                  <span className="trip-manage__member-id">
                    <input
                      type="radio"
                      name="new-owner"
                      value={member.userId}
                      checked={newOwnerUserId === member.userId}
                      onChange={() => setNewOwnerUserId(member.userId)}
                      disabled={isBusy}
                    />
                    사용자 #{member.userId}
                  </span>
                  <span className="trip-manage__member-role">{ROLE_LABEL[member.role]}</span>
                </label>
              ))}
            </div>

            {leaveMutation.isError && (
              <p className="trip-manage__error">소유자 위임에 실패했습니다. 다시 시도해 주세요.</p>
            )}

            <div className="trip-manage__actions">
              <button
                type="button"
                className="trip-manage__action trip-manage__action--danger"
                onClick={handleDelegateAndLeave}
                disabled={isBusy || newOwnerUserId == null}
              >
                {leaveMutation.isPending ? '나가는 중...' : '넘기고 나가기'}
              </button>
              <button type="button" className="trip-manage__cancel" onClick={backToMenu} disabled={isBusy}>
                취소
              </button>
            </div>
          </>
        )}

        {mode === 'confirm-delete' && (
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
                onClick={backToMenu}
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
