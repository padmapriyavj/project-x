import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router'

import { UploadMaterialModal } from '@/components/materials/UploadMaterialModal'
import { CourseForm } from '@/components/courses/CourseForm'
import { JoinCodeDisplay } from '@/components/courses/JoinCodeDisplay'
import { AvatarImg } from '@/components/ui/AvatarImg'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { SimpleModal } from '@/components/ui/SimpleModal'
import { Spinner } from '@/components/ui/Spinner'
import { deleteLesson, deleteMaterial, listLessons, listMaterials } from '@/lib/courseContentLocal'
import type { Student, UpdateCourseRequest } from '@/lib/api/types/course'
import {
  useCourseQuery,
  useCourseStudentsQuery,
  useUpdateCourseMutation,
} from '@/lib/queries/courseQueries'

function parseApiError(error: unknown): string {
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message)
      return parsed.detail || error.message
    } catch {
      return error.message
    }
  }
  return 'Something went wrong. Please try again.'
}

const rosterCell = 'px-4 py-3.5 align-middle sm:px-5 sm:py-4'

function studentRowInitials(student: Student) {
  const n = student.display_name.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase()
    return n.slice(0, 2).toUpperCase()
  }
  return student.email.slice(0, 2).toUpperCase()
}

function StudentRow({ student }: { student: Student }) {
  return (
    <tr className="border-divider/40 border-b last:border-0">
      <td className={rosterCell}>
        <div className="flex items-center gap-3">
          <AvatarImg
            user={{ id: student.id, email: student.email }}
            fallbackInitials={studentRowInitials(student)}
            size="sm"
            className="shrink-0"
          />
          <div className="min-w-0">
            <p className="font-medium">{student.display_name}</p>
            <p className="text-foreground/60 truncate text-xs">{student.email}</p>
          </div>
        </div>
      </td>
      <td className={`${rosterCell} font-mono text-sm tabular-nums`}>{student.coins}</td>
      <td className={`${rosterCell} font-mono text-sm tabular-nums`}>{student.current_streak} days</td>
    </tr>
  )
}

type Tab = 'students' | 'materials' | 'lessons'

