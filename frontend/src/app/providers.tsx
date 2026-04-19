import { QueryClientProvider } from '@tanstack/react-query'
import { useEffect, type ReactNode } from 'react'

import { Spinner } from '@/components/ui/Spinner'
import { queryClient } from '@/lib/queryClient'
import { useAuthStore } from '@/stores/authStore'

function AuthInitializer({ children }: { children: ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const isInitialized = useAuthStore((s) => s.isInitialized)

  useEffect(() => {
    // Only initialize after hydration is complete
    if (isHydrated && !isInitialized) {
      initialize()
    }
  }, [isHydrated, isInitialized, initialize])

  // Show loading while waiting for hydration or initialization
  if (!isHydrated || !isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Spinner label="Loading…" />
      </div>
    )
  }

  return <>{children}</>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  )
}
