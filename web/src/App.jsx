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
import Frameworks from './pages/Frameworks'
import Copilot   from './pages/Copilot'
import Evidence  from './pages/Evidence'
import FrameworkLibrary from './pages/FrameworkLibrary'
import Integrations from './pages/Integrations'
import Reports   from './pages/Reports'
import NotFound   from './pages/NotFound'

// Phase 6 pages
import PolicyGenerator   from './pages/PolicyGenerator'
import VendorRisk        from './pages/VendorRisk'
import ComplianceMonitor from './pages/ComplianceMonitor'
import Alerts            from './pages/Alerts'
import RegulatoryUpdates from './pages/RegulatoryUpdates'

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
              <Route path="/frameworks" element={<Frameworks />} />
              <Route path="/copilot"    element={<Copilot />}   />
              <Route path="/evidence"   element={<Evidence />}  />
              <Route path="/library"    element={<FrameworkLibrary />} />
              <Route path="/integrations" element={<Integrations />} />
              <Route path="/reports"    element={<Reports />}   />
              {/* Phase 6 */}
              <Route path="/policies"   element={<PolicyGenerator />}   />
              <Route path="/vendors"    element={<VendorRisk />}        />
              <Route path="/monitoring" element={<ComplianceMonitor />} />
              <Route path="/alerts"     element={<Alerts />}            />
              <Route path="/regulatory" element={<RegulatoryUpdates />} />
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
