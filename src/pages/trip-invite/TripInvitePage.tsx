import { useNavigate, useParams } from 'react-router-dom'
import { useAuthStore } from '@/app/store/auth-store'
import { useInvitationPreview } from '@/features/trip/hooks/use-invitation-preview'
import { useJoinInvitation } from '@/features/trip/hooks/use-join-invitation'
import './TripInvitePage.css'

export function TripInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const { data: preview, isLoading, isError } = useInvitationPreview(token)
  const joinMutation = useJoinInvitation()

  const handleJoin = () => {
    if (!token) return

    if (!isAuthenticated) {
      sessionStorage.setItem('pending_redirect', `/invitations/${token}`)
      navigate('/login')
      return
    }

    joinMutation.mutate(token, {
      onSuccess: () => navigate('/trips'),
    })
  }

  return (
    <main className="invite-page">
      <section className="invite-shell">
        {isLoading && <p className="invite-message">초대 정보를 불러오는 중...</p>}

        {isError && <p className="invite-message invite-message--error">초대 링크를 찾을 수 없어요.</p>}

        {preview && (
          <>
            <h1 className="invite-title">{preview.tripName}</h1>
            <p className="invite-dates">{preview.startDate} - {preview.endDate}</p>
            <p className="invite-hint">이 여행에 함께할까요?</p>

            {joinMutation.isError && (
              <p className="invite-message invite-message--error">참여에 실패했습니다. 다시 시도해 주세요.</p>
            )}

            <button
              type="button"
              className="invite-join-btn"
              onClick={handleJoin}
              disabled={joinMutation.isPending}
            >
              {joinMutation.isPending ? '참여하는 중...' : '참여하기'}
            </button>
          </>
        )}
      </section>
    </main>
  )
}
