import { useState, useEffect } from 'react'
import { complianceAPI, controlsAPI, riskAPI } from '../services/api'
import AlertMessage from '../components/AlertMessage'
import { useToast } from '../context/ToastContext'

/* ─── Stat card ─────────────────────────────────────────────────────────── */
function StatCard({ label, value, sub, color }) {
  return (
    <div className="rg-card" style={{ textAlign: 'center', padding: '1.25rem' }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: color ?? '#4f8ef7', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e6edf3', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

/* ─── Risk distribution bar ─────────────────────────────────────────────── */
function RiskBar({ controls }) {
  const high   = controls.filter((c) => c.risk_score === 'HIGH').length
  const medium = controls.filter((c) => c.risk_score === 'MEDIUM').length
  const low    = controls.filter((c) => c.risk_score === 'LOW').length
  const total  = controls.length || 1

  const segments = [
    { label: 'High',   count: high,   color: '#f85149', pct: (high   / total) * 100 },
    { label: 'Medium', count: medium, color: '#d29922', pct: (medium / total) * 100 },
    { label: 'Low',    count: low,    color: '#3fb950', pct: (low    / total) * 100 },
  ]

  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 6, overflow: 'hidden', height: 10, gap: 2 }}>
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${s.pct}%`, background: s.color, minWidth: s.count > 0 ? 4 : 0 }} />
        ))}
      </div>
      <div className="d-flex gap-3 mt-2">
        {segments.map((s) => (
          <span key={s.label} style={{ fontSize: '0.72rem', color: s.color }}>
            ■ {s.label}: {s.count}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ─── PDF export ─────────────────────────────────────────────────────────── */
async function exportPDF(data) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF()
  const { score, controls, forecast, detailed } = data

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.text('RegIntel AI — Compliance Report', 14, 20)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28)
  doc.setTextColor(0)

  // Score
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(`Overall Compliance Score: ${score ?? '—'}%`, 14, 42)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  if (detailed) {
    doc.text(`Implemented: ${detailed.implemented ?? 0}   Partial: ${detailed.partial ?? 0}   Missing: ${detailed.missing ?? 0}`, 14, 50)
  }

  // Controls table
  let y = 62
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Controls Overview', 14, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const headers = ['Title', 'Status', 'Risk', 'AI Category']
  const colW    = [90, 25, 20, 45]
  let x = 14
  headers.forEach((h, i) => { doc.setFont('helvetica', 'bold'); doc.text(h, x, y); x += colW[i] })
  y += 6

  doc.setFont('helvetica', 'normal')
  controls.slice(0, 25).forEach((c) => {
    if (y > 270) { doc.addPage(); y = 20 }
    x = 14
    const cells = [
      (c.title ?? '').substring(0, 42),
      c.status ?? '',
      c.risk_score ?? '',
      c.ai_category ?? '—',
    ]
    cells.forEach((cell, i) => { doc.text(String(cell), x, y); x += colW[i] })
    y += 6
  })

  // Risk forecast
  if (forecast?.potential_gains?.length) {
    if (y > 240) { doc.addPage(); y = 20 }
    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Top Risk Reduction Opportunities', 14, y)
    y += 8
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    forecast.potential_gains.slice(0, 5).forEach((pg, i) => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.text(`${i + 1}. ${(pg.title ?? '').substring(0, 60)} — ${pg.risk_score} risk — potential +${pg.gain} pts`, 14, y)
      y += 6
    })
  }

  doc.save('regintel-compliance-report.pdf')
}

export default function Reports() {
  const { toast }             = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [exporting, setExporting] = useState(false)
  const [data, setData]       = useState({ score: null, controls: [], forecast: null, detailed: null })

  useEffect(() => {
    (async () => {
      try {
        const [scoreRes, detailedRes, controlsRes, forecastRes] = await Promise.all([
          complianceAPI.getScore(),
          complianceAPI.getDetailed(),
          controlsAPI.getAll(),
          riskAPI.forecast(),
        ])
        setData({
          score:    scoreRes.data?.score ?? null,
          detailed: detailedRes.data ?? null,
          controls: Array.isArray(controlsRes.data) ? controlsRes.data : [],
          forecast: forecastRes.data ?? null,
        })
      } catch (err) {
        setError(err?.response?.data?.detail ?? 'Failed to load report data.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  async function handleExport() {
    setExporting(true)
    try {
      await exportPDF(data)
      toast.success('Report exported as PDF.')
    } catch (err) {
      toast.error('PDF export failed: ' + err.message)
    } finally {
      setExporting(false)
    }
  }

  const { score, controls, forecast, detailed } = data
  const high   = controls.filter((c) => c.risk_score === 'HIGH' && c.status === 'MISSING').length
  const impl   = controls.filter((c) => c.status === 'IMPLEMENTED').length

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            <i className="bi bi-file-earmark-bar-graph me-2" style={{ color: '#4f8ef7' }} />Compliance Reports
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: '4px 0 0' }}>
            Executive summary + full data export.
          </p>
        </div>
        <button
          className="btn rg-btn-primary btn-sm"
          onClick={handleExport}
          disabled={loading || exporting}
        >
          {exporting
            ? <><span className="spinner-border spinner-border-sm me-1" />Exporting…</>
            : <><i className="bi bi-file-earmark-pdf me-1" />Export PDF</>
          }
        </button>
      </div>

      {error   && <AlertMessage type="error" message={error} />}
      {loading && <div style={{ color: '#8b949e' }}>Loading report data…</div>}

      {!loading && !error && (
        <>
          {/* KPI row */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <StatCard label="Compliance Score" value={score != null ? `${score}%` : '—'} sub="Weighted average" color={score >= 70 ? '#3fb950' : score >= 40 ? '#d29922' : '#f85149'} />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Total Controls" value={controls.length} sub="Across all frameworks" color="#4f8ef7" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Implemented" value={impl} sub={`${controls.length ? Math.round((impl / controls.length) * 100) : 0}% complete`} color="#3fb950" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="High-Risk Gaps" value={high} sub="Missing + High risk" color={high > 0 ? '#f85149' : '#3fb950'} />
            </div>
          </div>

          {/* Risk distribution */}
          <div className="rg-card mb-4">
            <div style={{ fontWeight: 700, color: '#e6edf3', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
              <i className="bi bi-pie-chart-fill me-2" style={{ color: '#4f8ef7' }} />Risk Distribution
            </div>
            <RiskBar controls={controls} />
          </div>

          {/* Top priority fixes */}
          {forecast?.potential_gains?.length > 0 && (
            <div className="rg-card mb-4">
              <div style={{ fontWeight: 700, color: '#e6edf3', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
                <i className="bi bi-arrow-up-circle-fill me-2" style={{ color: '#d29922' }} />Top Priority Fixes
              </div>
              {forecast.potential_gains.slice(0, 5).map((pg, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.5rem 0', borderBottom: i < 4 ? '1px solid #21262d' : 'none',
                }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(210,153,34,0.15)', color: '#d29922',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 800,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', color: '#e6edf3', fontWeight: 600 }}>{pg.title}</span>
                    <span style={{
                      marginLeft: 8, fontSize: '0.68rem', fontWeight: 700, padding: '1px 6px', borderRadius: 20,
                      background: pg.risk_score === 'HIGH' ? 'rgba(248,81,73,0.12)' : 'rgba(210,153,34,0.12)',
                      color: pg.risk_score === 'HIGH' ? '#f85149' : '#d29922',
                      border: `1px solid ${pg.risk_score === 'HIGH' ? 'rgba(248,81,73,0.3)' : 'rgba(210,153,34,0.3)'}`,
                    }}>{pg.risk_score}</span>
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#3fb950', fontWeight: 700, flexShrink: 0 }}>
                    +{pg.gain} pts
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Controls table */}
          <div className="rg-card p-0">
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #21262d', fontWeight: 700, color: '#e6edf3', fontSize: '0.9rem' }}>
              <i className="bi bi-table me-2" style={{ color: '#4f8ef7' }} />All Controls
            </div>
            <div className="table-responsive">
              <table className="table rg-table mb-0">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>AI Category</th>
                    <th>Framework</th>
                  </tr>
                </thead>
                <tbody>
                  {controls.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: '#e6edf3', fontSize: '0.85rem' }}>{c.title}</td>
                      <td>
                        <span style={{
                          fontSize: '0.7rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                          background: c.status === 'IMPLEMENTED' ? 'rgba(63,185,80,0.12)' : c.status === 'PARTIAL' ? 'rgba(210,153,34,0.12)' : 'rgba(248,81,73,0.12)',
                          color: c.status === 'IMPLEMENTED' ? '#3fb950' : c.status === 'PARTIAL' ? '#d29922' : '#f85149',
                          border: '1px solid transparent',
                        }}>{c.status}</span>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: c.risk_score === 'HIGH' ? '#f85149' : c.risk_score === 'MEDIUM' ? '#d29922' : '#3fb950' }}>
                        {c.risk_score}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: '#8b949e' }}>{c.ai_category ?? '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: '#8b949e' }}>{c.framework_id ? '✓' : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
