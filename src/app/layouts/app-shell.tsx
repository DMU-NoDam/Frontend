import type { ReactNode } from 'react'
import './app-shell.css'

type AppShellProps = {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell-background">
      <div className="app-shell-frame">{children}</div>
    </div>
  )
}
