import confetti from 'canvas-confetti'
import { useEffect } from 'react'
import { Link, useLocation, useParams } from 'react-router'

import type { QuizResultsLocationState } from '@/lib/mocks/quizRun'

export function QuizResultsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const location = useLocation()
  const data = location.state as QuizResultsLocationState | null

  useEffect(() => {
    if (!data) return
    const pct = Math.round((data.correctCount / data.totalQuestions) * 100)
    if (pct >= 70) {
      void confetti({ particleCount: 120, spread: 70, origin: { y: 0.65 } })
    }
  }, [data])

  if (!data) {
    return (
      <section className="text-left">
        <p className="text-foreground/80 mb-4 text-sm">No results to show.</p>
        <Link to="/student" className="text-primary text-sm font-medium underline">
          Dashboard
        </Link>
      </section>
    )
  }

  const pct = Math.round((data.correctCount / data.totalQuestions) * 100)

  return (
    <section className="text-left">
      <h1 className="mb-2 text-2xl">Quiz results</h1>
      <p className="text-foreground/65 mb-6 font-mono text-xs">Room {roomId}</p>

      <div className="bg-surface border-divider/60 mb-6 max-w-md rounded-[var(--radius-lg)] border p-6">
        <p className="font-heading text-foreground text-4xl">{pct}%</p>
        <p className="text-foreground/80 mt-2 text-sm">
          {data.correctCount} / {data.totalQuestions} correct · Mode: {data.mode}
        </p>
        <p className="text-gold mt-3 font-mono text-lg">+{data.coinsEarned} coins</p>
        <p className="text-foreground/75 mt-3 text-sm">{data.betchaOutcome}</p>
      </div>

      <Link
        to="/student"
        className="bg-primary text-surface inline-flex rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-semibold"
      >
        Back to dashboard
      </Link>
    </section>
  )
}
