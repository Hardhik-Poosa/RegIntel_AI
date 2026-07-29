import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, ResponsiveContainer, Tooltip,
} from 'recharts'
import { complianceAPI, controlsAPI, getErrorMessage } from '../services/api'
import { ComplianceDonut, ComplianceBar } from '../components/ComplianceBar'
import ErrorScreen  from '../components/ErrorScreen'
import ReportExport from '../components/ReportExport'
import { getScoreColor } from '../utils/helpers'
import { useAuth } from '../context/AuthContext'

// ── Constants ─────────────────────────────────────────────────────────────────
const STATUS_COLOR = { IMPLEMENTED: '#3fb950', PARTIAL: '#d29922', MISSING: '#f85149' }
const RISK_BADGE   = { HIGH: '#f85149', MEDIUM: '#d29922', LOW: '#3fb950' }
const RISK_WEIGHTS = { HIGH: 10, MEDIUM: 5, LOW: 2 }

function LineTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
      color: '#e6edf3', fontSize: '0.8rem', padding: '0.4rem 0.75rem',
    }}>
      <div style={{ color: '#8b949e', fontSize: '0.72rem', marginBottom: 2 }}>{label}</div>
      <strong style={{ color: '#4f8ef7' }}>{payload[0].value}%</strong>
    </div>
  )
}

