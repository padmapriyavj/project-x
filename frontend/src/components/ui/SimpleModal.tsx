import { type ReactNode, useEffect, useId, useRef } from 'react'

type Props = {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function SimpleModal({ title, isOpen, onClose, children }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
    }, 0)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-foreground/40 absolute inset-0" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="border-divider bg-surface relative z-10 w-full max-w-md rounded-[var(--radius-lg)] border p-5 shadow-lg"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-heading text-foreground text-lg">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/70 hover:text-foreground rounded-[var(--radius-sm)] px-2 py-1 text-sm"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
