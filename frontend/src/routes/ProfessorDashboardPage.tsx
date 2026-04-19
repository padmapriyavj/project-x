import { useState } from 'react'
import { Link } from 'react-router'

import { CreateCourseModal } from '@/components/courses/CreateCourseModal'
import { JoinCodeDisplay } from '@/components/courses/JoinCodeDisplay'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import type { Course } from '@/lib/api/types/course'
import { useCoursesQuery } from '@/lib/queries/courseQueries'

function ProfessorCourseCardReal({ course }: { course: Course }) {
  return (
    <Card padding="none" className="text-left">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Link
            to={`/professor/course/${course.id}`}
            className="font-heading text-foreground hover:text-primary inline-flex min-h-11 items-center text-lg transition-colors"
          >
            {course.name}
          </Link>
          {course.description ? (
            <p className="text-foreground/70 mt-1 text-sm">{course.description}</p>
          ) : null}
          <p className="text-foreground/60 mt-2 text-xs">
            Created: {new Date(course.created_at).toLocaleDateString()}
          </p>
        </div>
        <div className="w-full shrink-0 sm:w-auto sm:max-w-[min(100%,20rem)]">
          <JoinCodeDisplay courseId={course.id} code={course.join_code} />
        </div>
      </div>
      <div className="border-divider/40 flex items-center gap-4 border-t px-4 py-3">
        <Link
          to={`/professor/course/${course.id}`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          View details
        </Link>
      </div>
    </Card>
  )
}

export function ProfessorDashboardPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const courses = useCoursesQuery()

  return (
    <div className="text-left">
      <PageHeader
        title="Professor dashboard"
        description="Manage your courses, view enrolled students, and share join codes."
        actions={
          <Button type="button" onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
            Create course
          </Button>
        }
      />

      {courses.isLoading ? <Spinner label="Loading courses..." /> : null}
      {courses.isError ? (
        <p className="text-danger text-sm" role="alert">
          Could not load courses. Please try again.
        </p>
      ) : null}

      {courses.data ? (
        courses.data.length > 0 ? (
          <div className="space-y-4">
            {courses.data.map((c) => (
              <ProfessorCourseCardReal key={c.id} course={c} />
            ))}
          </div>
        ) : (
          <Card padding="lg" className="text-center">
            <p className="text-foreground/70 mb-4 text-sm">You have not created any courses yet.</p>
            <Button type="button" onClick={() => setIsCreateModalOpen(true)}>
              Create your first course
            </Button>
          </Card>
        )
      ) : null}

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  )
}
