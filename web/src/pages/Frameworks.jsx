import { useState, useEffect } from 'react'
import { frameworksAPI, riskAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

// ── Category colour mapping ────────────────────────────────────────────────────
const CATEGORY_STYLE = {
  'Financial':    { bg: '#1f6feb22', border: '#388bfd', badge: 'primary'  },
  'Security':     { bg: '#3fb95022', border: '#3fb950', badge: 'success'  },
  'AI Governance':{ bg: '#f8514922', border: '#f85149', badge: 'danger'   },
}

function CategoryBadge({ category }) {
  const variant = CATEGORY_STYLE[category]?.badge || 'secondary'
  return <span className={`badge bg-${variant} me-1`}>{category}</span>
}

function FrameworkCard({ fw }) {
  const style = CATEGORY_STYLE[fw.category] || {}
  return (
    <div
      className="p-3 rounded-3 mb-3 h-100"
      style={{
        background:   style.bg    || '#ffffff11',
        border:       `1px solid ${style.border || '#444'}`,
      }}
    >
      <div className="d-flex align-items-start justify-content-between mb-2">
        <div>
          <CategoryBadge category={fw.category} />
        </div>
      </div>
      <h6 className="text-white fw-semibold mb-1">{fw.name}</h6>
      {fw.description && (
        <p className="text-secondary small mb-0" style={{ lineHeight: '1.4' }}>
          {fw.description}
        </p>
      )}
    </div>
  )
}

function ForecastCard({ data }) {
  if (!data) return null
  const { current_score, max_possible_gain, priority_fixes, trend, risk_warning } = data

  const trendColor  = trend === 'improving' ? '#3fb950'
                    : trend === 'declining'  ? '#f85149'
                    : '#d29922'
  const trendIcon   = trend === 'improving' ? 'bi-arrow-up-circle-fill'
                    : trend === 'declining'  ? 'bi-arrow-down-circle-fill'
                    : 'bi-dash-circle-fill'

  return (
    <div className="p-3 rounded-3 mb-4"
         style={{ background: '#161b22', border: '1px solid #30363d' }}>
      <h6 className="text-white fw-semibold mb-3">
        <i className="bi bi-graph-up-arrow me-2" style={{ color: '#388bfd' }} />
        Risk Forecast
      </h6>

      <div className="row g-3 mb-3">
        <div className="col-6">
          <div className="text-center p-2 rounded" style={{ background: '#0d1117' }}>
            <div className="fs-4 fw-bold text-white">{current_score ?? '—'}</div>
            <div className="text-secondary small">Current Score</div>
          </div>
        </div>
        <div className="col-6">
          <div className="text-center p-2 rounded" style={{ background: '#0d1117' }}>
            <div className="fs-4 fw-bold" style={{ color: '#3fb950' }}>+{max_possible_gain ?? 0}</div>
            <div className="text-secondary small">Max Possible Gain</div>
          </div>
        </div>
      </div>

      <div className="mb-3 d-flex align-items-center gap-2">
        <i className={`bi ${trendIcon}`} style={{ color: trendColor, fontSize: '1.1rem' }} />
        <span className="text-white text-capitalize">{trend?.replace('_', ' ')}</span>
      </div>

      {risk_warning && (
        <div className="alert alert-danger py-2 px-3 small mb-3">
          <i className="bi bi-exclamation-triangle-fill me-2" />
          {risk_warning}
        </div>
      )}

      {priority_fixes?.length > 0 && (
        <>
          <p className="text-secondary small mb-2">Top controls to fix for biggest score impact:</p>
          {priority_fixes.slice(0, 5).map((fix, i) => (
            <div key={i} className="d-flex justify-content-between align-items-center mb-1">
              <span className="text-white small text-truncate me-2">{fix.title}</span>
              <span className="badge"
                    style={{
                      background: fix.risk === 'HIGH' ? '#f85149'
                                : fix.risk === 'MEDIUM' ? '#d29922' : '#3fb950',
                      whiteSpace: 'nowrap',
                    }}>
                +{fix.potential_gain} pts
              </span>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

export default function Frameworks() {
  const [frameworks, setFrameworks] = useState([])
  const [activeCategory, setActiveCategory] = useState('All')
  const [forecast, setForecast]   = useState(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)

  const categories = ['All', 'Financial', 'Security', 'AI Governance']

  useEffect(() => {
    Promise.all([frameworksAPI.list(), riskAPI.forecast()])
      .then(([fwRes, riskRes]) => {
        setFrameworks(fwRes.data)
        setForecast(riskRes.data)
      })
      .catch(err => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  const visible = activeCategory === 'All'
    ? frameworks
    : frameworks.filter(fw => fw.category === activeCategory)

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
      <div className="spinner-border text-primary" />
    </div>
  )

  if (error) return (
    <div className="alert alert-danger m-4">{error}</div>
  )

  return (
    <div className="container-fluid px-4 py-4" style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="mb-4">
        <h4 className="text-white fw-bold mb-1">
          <i className="bi bi-diagram-3-fill me-2" style={{ color: '#388bfd' }} />
          Compliance Frameworks
        </h4>
        <p className="text-secondary mb-0">
          RegintelAI supports both FinTech regulation and AI governance frameworks in one platform.
        </p>
      </div>

      <div className="row g-4">
        {/* Left — framework grid */}
        <div className="col-lg-8">
          {/* Category filter pills */}
          <div className="d-flex gap-2 mb-4 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                className={`btn btn-sm rounded-pill ${activeCategory === cat ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {visible.length === 0 ? (
            <p className="text-secondary">No frameworks found for this category.</p>
          ) : (
            <div className="row g-3">
              {visible.map(fw => (
                <div key={fw.id} className="col-md-6">
                  <FrameworkCard fw={fw} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — risk forecast */}
        <div className="col-lg-4">
          <ForecastCard data={forecast} />

          {/* Domain summary cards */}
          <div className="p-3 rounded-3" style={{ background: '#161b22', border: '1px solid #30363d' }}>
            <h6 className="text-white fw-semibold mb-3">
              <i className="bi bi-info-circle me-2" style={{ color: '#388bfd' }} />
              Supported Domains
            </h6>
            {[
              { icon: 'bi-bank2',      color: '#388bfd', label: 'FinTech Regulation',
                desc: 'RBI, PCI-DSS, SEBI, DPDP Act' },
              { icon: 'bi-shield-lock',color: '#3fb950', label: 'Cyber Security',
                desc: 'SOC 2, ISO 27001' },
              { icon: 'bi-robot',      color: '#f85149', label: 'AI Governance',
                desc: 'EU AI Act, NIST AI RMF' },
            ].map(d => (
              <div key={d.label} className="d-flex align-items-start gap-2 mb-3">
                <i className={`bi ${d.icon} mt-1`} style={{ color: d.color, fontSize: '1.1rem' }} />
                <div>
                  <div className="text-white small fw-semibold">{d.label}</div>
                  <div className="text-secondary" style={{ fontSize: '0.78rem' }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
