import { useState, useEffect } from 'react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Tooltip, PieChart, Pie, Legend,
} from 'recharts'
import { dashboardAPI, complianceAPI, getErrorMessage } from '../services/api'
import { ComplianceDonut, ComplianceBar } from '../components/ComplianceBar'
import ErrorScreen from '../components/ErrorScreen'
import { getScoreColor } from '../utils/helpers'

const COLORS = ['#3fb950', '#d29922', '#f85149']

function CustomTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div style={{
        background: '#161b22', border: '1px solid #30363d',
        borderRadius: '8px', color: '#e6edf3',
        fontSize: '0.82rem', padding: '0.5rem 0.75rem',
      }}>
        <strong>{payload[0].name}</strong>: {payload[0].value}
      </div>
    )
  }
  return null
}

export default function Compliance() {
  const [summary, setSummary]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [errorType, setErrorType] = useState('500')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [dashRes, scoreRes] = await Promise.all([
          dashboardAPI.getSummary(),
          complianceAPI.getScore(),
        ])
        if (!cancelled) {
          setSummary({ ...dashRes.data, ...scoreRes.data })
        }
      } catch (err) {
        if (!cancelled) {
          const type = !err?.response ? 'offline' : err?.response?.status === 403 ? '403' : '500'
          setErrorType(type)
          setError(getErrorMessage(err, 'Failed to load compliance data.'))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div>
        <div className="mb-4">
          <div className="rg-skeleton" style={{ width: '200px', height: '20px', marginBottom: '8px' }} />
          <div className="rg-skeleton" style={{ width: '300px', height: '14px' }} />
        </div>
        <div className="row g-3 mb-4">
          <div className="col-12 col-lg-4">
            <div className="rg-card d-flex flex-column align-items-center" style={{ minHeight: '220px', justifyContent: 'center' }}>
              <div className="rg-skeleton" style={{ width: '120px', height: '120px', borderRadius: '50%', marginBottom: '1rem' }} />
              <div className="rg-skeleton" style={{ width: '80px', height: '14px', marginBottom: '0.5rem' }} />
              <div className="rg-skeleton" style={{ width: '50px', height: '32px' }} />
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="row g-3">
              {[...Array(4)].map((_, i) => (
                <div className="col-6" key={i}>
                  <div className="rg-card">
                    <div className="rg-skeleton" style={{ width: '40%', height: '28px', marginBottom: '8px' }} />
                    <div className="rg-skeleton" style={{ width: '70%', height: '13px' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rg-card mb-4" style={{ minHeight: '80px' }}>
          <div className="rg-skeleton" style={{ width: '180px', height: '14px', marginBottom: '1rem' }} />
          <div className="rg-skeleton" style={{ width: '100%', height: '20px', borderRadius: '10px' }} />
        </div>
        <div className="row g-3">
          {[...Array(2)].map((_, i) => (
            <div className="col-12 col-lg-6" key={i}>
              <div className="rg-card" style={{ minHeight: '240px' }}>
                <div className="rg-skeleton" style={{ width: '55%', height: '14px', marginBottom: '1rem' }} />
                <div className="rg-skeleton" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) return <ErrorScreen type={errorType} message={error} />

  const score = summary?.compliance_score ?? 0
  const color = getScoreColor(score)

  const total       = summary?.total_controls ?? 0
  const implemented = summary?.implemented    ?? 0
  const partial     = summary?.partial        ?? 0
  const missing     = summary?.missing        ?? 0

  const implPct = total ? Math.round((implemented / total) * 100) : 0
  const partPct = total ? Math.round((partial     / total) * 100) : 0
  const missPct = total ? Math.round((missing     / total) * 100) : 0

  const pieData = [
    { name: 'Implemented', value: implemented },
    { name: 'Partial',     value: partial     },
    { name: 'Missing',     value: missing     },
  ].filter((d) => d.value > 0)

  const barData = [
    { name: 'Implemented', count: implemented },
    { name: 'Partial',     count: partial     },
    { name: 'Missing',     count: missing     },
  ]

  // Gauge-grade label
  let grade = 'F'
  if (score >= 90) grade = 'A+'
  else if (score >= 80) grade = 'A'
  else if (score >= 70) grade = 'B'
  else if (score >= 60) grade = 'C'
  else if (score >= 50) grade = 'D'

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          Compliance Analytics
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
          Detailed view of your organisation&apos;s compliance posture
        </p>
      </div>

      {/* Score hero */}
      <div className="row g-3 mb-4 align-items-stretch">
        {/* Donut */}
        <div className="col-12 col-md-4">
          <div className="rg-card h-100 d-flex flex-column align-items-center justify-content-center text-center">
            <ComplianceDonut score={score} size={170} />
            <div className="mt-3">
              <span style={{
                fontSize: '2.5rem', fontWeight: 800, color,
                lineHeight: 1, display: 'block',
              }}>{grade}</span>
              <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>Compliance Grade</span>
            </div>
          </div>
        </div>

        {/* Breakdown cards */}
        <div className="col-12 col-md-8">
          <div className="row g-3 h-100">
            {[
              { label: 'Total Controls',   value: total,       pct: null,     color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)',  icon: 'bi-shield' },
              { label: 'Implemented',       value: implemented, pct: implPct,  color: '#3fb950', bg: 'rgba(63,185,80,0.1)',   icon: 'bi-check-circle' },
              { label: 'Partial',           value: partial,     pct: partPct,  color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: 'bi-exclamation-circle' },
              { label: 'Missing / Gaps',    value: missing,     pct: missPct,  color: '#f85149', bg: 'rgba(248,81,73,0.1)',  icon: 'bi-x-circle' },
            ].map((m) => (
              <div className="col-6" key={m.label}>
                <div className="rg-card h-100">
                  <div className="d-flex align-items-center gap-3 mb-2">
                    <div className="rg-metric-icon" style={{ background: m.bg, color: m.color }}>
                      <i className={`bi ${m.icon}`} />
                    </div>
                    <div>
                      <div className="rg-metric-value" style={{ fontSize: '1.6rem' }}>{m.value}</div>
                      <div className="rg-metric-label">{m.label}</div>
                    </div>
                  </div>
                  {m.pct !== null && (
                    <div className="rg-progress-bar-wrap">
                      <div className="rg-progress-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Score progress bar */}
      <div className="rg-card mb-4">
        <div className="rg-card-header">
          <p className="rg-card-title">Overall Compliance Score</p>
          <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>
            {score >= 75 ? '✅ Passing' : score >= 40 ? '⚠️ At Risk' : '🔴 Critical'}
          </span>
        </div>
        <ComplianceBar score={score} />
        <div className="d-flex justify-content-between mt-2" style={{ fontSize: '0.72rem', color: '#484f58' }}>
          <span>0% — Critical</span>
          <span>40% — At Risk</span>
          <span>75% — Passing</span>
          <span>100% — Perfect</span>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3">
        {/* Pie */}
        <div className="col-12 col-lg-5">
          <div className="rg-card h-100">
            <div className="rg-card-header">
              <p className="rg-card-title">Status Distribution</p>
            </div>
            {pieData.length === 0 ? (
              <div className="rg-empty" style={{ padding: '2rem 0' }}>
                <p style={{ fontSize: '0.85rem' }}>No controls yet.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData} cx="50%" cy="50%"
                    outerRadius={90} paddingAngle={3} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Bar */}
        <div className="col-12 col-lg-7">
          <div className="rg-card h-100">
            <div className="rg-card-header">
              <p className="rg-card-title">Control Counts by Status</p>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                <XAxis dataKey="name" tick={{ fill: '#8b949e', fontSize: '0.75rem' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8b949e', fontSize: '0.75rem' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={70}>
                  {barData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
