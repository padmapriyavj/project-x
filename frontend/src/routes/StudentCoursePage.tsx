import { useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { EventAccordion, type CompletedEvent } from '@/components/courses/EventAccordion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { useStudentDashboardQuery } from '@/lib/queries/dashboardQueries'
import { useJoinableTemposQuery, useUpcomingTemposQuery } from '@/lib/queries/tempoQueries'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useLessonsQuery } from '@/lib/queries/lessonQueries'
import { useAuthStore } from '@/stores/authStore'

export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()
  const token = useAuthStore((s) => s.token)

  const course = useCourseQuery(id)
  const lessonsQuery = useLessonsQuery(id)
  const dashboard = useStudentDashboardQuery()
  const temposScheduledQuery = useUpcomingTemposQuery(token)
  const temposJoinableQuery = useJoinableTemposQuery(token)

  const courseDash = useMemo(
    () => dashboard.data?.courses.find((c) => c.id === id),
    [dashboard.data?.courses, id],
  )

  const lessons = lessonsQuery.data ?? []

  const scheduledTempos = useMemo(() => {
    const rows = temposScheduledQuery.data ?? []
    return rows.filter((r) => String(r.course_id) === String(id))
  }, [temposScheduledQuery.data, id])

  const joinableTempos = useMemo(() => {
    const rows = temposJoinableQuery.data ?? []
    return rows.filter((r) => String(r.course_id) === String(id))
  }, [temposJoinableQuery.data, id])

  const completedEvents: CompletedEvent[] = (courseDash?.completed_events ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    date: '—',
    attempted: e.attempted,
    correct: e.correct,
    wrong: e.wrong,
    coins: e.coins,
    betcha: e.betcha ?? '—',
    concepts: e.concepts,
  }))

  if (course.isLoading) {
    return <Spinner label="Loading course..." />
  }

  if (course.isError || !course.data) {
    return (
      <div className="text-left">
        <p className="text-danger mb-4 text-sm">Could not load course.</p>
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const c = course.data
  const upcoming: { id: string; line: string }[] = courseDash?.upcoming_events?.length
    ? courseDash.upcoming_events.map((e) => ({
        id: e.id,
        line: `${e.title} — ${e.date}`,
      }))
    : scheduledTempos.map((t) => ({
        id: String(t.id),
        line: `Tempo — ${t.scheduled_at ? new Date(String(t.scheduled_at)).toLocaleString() : 'scheduled'}`,
      }))

  const testsTaken = courseDash?.tests_taken ?? 0
  const courseCoins = courseDash?.coins_earned ?? 0
  const weakConcept = courseDash?.top_weak_concept ?? '—'

  return (
    <div className="text-left">
      <nav className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          to="/student"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
        <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/student/course/${c.id}/leaderboard`)}>
          Leaderboard
        </Button>
      </nav>

      <PageHeader
        title={c.name}
        description={
          <>
            {c.description ? (
              <span className="block text-foreground/80">{c.description}</span>
            ) : null}
            <span className="text-foreground/60 mt-2 block text-xs">
              Enrolled since {new Date(c.created_at).toLocaleDateString()}
            </span>
          </>
        }
      />

      {joinableTempos.length > 0 ? (
        <Card padding="md" className="border-secondary/40 mb-6 border-2 bg-secondary/5">
          <p className="text-foreground font-medium">Live Tempos</p>
          <p className="text-foreground/70 mt-1 text-sm">
            These sessions have reached their scheduled start (or have no start time). Open to place Betcha and join
            the quiz room.
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {joinableTempos.map((t) => (
              <li key={String(t.id)}>
                <button
                  type="button"
                  className="text-primary font-mono text-left underline-offset-2 hover:underline"
                  onClick={() =>
                    navigate(`/student/tempo/${encodeURIComponent(String(t.id))}`, {
                      state: { courseName: c.name, courseId: c.id },
                    })
                  }
                >
                  Join quiz {String(t.id)}
                </button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {scheduledTempos.length > 0 ? (
        <Card padding="md" className="mb-6">
          <p className="text-foreground font-medium">Scheduled Tempos</p>
          <p className="text-foreground/70 mt-1 text-sm">Starts at the time shown — the Join button appears here once that time arrives.</p>
          <ul className="mt-2 space-y-1 text-sm">
            {scheduledTempos.map((t) => (
              <li key={String(t.id)} className="text-foreground/80 font-mono">
                Quiz {String(t.id)} — {t.scheduled_at ? new Date(String(t.scheduled_at)).toLocaleString() : 'scheduled'}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Tests taken</p>
          <p className="font-heading text-foreground mt-1 text-2xl">{testsTaken}</p>
        </Card>
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Coins (course)</p>
          <p className="font-heading text-gold mt-1 text-2xl">{courseCoins}</p>
        </Card>
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Top weak concept</p>
          <p className="text-foreground mt-1 text-sm font-medium">{weakConcept}</p>
        </Card>
      </div>

      <div className="mb-8 grid gap-4 sm:gap-6 md:grid-cols-2 md:items-stretch">
        <Card padding="lg" className="flex flex-col">
          <h2 className="font-heading text-foreground mb-3 text-lg">Practice</h2>
          <p className="text-foreground/70 mb-6 flex-1 text-sm leading-relaxed">
            Start a practice test to review course material and earn coins.
          </p>
          <Button
            variant="secondary"
            fullWidth
            className="md:w-auto"
            type="button"
            onClick={() =>
              navigate(`/student/practice/lobby/${c.id}`, { state: { courseName: c.name } })
            }
          >
            Start practice test
          </Button>
        </Card>

        <Card padding="lg" className="flex flex-col">
          <h2 className="font-heading text-foreground mb-3 text-lg">Course info</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-foreground/60 text-xs font-medium uppercase tracking-wide">Course ID</dt>
              <dd className="text-foreground font-mono">{c.id}</dd>
            </div>
            {Object.keys(c.schedule).length > 0 ? (
              <div>
                <dt className="text-foreground/60 mb-1 text-xs font-medium uppercase tracking-wide">Schedule</dt>
                <dd className="text-foreground max-h-48 overflow-auto rounded-[var(--radius-sm)] bg-background/50 p-3 font-mono text-xs">
                  <pre className="whitespace-pre-wrap break-words">{JSON.stringify(c.schedule, null, 2)}</pre>
                </dd>
              </div>
            ) : (
              <p className="text-foreground/60 text-sm">No schedule details yet.</p>
            )}
          </dl>
        </Card>
      </div>

      <section className="mb-8">
        <h2 className="font-heading text-foreground mb-3 text-lg">Lessons</h2>
        {lessonsQuery.isLoading ? <Spinner label="Loading lessons..." /> : null}
        {lessonsQuery.isError ? (
          <p className="text-danger text-sm">Could not load lessons.</p>
        ) : null}
        {lessons.length === 0 && !lessonsQuery.isLoading ? (
          <p className="text-foreground/70 text-sm">Your professor has not published lessons yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/student/course/${c.id}/lesson/${l.id}`}
                  className="border-divider bg-surface hover:border-primary/40 block rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition-colors"
                >
                  Week {l.week_number}: {l.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-foreground mb-3 text-lg">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-foreground/70 text-sm">No upcoming Tempos scheduled.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {upcoming.map((t) => (
              <li key={t.id} className="text-foreground/80">
                {t.line}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-foreground mb-3 text-lg">Completed events</h2>
        <EventAccordion events={completedEvents} />
      </section>
    </div>
  )
}
