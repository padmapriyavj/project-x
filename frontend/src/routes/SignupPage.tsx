import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { signupRequest } from '@/lib/authApi'
import { useAuthStore } from '@/stores/authStore'

const inputClass =
  'border-divider bg-surface text-foreground focus:border-primary focus:ring-primary/30 w-full rounded-[var(--radius-sm)] border px-3 py-2 text-sm outline-none focus:ring-2'

export function SignupPage() {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accountRole, setAccountRole] = useState<'student' | 'professor'>('student')

  const signup = useMutation({
    mutationFn: () =>
      signupRequest({
        email,
        password,
        display_name: displayName,
        role: accountRole,
      }),
    onSuccess: (data) => {
      setAuth(data.access_token, data.user)
      navigate(data.user.role === 'professor' ? '/professor' : '/student', {
        replace: true,
      })
    },
  })

  if (token && role) {
    return <Navigate to={role === 'professor' ? '/professor' : '/student'} replace />
  }

  return (
    <section className="bg-surface shadow-soft rounded-[var(--radius-lg)] border-divider/60 mx-auto max-w-md border p-8 text-left">
      <h1 className="mb-1 text-2xl">Sign up</h1>
      <p className="text-foreground/70 mb-6 text-sm">
        Create an account. With no API base URL, sign-up is mocked locally.
      </p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          signup.mutate()
        }}
      >
        <div>
          <label htmlFor="signup-name" className="mb-1 block text-sm font-medium">
            Display name
          </label>
          <input
            id="signup-name"
            name="displayName"
            type="text"
            required
            minLength={2}
            maxLength={100}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="signup-email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="signup-email"
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
          <label htmlFor="signup-password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            id="signup-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <p className="text-foreground/60 mt-1 text-xs">At least 8 characters.</p>
        </div>
        <fieldset>
          <legend className="mb-2 text-sm font-medium">I am a</legend>
          <div className="flex gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                value="student"
                checked={accountRole === 'student'}
                onChange={() => setAccountRole('student')}
              />
              Student
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="role"
                value="professor"
                checked={accountRole === 'professor'}
                onChange={() => setAccountRole('professor')}
              />
              Professor
            </label>
          </div>
        </fieldset>
        {signup.isError ? (
          <p className="text-danger text-sm" role="alert">
            {signup.error instanceof Error
              ? signup.error.message
              : 'Something went wrong.'}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={signup.isPending}
          className="bg-primary text-surface hover:opacity-95 w-full rounded-[var(--radius-sm)] px-4 py-2.5 text-sm font-semibold transition-opacity disabled:opacity-60"
        >
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="text-foreground/70 mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" className="text-primary font-medium underline-offset-2 hover:underline">
          Log in
        </Link>
      </p>
    </section>
  )
}
