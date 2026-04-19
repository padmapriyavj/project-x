import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { components } from '@/lib/api/schema'

export type UserPublic = components['schemas']['UserPublic']

type AuthState = {
  token: string | null
  user: UserPublic | null
  setAuth: (token: string, user: UserPublic) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
    }),
    {
      name: 'deductible-auth',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
