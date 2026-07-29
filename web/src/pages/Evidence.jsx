import { useState, useEffect, useRef } from 'react'
import { controlsAPI, evidenceAPI } from '../services/api'
import AlertMessage from '../components/AlertMessage'
import { useToast } from '../context/ToastContext'
import { formatDate } from '../utils/helpers'

const AI_VALID_BADGE = {
  true:  { label: '✓ Valid',     bg: 'rgba(63,185,80,0.12)',  color: '#3fb950', border: 'rgba(63,185,80,0.3)'  },
  false: { label: '✗ Invalid',   bg: 'rgba(248,81,73,0.12)',  color: '#f85149', border: 'rgba(248,81,73,0.3)'  },
  null:  { label: '⏳ Scanning…', bg: 'rgba(139,148,158,0.12)', color: '#8b949e', border: '#30363d'             },
}

function AIValidBadge({ valid }) {
  const s = AI_VALID_BADGE[String(valid)] ?? AI_VALID_BADGE['null']
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {s.label}
    </span>
  )
}

function UploadZone({ controlId, onUploaded }) {
  const { toast }               = useToast()
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef                = useRef(null)

  async function doUpload(file) {
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await evidenceAPI.upload(controlId, fd)
      toast.success(`"${file.name}" uploaded. AI scan queued.`)
      onUploaded()
    } catch (err) {
      toast.error(err?.response?.data?.detail ?? 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); doUpload(e.dataTransfer.files[0]) }}
      onClick={() => inputRef.current?.click()}
      style={{
        border: `2px dashed ${dragging ? '#4f8ef7' : '#30363d'}`,
        borderRadius: 10, padding: '1.5rem', textAlign: 'center', cursor: 'pointer',
        background: dragging ? 'rgba(79,142,247,0.06)' : 'transparent',
        transition: 'all 0.15s',
      }}
    >
      <input ref={inputRef} type="file" style={{ display: 'none' }}
        onChange={(e) => doUpload(e.target.files[0])} />
      {uploading
        ? <><span className="spinner-border spinner-border-sm me-2" style={{ color: '#4f8ef7' }} />Uploading…</>
        : <><i className="bi bi-cloud-upload me-2" style={{ color: '#4f8ef7', fontSize: '1.2rem' }} />
            <span style={{ color: '#8b949e', fontSize: '0.85rem' }}>
              Drag &amp; drop or click to upload evidence (PDF, DOCX, screenshots…)
            </span>
          </>
      }
    </div>
  )
}

function EvidenceRow({ item, onDelete }) {
  const { toast }               = useToast()
  const [deleting, setDeleting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await evidenceAPI.delete(item.id)
      toast.success('Evidence deleted.')
      onDelete()
    } catch {
      toast.error('Failed to delete evidence.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div style={{
      background: '#0d1117', border: '1px solid #21262d', borderRadius: 8,
      padding: '0.85rem 1rem', marginBottom: '0.5rem',
    }}>
      <div className="d-flex align-items-start justify-content-between gap-2">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: '#e6edf3', fontSize: '0.88rem', wordBreak: 'break-word' }}>
            <i className="bi bi-file-earmark me-1" style={{ color: '#4f8ef7' }} />
            {item.file_name}
          </div>
          <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
            <AIValidBadge valid={item.ai_valid} />
            {item.ai_confidence != null && (
              <span style={{ fontSize: '0.7rem', color: '#8b949e' }}>
                {Math.round(item.ai_confidence * 100)}% conf.
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: '#484f58' }}>{formatDate(item.created_at)}</span>
            {item.file_size && (
              <span style={{ fontSize: '0.7rem', color: '#484f58' }}>
                {(item.file_size / 1024).toFixed(1)} KB
              </span>
            )}
          </div>
          {item.ai_explanation && (
            <>
              <button
                className="rg-expand-btn mt-1"
                onClick={() => setExpanded((v) => !v)}
                style={{ fontSize: '0.72rem' }}
              >
                <i className={`bi ${expanded ? 'bi-chevron-up' : 'bi-chevron-down'}`} />
                {expanded ? 'Hide' : 'AI Explanation'}
              </button>
              {expanded && (
                <div style={{
                  fontSize: '0.78rem', color: '#8b949e', marginTop: 6,
                  padding: '0.5rem 0.75rem', background: '#010409',
                  borderRadius: 6, border: '1px solid #21262d',
                }}>
                  {item.ai_explanation}
                </div>
              )}
            </>
          )}
        </div>
        <button
          className="btn btn-sm"
          style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', flexShrink: 0 }}
          onClick={handleDelete} disabled={deleting}
          title="Delete evidence"
        >
          {deleting ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-trash" />}
        </button>
      </div>
    </div>
  )
}

