import { useState } from 'react'
import { policiesAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

const INDUSTRIES = ['FinTech', 'Banking', 'Insurance', 'Healthcare', 'E-Commerce', 'SaaS']
const JURISDICTIONS = ['India', 'EU', 'USA', 'Singapore', 'UAE', 'Global']

export default function PolicyGenerator() {
  const [policyTypes, setPolicyTypes]         = useState([])
  const [selectedType, setSelectedType]       = useState('')
  const [orgName, setOrgName]                 = useState('')
  const [industry, setIndustry]               = useState('FinTech')
  const [jurisdiction, setJurisdiction]       = useState('India')
  const [loading, setLoading]                 = useState(false)
  const [generatedPolicy, setGeneratedPolicy] = useState('')
  const [error, setError]                     = useState('')

  // Load policy types on first render
  useState(() => {
    policiesAPI.types()
      .then(r => {
        setPolicyTypes(r.data)
        if (r.data.length) setSelectedType(r.data[0].id)
      })
      .catch(console.error)
  }, [])

  async function handleGenerate(e) {
    e.preventDefault()
    if (!orgName.trim()) { setError('Please enter your organisation name.'); return }
    setError('')
    setLoading(true)
    setGeneratedPolicy('')
    try {
      const { data } = await policiesAPI.generate({
        policy_type:       selectedType,
        organization_name: orgName.trim(),
        industry,
        jurisdiction,
      })
      setGeneratedPolicy(data.policy)
    } catch (err) {
      setError(getErrorMessage(err, 'Policy generation failed.'))
    } finally {
      setLoading(false)
    }
  }

  function handleDownload() {
    const typeName = policyTypes.find(t => t.id === selectedType)?.name ?? selectedType
    const blob = new Blob([generatedPolicy], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${typeName.replace(/ /g, '_')}_${orgName.replace(/ /g, '_')}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Parse Markdown headings / bold for display
  function renderPolicy(text) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('# '))  return <h3 key={i} className="mt-3 mb-1">{line.slice(2)}</h3>
      if (line.startsWith('## ')) return <h5 key={i} className="mt-3 mb-1" style={{ color: 'var(--bs-primary)' }}>{line.slice(3)}</h5>
      if (line.startsWith('### ')) return <h6 key={i} className="mt-2 fw-semibold">{line.slice(4)}</h6>
      if (line.startsWith('- ') || line.startsWith('* '))
        return <div key={i} className="ms-3">• {line.slice(2)}</div>
      if (/^\d+\. /.test(line))
        return <div key={i} className="ms-3">{line}</div>
      if (line.trim() === '')
        return <div key={i} className="mb-1" />
      // Bold **text**
      const parts = line.split(/\*\*(.*?)\*\*/g)
      return (
        <p key={i} className="mb-1">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}
        </p>
      )
    })
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Header ─────────────────────────────────── */}
      <div className="d-flex align-items-center gap-3 mb-4">
        <div
          className="d-flex align-items-center justify-content-center rounded-3"
          style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#6f42c1,#4361ee)', color: '#fff', fontSize: 22 }}
        >
          <i className="bi bi-file-earmark-text-fill" />
        </div>
        <div>
          <h4 className="mb-0 fw-bold">AI Policy Generator</h4>
          <p className="mb-0 text-muted small">Generate compliance policy documents using AI</p>
        </div>
      </div>

      <div className="row g-4">
        {/* ── Left: Form ─────────────────────────────────── */}
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent fw-semibold">
              <i className="bi bi-sliders me-1" /> Policy Settings
            </div>
            <div className="card-body">
              <form onSubmit={handleGenerate}>
                {error && <div className="alert alert-danger py-2 small">{error}</div>}

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Policy Type</label>
                  <select className="form-select" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                    {policyTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Organisation Name</label>
                  <input
                    className="form-control"
                    placeholder="e.g. Acme FinTech Pvt Ltd"
                    value={orgName}
                    onChange={e => setOrgName(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Industry</label>
                  <select className="form-select" value={industry} onChange={e => setIndustry(e.target.value)}>
                    {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold small">Primary Jurisdiction</label>
                  <select className="form-select" value={jurisdiction} onChange={e => setJurisdiction(e.target.value)}>
                    {JURISDICTIONS.map(j => <option key={j}>{j}</option>)}
                  </select>
                </div>

                <button className="btn btn-primary w-100" disabled={loading || policyTypes.length === 0}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2" />Generating…</>
                  ) : (
                    <><i className="bi bi-magic me-2" />Generate Policy</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ── Right: Output ─────────────────────────────────── */}
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
              <span className="fw-semibold"><i className="bi bi-file-text me-1" /> Generated Policy</span>
              {generatedPolicy && (
                <button className="btn btn-outline-secondary btn-sm" onClick={handleDownload}>
                  <i className="bi bi-download me-1" /> Download .md
                </button>
              )}
            </div>
            <div className="card-body" style={{ minHeight: 480, maxHeight: 680, overflowY: 'auto' }}>
              {loading && (
                <div className="text-center py-5 text-muted">
                  <div className="spinner-border text-primary mb-3" />
                  <div>Generating policy with AI… this may take 15–30 seconds</div>
                </div>
              )}
              {!loading && !generatedPolicy && (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-file-earmark-text display-4 d-block mb-3 opacity-25" />
                  Configure settings on the left and click <strong>Generate Policy</strong>
                </div>
              )}
              {generatedPolicy && (
                <div style={{ lineHeight: 1.7, fontSize: '0.93rem' }}>
                  {renderPolicy(generatedPolicy)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
