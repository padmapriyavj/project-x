import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import type { FinnMood } from '@/components/finn/FinnMascot'
import { FinnMascot } from '@/components/finn/FinnMascot'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { getShopItemById } from '@/lib/mocks/shopCatalog'
import type { SpaceSlot } from '@/lib/mocks/spaceLayout'
import { queryKeys } from '@/lib/queryKeys'
import { fetchSpaceLayoutMock } from '@/lib/queries/shopSpaceQueries'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

export function StudentSpacePage() {
  const [activeSlot, setActiveSlot] = useState<SpaceSlot | null>(null)
  const [finnMood, setFinnMood] = useState<FinnMood>('neutral')

  const coins = useStudentEconomyStore((s) => s.coins)
  const inventoryCounts = useStudentEconomyStore((s) => s.inventoryCounts)
  const slotPlacements = useStudentEconomyStore((s) => s.slotPlacements)
  const placeInSlot = useStudentEconomyStore((s) => s.placeInSlot)
  const clearSlot = useStudentEconomyStore((s) => s.clearSlot)

  const layout = useQuery({
    queryKey: queryKeys.spaceLayout,
    queryFn: fetchSpaceLayoutMock,
  })

  useEffect(() => {
    if (finnMood !== 'celebrating') return
    const t = window.setTimeout(() => setFinnMood('neutral'), 1600)
    return () => window.clearTimeout(t)
  }, [finnMood])

  const ownedPlaceableIds = Object.entries(inventoryCounts)
    .filter(([, n]) => n > 0)
    .map(([id]) => id)

  const place = (itemId: string) => {
    if (!activeSlot) return
    placeInSlot(activeSlot.id, itemId)
    setFinnMood('celebrating')
    setActiveSlot(null)
  }

  return (
    <section className="text-left">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl">Your space</h1>
          <p className="text-foreground/75 max-w-xl text-sm">
            Fixed slots (product brief section 7.12). Tap a slot to place something from inventory, or clear it.{' '}
            <Link to="/student/shop" className="text-primary font-medium underline-offset-2 hover:underline">
              Visit the shop
            </Link>
            .
          </p>
        </div>
        <CoinCounter value={coins} />
      </div>

      <div className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <FinnMascot mood={finnMood} className="shrink-0" />
        <p className="text-foreground/70 max-w-md text-sm">
          Finn hangs out here while you arrange your study corner — moods react lightly when you place
          items.
        </p>
      </div>

      {layout.isLoading ? (
        <p className="text-foreground/70 text-sm">Loading layout…</p>
      ) : null}
      {layout.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load your space layout.
        </p>
      ) : null}

      {layout.data ? (
        <div className="border-divider bg-background relative mx-auto max-w-2xl rounded-[var(--radius-lg)] border p-4 sm:p-6">
          <p className="text-foreground/60 mb-4 text-center text-xs uppercase tracking-wide">
            {layout.data.title}
          </p>
          <div className="grid min-h-[280px] grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            {layout.data.slots.map((slot) => {
              const placedId = slotPlacements[slot.id] ?? null
              const placed = placedId ? getShopItemById(placedId) : null
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setActiveSlot(slot)}
                  className="border-divider bg-surface hover:border-secondary flex min-h-[7.5rem] flex-col items-center justify-center rounded-[var(--radius-md)] border p-4 text-center transition-colors sm:min-h-[6.5rem]"
                >
                  <span className="text-foreground/55 text-xs">{slot.label}</span>
                  {placed ? (
                    <span className="text-foreground mt-2 text-sm font-semibold">{placed.name}</span>
                  ) : (
                    <span className="text-foreground/50 mt-2 text-xs">Empty — tap to decorate</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ) : null}

      <p className="text-foreground/65 mt-8 text-sm">
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </p>

      <SimpleModal
        title={activeSlot ? `Slot: ${activeSlot.label}` : 'Slot'}
        isOpen={!!activeSlot}
        onClose={() => setActiveSlot(null)}
      >
        {activeSlot ? (
          <div className="space-y-4">
            {(() => {
              const current = slotPlacements[activeSlot.id]
              const currentItem = current ? getShopItemById(current) : null
              return currentItem ? (
                <div>
                  <p className="text-foreground/80 text-sm">
                    Currently: <strong>{currentItem.name}</strong>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      clearSlot(activeSlot.id)
                      setActiveSlot(null)
                    }}
                    className="text-danger mt-2 inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
                  >
                    Remove back to inventory
                  </button>
                </div>
              ) : (
                <p className="text-foreground/75 text-sm">Choose an item from your inventory to place.</p>
              )
            })()}
            {ownedPlaceableIds.length === 0 ? (
              <p className="text-foreground/70 text-sm">Nothing in inventory — buy items in the shop first.</p>
            ) : (
              <ul className="max-h-48 space-y-2 overflow-y-auto">
                {ownedPlaceableIds.map((id) => {
                  const item = getShopItemById(id)
                  if (!item) return null
                  const n = inventoryCounts[id] ?? 0
                  return (
                    <li key={id}>
                      <button
                        type="button"
                        onClick={() => place(id)}
                        className="border-divider hover:bg-background min-h-11 w-full rounded-[var(--radius-sm)] border px-3 py-2.5 text-left text-sm"
                      >
                        <span className="font-medium">{item.name}</span>
                        <span className="text-foreground/60 ml-2 font-mono text-xs">×{n}</span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        ) : null}
      </SimpleModal>
    </section>
  )
}
