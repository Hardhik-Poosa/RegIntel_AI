import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AlertMessage from '../components/AlertMessage'

export default function Login() {
  const { login }       = useAuth()
  const navigate        = useNavigate()
  const location        = useLocation()
  const from            = location.state?.from?.pathname ?? '/dashboard'

  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email.trim(), password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg =
        err?.response?.data?.detail ??
        'Login failed. Check your credentials and try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rg-auth-page">
      <div className="rg-auth-card">
        {/* Logo */}
        <div className="rg-auth-logo">
          <i className="bi bi-shield-fill-check" />
        </div>

        <h2 className="text-center fw-bold mb-1" style={{ fontSize: '1.3rem', color: '#e6edf3' }}>
          Welcome back
        </h2>
        <p className="text-center mb-4" style={{ fontSize: '0.85rem', color: '#8b949e' }}>
          Sign in to RegIntel AI
        </p>

        <AlertMessage type="error" message={error} />

        <form onSubmit={handleSubmit} className={error ? 'mt-3' : ''} noValidate>
          {/* Email */}
          <div className="mb-3">
            <label className="form-label" htmlFor="email">Email address</label>
            <div className="input-group">
              <span
                className="input-group-text"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRight: 'none', color: '#8b949e' }}
              >
                <i className="bi bi-envelope" />
              </span>
              <input
                id="email"
                type="email"
                className="rg-input form-control"
                style={{ borderLeft: 'none' }}
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-group">
              <span
                className="input-group-text"
                style={{ background: '#0d1117', border: '1px solid #30363d', borderRight: 'none', color: '#8b949e' }}
              >
                <i className="bi bi-lock" />
              </span>
              <input
                id="password"
                type={showPwd ? 'text' : 'password'}
                className="rg-input form-control"
                style={{ borderLeft: 'none', borderRight: 'none' }}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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

          <button
            type="submit"
            className="btn rg-btn-primary w-100"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Signing in…
              </>
            ) : (
              <>
                <i className="bi bi-box-arrow-in-right me-2" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center mt-4 mb-0" style={{ fontSize: '0.83rem', color: '#8b949e' }}>
          Don&apos;t have an account?{' '}
          <Link to="/register" style={{ color: '#4f8ef7', textDecoration: 'none', fontWeight: 600 }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
