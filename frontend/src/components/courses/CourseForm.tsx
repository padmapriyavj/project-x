import { useState } from 'react'

import { Button } from '@/components/ui/Button'
import { TextAreaField, TextField } from '@/components/ui/FormField'
import type { CreateCourseRequest, UpdateCourseRequest } from '@/lib/api/types/course'

type CourseFormProps = {
  initialValues?: {
    name?: string
    description?: string | null
  }
  onSubmit: (data: CreateCourseRequest | UpdateCourseRequest) => void
  onCancel: () => void
  isSubmitting?: boolean
  submitLabel?: string
}

export function CourseForm({
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitLabel = 'Save',
}: CourseFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '')
  const [description, setDescription] = useState(initialValues?.description ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      description: description.trim() || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <TextField
        id="course-name"
        label="Course name"
        required
        minLength={2}
        maxLength={200}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g., CS 101 — Discrete Structures"
      />
      <TextAreaField
        id="course-description"
        label="Description (optional)"
        rows={3}
        maxLength={1000}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief course description..."
      />
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || !name.trim()}>
          {isSubmitting ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
