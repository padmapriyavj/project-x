import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'

import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { TextField } from '@/components/ui/FormField'
import { Spinner } from '@/components/ui/Spinner'
import { addLesson, listMaterials } from '@/lib/courseContentLocal'
import { useCourseQuery } from '@/lib/queries/courseQueries'

export function CreateLessonPage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()

  const course = useCourseQuery(id)
  const [title, setTitle] = useState('')
  const [week, setWeek] = useState(1)
  const [materialId, setMaterialId] = useState<string | null>(null)

  const materials = useMemo(
    () =>
      id > 0
        ? listMaterials(id).filter((m) => m.processingStatus === 'ready' && (m.type === 'pdf' || m.type === 'ppt'))
        : [],
    [id],
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !materialId) return
    const lesson = addLesson({
      courseId: id,
      title: title.trim(),
      weekNumber: week,
      materialId,
    })
    navigate(`/professor/lesson/${lesson.id}/concepts`)
  }

  if (course.isLoading) return <Spinner label="Loading course..." />
  if (course.isError || !course.data) {
    return (
      <p className="text-danger text-sm">
        Could not load course.{' '}
        <Link to="/professor" className="text-primary underline">
          Back
        </Link>
      </p>
    )
  }

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to={`/professor/course/${id}?tab=lessons`}
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to lessons
        </Link>
      </nav>

      <PageHeader
        title="Create lesson"
        description={`Course: ${course.data.name}. Link one PDF or PowerPoint deck to this lesson (full document — no page ranges).`}
      />

      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
        <TextField
          id="lesson-title"
          label="Lesson title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Week 3: Sorting"
        />
        <TextField
          id="lesson-week"
          label="Week number"
          type="number"
          min={1}
          max={52}
          value={String(week)}
          onChange={(e) => setWeek(parseInt(e.target.value, 10) || 1)}
        />

        <div>
          <p className="text-foreground mb-2 text-sm font-medium">Linked material (ready PDF or PPT)</p>
          {materials.length === 0 ? (
            <Card padding="md">
              <p className="text-foreground/70 text-sm">Upload a ready PDF or PowerPoint file first.</p>
            </Card>
          ) : (
            <ul className="space-y-3" role="radiogroup" aria-label="Choose one material">
              {materials.map((m) => (
                <li key={m.id}>
                  <Card padding="md">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="radio"
                        name="lesson-material"
                        className="mt-1"
                        checked={materialId === m.id}
                        onChange={() => setMaterialId(m.id)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{m.filename}</p>
                        <p className="text-foreground/60 text-xs uppercase">{m.type}</p>
                      </div>
                    </label>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim() || !materialId}>
            Save and review concepts
          </Button>
        </div>
      </form>
    </div>
  )
}
