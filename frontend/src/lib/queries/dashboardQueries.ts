import { studentDashboardFixture } from '@/lib/mocks/studentDashboard'
import { professorDashboardFixture } from '@/lib/mocks/professorDashboard'

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function fetchStudentDashboardMock() {
  await delay(200)
  return studentDashboardFixture
}

export async function fetchProfessorDashboardMock() {
  await delay(200)
  return professorDashboardFixture
}
