import type { IconType } from 'react-icons'
import { useLocation, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { RiHomeFill } from 'react-icons/ri'
import { LuPlane, LuUser } from 'react-icons/lu'
import './TabBar.css'

type Tab = {
  path: string
  label: string
  Icon: IconType
}

const TABS: Tab[] = [
  { path: '/dashboard', label: '홈', Icon: RiHomeFill },
  { path: '/triplist', label: '여행', Icon: LuPlane },
  { path: '/mypage', label: '마이', Icon: LuUser },
]

export function TabBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()

  return (
    <nav className="tab-bar" aria-label="메인 메뉴">
      {TABS.map(({ path, label, Icon }) => {
        const isActive = pathname === path || pathname.startsWith(path + '/')
        return (
          <button
            key={path}
            type="button"
            className={clsx('tab-bar__tab', isActive && 'tab-bar__tab--active')}
            onClick={() => navigate(path)}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon className="tab-bar__icon" aria-hidden="true" />
            <span className="tab-bar__label">{label}</span>
          </button>
        )
      })}
    </nav>
  )
}
