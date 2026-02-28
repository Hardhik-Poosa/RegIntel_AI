import { useState, useEffect, useRef } from 'react'
import { Modal }        from 'bootstrap'
import { controlsAPI }  from '../services/api'
import { RiskBadge, StatusBadge } from '../components/RiskBadge'
import AlertMessage     from '../components/AlertMessage'
import { TableSkeleton } from '../components/Skeleton'
import { useToast }     from '../context/ToastContext'
import { formatDate, truncate } from '../utils/helpers'

// ── Empty form shape ───────────────────────────────────
const EMPTY_FORM = { title: '', description: '', status: 'MISSING', risk_score: 'MEDIUM' }

// ── Inline expandable AI section ───────────────────────
function AISection({ text }) {
  const [open, setOpen] = useState(false)
  if (!text) return <span style={{ color: '#484f58', fontSize: '0.8rem' }}>— no analysis</span>
  return (
    <div>
      <button className="rg-expand-btn" onClick={() => setOpen((v) => !v)}>
        <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
        {open ? 'Hide' : 'View'} AI Analysis
      </button>
      {open && <div className="rg-expand-content">{text}</div>}
    </div>
  )
}

// ── Control Form Modal ─────────────────────────────────
function ControlModal({ modalRef, editTarget, onSaved }) {
  const { toast }             = useToast()
  const [form, setForm]       = useState(EMPTY_FORM)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Populate form when editing
  useEffect(() => {
    if (editTarget) {
      setForm({
        title:       editTarget.title       ?? '',
        description: editTarget.description ?? '',
        status:      editTarget.status      ?? 'MISSING',
        risk_score:  editTarget.risk_score  ?? 'MEDIUM',
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setError('')
  }, [editTarget])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editTarget) {
        await controlsAPI.update(editTarget.id, form)
        Modal.getInstance(modalRef.current)?.hide()
        toast.success(`"${form.title}" updated successfully.`)
      } else {
        await controlsAPI.create(form)
        Modal.getInstance(modalRef.current)?.hide()
        toast.success(`"${form.title}" created successfully.`)
      }
      onSaved()
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to save control.'
      setError(msg)
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className={`bi ${editTarget ? 'bi-pencil' : 'bi-plus-circle'} me-2`} style={{ color: '#4f8ef7' }} />
              {editTarget ? 'Edit Control' : 'Create Control'}
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <AlertMessage type="error" message={error} />

              <div className={`mb-3 ${error ? 'mt-3' : ''}`}>
                <label className="form-label" htmlFor="ctrl-title">Title <span style={{ color: '#f85149' }}>*</span></label>
                <input
                  id="ctrl-title" name="title" type="text"
                  className="rg-input form-control"
                  placeholder="e.g. Access Control Policy"
                  value={form.title}
                  onChange={handleChange}
                  required
                  minLength={3}
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="ctrl-desc">Description</label>
                <textarea
                  id="ctrl-desc" name="description"
                  className="rg-input form-control"
                  rows={3}
                  placeholder="Describe the control and its purpose…"
                  value={form.description}
                  onChange={handleChange}
                />
              </div>

              <div className="row g-3">
                <div className="col-6">
                  <label className="form-label" htmlFor="ctrl-status">Status</label>
                  <select
                    id="ctrl-status" name="status"
                    className="rg-input form-control form-select"
                    value={form.status}
                    onChange={handleChange}
                  >
                    <option value="IMPLEMENTED">Implemented</option>
                    <option value="PARTIAL">Partial</option>
                    <option value="MISSING">Missing</option>
                  </select>
                </div>
                <div className="col-6">
                  <label className="form-label" htmlFor="ctrl-risk">Risk Level</label>
                  <select
                    id="ctrl-risk" name="risk_score"
                    className="rg-input form-control form-select"
                    value={form.risk_score}
                    onChange={handleChange}
                  >
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-sm" data-bs-dismiss="modal"
                style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', borderRadius: '8px', padding: '0.5rem 1rem' }}>
                Cancel
              </button>
              <button type="submit" className="btn rg-btn-primary btn-sm" disabled={saving || !form.title.trim()}>
                {saving ? <><span className="spinner-border spinner-border-sm me-1" /> Saving…</> : 'Save Control'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ── Delete Confirmation Modal ──────────────────────────
function DeleteModal({ modalRef, target, onDeleted }) {
  const { toast }               = useToast()
  const [deleting, setDeleting] = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => { setError('') }, [target])

  async function handleDelete() {
    if (!target) return
    setDeleting(true)
    setError('')
    try {
      await controlsAPI.delete(target.id)
      Modal.getInstance(modalRef.current)?.hide()
      toast.success(`"${target.title}" deleted.`)
      onDeleted()
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'Failed to delete control.'
      setError(msg)
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-dialog-centered modal-sm">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" style={{ color: '#f85149' }}>
              <i className="bi bi-trash me-2" /> Delete Control
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="modal" />
          </div>
          <div className="modal-body" style={{ fontSize: '0.88rem', color: '#c9d1d9' }}>
            <AlertMessage type="error" message={error} />
            <p className={error ? 'mt-3 mb-0' : 'mb-0'}>
              Are you sure you want to delete{' '}
              <strong style={{ color: '#e6edf3' }}>&quot;{target?.title}&quot;</strong>?
              This cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-sm" data-bs-dismiss="modal"
              style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', borderRadius: '8px', padding: '0.5rem 1rem' }}>
              Cancel
            </button>
            <button
              type="button" className="btn btn-sm"
              style={{ background: '#f85149', border: 'none', color: '#fff', borderRadius: '8px', padding: '0.5rem 1rem', fontWeight: 600 }}
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? <><span className="spinner-border spinner-border-sm me-1" /> Deleting…</> : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Controls Page ─────────────────────────────────
export default function Controls() {
  const [controls, setControls] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [riskFilter, setRiskFilter]     = useState('ALL')
  const [editTarget, setEditTarget]     = useState(null)   // null = create mode
  const [deleteTarget, setDeleteTarget] = useState(null)

  const ctrlModalEl   = useRef(null)
  const deleteModalEl = useRef(null)

  // Fetch controls
  async function fetchControls() {
    setLoading(true)
    setError('')
    try {
      const { data } = await controlsAPI.getAll()
      setControls(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.response?.data?.detail ?? 'Failed to load controls.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchControls() }, [])

  // Open create modal
  function openCreate() {
    setEditTarget(null)
    new Modal(ctrlModalEl.current).show()
  }

  // Open edit modal
  function openEdit(ctrl) {
    setEditTarget(ctrl)
    new Modal(ctrlModalEl.current).show()
  }

  // Open delete modal
  function openDelete(ctrl) {
    setDeleteTarget(ctrl)
    new Modal(deleteModalEl.current).show()
  }

  // Filtered list
  const filtered = controls.filter((c) => {
    const matchSearch = search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'ALL' || c.status === statusFilter
    const matchRisk   = riskFilter   === 'ALL' || c.risk_score === riskFilter
    return matchSearch && matchStatus && matchRisk
  })

  return (
    <div>
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>Controls Management</h2>
          <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
            {controls.length} total control{controls.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn rg-btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1" /> New Control
        </button>
      </div>

      {/* Filters */}
      <div className="rg-card mb-4">
        <div className="row g-2 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group">
              <span className="input-group-text"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRight: 'none', color: '#8b949e' }}>
                <i className="bi bi-search" />
              </span>
              <input
                type="text"
                className="rg-input form-control"
                style={{ borderLeft: 'none' }}
                placeholder="Search controls…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="rg-input form-control form-select"
              value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">All Statuses</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="PARTIAL">Partial</option>
              <option value="MISSING">Missing</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="rg-input form-control form-select"
              value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="ALL">All Risks</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div className="col-12 col-md-1 text-end">
            {(search || statusFilter !== 'ALL' || riskFilter !== 'ALL') && (
              <button className="btn btn-sm" style={{ color: '#8b949e', fontSize: '0.8rem' }}
                onClick={() => { setSearch(''); setStatusFilter('ALL'); setRiskFilter('ALL') }}>
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Feedback */}
      {error   && <AlertMessage type="error" message={error} />}
      {loading && <div className="rg-card p-0"><TableSkeleton cols={6} rows={6} /></div>}

      {/* Table */}
      {!loading && !error && (
        <div className="rg-card p-0">
          {filtered.length === 0 ? (
            <div className="rg-empty">
              <i className="bi bi-shield-x" />
              <div className="rg-empty-title">No controls found</div>
              <p style={{ fontSize: '0.82rem' }}>
                {controls.length === 0
                  ? 'Create your first control to get started.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {controls.length === 0 && (
                <button className="btn rg-btn-primary btn-sm mt-2" onClick={openCreate}>
                  Create Control
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table rg-table mb-0">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>AI Analysis</th>
                    <th>Created</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((ctrl) => (
                    <tr key={ctrl.id}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#e6edf3', marginBottom: '2px' }}>
                          {ctrl.title}
                        </div>
                        {ctrl.description && (
                          <div style={{ fontSize: '0.77rem', color: '#8b949e' }}>
                            {truncate(ctrl.description, 80)}
                          </div>
                        )}
                      </td>
                      <td><StatusBadge status={ctrl.status} /></td>
                      <td><RiskBadge risk={ctrl.risk_score} /></td>
                      <td style={{ maxWidth: '240px' }}>
                        <AISection text={ctrl.ai_analysis} />
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(ctrl.created_at)}</td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <button
                          className="btn btn-sm me-1"
                          style={{ background: 'rgba(79,142,247,0.1)', border: '1px solid rgba(79,142,247,0.2)', color: '#4f8ef7', borderRadius: '6px' }}
                          onClick={() => openEdit(ctrl)}
                          title="Edit control"
                        >
                          <i className="bi bi-pencil" />
                        </button>
                        <button
                          className="btn btn-sm"
                          style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px' }}
                          onClick={() => openDelete(ctrl)}
                          title="Delete control"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <ControlModal
        modalRef={ctrlModalEl}
        editTarget={editTarget}
        onSaved={fetchControls}
      />
      <DeleteModal
        modalRef={deleteModalEl}
        target={deleteTarget}
        onDeleted={fetchControls}
      />
    </div>
  )
}
