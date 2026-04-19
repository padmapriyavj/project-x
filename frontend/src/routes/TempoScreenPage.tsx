import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { BetchaSelector } from '@/components/betcha/BetchaSelector'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import type { BetchaMultiplier, QuizRunLocationState } from '@/lib/mocks/quizRun'

/**
 * Tempo delivery: Betcha first, then join quiz room (same runner shell as practice).
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
        <Link to="/student" className="text-primary inline-flex min-h-11 items-center hover:underline">
          Dashboard
        </Link>
      </nav>
      <PageHeader
        title="Tempo"
        description={
          <>
            Instance <span className="font-mono">{instanceId}</span> — place Betcha, then join the shared quiz runner
            (mock until backend schedules and sockets fire).
          </>
        }
      />
      <div className="mb-6 max-w-lg">
        <BetchaSelector value={betcha} onChange={setBetcha} />
      </div>
      <Button type="button" onClick={joinTempo}>
        Join Tempo quiz
      </Button>
    </section>
  )
}
