import { Link, Outlet } from 'react-router'

import { useAuthStore } from '@/stores/authStore'

const navLinkClass =
  'text-secondary hover:text-primary font-medium transition-colors underline-offset-4 hover:underline'

export function AppShell() {
  const token = useAuthStore((s) => s.token)
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

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
          <nav className="flex flex-wrap items-center justify-end gap-4 text-sm">
            {token && user ? (
              <>
                <span className="text-foreground/80 hidden sm:inline">
                  {user.display_name ?? user.email}
                </span>
                {user.role === 'student' ? (
                  <Link to="/student" className={navLinkClass}>
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/professor" className={navLinkClass}>
                    Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => clearAuth()}
                  className="text-danger hover:text-danger/90 font-medium underline-offset-4 hover:underline"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={navLinkClass}>
                  Log in
                </Link>
                <Link to="/signup" className={navLinkClass}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
