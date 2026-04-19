import type { Status } from '@elevenlabs/client'
import type { VoiceConversation } from '@elevenlabs/client'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import {
  endCoachConversationSession,
  getCoachSessionStatus,
  getCoachSetupHint,
  startCoachConversationSession,
} from '@/lib/voice/coachSession'

type Phase = 'idle' | 'connecting' | 'live' | 'ending'

export function CoachPlaceholderPage() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState<Status>('disconnected')
  const [note, setNote] = useState<string | null>(null)
  const conversationRef = useRef<VoiceConversation | null>(null)

  const coachStatus = getCoachSessionStatus()

  useEffect(() => {
    return () => {
      void endCoachConversationSession(conversationRef.current)
      conversationRef.current = null
    }
  }, [])

  const start = async () => {
    setNote(null)
    setPhase('connecting')
    try {
      const conv = await startCoachConversationSession({
        onStatusChange: ({ status: s }) => setStatus(s),
        onModeChange: () => {},
        onConnect: () => {
          setPhase('live')
        },
        onDisconnect: () => {
          setPhase('idle')
          setStatus('disconnected')
          conversationRef.current = null
        },
        onError: (message) => {
          setNote(message)
          setPhase('idle')
          conversationRef.current = null
        },
      })
      conversationRef.current = conv
    } catch (e) {
      setPhase('idle')
      setNote(e instanceof Error ? e.message : 'Could not start session.')
    }
  }

  const end = async () => {
    setPhase('ending')
    setNote(null)
    await endCoachConversationSession(conversationRef.current)
    conversationRef.current = null
    setPhase('idle')
    setStatus('disconnected')
  }

  return (
    <section className="text-left">
      <h1 className="mb-2 text-2xl">Chat with Finn</h1>
      <p className="text-foreground/75 mb-4 max-w-xl text-sm">
        PRD §7.8 — live voice uses ElevenLabs <strong>Conversational AI</strong> via{' '}
        <code className="font-mono text-xs">@elevenlabs/client</code>. Allow the microphone when the
        browser prompts. Official docs:{' '}
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
        Agent: <span className="font-mono">{coachStatus}</span>
        <br />
        Connection: <span className="font-mono">{status}</span>
        <br />
        {getCoachSetupHint()}
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void start()}
          disabled={phase === 'connecting' || phase === 'live' || phase === 'ending' || coachStatus !== 'ready'}
          className="bg-secondary text-surface rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {phase === 'connecting' ? 'Connecting…' : phase === 'live' ? 'Session active' : 'Start voice session'}
        </button>
        <button
          type="button"
          onClick={() => void end()}
          disabled={phase !== 'live' && phase !== 'ending'}
          className="border-divider rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {phase === 'ending' ? 'Ending…' : 'End session'}
        </button>
        <Link
          to="/student"
          className="text-primary self-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
      {note ? (
        <p className="text-danger max-w-xl text-sm" role="alert">
          {note}
        </p>
      ) : null}
      {coachStatus !== 'ready' ? (
        <p className="text-foreground/70 max-w-xl text-sm">
          Configure <span className="font-mono">VITE_ELEVENLABS_AGENT_ID</span> in{' '}
          <span className="font-mono">.env.local</span> to enable the start button. For many agents you
          also need <span className="font-mono">VITE_ELEVENLABS_API_KEY</span> in dev (never ship raw
          keys to production clients).
        </p>
      ) : null}
    </section>
  )
}
