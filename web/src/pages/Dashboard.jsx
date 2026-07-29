import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts'
import { dashboardAPI, auditAPI, controlsAPI, getErrorMessage } from '../services/api'
import { ComplianceDonut }        from '../components/ComplianceBar'
import { RiskBadge, StatusBadge } from '../components/RiskBadge'
import { DashboardSkeleton }      from '../components/Skeleton'
import ErrorScreen                from '../components/ErrorScreen'
import OnboardingModal            from '../components/OnboardingModal'
import { useToast }               from '../context/ToastContext'
import { formatDate, formatAction } from '../utils/helpers'
import { useAuth }                from '../context/AuthContext'

// Chart colours
const STATUS_COLORS = { IMPLEMENTED: '#3fb950', PARTIAL: '#d29922', MISSING: '#f85149' }
const DONUT_COLORS  = ['#3fb950', '#d29922', '#f85149']

const CUSTOM_TOOLTIP_STYLE = {
  background: '#161b22',
  border: '1px solid #30363d',
  borderRadius: '8px',
  color: '#e6edf3',
  fontSize: '0.82rem',
  padding: '0.5rem 0.75rem',
}

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div style={CUSTOM_TOOLTIP_STYLE}>
        <strong>{payload[0].name}</strong>: {payload[0].value}
      </div>
    )
  }
  return null
}

