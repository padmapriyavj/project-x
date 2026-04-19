import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import { studentDashboardFixture } from '@/lib/mocks/studentDashboard'
import type { BetchaMultiplier, QuizRunLocationState, QuizRunMode } from '@/lib/mocks/quizRun'

export function PracticeLobbyPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const courseName =
    (location.state as { courseName?: string } | null)?.courseName ??
    studentDashboardFixture.courses.find((c) => c.id === lessonId)?.name ??
    'Practice'

  const [mode, setMode] = useState<QuizRunMode>('solo')
  const [betcha, setBetcha] = useState<BetchaMultiplier>(1)

  const startQuiz = () => {
    const roomId = `mock-${crypto.randomUUID?.() ?? String(Date.now())}`
    const state: QuizRunLocationState = {
      mode,
      betcha,
      lessonId: lessonId ?? 'unknown',
      courseName,
    }
    navigate(`/student/quiz/${roomId}`, { state })
  }

  return (
    <section className="text-left">
      <nav className="text-foreground/70 mb-4 text-sm">
        <Link to="/student/practice" className="text-primary hover:underline">
          Practice
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Lobby</span>
      </nav>
      <h1 className="mb-1 text-2xl">Practice lobby</h1>
      <p className="text-foreground/75 mb-6 text-sm">{courseName}</p>

      <fieldset className="border-divider/60 bg-surface mb-6 rounded-[var(--radius-md)] border p-4">
        <legend className="text-foreground px-1 text-sm font-semibold">Mode</legend>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === 'solo'}
              onChange={() => setMode('solo')}
            />
            Solo practice
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="mode"
              checked={mode === 'duel'}
              onChange={() => setMode('duel')}
            />
            Duel (invite stub)
          </label>
        </div>
        {mode === 'duel' ? (
          <p className="text-foreground/70 mt-3 text-xs">
            Invite flow: share room id with a classmate once Socket.IO rooms exist
            (PRD §7.5). For now, duel mode still runs the mock single-player shell.
          </p>
        ) : null}
      </fieldset>

      <div className="mb-6 max-w-lg">
        <BetchaSelector value={betcha} onChange={setBetcha} />
      </div>

      <button
        type="button"
        onClick={startQuiz}
        className="bg-primary text-surface rounded-[var(--radius-sm)] px-5 py-2.5 text-sm font-semibold"
      >
        Start quiz
      </button>
    </section>
  )
}
