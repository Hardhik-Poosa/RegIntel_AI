import { useState, useRef, useEffect } from 'react'
import { copilotAPI } from '../services/api'
import { getErrorMessage } from '../services/api'

// ── Suggested starter questions ───────────────────────────────────────────────
const SUGGESTIONS = [
  'Which controls should we fix first?',
  'What are our biggest compliance risks right now?',
  'How is our compliance trend looking?',
  'Which HIGH-risk controls are still MISSING?',
  'Are we ready for a SOC 2 audit?',
  'Explain our compliance score and what is dragging it down.',
  'What would improve our compliance score the most?',
  'Which frameworks are most relevant for a FinTech startup?',
]

// ── Single chat message bubble ─────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'

  // Format the AI answer: convert bullet points and newlines to proper HTML
  function formatAnswer(text) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const trimmed = line.trim()
      if (!trimmed) return <br key={i} />
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
        return (
          <div key={i} style={{ paddingLeft: '0.75rem', marginBottom: '0.15rem' }}>
            <span style={{ color: '#388bfd', marginRight: '0.4rem' }}>•</span>
            {trimmed.slice(2)}
          </div>
        )
      }
      if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
        return <div key={i} className="fw-semibold text-white mb-1">{trimmed.slice(2, -2)}</div>
      }
      return <div key={i} style={{ marginBottom: '0.15rem' }}>{line}</div>
    })
  }

  return (
    <div
      className={`d-flex mb-3 ${isUser ? 'justify-content-end' : 'justify-content-start'}`}
    >
      {!isUser && (
        <div
          className="d-flex align-items-center justify-content-center me-2 flex-shrink-0"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg,#388bfd,#a966ff)',
            fontSize: '0.8rem',
          }}
        >
          <i className="bi bi-robot text-white" />
        </div>
      )}

      <div
        style={{
          maxWidth: '75%',
          background:   isUser ? '#1f6feb' : '#161b22',
          border:       `1px solid ${isUser ? '#388bfd' : '#30363d'}`,
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding:      '0.6rem 0.9rem',
          color:        '#e6edf3',
          fontSize:     '0.9rem',
          lineHeight:   '1.5',
          whiteSpace:   'pre-wrap',
          wordBreak:    'break-word',
        }}
      >
        {isUser ? msg.content : formatAnswer(msg.content)}
        {msg.loading && (
          <span className="ms-2">
            <span className="spinner-border spinner-border-sm" style={{ width: 12, height: 12 }} />
          </span>
        )}
      </div>

      {isUser && (
        <div
          className="d-flex align-items-center justify-content-center ms-2 flex-shrink-0"
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#21262d',
            border: '1px solid #30363d',
          }}
        >
          <i className="bi bi-person-fill text-secondary" />
        </div>
      )}
    </div>
  )
}

// ── Main Copilot page ──────────────────────────────────────────────────────────
export default function Copilot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hello! I\'m RegintelAI Copilot — your compliance intelligence assistant.\n\n' +
        'I have access to your organisation\'s controls, risk scores, and compliance trends. ' +
        'Ask me anything about your compliance posture, priority fixes, or regulatory requirements.',
    },
  ])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const bottomRef               = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendMessage(question) {
    const text = (question || input).trim()
    if (!text || loading) return

    setInput('')
    setError(null)

    // Add user message + loading placeholder
    const userMsg     = { role: 'user',      content: text }
    const loadingMsg  = { role: 'assistant', content: '', loading: true, id: Date.now() }
    setMessages(prev => [...prev, userMsg, loadingMsg])
    setLoading(true)

    try {
      const { data } = await copilotAPI.ask(text)

      setMessages(prev =>
        prev.map(m => m.id === loadingMsg.id
          ? { role: 'assistant', content: data.answer }
          : m
        )
      )
    } catch (err) {
      const errText = getErrorMessage(err)
      setMessages(prev =>
        prev.map(m => m.id === loadingMsg.id
          ? { role: 'assistant', content: `⚠️ ${errText}` }
          : m
        )
      )
      setError(errText)
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const showSuggestions = messages.length <= 1

  return (
    <div
      className="d-flex flex-column"
      style={{ height: 'calc(100vh - 60px)', background: '#0d1117' }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 d-flex align-items-center gap-3 flex-shrink-0"
        style={{ borderBottom: '1px solid #21262d' }}
      >
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'linear-gradient(135deg,#388bfd,#a966ff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <i className="bi bi-chat-dots-fill text-white" style={{ fontSize: '1rem' }} />
        </div>
        <div>
          <div className="text-white fw-semibold">AI Compliance Copilot</div>
          <div className="text-secondary" style={{ fontSize: '0.78rem' }}>
            Powered by your live compliance data · FinTech + AI Governance specialist
          </div>
        </div>
        <div className="ms-auto">
          <span className="badge rounded-pill" style={{ background: '#3fb95033', color: '#3fb950', border: '1px solid #3fb95066' }}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem' }} />
            Live
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-grow-1 overflow-auto px-4 py-3">
        {messages.map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}

        {/* Suggestion chips — shown on first load */}
        {showSuggestions && (
          <div className="mt-2 mb-3">
            <p className="text-secondary small mb-2">Try asking:</p>
            <div className="d-flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  className="btn btn-sm rounded-pill"
                  style={{
                    background: '#161b22', border: '1px solid #30363d',
                    color: '#8b949e', fontSize: '0.78rem',
                  }}
                  onClick={() => sendMessage(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        className="px-4 py-3 flex-shrink-0"
        style={{ borderTop: '1px solid #21262d', background: '#161b22' }}
      >
        <div className="d-flex gap-2 align-items-end">
          <textarea
            className="form-control text-white"
            placeholder="Ask a compliance question… (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            style={{
              background: '#0d1117', border: '1px solid #30363d',
              resize: 'none', borderRadius: 12,
              minHeight: 44, maxHeight: 120, overflowY: 'auto',
              color: '#e6edf3', lineHeight: '1.5',
            }}
          />
          <button
            className="btn btn-primary d-flex align-items-center justify-content-center"
            style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            {loading
              ? <span className="spinner-border spinner-border-sm" />
              : <i className="bi bi-send-fill" />
            }
          </button>
        </div>
        <div className="text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
          The copilot reads your live controls, risk scores, and compliance snapshots.
        </div>
      </div>
    </div>
  )
}
