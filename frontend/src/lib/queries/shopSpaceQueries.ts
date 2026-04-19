import { defaultSpaceLayoutFixture } from '@/lib/mocks/spaceLayout'
import { shopCatalogFixture } from '@/lib/mocks/shopCatalog'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchShopCatalogMock() {
  await delay(120)
  return shopCatalogFixture
}

export async function fetchSpaceLayoutMock() {
  await delay(120)
  return defaultSpaceLayoutFixture
}
