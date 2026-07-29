/**
 * A simple centred spinner component.
 * @param {{ fullScreen?: boolean, text?: string }} props
 */
export default function LoadingSpinner({ fullScreen = false, text = 'Loading…' }) {
  const style = fullScreen
    ? {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        background: '#0d1117',
        color: '#8b949e',
      }
    : {}

  return (
    <div className="rg-loading" style={style}>
      <div
        className="spinner-border"
        style={{ color: '#4f8ef7', width: '2.5rem', height: '2.5rem' }}
        role="status"
      >
        <span className="visually-hidden">Loading</span>
      </div>
      <span style={{ fontSize: '0.85rem' }}>{text}</span>
    </div>
  )
}
