import { getRiskClass, getStatusClass } from '../utils/helpers'

/**
 * Coloured badge for ControlRisk values (HIGH / MEDIUM / LOW).
 */
export function RiskBadge({ risk }) {
  const icons = { HIGH: 'bi-arrow-up-circle-fill', MEDIUM: 'bi-dash-circle-fill', LOW: 'bi-arrow-down-circle-fill' }
  const icon = icons[risk?.toUpperCase()] ?? 'bi-circle-fill'
  return (
    <span className={`rg-badge ${getRiskClass(risk)}`}>
      <i className={`bi ${icon}`} />
      {risk ?? '—'}
    </span>
  )
}

/**
 * Coloured badge for ControlStatus values (IMPLEMENTED / PARTIAL / MISSING).
 */
export function StatusBadge({ status }) {
  const icons = {
    IMPLEMENTED: 'bi-check-circle-fill',
    PARTIAL:     'bi-exclamation-circle-fill',
    MISSING:     'bi-x-circle-fill',
  }
  const icon = icons[status?.toUpperCase()] ?? 'bi-circle-fill'
  return (
    <span className={`rg-badge ${getStatusClass(status)}`}>
      <i className={`bi ${icon}`} />
      {status ?? '—'}
    </span>
  )
}
