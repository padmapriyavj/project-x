import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import type { BetchaMultiplier, QuizRunLocationState } from '@/lib/mocks/quizRun'

/**
 * PRD §7.4 — Tempo delivery: Betcha first, then join quiz room (same runner shell as practice).
 * Uses mock navigation until Person A schedules Tempos and Person B exposes rooms.
 */
export function TempoScreenPage() {
  const { instanceId } = useParams<{ instanceId: string }>()
  const navigate = useNavigate()
  const [betcha, setBetcha] = useState<BetchaMultiplier>(1)

  const joinTempo = () => {
    const roomId = `tempo-${instanceId ?? 'unknown'}`
    const state: QuizRunLocationState = {
      mode: 'tempo',
      betcha,
      lessonId: instanceId ?? 'tempo',
      courseName: 'Scheduled Tempo',
    }
    navigate(`/student/quiz/${roomId}`, { state })
  }

  return (
    <section className="text-left">
      <nav className="text-foreground/70 mb-4 text-sm">
        <Link to="/student" className="text-primary hover:underline">
          Dashboard
        </Link>
      </nav>
      <h1 className="mb-2 text-2xl">Tempo</h1>
      <p className="text-foreground/75 mb-6 max-w-xl text-sm">
        Instance <span className="font-mono">{instanceId}</span> — place Betcha,
        then join the shared quiz runner (mock until backend schedules and sockets
        fire).
      </p>
      <div className="mb-6 max-w-lg">
        <BetchaSelector value={betcha} onChange={setBetcha} />
      </div>
      <button
        type="button"
        onClick={joinTempo}
        className="bg-primary text-surface rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-semibold"
      >
        Join Tempo quiz
      </button>
    </section>
  )
}
