import { useState } from 'react'

export type CompletedEvent = {
  id: string
  title: string
  date: string
  attempted: number
  correct: number
  wrong: number
  coins: number
  betcha: string
  concepts: string[]
}

export function EventAccordion({ events }: { events: CompletedEvent[] }) {
  const [openId, setOpenId] = useState<string | null>(events[0]?.id ?? null)

  if (events.length === 0) {
    return <p className="text-foreground/70 text-sm">No completed events yet.</p>
  }

  return (
    <ul className="space-y-2">
      {events.map((ev) => {
        const open = openId === ev.id
        return (
          <li key={ev.id} className="border-divider/60 bg-surface rounded-[var(--radius-md)] border">
            <button
              type="button"
              className="flex w-full min-h-11 items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium"
              aria-expanded={open}
              onClick={() => setOpenId(open ? null : ev.id)}
            >
              <span>{ev.title}</span>
              <span className="text-foreground/50 font-mono text-xs">{ev.date}</span>
            </button>
            {open ? (
              <div className="border-divider/40 border-t px-4 py-3 text-sm">
                <p className="text-foreground/80">
                  {ev.correct}/{ev.attempted} correct · {ev.wrong} wrong ·{' '}
                  <span className="font-mono text-gold">+{ev.coins} coins</span>
                </p>
                <p className="text-foreground/70 mt-1 text-xs">Betcha: {ev.betcha}</p>
                <p className="text-foreground/60 mt-2 text-xs">
                  Concepts: {ev.concepts.length ? ev.concepts.join(', ') : '—'}
                </p>
              </div>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
