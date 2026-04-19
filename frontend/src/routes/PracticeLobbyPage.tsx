import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
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
        <Link to="/student/practice" className="text-primary inline-flex min-h-11 items-center hover:underline">
          Practice
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Lobby</span>
      </nav>
      <PageHeader title="Practice lobby" description={courseName} />

      <Card padding="md" className="mb-6">
        <fieldset>
          <legend className="text-foreground px-1 text-sm font-semibold">Mode</legend>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'solo'} onChange={() => setMode('solo')} />
              Solo practice
            </label>
            <label className="flex min-h-11 cursor-pointer items-center gap-2">
              <input type="radio" name="mode" checked={mode === 'duel'} onChange={() => setMode('duel')} />
              Duel (invite stub)
            </label>
          </div>
          {mode === 'duel' ? (
            <p className="text-foreground/70 mt-3 text-xs">
              Invite flow: share room id with a classmate once Socket.IO rooms exist. For now, duel mode still runs
              the mock single-player shell.
            </p>
          ) : null}
        </fieldset>
      </Card>

      <div className="mb-6 max-w-lg">
        <BetchaSelector value={betcha} onChange={setBetcha} />
      </div>

      <Button type="button" onClick={startQuiz}>
        Start quiz
      </Button>
    </section>
  )
}
