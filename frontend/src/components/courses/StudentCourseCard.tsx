import { Link } from 'react-router'

import { Card } from '@/components/ui/Card'
import type { Course } from '@/lib/api/types/course'

type Props = { course: Course }

export function StudentCourseCard({ course }: Props) {
  return (
    <Card padding="none" className="overflow-hidden">
      <div className="border-divider/40 flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="min-w-0 flex-1">
          <Link
            to={`/student/course/${course.id}`}
            className="font-heading text-foreground hover:text-primary text-lg transition-colors sm:text-xl"
          >
            {course.name}
          </Link>
          {course.description ? (
            <p className="text-foreground/70 mt-2 text-sm leading-relaxed">{course.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col gap-2 sm:items-end">
          <Link
            to={`/student/practice/lobby/${course.id}`}
            state={{ courseName: course.name }}
            className="bg-secondary text-surface hover:opacity-95 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-sm)] px-4 py-2.5 text-center text-sm font-semibold transition-opacity"
          >
            Start practice test
          </Link>
          <Link
            to={`/student/course/${course.id}`}
            className="text-primary inline-flex min-h-11 items-center justify-center text-sm font-medium underline-offset-2 hover:underline sm:justify-end"
          >
            View course detail
          </Link>
        </div>
      </div>
    </Card>
  )
}
