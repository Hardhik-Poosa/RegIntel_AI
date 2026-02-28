import { useState, useEffect } from 'react'
import { adminAPI, getErrorMessage } from '../services/api'
import ErrorScreen from '../components/ErrorScreen'

const CARDS = [
  { key: 'total_organizations', label: 'Organisations', icon: 'bi-building', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  { key: 'total_users',         label: 'Users',          icon: 'bi-people',   color: '#3fb950', bg: 'rgba(63,185,80,0.12)' },
  { key: 'total_controls',      label: 'Controls',       icon: 'bi-shield',   color: '#d29922', bg: 'rgba(210,153,34,0.12)' },
  { key: 'total_ai_calls',      label: 'AI Calls',       icon: 'bi-robot',    color: '#bc8cff', bg: 'rgba(188,140,255,0.12)' },
  { key: 'total_audit_logs',    label: 'Audit Events',   icon: 'bi-journal-text', color: '#f0883e', bg: 'rgba(240,136,62,0.12)' },
]

export default function Admin() {
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [errorType, setErrorType] = useState('500')

  useEffect(() => {
    adminAPI.getStats()
      .then((r) => setStats(r.data))
      .catch((err) => {
        const type = !err?.response ? 'offline' : err?.response?.status === 403 ? '403' : '500'
        setErrorType(type)
        setError(getErrorMessage(err, 'Failed to load admin stats.'))
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="d-flex align-items-center justify-content-center" style={{ minHeight: '40vh' }}>
      <div className="spinner-border" style={{ color: '#4f8ef7' }} />
    </div>
  )

  if (error) return <ErrorScreen type={errorType} message={error} />

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          <i className="bi bi-speedometer2 me-2" style={{ color: '#4f8ef7' }} />
          Admin — Platform Overview
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#8b949e', margin: 0 }}>
          Internal visibility into platform usage. Refresh the page for latest counts.
        </p>
      </div>

      {/* Notice */}
      <div
        className="rg-card mb-4"
        style={{ borderColor: 'rgba(210,153,34,0.3)', background: 'rgba(210,153,34,0.04)' }}
      >
        <div className="d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-triangle-fill" style={{ color: '#d29922' }} />
          <span style={{ fontSize: '0.84rem', color: '#c9d1d9' }}>
            This page is visible to all authenticated users during the beta. Role-based access will be added in a future release.
          </span>
        </div>
      </div>

      {/* Metric cards */}
      <div className="row g-3 mb-4">
        {CARDS.map((c) => (
          <div className="col-6 col-xl-4" key={c.key}>
            <div className="rg-card h-100">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="rg-metric-value">{stats?.[c.key] ?? 0}</div>
                  <div className="rg-metric-label">{c.label}</div>
                </div>
                <div className="rg-metric-icon" style={{ background: c.bg, color: c.color }}>
                  <i className={`bi ${c.icon}`} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Health indicators */}
      <div className="rg-card">
        <div className="rg-card-header">
          <p className="rg-card-title">
            <i className="bi bi-heart-pulse me-2" style={{ color: '#f85149' }} />
            Health Indicators
          </p>
        </div>
        <div className="d-flex flex-column gap-2 mt-2">
          {[
            {
              label: 'Avg controls / org',
              value: stats?.total_organizations > 0
                ? (stats.total_controls / stats.total_organizations).toFixed(1)
                : '—',
              color: '#4f8ef7',
            },
            {
              label: 'AI calls / user',
              value: stats?.total_users > 0
                ? (stats.total_ai_calls / stats.total_users).toFixed(1)
                : '—',
              color: '#bc8cff',
            },
            {
              label: 'Audit events / control',
              value: stats?.total_controls > 0
                ? (stats.total_audit_logs / stats.total_controls).toFixed(1)
                : '—',
              color: '#f0883e',
            },
          ].map(({ label, value, color }) => (
            <div key={label} className="d-flex align-items-center justify-content-between py-2"
              style={{ borderBottom: '1px solid #21262d' }}>
              <span style={{ fontSize: '0.85rem', color: '#8b949e' }}>{label}</span>
              <span style={{ fontSize: '1rem', fontWeight: 700, color }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
