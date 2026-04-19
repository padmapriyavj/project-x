import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { defaultStudySpaceLayout } from '@/lib/space/defaultLayout'

function emptyPlacements(): Record<string, string | null> {
  return Object.fromEntries(
    defaultStudySpaceLayout.slots.map((s) => [s.id, null]),
  ) as Record<string, string | null>
}

type EconomyState = {
  coins: number
  /** Inventory row ids (``GET /api/v1/me/inventory``) placed in each slot. */
  slotPlacements: Record<string, string | null>
  setCoinsFromBackend: (coins: number) => void
  placeInSlot: (slotId: string, inventoryItemId: string) => void
  clearSlot: (slotId: string) => void
  resetEconomy: () => void
}

export const useStudentEconomyStore = create<EconomyState>()(
  persist(
    (set) => ({
      coins: 0,
      slotPlacements: emptyPlacements(),

      setCoinsFromBackend: (coins) => set({ coins }),

      placeInSlot: (slotId, inventoryItemId) => {
        set((s) => {
          const placements = { ...s.slotPlacements }
          for (const [sid, val] of Object.entries(placements)) {
            if (val === inventoryItemId && sid !== slotId) placements[sid] = null
          }
          placements[slotId] = inventoryItemId
          return { slotPlacements: placements }
        })
      },

      clearSlot: (slotId) => {
        set((s) => ({
          slotPlacements: { ...s.slotPlacements, [slotId]: null },
        }))
      },

      resetEconomy: () =>
        set({
          coins: 0,
          slotPlacements: emptyPlacements(),
        }),
    }),
    {
      name: 'deductible-student-economy',
      version: 2,
      migrate: (persistedState, fromVersion) => {
        if (fromVersion < 2 && persistedState && typeof persistedState === 'object') {
          const p = persistedState as { coins?: number }
          return {
            coins: typeof p.coins === 'number' ? p.coins : 0,
            slotPlacements: emptyPlacements(),
          }
        }
        return persistedState as Partial<EconomyState>
      },
    },
  ),
)
