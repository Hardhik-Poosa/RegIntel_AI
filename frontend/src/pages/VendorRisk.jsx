import { useState, useEffect, useCallback } from 'react'
import { vendorsAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

const RISK_COLORS   = { HIGH: 'danger', MEDIUM: 'warning', LOW: 'success' }
const STATUS_COLORS = { PENDING: 'secondary', APPROVED: 'success', REJECTED: 'danger', UNDER_REVIEW: 'info' }
const CATEGORIES    = ['Payment', 'Infrastructure', 'Cloud', 'SaaS', 'Analytics', 'Communication', 'Security', 'Consulting', 'Other']

const EMPTY_FORM = { name: '', category: '', website: '', description: '', notes: '' }

export default function VendorRisk() {
  const [vendors, setVendors]       = useState([])
  const [summary, setSummary]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [showModal, setShowModal]   = useState(false)
  const [editVendor, setEditVendor] = useState(null)  // null = create mode
  const [form, setForm]             = useState(EMPTY_FORM)
  const [saving, setSaving]         = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [vRes, sRes] = await Promise.all([vendorsAPI.list(), vendorsAPI.summary()])
      setVendors(vRes.data)
      setSummary(sRes.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  function openCreate() {
    setEditVendor(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  function openEdit(v) {
    setEditVendor(v)
    setForm({ name: v.name, category: v.category || '', website: v.website || '', description: v.description || '', notes: v.notes || '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Vendor name is required.'); return }
    setSaving(true)
    setError('')
    try {
      if (editVendor) {
        await vendorsAPI.update(editVendor.id, form)
      } else {
        await vendorsAPI.create(form)
      }
      setShowModal(false)
      await load()
    } catch (err) {
      setError(getErrorMessage(err, 'Save failed.'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this vendor?')) return
    try {
      await vendorsAPI.delete(id)
      await load()
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  async function handleStatusChange(vendor, status) {
    try { await vendorsAPI.update(vendor.id, { review_status: status }); await load() }
    catch (err) { setError(getErrorMessage(err)) }
  }

  return (
    <div className="container-fluid px-4 py-4">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className="d-flex align-items-center justify-content-center rounded-3"
            style={{ width: 48, height: 48, background: 'linear-gradient(135deg,#198754,#20c997)', color: '#fff', fontSize: 22 }}
          >
            <i className="bi bi-building-check" />
          </div>
          <div>
            <h4 className="mb-0 fw-bold">Vendor Risk Management</h4>
            <p className="mb-0 text-muted small">Track and assess third-party vendor risks</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" /> Add Vendor
        </button>
      </div>

      {error && <div className="alert alert-danger py-2 small">{error}</div>}

      {/* ── Summary Cards ──────────────────────────────── */}
      {summary && (
        <div className="row g-3 mb-4">
          {[
            { label: 'Total Vendors', value: summary.total,          icon: 'bi-building', color: '#4361ee' },
            { label: 'High Risk',     value: summary.high,           icon: 'bi-exclamation-triangle-fill', color: '#dc3545' },
            { label: 'Medium Risk',   value: summary.medium,         icon: 'bi-exclamation-circle-fill', color: '#fd7e14' },
            { label: 'Pending Review',value: summary.pending_review, icon: 'bi-clock-fill', color: '#6c757d' },
          ].map(c => (
            <div key={c.label} className="col-sm-6 col-xl-3">
              <div className="card border-0 shadow-sm">
                <div className="card-body d-flex align-items-center gap-3">
                  <div className="rounded-3 p-3" style={{ background: c.color + '1a', color: c.color, fontSize: 22 }}>
                    <i className={`bi ${c.icon}`} />
                  </div>
                  <div>
                    <div className="fs-4 fw-bold">{c.value}</div>
                    <div className="text-muted small">{c.label}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────── */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-transparent fw-semibold">
          <i className="bi bi-list-ul me-1" /> Vendor Registry
        </div>
        <div className="table-responsive">
          {loading ? (
            <div className="text-center py-5"><div className="spinner-border text-primary" /></div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-building display-4 d-block mb-2 opacity-25" />
              No vendors yet. Click <strong>Add Vendor</strong> to get started.
            </div>
          ) : (
            <table className="table table-hover mb-0">
              <thead className="table-light small text-muted">
                <tr>
                  <th>Vendor</th><th>Category</th><th>Risk Level</th>
                  <th>Review Status</th><th>Website</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map(v => (
                  <tr key={v.id}>
                    <td>
                      <div className="fw-semibold">{v.name}</div>
                      {v.description && <div className="text-muted" style={{ fontSize: '0.78rem' }}>{v.description.slice(0, 60)}{v.description.length > 60 ? '…' : ''}</div>}
                    </td>
                    <td><span className="badge bg-light text-dark border">{v.category || '—'}</span></td>
                    <td><span className={`badge bg-${RISK_COLORS[v.risk_level] || 'secondary'}`}>{v.risk_level}</span></td>
                    <td>
                      <select
                        className={`badge bg-${STATUS_COLORS[v.review_status] || 'secondary'} border-0 text-white`}
                        style={{ cursor: 'pointer' }}
                        value={v.review_status}
                        onChange={e => handleStatusChange(v, e.target.value)}
                      >
                        {['PENDING','UNDER_REVIEW','APPROVED','REJECTED'].map(s => <option key={s} className="text-dark">{s}</option>)}
                      </select>
                    </td>
                    <td>
                      {v.website
                        ? <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-primary small"><i className="bi bi-box-arrow-up-right me-1" />{v.website.replace(/https?:\/\//,'').slice(0,30)}</a>
                        : <span className="text-muted small">—</span>}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => openEdit(v)}><i className="bi bi-pencil" /></button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(v.id)}><i className="bi bi-trash" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="modal d-block" tabIndex="-1" style={{ background: 'rgba(0,0,0,.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editVendor ? 'Edit Vendor' : 'Add Vendor'}</h5>
                <button className="btn-close" onClick={() => setShowModal(false)} />
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger py-2 small">{error}</div>}
                {[
                  { label: 'Vendor Name *', key: 'name', placeholder: 'e.g. AWS, Stripe, Razorpay', type: 'text' },
                  { label: 'Website', key: 'website', placeholder: 'https://...', type: 'url' },
                ].map(f => (
                  <div key={f.key} className="mb-3">
                    <label className="form-label fw-semibold small">{f.label}</label>
                    <input className="form-control" type={f.type} placeholder={f.placeholder} value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                  </div>
                ))}
                <div className="mb-3">
                  <label className="form-label fw-semibold small">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    <option value="">— Select —</option>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                {['description','notes'].map(f => (
                  <div key={f} className="mb-3">
                    <label className="form-label fw-semibold small">{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                    <textarea className="form-control" rows={2} value={form[f]}
                      onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? <span className="spinner-border spinner-border-sm me-1" /> : null}
                  {editVendor ? 'Save Changes' : 'Add Vendor'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
