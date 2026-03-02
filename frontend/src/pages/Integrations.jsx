import { useState, useEffect } from 'react'
import { integrationsAPI } from '../services/api'
import AlertMessage from '../components/AlertMessage'
import { useToast } from '../context/ToastContext'

const STATUS_PILL = {
  available:    { label: 'Available',    bg: 'rgba(63,185,80,0.12)',  color: '#3fb950', border: 'rgba(63,185,80,0.3)'  },
  coming_soon:  { label: 'Coming Soon',  bg: 'rgba(139,148,158,0.1)', color: '#8b949e', border: '#30363d'             },
}

function GitHubScanPanel() {
  const { toast }               = useToast()
  const [repo, setRepo]         = useState('')
  const [token, setToken]       = useState('')
  const [scanning, setScanning] = useState(false)
  const [result, setResult]     = useState(null)
  const [error, setError]       = useState('')

  async function handleScan(e) {
    e.preventDefault()
    if (!repo.trim()) return
    setScanning(true); setError(''); setResult(null)
    try {
      const { data } = await integrationsAPI.scanGitHub(repo.trim(), token.trim() || undefined)
      setResult(data)
      toast.success('GitHub scan complete.')
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Scan failed. Check the repo name and try again.'
      setError(msg)
      toast.error(msg)
    } finally {
      setScanning(false)
    }
  }

  const CHECK_LABELS = {
    security_policy:  { label: 'Security Policy (SECURITY.md)',    icon: 'bi-shield-check' },
    codeowners:       { label: 'CODEOWNERS',                        icon: 'bi-people-fill'  },
    dependabot:       { label: 'Dependabot Config',                 icon: 'bi-arrow-repeat' },
    license:          { label: 'License File',                      icon: 'bi-file-earmark-text' },
    ci_cd_workflows:  { label: 'CI/CD Workflows',                   icon: 'bi-play-circle'  },
  }

  return (
    <div>
      <form onSubmit={handleScan} className="mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-12 col-md-5">
            <label className="form-label" style={{ fontSize: '0.82rem', color: '#8b949e' }}>
              Repository <span style={{ color: '#f85149' }}>*</span>
            </label>
            <input
              className="rg-input form-control"
              placeholder="owner/repo (e.g. octocat/Hello-World)"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              required
            />
          </div>
          <div className="col-12 col-md-5">
            <label className="form-label" style={{ fontSize: '0.82rem', color: '#8b949e' }}>
              GitHub Token <span style={{ color: '#484f58' }}>(optional — for private repos)</span>
            </label>
            <input
              className="rg-input form-control"
              type="password"
              placeholder="ghp_xxxxxxxx"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="col-12 col-md-2">
            <button className="btn rg-btn-primary w-100" type="submit" disabled={scanning || !repo.trim()}>
              {scanning
                ? <><span className="spinner-border spinner-border-sm me-1" />Scanning…</>
                : <><i className="bi bi-search me-1" />Scan</>
              }
            </button>
          </div>
        </div>
      </form>

      <AlertMessage type="error" message={error} />

      {result && (
        <div>
          {/* Score bar */}
          <div className="d-flex align-items-center gap-3 mb-4">
            <div style={{
              width: 60, height: 60, borderRadius: '50%', flexShrink: 0,
              border: `3px solid ${result.compliance_score >= 70 ? '#3fb950' : result.compliance_score >= 40 ? '#d29922' : '#f85149'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: 800,
              color: result.compliance_score >= 70 ? '#3fb950' : result.compliance_score >= 40 ? '#d29922' : '#f85149',
            }}>
              {result.compliance_score}
            </div>
            <div>
              <div style={{ fontWeight: 700, color: '#e6edf3' }}>{result.repo}</div>
              <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>GitHub Compliance Score</div>
            </div>
          </div>

          {/* Check list */}
          <div className="mb-4">
            {Object.entries(result.checks).map(([key, val]) => {
              const meta   = CHECK_LABELS[key] ?? { label: key, icon: 'bi-check-circle' }
              const passed = val.found
              return (
                <div key={key} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0',
                  borderBottom: '1px solid #21262d',
                }}>
                  <i className={`bi ${passed ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}
                    style={{ color: passed ? '#3fb950' : '#f85149', fontSize: '1rem', flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.85rem', color: '#e6edf3' }}>
                      <i className={`bi ${meta.icon} me-1`} style={{ color: '#8b949e' }} />
                      {meta.label}
                    </span>
                    {val.path && (
                      <span style={{ fontSize: '0.72rem', color: '#8b949e', marginLeft: 8 }}>{val.path}</span>
                    )}
                    {key === 'ci_cd_workflows' && val.count > 0 && (
                      <span style={{ fontSize: '0.72rem', color: '#8b949e', marginLeft: 8 }}>{val.count} workflow(s)</span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20,
                    background: passed ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)',
                    color: passed ? '#3fb950' : '#f85149',
                    border: `1px solid ${passed ? 'rgba(63,185,80,0.3)' : 'rgba(248,81,73,0.3)'}`,
                  }}>
                    {passed ? 'Found' : 'Missing'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div style={{ background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '1rem' }}>
              <div style={{ fontWeight: 700, color: '#d29922', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                <i className="bi bi-exclamation-triangle-fill me-1" />Recommendations
              </div>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ fontSize: '0.82rem', color: '#8b949e', marginBottom: '0.4rem' }}>
                  • {rec}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IntegrationCard({ integration }) {
  const [open, setOpen] = useState(false)
  const pill = STATUS_PILL[integration.status] ?? STATUS_PILL.coming_soon

  return (
    <div className="rg-card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
      <div
        style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: integration.status === 'available' ? 'pointer' : 'default' }}
        onClick={() => integration.status === 'available' && setOpen((v) => !v)}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: 'rgba(139,148,158,0.08)', border: '1px solid #30363d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${integration.icon}`} style={{ color: '#c9d1d9', fontSize: '1.3rem' }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, color: '#e6edf3' }}>{integration.name}</div>
          <div style={{ fontSize: '0.8rem', color: '#8b949e' }}>{integration.description}</div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span style={{
            fontSize: '0.68rem', fontWeight: 700, padding: '2px 10px', borderRadius: 20,
            background: pill.bg, color: pill.color, border: `1px solid ${pill.border}`,
          }}>
            {pill.label}
          </span>
          {integration.status === 'available' && (
            <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#8b949e' }} />
          )}
        </div>
      </div>

      {open && integration.id === 'github' && (
        <div style={{ borderTop: '1px solid #21262d', padding: '1.25rem' }}>
          <GitHubScanPanel />
        </div>
      )}
    </div>
  )
}

export default function Integrations() {
  const [integrations, setIntegrations] = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await integrationsAPI.list()
        setIntegrations(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err?.response?.data?.detail ?? 'Failed to load integrations.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          <i className="bi bi-plug-fill me-2" style={{ color: '#4f8ef7' }} />Integrations
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: '4px 0 0' }}>
          Connect your tools and data sources to enrich compliance intelligence.
        </p>
      </div>

      {error   && <AlertMessage type="error" message={error} />}
      {loading && <div style={{ color: '#8b949e' }}>Loading integrations…</div>}

      {!loading && !error && integrations.map((intg) => (
        <IntegrationCard key={intg.id} integration={intg} />
      ))}
    </div>
  )
}
