import { Route, Routes } from 'react-router'

import { AppShell } from '@/components/layout/AppShell'
import { HomePage } from '@/routes/HomePage'
import { LoginPage } from '@/routes/LoginPage'
import { ProfessorDashboardPage } from '@/routes/ProfessorDashboardPage'
import { SignupPage } from '@/routes/SignupPage'
import { StudentDashboardPage } from '@/routes/StudentDashboardPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route path="student" element={<StudentDashboardPage />} />
        <Route path="professor" element={<ProfessorDashboardPage />} />
      </Route>
    </Routes>
  )
}
