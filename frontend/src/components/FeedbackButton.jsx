import { useState } from 'react'

/**
 * Floating feedback button — bottom-right corner.
 * Expands to show options: email link or form.
 */
export default function FeedbackButton() {
  const [open, setOpen] = useState(false)

  const FEEDBACK_EMAIL = 'feedback@regintel.ai'
  const FEEDBACK_SUBJECT = encodeURIComponent('RegIntel AI — Beta Feedback')
  const FEEDBACK_BODY = encodeURIComponent(
    'Hi RegIntel team,\n\nHere\'s my feedback:\n\n[Describe your experience, issues, or suggestions]\n\n'
  )

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '0.5rem',
      }}
    >
      {/* Expanded menu */}
      {open && (
        <div
          style={{
            background: '#161b22',
            border: '1px solid #30363d',
            borderRadius: '10px',
            padding: '0.75rem',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            minWidth: '200px',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <p style={{ fontSize: '0.78rem', color: '#8b949e', margin: '0 0 0.6rem', fontWeight: 600 }}>
            SEND FEEDBACK
          </p>

          <a
            href={`mailto:${FEEDBACK_EMAIL}?subject=${FEEDBACK_SUBJECT}&body=${FEEDBACK_BODY}`}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.6rem', borderRadius: '6px',
              color: '#c9d1d9', fontSize: '0.84rem', textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#21262d'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => setOpen(false)}
          >
            <i className="bi bi-envelope" style={{ color: '#4f8ef7' }} />
            Email feedback
          </a>

          <a
            href="https://github.com/regintel-ai/feedback/issues/new"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              padding: '0.5rem 0.6rem', borderRadius: '6px',
              color: '#c9d1d9', fontSize: '0.84rem', textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#21262d'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            onClick={() => setOpen(false)}
          >
            <i className="bi bi-github" style={{ color: '#8b949e' }} />
            Report a bug
          </a>

          <div style={{ borderTop: '1px solid #21262d', margin: '0.5rem 0' }} />

          <p style={{ fontSize: '0.74rem', color: '#484f58', margin: 0, paddingLeft: '0.6rem' }}>
            Beta feedback helps us improve fast.
          </p>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        title="Give Feedback"
        style={{
          width: 48, height: 48,
          borderRadius: '50%',
          background: open ? '#30363d' : '#4f8ef7',
          border: 'none',
          color: '#fff',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(79,142,247,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s ease, background 0.2s ease',
          transform: open ? 'rotate(360deg)' : 'rotate(0deg)',
        }}
      >
        <i className={`bi ${open ? 'bi-x-lg' : 'bi-chat-dots-fill'}`} />
      </button>
    </div>
  )
}
