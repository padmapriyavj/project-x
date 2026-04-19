import type { Status } from '@elevenlabs/client'
import type { VoiceConversation } from '@elevenlabs/client'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
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
      <PageHeader
        title="Chat with Finn"
        description={
          <>
            Live voice uses ElevenLabs <strong>Conversational AI</strong> via{' '}
            <code className="font-mono text-xs">@elevenlabs/client</code>. Allow the microphone when the browser prompts.
            Official docs:{' '}
            <a
              href="https://elevenlabs.io/docs/conversational-ai"
              className="text-primary underline-offset-2 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              elevenlabs.io/docs/conversational-ai
            </a>
            .
          </>
        }
      />

      <Card padding="md" className="mb-6 max-w-xl">
        <p className="text-foreground/80 text-sm">
          Agent: <span className="font-mono">{coachStatus}</span>
          <br />
          Connection: <span className="font-mono">{status}</span>
          <br />
          {getCoachSetupHint()}
        </p>
      </Card>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="secondary"
          onClick={() => void start()}
          disabled={phase === 'connecting' || phase === 'live' || phase === 'ending' || coachStatus !== 'ready'}
        >
          {phase === 'connecting' ? 'Connecting…' : phase === 'live' ? 'Session active' : 'Start voice session'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => void end()}
          disabled={phase !== 'live' && phase !== 'ending'}
        >
          {phase === 'ending' ? 'Ending…' : 'End session'}
        </Button>
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center self-center text-sm font-medium underline-offset-2 hover:underline sm:self-auto"
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
          <span className="font-mono">.env.local</span> to enable the start button. For many agents you also need{' '}
          <span className="font-mono">VITE_ELEVENLABS_API_KEY</span> in dev (never ship raw keys to production clients).
        </p>
      ) : null}
    </section>
  )
}
