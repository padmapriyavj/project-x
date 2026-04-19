import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import {
  getCoachSessionStatus,
  getCoachSetupHint,
  startCoachConversationSession,
} from '@/lib/voice/coachSession'

export function CoachPlaceholderPage() {
  const [note, setNote] = useState<string | null>(null)
  const status = getCoachSessionStatus()

  const tryStart = useMutation({
    mutationFn: startCoachConversationSession,
    onSuccess: () => setNote(null),
    onError: (e) =>
      setNote(e instanceof Error ? e.message : 'Could not start session.'),
  })

  return (
    <section className="text-left">
      <h1 className="mb-2 text-2xl">Chat with Finn</h1>
      <p className="text-foreground/75 mb-4 max-w-xl text-sm">
        PRD §7.8 — Coach uses ElevenLabs <strong>Conversational AI</strong> with
        injected context and tools. This screen will host the live agent session
        (Hour 14–20). Official docs:{' '}
        <a
          href="https://elevenlabs.io/docs/conversational-ai"
          className="text-primary underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          elevenlabs.io/docs/conversational-ai
        </a>
        .
      </p>
      <p className="text-foreground/80 bg-surface mb-4 max-w-xl rounded-[var(--radius-sm)] border border-divider/60 p-3 text-sm">
        Status: <span className="font-mono">{status}</span>
        <br />
        {getCoachSetupHint()}
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => tryStart.mutate()}
          disabled={tryStart.isPending}
          className="bg-secondary text-surface rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {tryStart.isPending ? 'Starting…' : 'Try start session (stub)'}
        </button>
        <Link
          to="/student"
          className="text-primary text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
      {note ? (
        <p className="text-foreground/90 max-w-xl text-sm" role="status">
          {note}
        </p>
      ) : null}
    </section>
  )
}
