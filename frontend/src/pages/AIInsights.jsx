import { useState, useEffect, useRef } from 'react'
import { aiAPI, controlsAPI } from '../services/api'
import { RiskBadge }          from '../components/RiskBadge'
import LoadingSpinner          from '../components/LoadingSpinner'
import AlertMessage            from '../components/AlertMessage'
import { useToast }            from '../context/ToastContext'
import { truncate, formatDate } from '../utils/helpers'

// Suggested prompts
const SUGGESTIONS = [
  'What are my highest-risk compliance gaps?',
  'Summarise my current compliance posture.',
  'Which missing controls should I prioritise?',
  'How can I improve my compliance score?',
  'What are best practices for access control?',
]

export default function AIInsights() {
  const { toast }                     = useToast()
  const [controls, setControls]       = useState([])
  const [ctrlLoading, setCtrlLoading] = useState(true)
  const [ctrlError, setCtrlError]     = useState('')

  const [prompt, setPrompt]           = useState('')
  const [response, setResponse]       = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError]     = useState('')

  const textareaRef = useRef(null)

  // Load high-risk controls
  useEffect(() => {
    let cancelled = false
    async function load() {
      setCtrlLoading(true)
      try {
        const { data } = await controlsAPI.getAll()
        if (!cancelled) {
          const highRisk = Array.isArray(data)
            ? data.filter((c) => c.risk_score === 'HIGH' || c.status === 'MISSING')
            : []
          setControls(highRisk)
        }
      } catch (err) {
        if (!cancelled) setCtrlError(err?.response?.data?.detail ?? 'Failed to load controls.')
      } finally {
        if (!cancelled) setCtrlLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  async function handleChat(e) {
    e?.preventDefault()
    const p = prompt.trim()
    if (!p) return
    setChatLoading(true)
    setChatError('')
    setResponse('')
    try {
      const { data } = await aiAPI.chat(p)
      setResponse(data.response ?? 'No response received.')
      toast.success('AI analysis complete.')
    } catch (err) {
      const msg = err?.response?.data?.detail ?? 'AI service failed. Please try again.'
      setChatError(msg)
      toast.error(msg)
    } finally {
      setChatLoading(false)
    }
  }

  function useSuggestion(s) {
    setPrompt(s)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e6edf3', margin: 0 }}>
          AI Insights
        </h2>
        <p style={{ fontSize: '0.82rem', color: '#8b949e', margin: 0 }}>
          AI-powered compliance analysis and recommendations
        </p>
      </div>

      <div className="row g-4">
        {/* Left — AI Chat */}
        <div className="col-12 col-lg-7">
          {/* Quick suggestions */}
          <div className="rg-card mb-3">
            <p className="rg-card-title mb-2">
              <i className="bi bi-lightbulb me-2" style={{ color: '#d29922' }} />
              Quick prompts
            </p>
            <div className="d-flex gap-2 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => useSuggestion(s)}
                  style={{
                    background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9',
                    borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.78rem',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#4f8ef7'; e.currentTarget.style.color = '#4f8ef7' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#30363d'; e.currentTarget.style.color = '#c9d1d9' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Chat box */}
          <div className="rg-ai-prompt-box">
            <div className="d-flex align-items-center gap-2 mb-3">
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, #4f8ef7, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.9rem', color: '#fff', flexShrink: 0,
              }}>
                <i className="bi bi-robot" />
              </div>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e6edf3' }}>
                RegIntel AI Assistant
              </span>
              <span style={{
                fontSize: '0.65rem', background: 'rgba(79,142,247,0.12)', color: '#4f8ef7',
                border: '1px solid rgba(79,142,247,0.25)', borderRadius: '4px',
                padding: '0.1rem 0.4rem', fontWeight: 600, letterSpacing: '0.4px',
              }}>
                ONLINE
              </span>
            </div>

            <form onSubmit={handleChat}>
              <textarea
                ref={textareaRef}
                className="rg-input form-control mb-3"
                rows={4}
                placeholder="Ask anything about compliance, risk, or your controls…"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleChat()
                }}
              />
              <div className="d-flex align-items-center justify-content-between gap-2">
                <span style={{ fontSize: '0.72rem', color: '#484f58' }}>
                  <i className="bi bi-keyboard me-1" />
                  Ctrl + Enter to send
                </span>
                <button
                  type="submit"
                  className="btn rg-btn-primary btn-sm"
                  disabled={chatLoading || !prompt.trim()}
                >
                  {chatLoading ? (
                    <><span className="spinner-border spinner-border-sm me-1" /> Analysing…</>
                  ) : (
                    <><i className="bi bi-send me-1" /> Ask AI</>
                  )}
                </button>
              </div>
            </form>

            {/* Response */}
            {(chatLoading || chatError || response) && (
              <div className="mt-3">
                {chatLoading && (
                  <div className="d-flex align-items-center gap-2" style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                    <div className="spinner-border spinner-border-sm" style={{ color: '#4f8ef7' }} />
                    AI is analysing your query…
                  </div>
                )}
                {chatError && <AlertMessage type="error" message={chatError} />}
                {response && (
                  <div>
                    <div style={{ fontSize: '0.72rem', color: '#8b949e', marginBottom: '0.5rem' }}>
                      <i className="bi bi-robot me-1" /> AI Response
                    </div>
                    <div className="rg-ai-response">{response}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right — High-risk controls */}
        <div className="col-12 col-lg-5">
          <div className="rg-card h-100">
            <div className="rg-card-header">
              <p className="rg-card-title">
                <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: '#f85149' }} />
                High-Risk / Missing Controls
              </p>
              <span style={{
                fontSize: '0.72rem', background: 'rgba(248,81,73,0.1)', color: '#f85149',
                border: '1px solid rgba(248,81,73,0.25)', borderRadius: '4px',
                padding: '0.1rem 0.4rem', fontWeight: 600,
              }}>
                {controls.length} items
              </span>
            </div>

            {ctrlError   && <AlertMessage type="error" message={ctrlError} />}
            {ctrlLoading && <LoadingSpinner text="Loading controls…" />}

            {!ctrlLoading && !ctrlError && (
              controls.length === 0 ? (
                <div className="rg-empty" style={{ padding: '2rem 0' }}>
                  <i className="bi bi-shield-check" style={{ color: '#3fb950' }} />
                  <div className="rg-empty-title" style={{ color: '#3fb950' }}>All clear!</div>
                  <p style={{ fontSize: '0.82rem' }}>No high-risk or missing controls.</p>
                </div>
              ) : (
                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  {controls.map((ctrl) => (
                    <div className="rg-ai-card" key={ctrl.id}>
                      <div className="d-flex align-items-start justify-content-between gap-2 mb-2">
                        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e6edf3' }}>
                          {ctrl.title}
                        </span>
                        <div className="d-flex gap-1 flex-shrink-0">
                          <RiskBadge risk={ctrl.risk_score} />
                        </div>
                      </div>
                      {ctrl.description && (
                        <p style={{ fontSize: '0.78rem', color: '#8b949e', margin: '0 0 0.5rem' }}>
                          {truncate(ctrl.description, 100)}
                        </p>
                      )}
                      {ctrl.ai_analysis && (
                        <div style={{
                          fontSize: '0.76rem', color: '#c9d1d9',
                          background: 'rgba(79,142,247,0.05)',
                          borderLeft: '2px solid rgba(79,142,247,0.3)',
                          padding: '0.4rem 0.6rem', borderRadius: '4px',
                        }}>
                          <i className="bi bi-robot me-1" style={{ color: '#4f8ef7', fontSize: '0.7rem' }} />
                          {truncate(ctrl.ai_analysis, 120)}
                        </div>
                      )}
                      <div style={{ fontSize: '0.7rem', color: '#484f58', marginTop: '0.4rem' }}>
                        {formatDate(ctrl.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