function ControlCard({ ctrl }) {
  const [open, setOpen]         = useState(false)
  const [evidence, setEvidence] = useState([])
  const [loading, setLoading]   = useState(false)

  async function fetchEvidence() {
    setLoading(true)
    try {
      const { data } = await evidenceAPI.list(ctrl.id)
      setEvidence(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
    finally { setLoading(false) }
  }

  function toggle() {
    if (!open) fetchEvidence()
    setOpen((v) => !v)
  }

  return (
    <div className="rg-card mb-3" style={{ padding: '1rem 1.25rem' }}>
      <div className="d-flex align-items-center justify-content-between" style={{ cursor: 'pointer' }} onClick={toggle}>
        <div>
          <span style={{ fontWeight: 600, color: '#e6edf3', fontSize: '0.9rem' }}>{ctrl.title}</span>
          <span style={{
            marginLeft: 10, fontSize: '0.68rem', fontWeight: 700, padding: '1px 8px', borderRadius: 20,
            background: ctrl.status === 'IMPLEMENTED' ? 'rgba(63,185,80,0.12)' : ctrl.status === 'PARTIAL' ? 'rgba(210,153,34,0.12)' : 'rgba(248,81,73,0.12)',
            color: ctrl.status === 'IMPLEMENTED' ? '#3fb950' : ctrl.status === 'PARTIAL' ? '#d29922' : '#f85149',
            border: '1px solid transparent',
          }}>{ctrl.status}</span>
        </div>
        <i className={`bi ${open ? 'bi-chevron-up' : 'bi-chevron-down'}`} style={{ color: '#8b949e' }} />
      </div>

      {open && (
        <div className="mt-3">
          <UploadZone controlId={ctrl.id} onUploaded={fetchEvidence} />
          <div className="mt-3">
            {loading && <div style={{ color: '#8b949e', fontSize: '0.85rem' }}>Loading evidence…</div>}
            {!loading && evidence.length === 0 && (
              <div style={{ color: '#484f58', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>
                No evidence uploaded yet.
              </div>
            )}
            {evidence.map((ev) => (
              <EvidenceRow key={ev.id} item={ev} onDelete={fetchEvidence} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function Evidence() {
  const [controls, setControls] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    (async () => {
      try {
        const { data } = await controlsAPI.getAll()
        setControls(Array.isArray(data) ? data : [])
      } catch (err) {
        setError(err?.response?.data?.detail ?? 'Failed to load controls.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = controls.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          <i className="bi bi-file-earmark-check me-2" style={{ color: '#4f8ef7' }} />Evidence Management
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: '4px 0 0' }}>
          Upload evidence files for each control. AI automatically validates them.
        </p>
      </div>

      <div className="mb-3">
        <input
          className="rg-input form-control"
          style={{ maxWidth: 400 }}
          placeholder="Search controls…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {error   && <AlertMessage type="error" message={error} />}
      {loading && <div style={{ color: '#8b949e' }}>Loading controls…</div>}

      {!loading && !error && filtered.map((ctrl) => (
        <ControlCard key={ctrl.id} ctrl={ctrl} />
      ))}

      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#484f58', padding: '3rem' }}>
          No controls found.
        </div>
      )}
    </div>
  )
}
