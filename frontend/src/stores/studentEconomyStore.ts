import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { defaultSpaceLayoutFixture } from '@/lib/mocks/spaceLayout'
import { studentDashboardFixture } from '@/lib/mocks/studentDashboard'

const INITIAL_COINS = studentDashboardFixture.coins

function emptyPlacements(): Record<string, string | null> {
  return Object.fromEntries(
    defaultSpaceLayoutFixture.slots.map((s) => [s.id, null]),
  ) as Record<string, string | null>
}

type EconomyState = {
  coins: number
  inventoryCounts: Record<string, number>
  slotPlacements: Record<string, string | null>
  purchase: (itemId: string, price: number) => boolean
  placeInSlot: (slotId: string, itemId: string) => void
  clearSlot: (slotId: string) => void
  resetEconomy: () => void
}

function defaultInventory(): Record<string, number> {
  return { 'poster-math': 1 }
}

export const useStudentEconomyStore = create<EconomyState>()(
  persist(
    (set, get) => ({
      coins: INITIAL_COINS,
      inventoryCounts: defaultInventory(),
      slotPlacements: emptyPlacements(),

      purchase: (itemId, price) => {
        const { coins } = get()
        if (coins < price) return false
        set((s) => ({
          coins: s.coins - price,
          inventoryCounts: {
            ...s.inventoryCounts,
            [itemId]: (s.inventoryCounts[itemId] ?? 0) + 1,
          },
        }))
        return true
      },

      placeInSlot: (slotId, itemId) => {
        const inv = { ...get().inventoryCounts }
        if ((inv[itemId] ?? 0) < 1) return
        const placements = { ...get().slotPlacements }
        const previous = placements[slotId] ?? null
        if (previous) inv[previous] = (inv[previous] ?? 0) + 1
        inv[itemId] = (inv[itemId] ?? 0) - 1
        placements[slotId] = itemId
        set({ inventoryCounts: inv, slotPlacements: placements })
      },

      clearSlot: (slotId) => {
        const placements = { ...get().slotPlacements }
        const itemId = placements[slotId]
        if (!itemId) return
        placements[slotId] = null
        const inv = { ...get().inventoryCounts }
        inv[itemId] = (inv[itemId] ?? 0) + 1
        set({ slotPlacements: placements, inventoryCounts: inv })
      },

      resetEconomy: () =>
        set({
          coins: INITIAL_COINS,
          inventoryCounts: defaultInventory(),
          slotPlacements: emptyPlacements(),
        }),
    }),
    {
      name: 'deductible-student-economy',
      version: 1,
    },
  ),
)
