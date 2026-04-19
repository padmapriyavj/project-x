export const queryKeys = {
  studentDashboard: ['dashboard', 'student'] as const,
  professorDashboard: ['dashboard', 'professor'] as const,
  shopCatalog: ['shop', 'catalog'] as const,
  spaceLayout: ['space', 'layout', 'default'] as const,
  courses: ['courses'] as const,
  course: (id: number) => ['courses', id] as const,
  courseStudents: (id: number) => ['courses', id, 'students'] as const,
  courseJoinInfo: (id: number) => ['courses', id, 'join-info'] as const,
  lessonConcepts: (lessonId: string) => ['lessons', lessonId, 'concepts'] as const,
  quizDetail: (quizId: string) => ['quizzes', quizId] as const,
}
