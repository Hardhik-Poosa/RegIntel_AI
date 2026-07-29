import { useState, useEffect } from 'react'
import { usersAPI, getErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AlertMessage from '../components/AlertMessage'

const ROLE_COLOR = {
  ADMIN:              { bg: 'rgba(248,81,73,0.1)',   color: '#f85149', border: 'rgba(248,81,73,0.25)'   },
  COMPLIANCE_OFFICER: { bg: 'rgba(79,142,247,0.1)',  color: '#4f8ef7', border: 'rgba(79,142,247,0.25)'  },
  AUDITOR:            { bg: 'rgba(210,153,34,0.1)',  color: '#d29922', border: 'rgba(210,153,34,0.25)'  },
  VIEWER:             { bg: 'rgba(139,148,158,0.1)', color: '#8b949e', border: 'rgba(139,148,158,0.3)'  },
}

function RolePill({ role }) {
  const s = ROLE_COLOR[role] ?? ROLE_COLOR.VIEWER
  return (
    <span style={{
      fontSize: '0.7rem', fontWeight: 700, padding: '2px 9px', borderRadius: 20,
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>
      {role?.replace('_', ' ')}
    </span>
  )
}

// ── Invite form ─────────────────────────────────────────────────────────────
function InviteForm({ onInvited }) {
  const { toast } = useToast()
  const [form, setForm]     = useState({ email: '', password: '', role: 'VIEWER' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function handleChange(e) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await usersAPI.invite(form)
      toast.success(`${form.email} invited successfully.`)
      setForm({ email: '', password: '', role: 'VIEWER' })
      onInvited()
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to invite user.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rg-card mb-4">
      <div className="rg-card-header mb-3">
        <p className="rg-card-title">
          <i className="bi bi-person-plus me-2" style={{ color: '#3fb950' }} />
          Invite Team Member
        </p>
      </div>
      <AlertMessage type="error" message={error} />
      <form onSubmit={handleSubmit}>
        <div className="row g-2">
          <div className="col-12 col-md-4">
            <input
              name="email" type="email"
              className="rg-input form-control"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="col-12 col-md-3">
            <input
              name="password" type="password"
              className="rg-input form-control"
              placeholder="Temporary password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
            />
          </div>
          <div className="col-6 col-md-3">
            <select name="role" className="rg-input form-control form-select" value={form.role} onChange={handleChange}>
              <option value="VIEWER">Viewer</option>
              <option value="AUDITOR">Auditor</option>
              <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="col-6 col-md-2">
            <button
              type="submit" className="btn rg-btn-primary btn-sm w-100"
              disabled={saving || !form.email || !form.password}
            >
              {saving ? <span className="spinner-border spinner-border-sm" /> : 'Invite'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

// ── Member row ───────────────────────────────────────────────────────────────
function MemberRow({ member, currentUser, onChanged, onRemoved }) {
  const { toast }             = useToast()
  const [role, setRole]       = useState(member.role)
  const [updating, setUpdating] = useState(false)
  const [removing, setRemoving] = useState(false)
  const isSelf = member.id === currentUser?.id

  async function changeRole(newRole) {
    setUpdating(true)
    try {
      await usersAPI.changeRole(member.id, newRole)
      setRole(newRole)
      toast.success('Role updated.')
      onChanged()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to update role.'))
    } finally {
      setUpdating(false)
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remove ${member.email} from your organisation?`)) return
    setRemoving(true)
    try {
      await usersAPI.remove(member.id)
      toast.success(`${member.email} removed.`)
      onRemoved()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to remove user.'))
      setRemoving(false)
    }
  }

  return (
    <tr style={{ opacity: member.is_active ? 1 : 0.45 }}>
      <td>
        <div style={{ fontWeight: 600, color: '#e6edf3' }}>{member.email}</div>
        {!member.is_active && (
          <span style={{ fontSize: '0.7rem', color: '#f85149' }}>Deactivated</span>
        )}
      </td>
      <td><RolePill role={member.role} /></td>
      <td>
        {isSelf || !member.is_active ? (
          <span style={{ color: '#484f58', fontSize: '0.8rem' }}>—</span>
        ) : (
          <select
            className="rg-input form-control form-select"
            style={{ fontSize: '0.78rem', padding: '3px 8px', width: 'auto' }}
            value={role}
            onChange={(e) => changeRole(e.target.value)}
            disabled={updating}
          >
            <option value="VIEWER">Viewer</option>
            <option value="AUDITOR">Auditor</option>
            <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
            <option value="ADMIN">Admin</option>
          </select>
        )}
      </td>
      <td style={{ textAlign: 'right' }}>
        {!isSelf && member.is_active && (
          <button
            className="btn btn-sm"
            style={{ background: 'rgba(248,81,73,0.1)', border: '1px solid rgba(248,81,73,0.2)', color: '#f85149', borderRadius: '6px', fontSize: '0.78rem' }}
            onClick={handleRemove}
            disabled={removing}
            title="Deactivate user"
          >
            {removing ? <span className="spinner-border spinner-border-sm" /> : <i className="bi bi-person-dash" />}
          </button>
        )}
        {isSelf && (
          <span style={{ fontSize: '0.72rem', color: '#484f58' }}>You</span>
        )}
      </td>
    </tr>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function OrgSettings() {
  const { user }              = useAuth()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const isAdmin               = user?.role === 'ADMIN'

  async function loadMembers() {
    setLoading(true)
    setError('')
    try {
      const { data } = await usersAPI.list()
      setMembers(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load team members.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadMembers() }, [])

  const active   = members.filter((m) => m.is_active)
  const inactive = members.filter((m) => !m.is_active)

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          Organisation Settings
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
          Manage team members, roles, and access
        </p>
      </div>

      {/* Stats strip */}
      <div className="row g-3 mb-4">
        {[
          { label: 'Active Members', value: active.length,   color: '#3fb950', icon: 'bi-people' },
          { label: 'Admins',         value: active.filter((m) => m.role === 'ADMIN').length, color: '#f85149', icon: 'bi-shield-fill' },
          { label: 'Viewers',        value: active.filter((m) => m.role === 'VIEWER').length, color: '#8b949e', icon: 'bi-eye' },
        ].map((s) => (
          <div className="col-4" key={s.label}>
            <div className="rg-card text-center" style={{ padding: '1rem' }}>
              <i className={`bi ${s.icon}`} style={{ fontSize: '1.25rem', color: s.color }} />
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: s.color, lineHeight: 1.1, marginTop: 4 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', color: '#8b949e', marginTop: 2 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Invite form — admin only */}
      {isAdmin && <InviteForm onInvited={loadMembers} />}

      {/* Members table */}
      <div className="rg-card p-0">
        <div className="rg-card-header px-4 pt-3 pb-2">
          <p className="rg-card-title">
            <i className="bi bi-people me-2" style={{ color: '#4f8ef7' }} />
            Team Members
          </p>
          <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>{active.length} active</span>
        </div>

        {error && <div className="p-3"><AlertMessage type="error" message={error} /></div>}

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#484f58' }}>
            <div className="spinner-border spinner-border-sm" />
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table rg-table mb-0">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>{isAdmin ? 'Change Role' : 'Role'}</th>
                  <th style={{ textAlign: 'right' }}>{isAdmin ? 'Actions' : ''}</th>
                </tr>
              </thead>
              <tbody>
                {active.map((m) => (
                  <MemberRow
                    key={m.id} member={m}
                    currentUser={user} onChanged={loadMembers} onRemoved={loadMembers}
                  />
                ))}
                {inactive.length > 0 && inactive.map((m) => (
                  <MemberRow
                    key={m.id} member={m}
                    currentUser={user} onChanged={loadMembers} onRemoved={loadMembers}
                  />
                ))}
                {members.length === 0 && !error && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: '#484f58', padding: '2rem' }}>
                      No members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role legend */}
      <div className="rg-card mt-4">
        <div className="rg-card-header mb-3">
          <p className="rg-card-title">
            <i className="bi bi-info-circle me-2" style={{ color: '#4f8ef7' }} />
            Role Permissions
          </p>
        </div>
        <div className="row g-2">
          {[
            { role: 'ADMIN',              desc: 'Full access: invite users, change roles, manage all data.' },
            { role: 'COMPLIANCE_OFFICER', desc: 'View & manage controls, run compliance reports, view audit logs.' },
            { role: 'AUDITOR',            desc: 'Read-only access to controls, compliance data, and audit logs.' },
            { role: 'VIEWER',             desc: 'View-only dashboard access. Cannot modify any data.' },
          ].map(({ role, desc }) => (
            <div className="col-12 col-md-6" key={role}>
              <div className="d-flex gap-3 align-items-start" style={{ padding: '0.4rem 0' }}>
                <RolePill role={role} />
                <span style={{ fontSize: '0.78rem', color: '#8b949e', flex: 1 }}>{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
