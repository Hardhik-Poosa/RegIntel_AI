/**
 * Inline alert component.
 * @param {{ type: 'error'|'success', message: string }} props
 */
export default function AlertMessage({ type, message }) {
  if (!message) return null
  const cls  = type === 'success' ? 'rg-alert-success' : 'rg-alert-error'
  const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'
  return (
    <div className={cls} role="alert">
      <i className={`bi ${icon}`} />
      {message}
    </div>
  )
}