// Risk heatmap — 3×3 grid showing controls by risk level × status
function RiskHeatmap({ byRisk }) {
  const risks    = ['HIGH', 'MEDIUM', 'LOW']
  const statuses = ['IMPLEMENTED', 'PARTIAL', 'MISSING']
  const labels   = { IMPLEMENTED: 'Implemented', PARTIAL: 'Partial', MISSING: 'Missing' }

  return (
    <div>
      <div className="rg-card-header mb-3">
        <p className="rg-card-title">
          <i className="bi bi-grid-3x3 me-2" style={{ color: '#bc8cff' }} />
          Risk × Status Heatmap
        </p>
        <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>
          Weight: HIGH=10 · MEDIUM=5 · LOW=2
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th style={{
                padding: '8px 12px', color: '#8b949e', fontWeight: 600,
                textAlign: 'left', borderBottom: '1px solid #21262d',
              }}>
                Risk Level
              </th>
              {statuses.map((s) => (
                <th key={s} style={{
                  padding: '8px 12px', color: STATUS_COLOR[s], fontWeight: 600,
                  textAlign: 'center', borderBottom: '1px solid #21262d',
                }}>
                  {labels[s]}
                </th>
              ))}
              <th style={{
                padding: '8px 12px', color: '#8b949e', fontWeight: 600,
                textAlign: 'center', borderBottom: '1px solid #21262d',
              }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {risks.map((risk, ri) => {
              const row = byRisk?.[risk] ?? { implemented: 0, partial: 0, missing: 0, total: 0 }
              return (
                <tr key={risk} style={{ borderBottom: ri < 2 ? '1px solid #21262d' : 'none' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <div className="d-flex align-items-center gap-2">
                      <span style={{
                        display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                        background: RISK_BADGE[risk], flexShrink: 0,
                      }} />
                      <span style={{ fontWeight: 600, color: RISK_BADGE[risk] }}>{risk}</span>
                      <span style={{ fontSize: '0.7rem', color: '#484f58' }}>×{RISK_WEIGHTS[risk]}</span>
                    </div>
                  </td>
                  {statuses.map((s) => {
                    const val      = row[s.toLowerCase()] ?? 0
                    const color    = STATUS_COLOR[s]
                    const alpha    = val > 0 ? Math.min(0.06 + val * 0.08, 0.28) : 0
                    const hexAlpha = Math.round(alpha * 255).toString(16).padStart(2, '0')
                    return (
                      <td key={s} style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 34, height: 34, borderRadius: 8,
                          background: val > 0 ? `${color}${hexAlpha}` : 'transparent',
                          fontWeight: val > 0 ? 700 : 400,
                          color: val > 0 ? color : '#484f58',
                          fontSize: val > 0 ? '1rem' : '0.85rem',
                        }}>
                          {val > 0 ? val : '—'}
                        </div>
                      </td>
                    )
                  })}
                  <td style={{ padding: '10px 12px', textAlign: 'center', color: '#8b949e', fontWeight: 600 }}>
                    {row.total ?? 0}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Score insight panel ────────────────────────────────────────────────────────
function ScoreInsightPanel({ data }) {
  const highMissing = data?.high_risk_missing ?? 0
  const maxGain     = data?.max_score_gain    ?? 0

  if (highMissing === 0 && maxGain === 0) return null

  return (
    <div className="rg-card mb-4" style={{
      borderLeft: `3px solid ${highMissing > 0 ? '#f85149' : '#d29922'}`,
    }}>
      <div className="rg-card-header mb-3">
        <p className="rg-card-title">
          <i
            className={`bi ${highMissing > 0 ? 'bi-exclamation-triangle' : 'bi-info-circle'} me-2`}
            style={{ color: highMissing > 0 ? '#f85149' : '#d29922' }}
          />
          Score Insights
        </p>
      </div>
      <div className="row g-3">
        {[
          {
            label: 'HIGH-risk gaps',
            value: highMissing > 0 ? `${highMissing} missing` : 'None ✅',
            note:  'Controls with HIGH risk still unimplemented',
            color: highMissing > 0 ? '#f85149' : '#3fb950',
          },
          {
            label: 'Max achievable gain',
            value: maxGain > 0 ? `+${maxGain}%` : 'Maximised',
            note:  'if all missing → implemented',
            color: '#3fb950',
          },
          {
            label: 'HIGH missing penalty',
            value: highMissing > 0 ? `${highMissing} control${highMissing !== 1 ? 's' : ''}` : 'None ✅',
            note:  '×10 weight each',
            color: highMissing > 0 ? '#f85149' : '#3fb950',
          },
        ].map(({ label, value, note, color: c }) => (
          <div className="col-12 col-md-4" key={label}>
            <div className="d-flex flex-column" style={{ padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.75rem', color: '#8b949e', marginBottom: 4 }}>{label}</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, color: c, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: '0.72rem', color: '#484f58', marginTop: 4 }}>{note}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Compliance() {
  const { user }                = useAuth()
  const [data, setData]         = useState(null)
  const [controls, setControls] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [errorType, setErrorType] = useState('500')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [detRes, ctrlRes] = await Promise.all([
          complianceAPI.getDetailed(),
          controlsAPI.getAll(),
        ])
        if (!cancelled) {
          setData(detRes.data)
          setControls(ctrlRes.data ?? [])
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
        <div className="rg-card mb-4" style={{ minHeight: '240px' }}>
          <div className="rg-skeleton" style={{ width: '180px', height: '14px', marginBottom: '1rem' }} />
          <div className="rg-skeleton" style={{ width: '100%', height: '200px', borderRadius: '8px' }} />
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

  const score = data?.compliance_score ?? 0
  const grade = data?.grade            ?? 'F'
  const color = getScoreColor(score)
  const total = data?.total_controls   ?? 0

  const byStatus = data?.by_status ?? {}
  const byRisk   = data?.by_risk   ?? {}
  const trend    = data?.trend     ?? []

  const implemented = byStatus.IMPLEMENTED ?? 0
  const partial     = byStatus.PARTIAL     ?? 0
  const missing     = byStatus.MISSING     ?? 0

  const implPct = total ? Math.round((implemented / total) * 100) : 0
  const partPct = total ? Math.round((partial     / total) * 100) : 0
  const missPct = total ? Math.round((missing     / total) * 100) : 0

  const trendData = trend.map((t) => ({
    date:  new Date(t.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
    score: t.score,
  }))

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-start justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            Compliance Analytics
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
            Weighted risk scoring — HIGH×10 · MEDIUM×5 · LOW×2
          </p>
        </div>
        <ReportExport
          data={data}
          controls={controls}
          orgName={user?.organization_name ?? 'My Organisation'}
        />
      </div>

      {/* Score hero */}
      <div className="row g-3 mb-4 align-items-stretch">
        {/* Donut + grade */}
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
              { label: 'Total Controls', value: total,       pct: null,    color: '#4f8ef7', bg: 'rgba(79,142,247,0.1)',  icon: 'bi-shield' },
              { label: 'Implemented',    value: implemented, pct: implPct, color: '#3fb950', bg: 'rgba(63,185,80,0.1)',   icon: 'bi-check-circle' },
              { label: 'Partial',        value: partial,     pct: partPct, color: '#d29922', bg: 'rgba(210,153,34,0.1)', icon: 'bi-exclamation-circle' },
              { label: 'Missing / Gaps', value: missing,     pct: missPct, color: '#f85149', bg: 'rgba(248,81,73,0.1)',  icon: 'bi-x-circle' },
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

      {/* Overall score bar */}
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

      {/* Score insights */}
      <ScoreInsightPanel data={data} />

      {/* Risk Heatmap + Trend chart */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-lg-6">
          <div className="rg-card h-100">
            <RiskHeatmap byRisk={byRisk} />
          </div>
        </div>

        <div className="col-12 col-lg-6">
          <div className="rg-card h-100">
            <div className="rg-card-header mb-3">
              <p className="rg-card-title">
                <i className="bi bi-graph-up me-2" style={{ color: '#4f8ef7' }} />
                Compliance Trend
              </p>
              <span style={{ fontSize: '0.72rem', color: '#8b949e' }}>Last 30 snapshots</span>
            </div>
            {trendData.length < 2 ? (
              <div className="rg-empty" style={{ padding: '3rem 0' }}>
                <i className="bi bi-clock-history" style={{ fontSize: '2rem', color: '#30363d' }} />
                <p style={{ fontSize: '0.85rem', color: '#484f58', marginTop: '0.75rem' }}>
                  Trend data appears after the compliance score is updated at least twice.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8b949e', fontSize: '0.72rem' }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: '#8b949e', fontSize: '0.72rem' }}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip content={<LineTooltip />} />
                  <Line
                    type="monotone" dataKey="score" stroke="#4f8ef7"
                    strokeWidth={2} dot={{ fill: '#4f8ef7', r: 3 }}
                    activeDot={{ r: 5, fill: '#4f8ef7' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
