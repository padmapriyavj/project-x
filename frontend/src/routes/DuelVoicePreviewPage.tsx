import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'

import {
  speakDuelIntro,
  speakDuelPeerCommentary,
  speakDuelQuestionRead,
  speakDuelWinnerCallout,
} from '@/lib/voice/quizVoice'

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * PRD §7.5 — preview Finn duel voice lines before Socket.IO QuizRunner exists.
 * Wire `quizVoice` helpers from real duel room events when Person B ships `/quiz-room`.
 */
async function runDuelVoiceShowcase(): Promise<void> {
  await speakDuelIntro(
    "Welcome both of you! I'm Finn — I'll host this practice duel. First question coming up.",
  )
  await delay(600)
  await speakDuelQuestionRead(
    'Question one: Which of the following best describes a directed graph?',
  )
  await delay(600)
  await speakDuelPeerCommentary('Your classmate just locked in an answer — no pressure!')
  await delay(600)
  await speakDuelWinnerCallout(
    'Time! That was a close one — great work from both of you. Check the board for coins.',
  )
}

export function DuelVoicePreviewPage() {
  const [err, setErr] = useState<string | null>(null)
  const run = useMutation({
    mutationFn: runDuelVoiceShowcase,
    onMutate: () => setErr(null),
    onError: (e) =>
      setErr(e instanceof Error ? e.message : 'Playback failed.'),
  })

  return (
    <section className="text-left">
      <h1 className="mb-2 text-2xl">Practice duel — Finn voice (PRD §7.5)</h1>
      <p className="text-foreground/75 mb-4 max-w-xl text-sm">
        Plays a short sequence using the same `quizVoice` helpers the live duel
        QuizRunner will call after socket events are wired (§7.6, §8.4). Audio
        resolves: cached clip → ElevenLabs TTS → Web Speech (§14.3).
      </p>
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending}
          className="bg-primary text-surface rounded-[var(--radius-sm)] px-4 py-2 text-sm font-semibold disabled:opacity-60"
        >
          {run.isPending ? 'Playing showcase…' : 'Run duel voice showcase'}
        </button>
        <Link
          to="/student"
          className="border-divider text-foreground inline-flex items-center rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
      {err ? (
        <p className="text-danger max-w-xl text-sm" role="alert">
          {err}
        </p>
      ) : null}
    </section>
  )
}
