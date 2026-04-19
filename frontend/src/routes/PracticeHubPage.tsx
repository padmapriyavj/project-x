import { Link } from 'react-router'

import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { studentDashboardFixture } from '@/lib/mocks/studentDashboard'

/** Entry to practice flows — uses mock course list until enrollment API exists. */
export function PracticeHubPage() {
  return (
    <section className="text-left">
      <PageHeader
        title="Practice test"
        description="Pick a lesson to open the lobby (solo or duel), place Betcha, then run the quiz shell. Data is mocked from the student dashboard fixture."
      />

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {studentDashboardFixture.courses.map((course) => (
          <li key={course.id}>
            <Card padding="md" className="h-full">
              <h2 className="font-heading text-foreground text-lg">{course.name}</h2>
              <p className="text-foreground/70 mt-2 text-sm">Open the practice lobby for this course.</p>
              <Link
                to={`/student/practice/lobby/${course.id}`}
                state={{ courseName: course.name }}
                className="bg-primary text-surface shadow-soft border-primary/20 mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--radius-sm)] border px-4 text-sm font-semibold transition-opacity hover:opacity-95 sm:w-auto"
              >
                Open lobby
              </Link>
            </Card>
          </li>
        ))}
      </ul>
      <p className="text-foreground/60 mt-6 text-xs">
        Tempo flow:{' '}
        <Link
          to="/student/tempo/demo"
          className="text-primary inline-flex min-h-11 items-center underline-offset-2 hover:underline"
        >
          Open demo Tempo screen
        </Link>
        .
      </p>
    </section>
  )
}
