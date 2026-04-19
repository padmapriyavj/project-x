/** Deterministic UUID-shaped string from integer (for intelligence APIs expecting UUID). */
export function stableUuidFromInt(n: number): string {
  const tail = Math.max(0, Math.floor(n)).toString(16).padStart(12, '0').slice(-12)
  return `00000000-0000-4000-8000-${tail}`
}
