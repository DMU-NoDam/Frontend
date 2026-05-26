import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { LuUser, LuShield, LuInfo, LuChevronRight, LuX, LuChevronLeft } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { useTrips } from '@/features/trip/hooks/use-trips'
import { useAuthStore } from '@/app/store/auth-store'
import { apiClient } from '@/shared/api/client'
import { PrivacyPolicyModal } from './privacy-policy/PrivacyPolicyModal'
import { ProfileEditSheet } from './profile-edit/ProfileEditSheet'
import './MyPage.css'

const stampModules = import.meta.glob('@/assets/Trip-Stamp/*.png', { eager: true }) as Record<string, { default: string }>
const providerModules = import.meta.glob('@/assets/Social-Login/*.png', { eager: true }) as Record<string, { default: string }>

function getStamp(file: string): string {
  return stampModules[`/src/assets/Trip-Stamp/${file}_Stamp.png`]?.default ?? ''
}

function getProvider(provider: string): string {
  return providerModules[`/src/assets/Social-Login/${provider}_login.png`]?.default ?? ''
}

// stamp rotation per position index [left-top, left-bottom, right-top, right-bottom]
const ROTATIONS = [-8, 5, 3, -7]

const COUNTRIES = [
  { code: 'JP', name: '일본',     file: 'Japan',          aliases: ['JP', '일본', 'Japan'] },
  { code: 'US', name: '미국',     file: 'USA',            aliases: ['US', '미국', 'USA', 'United States'] },
  { code: 'FR', name: '프랑스',   file: 'France',         aliases: ['FR', '프랑스', 'France'] },
  { code: 'IT', name: '이탈리아', file: 'Italy',          aliases: ['IT', '이탈리아', 'Italy'] },
  { code: 'ES', name: '스페인',   file: 'Spain',          aliases: ['ES', '스페인', 'Spain'] },
  { code: 'TH', name: '태국',     file: 'Thailand',       aliases: ['TH', '태국', 'Thailand'] },
  { code: 'VN', name: '베트남',   file: 'Vietnam',        aliases: ['VN', '베트남', 'Vietnam'] },
  { code: 'TW', name: '대만',     file: 'Taiwan',         aliases: ['TW', '대만', 'Taiwan'] },
  { code: 'GB', name: '영국',     file: 'United Kingdom', aliases: ['GB', '영국', 'UK', 'United Kingdom'] },
  { code: 'DE', name: '독일',     file: 'Germany',        aliases: ['DE', '독일', 'Germany'] },
  { code: 'AU', name: '호주',     file: 'Australia',      aliases: ['AU', '호주', 'Australia'] },
  { code: 'SG', name: '싱가포르', file: 'Singapore',      aliases: ['SG', '싱가포르', 'Singapore'] },
]

function siteToCode(site: string): string | null {
  const found = COUNTRIES.find((c) =>
    c.aliases.some((a) => a.toLowerCase() === site.toLowerCase())
  )
  return found?.code ?? null
}

function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  )
}

const MENU_ITEMS = [
  { Icon: LuShield, label: '개인정보처리방침', id: 'privacy' },
  { Icon: LuInfo,   label: '서비스 정보',     id: 'info'    },
]

const STAMP_PAGES = chunk(COUNTRIES, 4)

