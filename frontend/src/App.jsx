import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute    from './components/ProtectedRoute'
import MainLayout        from './layouts/MainLayout'
import ErrorBoundary     from './components/ErrorBoundary'

// Pages
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Controls   from './pages/Controls'
import Audit      from './pages/Audit'
import AIInsights from './pages/AIInsights'
import Compliance from './pages/Compliance'
import Admin      from './pages/Admin'
import OrgSettings from './pages/OrgSettings'
import NotFound   from './pages/NotFound'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
          <Routes>
            {/* ── Public ──────────────────────────────────── */}
            <Route path="/login"    element={<Login />}    />
            <Route path="/register" element={<Register />} />

            {/* ── Protected (authenticated layout shell) ──── */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"  element={<Dashboard />}  />
              <Route path="/controls"   element={<Controls />}   />
              <Route path="/compliance" element={<Compliance />} />
              <Route path="/audit"      element={<Audit />}      />
              <Route path="/ai"         element={<AIInsights />} />
              <Route path="/admin"      element={<Admin />}      />
              <Route path="/settings"   element={<OrgSettings />} />
            </Route>

            {/* ── Catch-all ───────────────────────────────── */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  )
}
