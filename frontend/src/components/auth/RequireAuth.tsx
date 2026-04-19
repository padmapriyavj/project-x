import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router'

import { useAuthStore } from '@/stores/authStore'

type Role = 'student' | 'professor'

export function RequireAuth({
  allowedRoles,
  children,
}: {
  allowedRoles?: Role[]
  children?: ReactNode
}) {
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const location = useLocation()

  if (!token) {
    return (
      <Navigate to="/login" replace state={{ from: location.pathname }} />
    )
  }

  if (
    allowedRoles?.length &&
    role &&
    !allowedRoles.includes(role)
  ) {
    return <Navigate to="/" replace />
  }

  return children ?? <Outlet />
}