export function MyPage() {
  const { data: trips = [] } = useTrips()
  const [passportOpen, setPassportOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [privacyOpen, setPrivacyOpen] = useState(false)
  const [profileEditOpen, setProfileEditOpen] = useState(false)

  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const user = useAuthStore((s) => s.user)

  const today = new Date().toISOString().slice(0, 10)
  const pastTrips   = trips.filter((t) => t.endDate < today)
  const upcoming    = trips.filter((t) => t.startDate > today)
  const earnedCodes = new Set(
    pastTrips.map((t) => siteToCode(t.name)).filter(Boolean) as string[]
  )

  function openPassport() { setPage(0); setPassportOpen(true) }
  function closePassport() { setPassportOpen(false) }

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  async function handleWithdraw() {
    setWithdrawing(true)
    try {
      await apiClient.delete('/user/api')
    } catch {
      // 계정 삭제 실패해도 클라이언트 상태는 초기화
    } finally {
      logout()
      navigate('/login', { replace: true })
    }
  }

  return (
    <main className="my-page">
      <div className="my-page__scroll">
      {/* ── 프로필 ── */}
      <section className="my-profile">
        <div className="my-profile__info">
          <h1 className="my-profile__name">{user?.name ?? '여행자'}</h1>
          <div className="my-profile__email-row">
            {user?.provider && getProvider(user.provider) && (
              <img
                src={getProvider(user.provider)}
                alt={user.provider}
                className="my-profile__provider-img"
              />
            )}
            <span className="my-profile__email">{user?.email ?? ''}</span>
          </div>
        </div>
        <button
          type="button"
          className="my-profile__avatar"
          onClick={() => setProfileEditOpen(true)}
          aria-label="프로필 편집"
        >
          <LuUser className="my-profile__avatar-icon" />
        </button>
      </section>

      {/* ── 여행 통계 카드 ── */}
      <section className="my-stats" aria-label="여행 통계">
        <div className="my-stats__row">
          <div className="my-stats__card my-stats__card--upcoming">
            <span className="my-stats__card-value">{upcoming.length}</span>
            <span className="my-stats__card-label">예정된 여행</span>
          </div>
          <div className="my-stats__card my-stats__card--past">
            <span className="my-stats__card-value">{pastTrips.length}</span>
            <span className="my-stats__card-label">다녀온 여행</span>
          </div>
        </div>

        {/* ── 여권 카드 ── */}
        <motion.button
          type="button"
          className="my-passport"
          onClick={openPassport}
          whileTap={{ scale: 0.97 }}
        >
          <div className="my-passport__left">
            <p className="my-passport__country">REPUBLIC OF KOREA</p>
            <p className="my-passport__title">여행도장 확인</p>
            <p className="my-passport__sub">{earnedCodes.size} / {COUNTRIES.length} 스탬프 획득</p>
          </div>
          <div className="my-passport__emblem" aria-hidden="true">
            <span className="my-passport__book">📔</span>
          </div>
        </motion.button>
      </section>

      {/* ── 메뉴 ── */}
      <nav className="my-menu" aria-label="마이페이지 메뉴">
        {MENU_ITEMS.map(({ Icon, label, id }) => (
          <button
            key={id}
            type="button"
            className="my-menu__item"
            onClick={
              id === 'privacy' ? () => setPrivacyOpen(true)
              : id === 'info'  ? () => navigate('/mypage/service')
              : undefined
            }
          >
            <Icon className="my-menu__icon" aria-hidden="true" />
            <span className="my-menu__label">{label}</span>
            <LuChevronRight className="my-menu__arrow" aria-hidden="true" />
          </button>
        ))}
      </nav>
        <div className="my-spacer" />
        <div className="my-bottom-actions">
          <button type="button" className="my-logout" onClick={handleLogout}>LOGOUT</button>
          <button type="button" className="my-withdraw" onClick={() => setWithdrawOpen(true)}>회원 탈퇴</button>
        </div>
      </div>

      <TabBar />

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
      <ProfileEditSheet open={profileEditOpen} onClose={() => setProfileEditOpen(false)} />

      {/* ── 회원 탈퇴 확인 모달 ── */}
      <AnimatePresence>
        {withdrawOpen && (
          <>
            <motion.div
              className="passport-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !withdrawing && setWithdrawOpen(false)}
            />
            <motion.div
              className="withdraw-modal"
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            >
              <p className="withdraw-modal__title">정말 탈퇴하시겠어요?</p>
              <p className="withdraw-modal__desc">탈퇴하면 모든 여행 데이터가 삭제되며 복구할 수 없습니다.</p>
              <div className="withdraw-modal__actions">
                <button
                  type="button"
                  className="withdraw-modal__cancel"
                  onClick={() => setWithdrawOpen(false)}
                  disabled={withdrawing}
                >
                  취소
                </button>
                <button
                  type="button"
                  className="withdraw-modal__confirm"
                  onClick={handleWithdraw}
                  disabled={withdrawing}
                >
                  {withdrawing ? '처리 중…' : '탈퇴하기'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 여권 오버레이 ── */}
      <AnimatePresence>
        {passportOpen && (
          <>
            {/* 반투명 backdrop */}
            <motion.div
              className="passport-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closePassport}
            />

            {/* 펼쳐진 여권 책 */}
            <motion.div
              className="passport-book"
              initial={{ opacity: 0, scale: 0.88, y: 20 }}
              animate={{ opacity: 1, scale: 1,  y: 0  }}
              exit={{ opacity: 0, scale: 0.88, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            >
              {/* 헤더 (책 표지 띠) */}
              <div className="passport-book__header">
                <div>
                  <p className="passport-book__country">REPUBLIC OF KOREA</p>
                  <p className="passport-book__title">여행 도장</p>
                </div>
                <button
                  type="button"
                  className="passport-close"
                  onClick={closePassport}
                  aria-label="여권 닫기"
                >
                  <LuX />
                </button>
              </div>

              {/* 펼친 두 페이지 */}
              <div className="passport-spread">
                {/* 왼쪽 페이지 */}
                <div className="passport-page passport-page--left">
                  {STAMP_PAGES[page].slice(0, 2).map(({ code, name, file }, i) => {
                    const earned = earnedCodes.has(code)
                    return (
                      <div
                        key={code}
                        className={`passport-stamp${earned ? ' passport-stamp--earned' : ''}`}
                        style={{ transform: `rotate(${ROTATIONS[i]}deg)` }}
                      >
                        <img
                          src={getStamp(file)}
                          alt={name}
                          className="passport-stamp__img"
                        />
                      </div>
                    )
                  })}
                </div>

                {/* 중철 선 */}
                <div className="passport-spine" aria-hidden="true" />

                {/* 오른쪽 페이지 */}
                <div className="passport-page passport-page--right">
                  {STAMP_PAGES[page].slice(2, 4).map(({ code, name, file }, i) => {
                    const earned = earnedCodes.has(code)
                    return (
                      <div
                        key={code}
                        className={`passport-stamp${earned ? ' passport-stamp--earned' : ''}`}
                        style={{ transform: `rotate(${ROTATIONS[i + 2]}deg)` }}
                      >
                        <img
                          src={getStamp(file)}
                          alt={name}
                          className="passport-stamp__img"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 페이지 네비게이션 */}
              <div className="passport-nav">
                <button
                  type="button"
                  className="passport-nav__arrow"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  aria-label="이전 페이지"
                >
                  <LuChevronLeft />
                </button>
                <div className="passport-nav__dots">
                  {STAMP_PAGES.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`passport-nav__dot${i === page ? ' passport-nav__dot--active' : ''}`}
                      onClick={() => setPage(i)}
                      aria-label={`${i + 1}페이지`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="passport-nav__arrow"
                  onClick={() => setPage((p) => Math.min(STAMP_PAGES.length - 1, p + 1))}
                  disabled={page === STAMP_PAGES.length - 1}
                  aria-label="다음 페이지"
                >
                  <LuChevronRight />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  )
}
