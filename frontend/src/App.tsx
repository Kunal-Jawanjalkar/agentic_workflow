import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/app/AppLayout'
import { WorkflowEditorPage } from '@/components/app/WorkflowLayout'
import { WorkflowsPage } from '@/features/workflows/WorkflowsPage'
import { PlaceholderPage } from '@/features/app/PlaceholderPage'
import { GuestRoute } from '@/features/auth/GuestRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProtectedRoute } from '@/features/auth/ProtectedRoute'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { HomePage } from '@/features/home/HomePage'
import { RunsPage } from '@/features/runs/RunsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="workflows" element={<WorkflowsPage />} />
          <Route path="workflows/:workflowId" element={<WorkflowEditorPage />} />
          <Route path="runs" element={<RunsPage />} />
          <Route path="approvals" element={<PlaceholderPage title="Approvals" />} />
          <Route path="evals" element={<PlaceholderPage title="Evals" />} />
          <Route path="credentials" element={<PlaceholderPage title="Credentials" />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/register"
          element={
            <GuestRoute>
              <RegisterPage />
            </GuestRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
