import { useState, useEffect } from 'react'
import { frameworksAPI } from '../services/api'
import AlertMessage from '../components/AlertMessage'
import { useToast } from '../context/ToastContext'

const CATEGORY_ICONS = {
  'Financial':      'bi-bank2',
  'Security':       'bi-shield-lock-fill',
  'AI Governance':  'bi-robot',
  'Data Privacy':   'bi-eye-slash-fill',
}
const CATEGORY_COLORS = {
  'Financial':     '#f0a500',
  'Security':      '#4f8ef7',
  'AI Governance': '#bc8cff',
  'Data Privacy':  '#3fb950',
}

function TemplateControlItem({ tmpl }) {
  const RISK_COLOR = { HIGH: '#f85149', MEDIUM: '#d29922', LOW: '#3fb950' }
  return (
    <div style={{
      padding: '0.5rem 0.75rem', borderBottom: '1px solid #21262d',
      display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    }}>
      <span style={{
        fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 20, flexShrink: 0,
        background: `${RISK_COLOR[tmpl.risk_score] ?? '#8b949e'}22`,
        color: RISK_COLOR[tmpl.risk_score] ?? '#8b949e',
        border: `1px solid ${RISK_COLOR[tmpl.risk_score] ?? '#8b949e'}44`,
        marginTop: 2,
      }}>
        {tmpl.risk_score}
      </span>
      <div>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e6edf3' }}>
          {tmpl.control_ref && <span style={{ color: '#8b949e', marginRight: 6 }}>[{tmpl.control_ref}]</span>}
          {tmpl.title}
        </div>
        {tmpl.description && (
          <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: 2 }}>{tmpl.description}</div>
        )}
      </div>
    </div>
  )
}

function FrameworkCard({ fw }) {
  const { toast }                   = useToast()
  const [expanded, setExpanded]     = useState(false)
  const [templates, setTemplates]   = useState([])
  const [loadingT, setLoadingT]     = useState(false)
  const [installing, setInstalling] = useState(false)

  const color = CATEGORY_COLORS[fw.category] ?? '#8b949e'
  const icon  = CATEGORY_ICONS[fw.category]  ?? 'bi-diagram-3'

  async function fetchTemplates() {
    if (templates.length) { setExpanded((v) => !v); return }
    setLoadingT(true)
    try {
      const { data } = await frameworksAPI.listControls(fw.id)
      setTemplates(Array.isArray(data) ? data : [])
      setExpanded(true)
    } catch {
      toast.error('Failed to load template controls.')
    } finally {
      setLoadingT(false)
    }
  }

  async function handleInstall() {
    setInstalling(true)
    try {
      const { data } = await frameworksAPI.install(fw.id)
      toast.success(`Installed ${data.installed} controls from ${fw.name}. (${data.skipped} skipped — already exist)`)
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Install failed.')
    } finally {
      setInstalling(false)
    }
  }

  return (
    <div className="rg-card mb-3" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{
          width: 44, height: 44, borderRadius: 10, flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}33`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <i className={`bi ${icon}`} style={{ color, fontSize: '1.2rem' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, color: '#e6edf3', fontSize: '0.94rem' }}>{fw.name}</div>
          <div style={{
            fontSize: '0.68rem', fontWeight: 600, padding: '1px 8px', borderRadius: 20,
            background: `${color}15`, color, border: `1px solid ${color}33`,
            display: 'inline-block', marginTop: 3,
          }}>
            {fw.category}
          </div>
        </div>

        <div className="d-flex gap-2 flex-shrink-0">
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4f8ef7', borderRadius: 7, fontSize: '0.78rem' }}
            onClick={fetchTemplates}
            disabled={loadingT}
          >
            {loadingT
              ? <span className="spinner-border spinner-border-sm" />
              : <><i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'} me-1`} />{expanded ? 'Hide' : 'Preview'}</>
            }
          </button>
          <button
            className="btn btn-sm rg-btn-primary"
            onClick={handleInstall}
            disabled={installing}
          >
            {installing
              ? <><span className="spinner-border spinner-border-sm me-1" />Installing…</>
              : <><i className="bi bi-download me-1" />Install</>
            }
          </button>
        </div>
      </div>

      {fw.description && (
        <div style={{ padding: '0 1.25rem 0.75rem', fontSize: '0.8rem', color: '#8b949e' }}>
          {fw.description}
        </div>
      )}

      {/* Template controls preview */}
      {expanded && templates.length > 0 && (
        <div style={{ borderTop: '1px solid #21262d', maxHeight: 320, overflowY: 'auto' }}>
          {templates.map((t) => <TemplateControlItem key={t.id} tmpl={t} />)}
        </div>
      )}
      {expanded && templates.length === 0 && (
        <div style={{ padding: '0.75rem 1.25rem', color: '#484f58', fontSize: '0.82rem', borderTop: '1px solid #21262d' }}>
          No template controls seeded yet. Run the seed script to add them.
        </div>
      )}
    </div>
  )
}

export default function FrameworkLibrary() {
  const [frameworks, setFrameworks] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [catFilter, setCatFilter]   = useState('ALL')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await frameworksAPI.list()
        setFrameworks(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err?.response?.data?.detail ?? 'Failed to load frameworks.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const categories = ['ALL', ...new Set(frameworks.map((f) => f.category))]
  const filtered   = catFilter === 'ALL' ? frameworks : frameworks.filter((f) => f.category === catFilter)

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          <i className="bi bi-journals me-2" style={{ color: '#4f8ef7' }} />Framework Library
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: '4px 0 0' }}>
          Browse pre-built control templates. Click <strong style={{ color: '#4f8ef7' }}>Install</strong> to add them to your workspace.
        </p>
      </div>

      {/* Category filter pills */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFilter(cat)}
            style={{
              padding: '4px 14px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${catFilter === cat ? '#4f8ef7' : '#30363d'}`,
              background: catFilter === cat ? 'rgba(79,142,247,0.15)' : 'transparent',
              color: catFilter === cat ? '#4f8ef7' : '#8b949e',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {error   && <AlertMessage type="error" message={error} />}
      {loading && <div style={{ color: '#8b949e' }}>Loading frameworks…</div>}

      {!loading && !error && filtered.map((fw) => (
        <FrameworkCard key={fw.id} fw={fw} />
      ))}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#484f58', padding: '3rem' }}>
          No frameworks found for this category.
        </div>
      )}
    </div>
  )
}
