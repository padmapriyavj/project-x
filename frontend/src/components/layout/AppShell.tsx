import { Link, Outlet } from 'react-router'

import { useUiStore } from '@/stores/uiStore'

const navLinkClass =
  'text-secondary hover:text-primary font-medium transition-colors underline-offset-4 hover:underline'

export function AppShell() {
  const { sidebarOpen, toggleSidebar } = useUiStore()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <header className="border-divider bg-surface/80 sticky top-0 z-10 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link
            to="/"
            className="font-heading text-foreground text-xl tracking-tight"
          >
            Deductible
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm">
            <Link to="/login" className={navLinkClass}>
              Log in
            </Link>
            <Link to="/signup" className={navLinkClass}>
              Sign up
            </Link>
            <Link to="/student" className={navLinkClass}>
              Student
            </Link>
            <Link to="/professor" className={navLinkClass}>
              Professor
            </Link>
            <button
              type="button"
              onClick={toggleSidebar}
              className="border-divider text-foreground hover:bg-background rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm transition-colors"
              aria-expanded={sidebarOpen}
            >
              UI store: {sidebarOpen ? 'on' : 'off'}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
