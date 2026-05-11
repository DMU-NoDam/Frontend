import { LuSparkles } from 'react-icons/lu'
import { TabBar } from '@/shared/ui/tab-bar/TabBar'
import './DashboardPage.css'

// TODO: Export from Figma (node 2333:1511) and move to src/assets/home-illustration.png
const MAP_ILLUSTRATION = 'https://www.figma.com/api/mcp/asset/8dffae04-6aed-437a-9820-640ede3d170e'

export function DashboardPage() {
  return (
    <main className="home-page">
      <header className="home-header">
        <span className="home-header__badge">🗓️ 일정을 확정해주세요</span>
      </header>

      <div className="home-feed">
        <div className="home-map" aria-hidden="true">
          <img className="home-map__image" src={MAP_ILLUSTRATION} alt="" />
        </div>

        <section className="home-trips" aria-label="내 여행">
          <div className="home-trips__handle" aria-hidden="true" />
          <div className="home-trips__empty">
            <h2 className="home-trips__empty-title">
              AI 여행 플래너<br />시작하기
            </h2>
            <button type="button" className="home-trips__make-btn">
              <LuSparkles className="home-trips__make-icon" aria-hidden="true" />
              나만의 일정 만들기
            </button>
          </div>
        </section>
      </div>

      <TabBar />
    </main>
  )
}
