import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authAPI } from '../services/api'
import AlertMessage from '../components/AlertMessage'

const INDUSTRIES = [
  'Finance', 'Healthcare', 'Technology', 'Manufacturing',
  'Retail', 'Education', 'Government', 'Energy', 'Other',
]

export default function Register() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email:     '',
    password:  '',
    confirmPwd:'',
    orgName:   '',
    industry:  '',
  })
  const [showPwd, setShowPwd]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirmPwd) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      await authAPI.register({
        email: form.email.trim(),
        password: form.password,
        organization: {
          name:     form.orgName.trim(),
          industry: form.industry || null,
        },
      })
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rg-auth-page">
      <div className="rg-auth-card" style={{ maxWidth: '460px' }}>
        {/* Logo */}
        <div className="rg-auth-logo">
          <i className="bi bi-shield-fill-check" />
        </div>

        <h2 className="text-center fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#e6edf3' }}>
          Create your account
        </h2>
        <p className="text-center mb-4" style={{ fontSize: '0.85rem', color: '#8b949e' }}>
          Start managing compliance with RegIntel AI
        </p>

        <AlertMessage type="error"   message={error}   />
        <AlertMessage type="success" message={success} />

        <form onSubmit={handleSubmit} className={(error || success) ? 'mt-3' : ''} noValidate>

          {/* Organisation */}
          <div className="mb-3">
            <label className="form-label" htmlFor="orgName">Organisation Name</label>
            <input
              id="orgName" name="orgName" type="text"
              className="rg-input form-control"
              placeholder="Acme Corp"
              value={form.orgName}
              onChange={handleChange}
              required
            />
          </div>

          {/* Industry */}
          <div className="mb-3">
            <label className="form-label" htmlFor="industry">Industry <span style={{ color: '#484f58' }}>(optional)</span></label>
            <select
              id="industry" name="industry"
              className="rg-input form-control form-select"
              value={form.industry}
              onChange={handleChange}
            >
              <option value="">Select industry…</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          {/* Email */}
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email address</label>
            <input
              id="email" name="email" type="email"
              className="rg-input form-control"
              placeholder="you@company.com"
              value={form.email}
              onChange={handleChange}
              required
              autoComplete="email"
            />
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group">
              <input
                id="password" name="password" type={showPwd ? 'text' : 'password'}
                className="rg-input form-control"
                style={{ borderRight: 'none' }}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="input-group-text"
                onClick={() => setShowPwd((v) => !v)}
                style={{ background: '#0d1117', border: '1px solid #30363d', borderLeft: 'none', color: '#8b949e', cursor: 'pointer' }}
              >
                <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="mb-4">
            <label className="form-label" htmlFor="confirmPwd">Confirm Password</label>
            <input
              id="confirmPwd" name="confirmPwd" type={showPwd ? 'text' : 'password'}
              className="rg-input form-control"
              placeholder="Repeat password"
              value={form.confirmPwd}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn rg-btn-primary w-100"
            disabled={loading || !form.email || !form.password || !form.orgName}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Creating account…
              </>
            ) : (
              <>
                <i className="bi bi-person-plus-fill me-2" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-4 mb-0" style={{ fontSize: '0.83rem', color: '#8b949e' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#4f8ef7', textDecoration: 'none', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
