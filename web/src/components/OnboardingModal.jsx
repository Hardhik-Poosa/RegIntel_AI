import { useState } from 'react'
import { Link } from 'react-router-dom'

const STEPS = [
  {
    icon: 'bi-shield-plus',
    color: '#4f8ef7',
    title: 'Add your first control',
    desc: 'Create a control — e.g. "Access Control Policy" or "Data Encryption Standard". Each control tracks an action your organisation takes to stay compliant.',
    cta: null,
  },
  {
    icon: 'bi-graph-up-arrow',
    color: '#3fb950',
    title: 'Review your compliance score',
    desc: 'As you mark controls as Implemented, Partial, or Missing, your live compliance score updates automatically. Target 75%+ for a strong posture.',
    cta: null,
  },
  {
    icon: 'bi-robot',
    color: '#d29922',
    title: 'Use AI Insights',
    desc: 'Chat with the AI to identify gaps, get remediation steps, and understand risk exposure. The AI understands your specific control descriptions.',
    cta: null,
  },
]

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  function handleNext() {
    if (isLast) {
      onClose()
    } else {
      setStep((s) => s + 1)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          zIndex: 1050, backdropFilter: 'blur(2px)',
        }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 1051,
          width: 'min(480px, 92vw)',
          background: '#161b22',
          border: '1px solid #30363d',
          borderRadius: '12px',
          padding: '2rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        }}
      >
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between mb-3">
          <span style={{ fontSize: '0.75rem', color: '#8b949e', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Getting started — {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: '1.2rem', cursor: 'pointer', lineHeight: 1 }}
          >
            <i className="bi bi-x" />
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: '#21262d', borderRadius: 99, marginBottom: '1.75rem' }}>
          <div
            style={{
              height: '100%',
              width: `${((step + 1) / STEPS.length) * 100}%`,
              background: current.color,
              borderRadius: 99,
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        {/* Step icon */}
        <div
          style={{
            width: 56, height: 56, borderRadius: '14px',
            background: `rgba(${current.color === '#4f8ef7' ? '79,142,247' : current.color === '#3fb950' ? '63,185,80' : '210,153,34'},0.12)`,
            border: `1px solid ${current.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.6rem', color: current.color, marginBottom: '1rem',
          }}
        >
          <i className={`bi ${current.icon}`} />
        </div>

        {/* Content */}
        <h4 style={{ color: '#e6edf3', fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.6rem' }}>
          {current.title}
        </h4>
        <p style={{ color: '#8b949e', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: '1.75rem' }}>
          {current.desc}
        </p>

        {/* Actions */}
        <div className="d-flex align-items-center justify-content-between gap-2">
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#484f58', fontSize: '0.82rem', cursor: 'pointer', padding: 0 }}
          >
            Skip tour
          </button>

          <div className="d-flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="btn btn-sm"
                style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9' }}
              >
                Back
              </button>
            )}
            {isLast ? (
              <Link to="/controls" className="btn btn-sm rg-btn-primary" onClick={onClose}>
                <i className="bi bi-plus-lg me-1" /> Add First Control
              </Link>
            ) : (
              <button onClick={handleNext} className="btn btn-sm rg-btn-primary">
                Next <i className="bi bi-arrow-right ms-1" />
              </button>
            )}
          </div>
        </div>

        {/* Step dots */}
        <div className="d-flex justify-content-center gap-2 mt-4">
          {STEPS.map((_, i) => (
            <div
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 20 : 8, height: 8, borderRadius: 99,
                background: i === step ? current.color : '#30363d',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>
    </>
  )
}
