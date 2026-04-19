import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import { SimpleModal } from '@/components/ui/SimpleModal'
import type { ShopCatalogItem, ShopCategory } from '@/lib/mocks/shopCatalog'
import { queryKeys } from '@/lib/queryKeys'
import { fetchShopCatalogMock } from '@/lib/queries/shopSpaceQueries'
import { useStudentEconomyStore } from '@/stores/studentEconomyStore'

const filters: Array<{ id: 'all' | ShopCategory; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'decor', label: 'Decor' },
  { id: 'desk', label: 'Desk' },
  { id: 'plant', label: 'Plants' },
]

export function StudentShopPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]['id']>('all')
  const [confirmItem, setConfirmItem] = useState<ShopCatalogItem | null>(null)
  const [purchaseError, setPurchaseError] = useState<string | null>(null)

  const coins = useStudentEconomyStore((s) => s.coins)
  const inventoryCounts = useStudentEconomyStore((s) => s.inventoryCounts)
  const purchase = useStudentEconomyStore((s) => s.purchase)

  const catalog = useQuery({
    queryKey: queryKeys.shopCatalog,
    queryFn: fetchShopCatalogMock,
  })

  const items = useMemo(() => {
    const list = catalog.data ?? []
    if (filter === 'all') return list
    return list.filter((i) => i.category === filter)
  }, [catalog.data, filter])

  const tryPurchase = () => {
    if (!confirmItem) return
    setPurchaseError(null)
    if (coins < confirmItem.price) {
      setPurchaseError('Not enough coins for this item.')
      return
    }
    const ok = purchase(confirmItem.id, confirmItem.price)
    if (!ok) setPurchaseError('Purchase failed.')
    else setConfirmItem(null)
  }

  return (
    <section className="text-left">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-1 text-2xl">Shop & inventory</h1>
          <p className="text-foreground/75 max-w-xl text-sm">
            Mock storefront — coins and owned items persist in this browser.{' '}
            <Link to="/student/space" className="text-primary font-medium underline-offset-2 hover:underline">
              Open your space
            </Link>{' '}
            to place decor.
          </p>
        </div>
        <CoinCounter value={coins} />
      </div>

      {catalog.isLoading ? (
        <p className="text-foreground/70 text-sm">Loading catalog…</p>
      ) : null}
      {catalog.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load the shop catalog.
        </p>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`rounded-[var(--radius-sm)] border px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f.id
                ? 'border-secondary bg-secondary text-surface'
                : 'border-divider text-foreground hover:bg-background'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 && catalog.isSuccess ? (
        <p className="text-foreground/70 text-sm">No items match this filter.</p>
      ) : null}

      <ul className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const owned = inventoryCounts[item.id] ?? 0
          return (
            <li
              key={item.id}
              className="border-divider bg-surface flex flex-col rounded-[var(--radius-lg)] border p-4"
            >
              <p className="text-foreground/60 text-xs uppercase tracking-wide">{item.category}</p>
              <h2 className="font-heading mt-1 text-lg">{item.name}</h2>
              <p className="text-foreground/75 mt-2 flex-1 text-sm">{item.description}</p>
              <p className="text-foreground mt-3 font-mono text-sm">
                {item.price} coins {owned > 0 ? `· owned ×${owned}` : null}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPurchaseError(null)
                  setConfirmItem(item)
                }}
                className="bg-primary text-surface mt-3 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold disabled:opacity-50"
                disabled={coins < item.price}
              >
                {coins < item.price ? 'Not enough coins' : 'Buy'}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="border-divider mt-10 border-t pt-6">
        <h2 className="font-heading mb-3 text-lg">Inventory</h2>
        {catalog.data ? (
          <ul className="space-y-2 text-sm">
            {catalog.data.map((item) => {
              const n = inventoryCounts[item.id] ?? 0
              if (n <= 0) return null
              return (
                <li key={item.id} className="text-foreground/85 flex justify-between gap-2">
                  <span>{item.name}</span>
                  <span className="font-mono">×{n}</span>
                </li>
              )
            })}
          </ul>
        ) : null}
        {catalog.isSuccess &&
        catalog.data?.every((item) => (inventoryCounts[item.id] ?? 0) <= 0) ? (
          <p className="text-foreground/70 text-sm">You do not own any items yet.</p>
        ) : null}
      </div>

      <p className="text-foreground/65 mt-8 text-sm">
        <Link to="/student" className="text-primary font-medium underline-offset-2 hover:underline">
          Back to dashboard
        </Link>
      </p>

      <SimpleModal
        title="Confirm purchase"
        isOpen={!!confirmItem}
        onClose={() => {
          setConfirmItem(null)
          setPurchaseError(null)
        }}
      >
        {confirmItem ? (
          <>
            <p className="text-foreground/85 text-sm">
              Buy <strong>{confirmItem.name}</strong> for{' '}
              <span className="font-mono">{confirmItem.price}</span> coins?
            </p>
            {purchaseError ? (
              <p className="text-danger mt-3 text-sm" role="alert">
                {purchaseError}
              </p>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={tryPurchase}
                className="bg-secondary text-surface rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmItem(null)
                  setPurchaseError(null)
                }}
                className="border-divider rounded-[var(--radius-sm)] border px-4 py-2 text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        ) : null}
      </SimpleModal>
    </section>
  )
}
