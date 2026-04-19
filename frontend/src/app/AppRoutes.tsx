import { Route, Routes } from 'react-router'

import { RequireAuth } from '@/components/auth/RequireAuth'
import { AppShell } from '@/components/layout/AppShell'
import { CoachPlaceholderPage } from '@/routes/CoachPlaceholderPage'
import { DuelVoicePreviewPage } from '@/routes/DuelVoicePreviewPage'
import { HomePage } from '@/routes/HomePage'
import { LoginPage } from '@/routes/LoginPage'
import { PracticeHubPage } from '@/routes/PracticeHubPage'
import { PracticeLobbyPage } from '@/routes/PracticeLobbyPage'
import { ProfessorDashboardPage } from '@/routes/ProfessorDashboardPage'
import { QuizResultsPage } from '@/routes/QuizResultsPage'
import { QuizRunnerPage } from '@/routes/QuizRunnerPage'
import { SignupPage } from '@/routes/SignupPage'
import { StudentDashboardPage } from '@/routes/StudentDashboardPage'
import { TempoScreenPage } from '@/routes/TempoScreenPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="signup" element={<SignupPage />} />
        <Route element={<RequireAuth allowedRoles={['student']} />}>
          <Route path="student" element={<StudentDashboardPage />} />
          <Route path="student/practice" element={<PracticeHubPage />} />
          <Route
            path="student/practice/lobby/:lessonId"
            element={<PracticeLobbyPage />}
          />
          <Route
            path="student/quiz/:roomId/results"
            element={<QuizResultsPage />}
          />
          <Route path="student/quiz/:roomId" element={<QuizRunnerPage />} />
          <Route path="student/tempo/:instanceId" element={<TempoScreenPage />} />
          <Route
            path="student/practice/duel-voice-preview"
            element={<DuelVoicePreviewPage />}
          />
          <Route path="coach" element={<CoachPlaceholderPage />} />
        </Route>
        <Route element={<RequireAuth allowedRoles={['professor']} />}>
          <Route path="professor" element={<ProfessorDashboardPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
