import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { EventAccordion, type CompletedEvent } from '@/components/courses/EventAccordion'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { listLessons, listTempos, seedCourseDemoAlerts } from '@/lib/courseContentLocal'
import { useCourseQuery } from '@/lib/queries/courseQueries'
import { useAuthStore } from '@/stores/authStore'

const demoCompleted = (courseName: string): CompletedEvent[] => [
  {
    id: '1',
    title: 'Practice quiz',
    date: new Date().toLocaleDateString(),
    attempted: 10,
    correct: 7,
    wrong: 3,
    coins: 42,
    betcha: '3× (fallback to 1×)',
    concepts: ['Sorting', 'Big-O'],
  },
  {
    id: '2',
    title: `${courseName} — warm-up`,
    date: new Date(Date.now() - 86400000 * 3).toLocaleDateString(),
    attempted: 5,
    correct: 5,
    wrong: 0,
    coins: 80,
    betcha: '1×',
    concepts: ['Arrays'],
  },
]

export function StudentCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const course = useCourseQuery(id)

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

  useEffect(() => {
    seedCourseDemoAlerts(c.id, c.name)
  }, [c.id, c.name])

  const tempos = listTempos(c.id)
  const liveTempo = tempos.find((t) => t.status === 'live')
  const upcoming = tempos.filter((t) => t.status === 'scheduled')
  const lessons = listLessons(c.id)

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

      {liveTempo ? (
        <Card padding="md" className="border-secondary/40 mb-6 border-2 bg-secondary/5">
          <p className="text-foreground font-medium">Tempo in progress</p>
          <p className="text-foreground/70 mt-1 text-sm">A Tempo window is open — join now.</p>
          <Button type="button" className="mt-3" onClick={() => navigate(`/student/tempo/${liveTempo.id}`)}>
            Open Tempo
          </Button>
        </Card>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Tests taken</p>
          <p className="font-heading text-foreground mt-1 text-2xl">3</p>
        </Card>
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Coins (course)</p>
          <p className="font-heading text-gold mt-1 text-2xl">{user?.coins ?? 0}</p>
        </Card>
        <Card padding="md">
          <p className="text-foreground/60 text-xs uppercase">Top weak concept</p>
          <p className="text-foreground mt-1 text-sm font-medium">Recursion</p>
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
        {lessons.length === 0 ? (
          <p className="text-foreground/70 text-sm">Your professor has not published lessons yet.</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((l) => (
              <li key={l.id}>
                <Link
                  to={`/student/course/${c.id}/lesson/${l.id}`}
                  className="border-divider bg-surface hover:border-primary/40 block rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition-colors"
                >
                  Week {l.weekNumber}: {l.title}
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
                Tempo — {new Date(t.scheduledAt).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="font-heading text-foreground mb-3 text-lg">Completed events</h2>
        <EventAccordion events={demoCompleted(c.name)} />
      </section>
    </div>
  )
}
