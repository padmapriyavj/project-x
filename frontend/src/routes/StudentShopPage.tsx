import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'

import { CoinCounter } from '@/components/dashboard/CoinCounter'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { Spinner } from '@/components/ui/Spinner'
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
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <PageHeader
          className="mb-0 flex-1 sm:mb-0"
          title="Shop and inventory"
          description={
            <>
              Mock storefront — coins and owned items persist in this browser.{' '}
              <Link to="/student/space" className="text-primary font-medium underline-offset-2 hover:underline">
                Open your space
              </Link>{' '}
              to place decor.
            </>
          }
        />
        <div className="shrink-0 md:pb-1">
          <CoinCounter value={coins} />
        </div>
      </div>

      {catalog.isLoading ? <Spinner label="Loading catalog…" /> : null}
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
            className={`min-h-11 rounded-[var(--radius-sm)] border px-3 py-2 text-sm font-medium transition-colors ${
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

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const owned = inventoryCounts[item.id] ?? 0
          return (
            <li key={item.id}>
              <Card padding="md" className="flex h-full flex-col">
                <p className="text-foreground/60 text-xs uppercase tracking-wide">{item.category}</p>
                <h2 className="font-heading mt-1 text-lg">{item.name}</h2>
                <p className="text-foreground/75 mt-2 flex-1 text-sm">{item.description}</p>
                <p className="text-foreground mt-3 font-mono text-sm">
                  {item.price} coins {owned > 0 ? `· owned ×${owned}` : null}
                </p>
                <Button
                  type="button"
                  className="mt-3"
                  fullWidth
                  disabled={coins < item.price}
                  onClick={() => {
                    setPurchaseError(null)
                    setConfirmItem(item)
                  }}
                >
                  {coins < item.price ? 'Not enough coins' : 'Buy'}
                </Button>
              </Card>
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
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center font-medium underline-offset-2 hover:underline"
        >
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
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button type="button" variant="secondary" onClick={tryPurchase}>
                Confirm
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setConfirmItem(null)
                  setPurchaseError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : null}
      </SimpleModal>
    </section>
  )
}
