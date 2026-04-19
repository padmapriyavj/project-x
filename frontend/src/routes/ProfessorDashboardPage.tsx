import { useQuery } from '@tanstack/react-query'

import { ProfessorCourseCard } from '@/components/dashboard/ProfessorCourseCard'
import { queryKeys } from '@/lib/queryKeys'
import { fetchProfessorDashboardMock } from '@/lib/queries/dashboardQueries'

export function ProfessorDashboardPage() {
  const dashboard = useQuery({
    queryKey: queryKeys.professorDashboard,
    queryFn: fetchProfessorDashboardMock,
  })

  return (
    <div className="text-left">
      <h1 className="mb-2 text-2xl">Professor dashboard</h1>
      <p className="text-foreground/75 mb-8 max-w-xl text-sm">
        Mock course analytics and roster — wired with TanStack Query for easy
        replacement with live API data.
      </p>

      {dashboard.isLoading ? (
        <p className="text-foreground/70 text-sm">Loading courses…</p>
      ) : null}
      {dashboard.isError ? (
        <p className="text-danger text-sm">Could not load dashboard.</p>
      ) : null}

      {dashboard.data ? (
        <div className="space-y-4">
          {dashboard.data.courses.map((c) => (
            <ProfessorCourseCard key={c.id} course={c} />
          ))}
        </div>
      ) : null}
    </div>
  )
}