export function ProfessorCoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const id = parseInt(courseId ?? '', 10)
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = (searchParams.get('tab') as Tab) || 'students'
  const setTab = (t: Tab) => {
    setSearchParams(t === 'students' ? {} : { tab: t })
  }

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [localTick, setLocalTick] = useState(0)

  const course = useCourseQuery(id)
  const students = useCourseStudentsQuery(id)
  const updateCourse = useUpdateCourseMutation(id)

  const materials = useMemo(() => (id > 0 ? listMaterials(id) : []), [id, localTick])
  const lessons = useMemo(() => (id > 0 ? listLessons(id) : []), [id, localTick])

  const handleUpdate = (data: UpdateCourseRequest) => {
    updateCourse.mutate(data, {
      onSuccess: () => setIsEditModalOpen(false),
    })
  }

  if (course.isLoading) {
    return <Spinner label="Loading course..." />
  }

  if (course.isError || !course.data) {
    return (
      <div className="text-left">
        <p className="text-danger mb-4 text-sm" role="alert">
          Could not load course.
        </p>
        <Link
          to="/professor"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const c = course.data

  const tabBtn = (t: Tab, label: string) => (
    <button
      key={t}
      type="button"
      role="tab"
      aria-selected={tab === t}
      onClick={() => setTab(t)}
      className={`min-h-11 rounded-[var(--radius-sm)] border px-4 py-2 text-sm font-medium transition-colors ${
        tab === t
          ? 'border-secondary bg-secondary text-surface'
          : 'border-divider text-foreground hover:bg-background'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="text-left">
      <nav className="mb-6">
        <Link
          to="/professor"
          className="text-primary inline-flex min-h-11 items-center text-sm font-medium underline-offset-2 hover:underline"
        >
          &larr; Back to dashboard
        </Link>
      </nav>

      <PageHeader
        title={c.name}
        description={
          <>
            {c.description ? (
              <span className="text-foreground/70 block max-w-2xl text-sm">{c.description}</span>
            ) : null}
            <span className="text-foreground/60 mt-2 block text-xs">
              Created: {new Date(c.created_at).toLocaleDateString()}
            </span>
          </>
        }
        actions={
          <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(true)} className="w-full sm:w-auto">
            Edit course
          </Button>
        }
      />

      <div className="mb-8 w-full max-w-full">
        <JoinCodeDisplay courseId={c.id} code={c.join_code} />
      </div>

      <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Course sections">
        {tabBtn('students', 'Students')}
        {tabBtn('materials', 'Materials')}
        {tabBtn('lessons', 'Lessons')}
      </div>

      {tab === 'students' ? (
        <section>
          <h2 className="font-heading text-foreground mb-4 text-lg">
            Enrolled students ({students.data?.length ?? 0})
          </h2>

          {students.isLoading ? <Spinner label="Loading students..." /> : null}
          {students.isError ? (
            <p className="text-danger text-sm" role="alert">
              Could not load students.
            </p>
          ) : null}

          {students.data ? (
            students.data.length > 0 ? (
              <div className="bg-surface shadow-soft border-divider/60 overflow-hidden rounded-[var(--radius-lg)] border">
                <div className="overflow-x-auto p-4 sm:p-5">
                  <table className="text-foreground/85 w-full min-w-[400px] border-collapse text-sm">
                    <thead>
                      <tr className="border-divider/60 bg-background/50 text-foreground/60 border-b text-left text-xs uppercase tracking-wide">
                        <th className={`${rosterCell} font-medium`}>Student</th>
                        <th className={`${rosterCell} font-medium`}>Coins</th>
                        <th className={`${rosterCell} font-medium`}>Streak</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.data.map((student) => (
                        <StudentRow key={student.id} student={student} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <Card padding="lg" className="text-center">
                <p className="text-foreground/70 text-sm">
                  No students enrolled yet. Share the join code with your students.
                </p>
              </Card>
            )
          ) : null}
        </section>
      ) : null}

      {tab === 'materials' ? (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-foreground text-lg">Materials</h2>
            <Button type="button" onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
              Upload material
            </Button>
          </div>
          {materials.length === 0 ? (
            <Card padding="lg">
              <p className="text-foreground/70 text-sm">
                No materials yet. Upload a PDF or PowerPoint file (.pdf, .ppt, .pptx).
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {materials.map((m) => (
                <li key={m.id}>
                  <Card padding="md" className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{m.filename}</p>
                      <p className="text-foreground/60 text-xs uppercase">
                        {m.type} · {m.processingStatus}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteMaterial(m.id)
                        setLocalTick((x) => x + 1)
                      }}
                    >
                      Remove
                    </Button>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {tab === 'lessons' ? (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-heading text-foreground text-lg">Lessons</h2>
            <Button
              type="button"
              fullWidth
              className="sm:w-auto"
              onClick={() => navigate(`/professor/course/${c.id}/lessons/new`)}
            >
              Create lesson
            </Button>
          </div>
          {lessons.length === 0 ? (
            <Card padding="lg">
              <p className="text-foreground/70 text-sm">
                No lessons yet. Create a weekly lesson and link one PDF or deck to it.
              </p>
            </Card>
          ) : (
            <ul className="space-y-3">
              {lessons.map((lesson) => {
                const linkedName =
                  lesson.materialId != null
                    ? materials.find((m) => m.id === lesson.materialId)?.filename
                    : undefined
                return (
                  <li key={lesson.id}>
                    <Card padding="md" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-heading font-medium">{lesson.title}</p>
                        <p className="text-foreground/60 text-sm">Week {lesson.weekNumber}</p>
                        {linkedName ? (
                          <p className="text-foreground/70 mt-1 truncate text-xs">File: {linkedName}</p>
                        ) : (
                          <p className="text-foreground/50 mt-1 text-xs">No file linked</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => navigate(`/professor/lesson/${lesson.id}/concepts`)}
                        >
                          Concepts
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this lesson?')) {
                              deleteLesson(lesson.id)
                              setLocalTick((x) => x + 1)
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </Card>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      ) : null}

      <UploadMaterialModal
        courseId={c.id}
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUploaded={() => setLocalTick((x) => x + 1)}
      />

      <SimpleModal title="Edit course" isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <div className="space-y-4">
          {updateCourse.isError ? (
            <p className="text-danger text-sm" role="alert">
              {parseApiError(updateCourse.error)}
            </p>
          ) : null}
          <CourseForm
            initialValues={{
              name: c.name,
              description: c.description,
            }}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditModalOpen(false)}
            isSubmitting={updateCourse.isPending}
            submitLabel="Update course"
          />
        </div>
      </SimpleModal>
    </div>
  )
}
