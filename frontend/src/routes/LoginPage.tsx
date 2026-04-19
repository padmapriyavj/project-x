import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { loginRequest } from '@/lib/authApi'
import { useAuthStore } from '@/stores/authStore'

const inputClass =
  'border-divider bg-surface text-foreground focus:border-primary focus:ring-primary/30 w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm outline-none focus:ring-2'

export function LoginPage() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const login = useMutation({
    mutationFn: () => loginRequest({ email, password }),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
      const fallback = data.user.role === 'professor' ? '/professor' : '/student'
      const target =
        from && from !== '/login' && from !== '/signup' ? from : fallback
      navigate(target, { replace: true })
    },
  })

  if (token && role) {
    return <Navigate to={role === 'professor' ? '/professor' : '/student'} replace />
  }

  return (
    <section className="bg-surface shadow-soft rounded-[var(--radius-lg)] border-divider/60 mx-auto max-w-md border p-8 text-left">
      <h1 className="mb-1 text-2xl">Log in</h1>
      <p className="text-foreground/70 mb-6 text-sm">
        Mock mode: use password at least 4 characters. Include{' '}
        <span className="font-mono text-xs">professor</span> in your email to
        land on the professor dashboard.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          login.mutate()
        }}
      >
        <div>
          <label htmlFor="login-email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="login-password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>
        {login.isError ? (
          <p className="text-danger text-sm" role="alert">
            {login.error instanceof Error
              ? login.error.message
              : 'Something went wrong.'}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={login.isPending}
          className="bg-primary text-surface hover:opacity-95 w-full rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
        >
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="text-foreground/70 mt-6 text-center text-sm">
        No account?{' '}
        <Link to="/signup" className="text-primary font-medium underline-offset-2 hover:underline">
          Sign up
        </Link>
      </p>
    </section>
  )
}
