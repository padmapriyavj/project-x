import { apiFetch } from '@/lib/api/client'
import type { components } from '@/lib/api/schema'

type ShopCatalogItem = components['schemas']['ShopCatalogItem']
type SpaceLayout = components['schemas']['SpaceLayout']

/** GET /shop/catalog — swap mock `fetchShopCatalogMock` when Person A ships this route. */
export async function getShopCatalog(token: string): Promise<ShopCatalogItem[]> {
  const res = await apiFetch('/shop/catalog', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<ShopCatalogItem[]>
}

/** GET /space/layouts/{layout_id} — swap mock `fetchSpaceLayoutMock` when ready. */
export async function getSpaceLayout(
  layoutId: string,
  token: string,
): Promise<SpaceLayout> {
  const res = await apiFetch(`/space/layouts/${encodeURIComponent(layoutId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    throw new Error((await res.text()) || `${res.status} ${res.statusText}`)
  }
  return res.json() as Promise<SpaceLayout>
}
