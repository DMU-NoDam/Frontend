import { useNavigate } from 'react-router-dom'
import { LuSparkles } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import { TravelHero } from './TravelHero'
import './DashboardPage.css'

export function GuestDashboard() {
  const navigate = useNavigate()

  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-header__badge">✈️ 나만의 여행을 계획해보세요</span>
      </header>

      <div className="home-feed">
        <div className="home-map">
          <TravelHero />
        </div>

        <section
          className="home-trips"
          aria-label="시작하기"
          style={{ height: '60%' }}
        >
          <div className="home-trips__handle-btn" style={{ cursor: 'default', pointerEvents: 'none' }} aria-hidden="true">
            <div className="home-trips__handle" />
          </div>

          <div className="home-trips__hero">
            <h2 className="home-trips__empty-title">
              AI 여행 플래너<br />시작하기
            </h2>
            <button
              type="button"
              className="home-trips__make-btn"
              onClick={() => navigate('/trips/create')}
            >
              <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
              나만의 일정 만들기
            </button>
            <button
              type="button"
              className="home-trips__login-btn"
              onClick={() => navigate('/login')}
            >
              로그인
            </button>
          </div>
        </section>
      </div>

      <TabBar />
    </main>
  )
}
