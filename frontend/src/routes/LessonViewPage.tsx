import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { getLesson, listMaterials } from '@/lib/courseContentLocal'
import { useCourseQuery } from '@/lib/queries/courseQueries'

export function LessonViewPage() {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId: string }>()
  const cid = parseInt(courseId ?? '', 10)
  const lid = lessonId ?? ''
  const navigate = useNavigate()
  const course = useCourseQuery(cid)
  const lesson = getLesson(lid)
  const materials = listMaterials(cid)

  if (!lesson || lesson.courseId !== cid) {
    return (
      <p className="text-danger text-sm">
        Lesson not found.{' '}
        <Link to={`/student/course/${cid}`} className="text-primary underline">
          Back to course
        </Link>
      </p>
    )
  }

  const linked =
    lesson.materialId != null
      ? materials.find((m) => m.id === lesson.materialId)?.filename ?? null
      : null

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/student/course/${cid}`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to course
        </Link>
      </nav>

      <PageHeader
        title={lesson.title}
        description={
          <>
            Week {lesson.weekNumber}
            {course.data ? (
              <span className="text-foreground/60 mt-2 block text-sm">Course: {course.data.name}</span>
            ) : null}
          </>
        }
      />

      <Card padding="lg" className="mb-6">
        <h2 className="font-heading text-foreground mb-2 text-lg">Material</h2>
        <p className="text-foreground/80 text-sm">
          {linked ? (
            <>
              Linked file: <span className="text-foreground font-medium">{linked}</span>
            </>
          ) : (
            'No file linked to this lesson yet.'
          )}
        </p>
      </Card>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          navigate(`/student/practice/lobby/${lid}`, {
            state: { courseName: lesson.title },
          })
        }
      >
        Start practice test for this lesson
      </Button>
    </div>
  )
}