export default function Dashboard() {
  const { user }             = useAuth()
  const { toast }            = useToast()
  const [summary, setSummary]      = useState(null)
  const [logs, setLogs]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [errorType, setErrorType]   = useState('500')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [seedingDemo, setSeedingDemo]       = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, auditRes] = await Promise.all([
          dashboardAPI.getSummary(),
          auditAPI.getLogs(),
        ])
        if (!cancelled) {
          setSummary(dashRes.data)
          setLogs(Array.isArray(auditRes.data) ? auditRes.data.slice(0, 5) : [])
        }
      } catch (err) {
        if (!cancelled) {
          const type = !err?.response ? 'offline' : err?.response?.status === 403 ? '403' : '500'
          const msg  = getErrorMessage(err, 'Failed to load dashboard data.')
          setErrorType(type)
          setError(msg)
          toast.error(msg)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    // Show onboarding modal for first-time users
    if (localStorage.getItem('rg_onboarding') === 'true') {
      localStorage.removeItem('rg_onboarding')
      setTimeout(() => setShowOnboarding(true), 600)
    }
    return () => { cancelled = true }
  }, [])

  if (loading) return <DashboardSkeleton />
  if (error)   return <ErrorScreen type={errorType} message={error} />

  // ── Demo data seeder ────────────────────────────────────────────────────
  const DEMO_CONTROLS = [
    { title: 'Access Control Policy',       description: 'Defines who can access which systems and data. Controls user authentication and authorisation procedures.', status: 'IMPLEMENTED', risk_level: 'LOW' },
    { title: 'Data Encryption Standard',    description: 'All sensitive data must be encrypted at rest (AES-256) and in transit (TLS 1.2+). Covers databases, backups, and API communication.', status: 'PARTIAL',     risk_level: 'HIGH' },
    { title: 'Incident Response Plan',      description: 'Documented procedures for identifying, containing, and recovering from security incidents. Includes escalation paths and communication templates.', status: 'MISSING',      risk_level: 'HIGH' },
    { title: 'Vendor Risk Assessment',      description: 'Third-party vendors handling sensitive data must complete a security questionnaire and be re-evaluated annually.', status: 'PARTIAL',     risk_level: 'MEDIUM' },
    { title: 'Employee Security Training',  description: 'All employees must complete annual security awareness training covering phishing, social engineering, and data handling procedures.', status: 'IMPLEMENTED', risk_level: 'MEDIUM' },
  ]

  async function loadDemoData() {
    setSeedingDemo(true)
    try {
      for (const ctrl of DEMO_CONTROLS) {
        await controlsAPI.create(ctrl)
      }
      toast.success('5 sample controls loaded! Refreshing…')
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load demo data.'))
      setSeedingDemo(false)
    }
  }

  const score = summary?.compliance_score ?? 0

  // Pie data
  const statusData = [
    { name: 'Implemented', value: summary?.implemented ?? 0 },
    { name: 'Partial',     value: summary?.partial     ?? 0 },
    { name: 'Missing',     value: summary?.missing     ?? 0 },
  ].filter((d) => d.value > 0)

  // Bar data
  const barData = [
    { name: 'Implemented', count: summary?.implemented ?? 0 },
    { name: 'Partial',     count: summary?.partial     ?? 0 },
    { name: 'Missing',     count: summary?.missing     ?? 0 },
  ]

  const metricCards = [
    {
      label: 'Total Controls',
      value: summary?.total_controls ?? 0,
      icon:  'bi-shield',
      color: '#4f8ef7',
      bg:    'rgba(79,142,247,0.12)',
    },
    {
      label: 'Implemented',
      value: summary?.implemented ?? 0,
      icon:  'bi-check-circle',
      color: '#3fb950',
      bg:    'rgba(63,185,80,0.12)',
    },
    {
      label: 'Partial',
      value: summary?.partial ?? 0,
      icon:  'bi-exclamation-circle',
      color: '#d29922',
      bg:    'rgba(210,153,34,0.12)',
    },
    {
      label: 'Missing',
      value: summary?.missing ?? 0,
      icon:  'bi-x-circle',
      color: '#f85149',
      bg:    'rgba(248,81,73,0.12)',
    },
  ]

  return (
    <div>
      {/* Onboarding modal — first-time users only */}
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Welcome banner */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            Good day, {user?.email?.split('@')[0] ?? 'User'} 👋
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#8b949e', margin: 0 }}>
            Here&apos;s your organisation&apos;s compliance overview.
          </p>
        </div>
        <Link to="/controls" className="btn rg-btn-primary btn-sm">
          <i className="bi bi-plus-lg me-1" /> New Control
        </Link>
      </div>

      {/* Getting Started guide — shown only when org has no controls yet */}
      {(summary?.total_controls ?? 0) === 0 && (
        <div
          className="rg-card mb-4"
          style={{ borderColor: 'rgba(79,142,247,0.3)', background: 'rgba(79,142,247,0.04)' }}
        >
          <div className="d-flex align-items-start gap-3">
            <div style={{ fontSize: '2rem', flexShrink: 0, lineHeight: 1 }}>🚀</div>
            <div style={{ flex: 1 }}>
              <h5 style={{ color: '#e6edf3', fontWeight: 700, margin: '0 0 0.3rem', fontSize: '1rem' }}>
                Welcome to RegIntel AI!
              </h5>
              <p style={{ color: '#8b949e', fontSize: '0.84rem', margin: '0 0 1rem', lineHeight: 1.6 }}>
                You&apos;re all set up. Follow these steps to get your compliance baseline started:
              </p>
              <div className="d-flex flex-column gap-2 mb-3">
                {[
                  { step: 1, text: 'Add your first control — e.g. “Access Control Policy”' },
                  { step: 2, text: 'Review your live compliance score and grade' },
                  { step: 3, text: 'Use AI Insights to identify gaps and get recommendations' },
                ].map(({ step, text }) => (
                  <div key={step} className="d-flex align-items-center gap-2">
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700, color: '#4f8ef7', flexShrink: 0,
                    }}>
                      {step}
                    </div>
                    <span style={{ fontSize: '0.84rem', color: '#c9d1d9' }}>{text}</span>
                  </div>
                ))}
              </div>
              <Link to="/controls" className="btn rg-btn-primary btn-sm">
                <i className="bi bi-plus-lg me-1" /> Add First Control
              </Link>
              <button
                className="btn btn-sm ms-2"
                style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9' }}
                onClick={loadDemoData}
                disabled={seedingDemo}
              >
                {seedingDemo ? (
                  <><span className="spinner-border spinner-border-sm me-1" /> Loading…</>
                ) : (
                  <><i className="bi bi-database-add me-1" /> Load Sample Data</>
                )}
              </button>
              <button
                className="btn btn-sm ms-1"
                style={{ background: 'none', border: 'none', color: '#4f8ef7', fontSize: '0.82rem', cursor: 'pointer' }}
                onClick={() => setShowOnboarding(true)}
              >
                <i className="bi bi-mortarboard me-1" /> Take tour
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI high-risk alert — shown when there are missing controls */}
      {(summary?.missing ?? 0) > 0 && (
        <div
          className="rg-card mb-4"
          style={{ borderColor: 'rgba(248,81,73,0.35)', background: 'rgba(248,81,73,0.04)', cursor: 'pointer' }}
          onClick={() => window.location.href = '/ai'}
        >
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div style={{
                width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                background: 'rgba(248,81,73,0.12)', border: '1px solid rgba(248,81,73,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#f85149', fontSize: '1.1rem',
              }}>
                <i className="bi bi-exclamation-triangle-fill" />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#f85149', fontSize: '0.92rem' }}>
                  AI detected {summary.missing} missing control{summary.missing !== 1 ? 's' : ''}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>
                  These gaps expose your organisation to compliance risk. Click to get AI remediation steps.
                </div>
              </div>
            </div>
            <i className="bi bi-arrow-right-circle" style={{ color: '#f85149', fontSize: '1.1rem', flexShrink: 0 }} />
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="row g-3 mb-4">
        {metricCards.map((m) => (
          <div className="col-6 col-xl-3" key={m.label}>
            <div className="rg-card h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="rg-metric-value">{m.value}</div>
                  <div className="rg-metric-label">{m.label}</div>
                </div>
                <div className="rg-metric-icon" style={{ background: m.bg, color: m.color }}>
                  <i className={`bi ${m.icon}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="row g-3 mb-4">
        {/* Compliance Score (donut) */}
        <div className="col-12 col-lg-4">
          <div className="rg-card h-100 d-flex flex-column align-items-center justify-content-center">
            <p className="rg-card-title mb-3">Compliance Score</p>
            <ComplianceDonut score={score} size={160} />
            <p className="mt-3 mb-0 text-center" style={{ fontSize: '0.8rem', color: '#8b949e', maxWidth: '180px' }}>
              {score >= 75
                ? '✅ Great compliance posture'
                : score >= 40
                ? '⚠️ Needs improvement'
                : '🚨 Critical — take action now'}
            </p>
          </div>
        </div>

        {/* Status Pie */}
        <div className="col-12 col-lg-4">
          <div className="rg-card h-100">
            <div className="rg-card-header">
              <p className="rg-card-title">Control Status Breakdown</p>
            </div>
            {statusData.length === 0 ? (
              <div className="rg-empty" style={{ padding: '2rem 0' }}>
                <i className="bi bi-pie-chart" style={{ fontSize: '2rem' }} />
                <p style={{ fontSize: '0.85rem' }}>No controls yet</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            {/* Legend */}
            <div className="d-flex justify-content-center gap-3 flex-wrap mt-2">
              {['Implemented','Partial','Missing'].map((s, i) => (
                <div key={s} className="d-flex align-items-center gap-1" style={{ fontSize: '0.75rem', color: '#8b949e' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: DONUT_COLORS[i], display: 'inline-block' }} />
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bar chart */}
        <div className="col-12 col-lg-4">
          <div className="rg-card h-100">
            <div className="rg-card-header">
              <p className="rg-card-title">Controls Overview</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: '0.72rem' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b949e', fontSize: '0.72rem' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Audit Logs */}
      <div className="rg-card">
        <div className="rg-card-header">
          <p className="rg-card-title">
            <i className="bi bi-clock-history me-2" style={{ color: '#4f8ef7' }} />
            Recent Activity
          </p>
          <Link to="/audit" style={{ fontSize: '0.8rem', color: '#4f8ef7', textDecoration: 'none' }}>
            View all →
          </Link>
        </div>

        {logs.length === 0 ? (
          <div className="rg-empty" style={{ padding: '1.5rem 0' }}>
            <p style={{ fontSize: '0.85rem' }}>No recent activity</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table rg-table mb-0">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td>
                      <span style={{ fontWeight: 500 }}>{formatAction(log.action)}</span>
                    </td>
                    <td style={{ color: '#8b949e' }}>{log.entity_type ?? '—'}</td>
                    <td style={{ color: '#8b949e' }}>{formatDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
