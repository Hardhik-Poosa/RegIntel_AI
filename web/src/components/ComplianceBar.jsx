import { getScoreColor } from '../utils/helpers'

/**
 * Animated horizontal progress bar for compliance score.
 */
export function ComplianceBar({ score = 0 }) {
  const color = getScoreColor(score)
  return (
    <div>
      <div className="d-flex justify-content-between mb-1">
        <span style={{ fontSize: '0.8rem', color: '#8b949e' }}>Compliance Score</span>
        <span style={{ fontSize: '0.8rem', fontWeight: 700, color }}>{score}%</span>
      </div>
      <div className="rg-progress-bar-wrap">
        <div
          className="rg-progress-fill"
          style={{ width: `${score}%`, background: color }}
        />
      </div>
    </div>
  )
}

/**
 * SVG donut chart for compliance score used on the Dashboard.
 * @param {{ score: number, size?: number }} props
 */
export function ComplianceDonut({ score = 0, size = 140 }) {
  const radius   = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const offset   = circumference - (score / 100) * circumference
  const color    = getScoreColor(score)

  return (
    <div className="rg-score-circle" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="#21262d" strokeWidth="10"
        />
        {/* Fill */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="rg-score-text">
        <div className="rg-score-number" style={{ color }}>{score}%</div>
        <div className="rg-score-label">Score</div>
      </div>
    </div>
  )
}
