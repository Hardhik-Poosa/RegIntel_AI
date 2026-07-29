import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: '1rem',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{
        width: 72, height: 72,
        background: 'rgba(248,81,73,0.1)',
        border: '1px solid rgba(248,81,73,0.25)',
        borderRadius: '18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '2rem', color: '#f85149', margin: '0 auto',
      }}>
        <i className="bi bi-exclamation-triangle" />
      </div>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: '#e6edf3', lineHeight: 1 }}>404</h1>
      <p style={{ fontSize: '1rem', color: '#8b949e', maxWidth: 320 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to="/dashboard" className="btn rg-btn-primary">
        <i className="bi bi-arrow-left me-2" />
        Back to Dashboard
      </Link>
    </div>
  )
}
