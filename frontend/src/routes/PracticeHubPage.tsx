import { Link } from 'react-router'

import { studentDashboardFixture } from '@/lib/mocks/studentDashboard'

/** Entry to practice flows (PRD §7.5) — uses mock course list until enrollment API exists. */
export function PracticeHubPage() {
  return (
    <section className="text-left">
      <h1 className="mb-2 text-2xl">Practice test</h1>
      <p className="text-foreground/75 mb-6 max-w-xl text-sm">
        Pick a lesson to open the lobby (solo or duel), place Betcha, then run the
        quiz shell. Data is mocked from the student dashboard fixture.
      </p>
      <ul className="space-y-3">
        {studentDashboardFixture.courses.map((course) => (
          <li key={course.id}>
            <Link
              to={`/student/practice/lobby/${course.id}`}
              state={{ courseName: course.name }}
              className="bg-surface shadow-soft border-divider/60 inline-flex rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition-colors hover:border-primary/40"
            >
              Lobby: {course.name}
            </Link>
          </li>
        ))}
      </ul>
      <p className="text-foreground/60 mt-6 text-xs">
        Tempo flow:{' '}
        <Link to="/student/tempo/demo" className="text-primary underline-offset-2 hover:underline">
          open demo Tempo screen
        </Link>
        .
      </p>
    </section>
  )
}
