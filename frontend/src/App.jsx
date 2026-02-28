import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute   from './components/ProtectedRoute'
import MainLayout       from './layouts/MainLayout'

// Pages
import Login      from './pages/Login'
import Register   from './pages/Register'
import Dashboard  from './pages/Dashboard'
import Controls   from './pages/Controls'
import Audit      from './pages/Audit'
import AIInsights from './pages/AIInsights'
import Compliance from './pages/Compliance'
import NotFound   from './pages/NotFound'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* ── Public routes ─────────────────────────────── */}
          <Route path="/login"    element={<Login />}    />
          <Route path="/register" element={<Register />} />

          {/* ── Protected routes (require auth) ───────────── */}
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
          </Route>

          {/* ── Redirect bare / to dashboard ──────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ── 404 ───────────────────────────────────────── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
