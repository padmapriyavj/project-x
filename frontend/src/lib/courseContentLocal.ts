/**
 * Client-side course materials, lessons, tempos, and notifications (PRD §7.2–7.4, §7.11)
 * until dedicated platform list/upload APIs are wired.
 * Lessons mirror backend: at most one linked material (PDF or PPT); no page/time ranges.
 */

export type MaterialType = 'pdf' | 'ppt'
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed'

export type LocalMaterial = {
  id: string
  courseId: number
  filename: string
  type: MaterialType
  processingStatus: ProcessingStatus
  /** Optional excerpt stored for “processing complete” simulation */
  excerpt?: string
  createdAt: string
}

export type LocalConcept = {
  id: string
  name: string
  description: string
}

export type LocalLesson = {
  id: string
  courseId: number
  title: string
  weekNumber: number
  /** At most one material per lesson (matches lessons.material_id). */
  materialId: string | null
  /** Cached after concept extraction (or demo seed) */
  concepts?: LocalConcept[]
  createdAt: string
}

export type LocalTempo = {
  id: string
  courseId: number
  lessonId: string
  scheduledAt: string
  status: 'scheduled' | 'live' | 'completed'
  createdAt: string
}

export type LocalNotification = {
  id: string
  title: string
  body: string
  read: boolean
  createdAt: string
  type: 'tempo' | 'system'
}

const KEY = 'deductible:courseContent:v1'

type Store = {
  materials: LocalMaterial[]
  lessons: LocalLesson[]
  tempos: LocalTempo[]
  notifications: LocalNotification[]
}

type LegacyLessonSource = {
  materialId: string
  kind?: string
  start?: number
  end?: number
}

type LegacyLessonRow = {
  id: string
  courseId: number
  title: string
  weekNumber: number
  materialId?: string | null
  sources?: LegacyLessonSource[]
  concepts?: LocalConcept[]
  createdAt: string
}

type LegacyMaterialRow = Omit<LocalMaterial, 'type'> & {
  type?: string
}

function normalizeMaterialType(t: string | undefined): MaterialType {
  if (t === 'pdf' || t === 'ppt') return t
  return 'ppt'
}

function migrateLesson(row: LegacyLessonRow): LocalLesson {
  let materialId: string | null = row.materialId ?? null
  if (!materialId && Array.isArray(row.sources) && row.sources.length > 0) {
    materialId = row.sources[0]?.materialId ?? null
  }
  return {
    id: row.id,
    courseId: row.courseId,
    title: row.title,
    weekNumber: row.weekNumber,
    materialId,
    concepts: row.concepts,
    createdAt: row.createdAt,
  }
}

function migrateMaterial(row: LegacyMaterialRow): LocalMaterial {
  return {
    ...row,
    type: normalizeMaterialType(row.type),
  } as LocalMaterial
}

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { materials: [], lessons: [], tempos: [], notifications: [] }
    const p = JSON.parse(raw) as {
      materials?: LegacyMaterialRow[]
      lessons?: LegacyLessonRow[]
      tempos?: LocalTempo[]
      notifications?: LocalNotification[]
    }
    const materials = Array.isArray(p.materials) ? p.materials.map(migrateMaterial) : []
    const lessons = Array.isArray(p.lessons) ? p.lessons.map(migrateLesson) : []
    const tempos = Array.isArray(p.tempos) ? p.tempos : []
    const notifications = Array.isArray(p.notifications) ? p.notifications : []
    return { materials, lessons, tempos, notifications }
  } catch {
    return { materials: [], lessons: [], tempos: [], notifications: [] }
  }
}

function save(s: Store) {
  localStorage.setItem(KEY, JSON.stringify(s))
}

export function listMaterials(courseId: number): LocalMaterial[] {
  return load().materials.filter((m) => m.courseId === courseId)
}

export function addMaterial(row: Omit<LocalMaterial, 'id' | 'createdAt'>): LocalMaterial {
  const s = load()
  const m: LocalMaterial = {
    ...row,
    type: normalizeMaterialType(row.type),
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  s.materials.push(m)
  save(s)
  return m
}

export function updateMaterial(id: string, patch: Partial<LocalMaterial>) {
  const s = load()
  const i = s.materials.findIndex((m) => m.id === id)
  if (i < 0) return
  const next = { ...s.materials[i], ...patch }
  if (patch.type !== undefined) next.type = normalizeMaterialType(patch.type)
  s.materials[i] = next
  save(s)
}

export function deleteMaterial(id: string) {
  const s = load()
  s.materials = s.materials.filter((m) => m.id !== id)
  s.lessons = s.lessons.map((l) => (l.materialId === id ? { ...l, materialId: null } : l))
  save(s)
}

export function listLessons(courseId: number): LocalLesson[] {
  return load().lessons.filter((l) => l.courseId === courseId)
}

export function getLesson(lessonId: string): LocalLesson | undefined {
  return load().lessons.find((l) => l.id === lessonId)
}

export function saveLesson(lesson: LocalLesson) {
  const s = load()
  const i = s.lessons.findIndex((l) => l.id === lesson.id)
  if (i >= 0) s.lessons[i] = lesson
  else s.lessons.push(lesson)
  save(s)
}

export function addLesson(
  row: Omit<LocalLesson, 'id' | 'createdAt' | 'concepts'>,
): LocalLesson {
  const lesson: LocalLesson = {
    ...row,
    materialId: row.materialId,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }
  const s = load()
  s.lessons.push(lesson)
  save(s)
  return lesson
}

export function deleteLesson(lessonId: string) {
  const s = load()
  s.lessons = s.lessons.filter((l) => l.id !== lessonId)
  save(s)
}

export function setLessonConcepts(lessonId: string, concepts: LocalConcept[]) {
  const s = load()
  const i = s.lessons.findIndex((l) => l.id === lessonId)
  if (i < 0) return
  s.lessons[i] = { ...s.lessons[i], concepts }
  save(s)
}

export function listTempos(courseId: number): LocalTempo[] {
  return load().tempos.filter((t) => t.courseId === courseId)
}

export function addTempo(row: Omit<LocalTempo, 'id' | 'createdAt' | 'status'> & { status?: LocalTempo['status'] }) {
  const s = load()
  const t: LocalTempo = {
    ...row,
    id: crypto.randomUUID(),
    status: row.status ?? 'scheduled',
    createdAt: new Date().toISOString(),
  }
  s.tempos.push(t)
  save(s)
  return t
}

export function listNotifications(): LocalNotification[] {
  return load().notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function addNotification(n: Omit<LocalNotification, 'id' | 'createdAt' | 'read'>) {
  const s = load()
  const row: LocalNotification = {
    ...n,
    id: crypto.randomUUID(),
    read: false,
    createdAt: new Date().toISOString(),
  }
  s.notifications.unshift(row)
  save(s)
  return row
}

export function markNotificationRead(id: string) {
  const s = load()
  const n = s.notifications.find((x) => x.id === id)
  if (n) n.read = true
  save(s)
}

/** Demo seed: upcoming tempo + notification */
export function seedCourseDemoAlerts(courseId: number, courseName: string) {
  const tempos = listTempos(courseId)
  if (tempos.length > 0) return
  const lessons = listLessons(courseId)
  const lessonId = lessons[0]?.id
  if (!lessonId) return
  const when = new Date(Date.now() + 86400000).toISOString()
  addTempo({ courseId, lessonId, scheduledAt: when })
  addNotification({
    title: 'Tempo scheduled',
    body: `A Tempo is scheduled for “${courseName}”.`,
    type: 'tempo',
  })
}
