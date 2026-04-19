import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { listNotifications, markNotificationRead } from '@/lib/courseContentLocal'

type Props = {
  open: boolean
  onClose: () => void
}

export function NotificationsDrawer({ open, onClose }: Props) {
  const [, tick] = useState(0)
  const items = useMemo(() => listNotifications(), [open, tick])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="bg-foreground/30 fixed inset-0 z-40"
        aria-label="Close notifications"
        onClick={onClose}
      />
      <aside
        className="border-divider bg-surface fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l shadow-xl"
        aria-label="Notifications"
      >
        <div className="border-divider flex items-center justify-between border-b px-4 py-3">
          <h2 className="font-heading text-lg">Notifications</h2>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {items.length === 0 ? (
            <li className="text-foreground/60 px-3 py-6 text-center text-sm">No notifications yet.</li>
          ) : (
            items.map((n) => (
              <li key={n.id} className="mb-1">
                <button
                  type="button"
                  className={`hover:bg-background w-full rounded-[var(--radius-md)] px-3 py-3 text-left text-sm ${
                    n.read ? 'opacity-70' : ''
                  }`}
                  onClick={() => {
                    markNotificationRead(n.id)
                    tick((x) => x + 1)
                  }}
                >
                  <p className="font-medium">{n.title}</p>
                  <p className="text-foreground/70 mt-1 text-xs">{n.body}</p>
                  <p className="text-foreground/50 mt-1 font-mono text-[10px]">
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>
    </>
  )
}
