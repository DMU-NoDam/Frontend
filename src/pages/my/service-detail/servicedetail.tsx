import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuChevronLeft } from 'react-icons/lu'
import { PrivacyPolicyModal } from '@/pages/my/privacy-policy/PrivacyPolicyModal'
import { useBrowserChrome } from '@/shared/hooks/use-browser-chrome'
import arubiIcon from '@/assets/Arubi-icon.png'
import './ServiceDetail.css'

const INFO_ROWS = [
  { label: '버전',        value: '1.0.0' },
  { label: '최근 업데이트', value: '2026.04.03' },
  { label: '개발사',       value: 'NODAM' },
]

export function ServiceDetail() {
  useBrowserChrome({ safeTopColor: '#ffffff' })

  const navigate = useNavigate()
  const [privacyOpen, setPrivacyOpen] = useState(false)

  return (
    <main className="sd-page">
      {/* 헤더 */}
      <header className="sd-header">
        <button
          type="button"
          className="sd-header__back"
          onClick={() => navigate(-1)}
          aria-label="뒤로 가기"
        >
          <LuChevronLeft />
        </button>
        <h1 className="sd-header__title">서비스 정보</h1>
        <div className="sd-header__spacer" />
      </header>

      {/* 앱 아이콘 + 이름 */}
      <section className="sd-hero">
        <div className="sd-hero__icon-wrap">
          <img src={arubiIcon} alt="Arubi 앱 아이콘" className="sd-hero__icon" />
        </div>
        <p className="sd-hero__name">ARUBI</p>
        <p className="sd-hero__desc">멋진 앱 서비스</p>
      </section>

      {/* 정보 목록 */}
      <ul className="sd-info">
        {INFO_ROWS.map(({ label, value }) => (
          <li key={label} className="sd-info__row">
            <span className="sd-info__label">{label}</span>
            <span className="sd-info__value">{value}</span>
          </li>
        ))}
        <li className="sd-info__row">
          <span className="sd-info__label">라이선스</span>
          <span className="sd-info__value">내용</span>
        </li>
      </ul>

      <div className="sd-spacer" />

      {/* 푸터 */}
      <footer className="sd-footer">
        <p className="sd-footer__copyright">© 2026 NODAM. All rights reserved.</p>
        <div className="sd-footer__links">
          <button type="button" className="sd-footer__link">이용약관</button>
          <button
            type="button"
            className="sd-footer__link"
            onClick={() => setPrivacyOpen(true)}
          >
            개인정보처리방침
          </button>
        </div>
      </footer>

      <PrivacyPolicyModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </main>
  )
}
