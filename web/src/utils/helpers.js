/**
 * RegIntel AI — Utility helpers
 */

/**
 * Validate an email address format.
 * Returns true when the string looks like a valid email.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email ?? '').trim())
}

/**
 * Return the Bootstrap/custom colour class for a risk level.
 * @param {'HIGH'|'MEDIUM'|'LOW'} risk
 */
export function getRiskClass(risk) {
  switch (risk?.toUpperCase()) {
    case 'HIGH':   return 'rg-badge-high'
    case 'MEDIUM': return 'rg-badge-medium'
    case 'LOW':    return 'rg-badge-low'
    default:       return 'rg-badge-medium'
  }
}

/**
 * Return the colour class for a control status.
 * @param {'IMPLEMENTED'|'PARTIAL'|'MISSING'} status
 */
export function getStatusClass(status) {
  switch (status?.toUpperCase()) {
    case 'IMPLEMENTED': return 'rg-badge-implemented'
    case 'PARTIAL':     return 'rg-badge-partial'
    case 'MISSING':     return 'rg-badge-missing'
    default:            return 'rg-badge-missing'
  }
}

/**
 * Return fill colour for the compliance score bar / circle.
 * @param {number} score  0–100
 */
export function getScoreColor(score) {
  if (score >= 75) return '#3fb950'   // green
  if (score >= 40) return '#d29922'   // yellow
  return '#f85149'                    // red
}

/**
 * Return a human-readable label for an audit action.
 * @param {string} action
 */
export function formatAction(action) {
  return action
    ? action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
    : '—'
}

/**
 * Format an ISO date string to a readable local string.
 * @param {string} isoStr
 */
export function formatDate(isoStr) {
  if (!isoStr) return '—'
  try {
    return new Date(isoStr).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  } catch {
    return isoStr
  }
}

/**
 * Derive initials from an email address (up to 2 chars).
 * @param {string} email
 */
export function initials(email) {
  if (!email) return '?'
  const parts = email.split('@')[0].split(/[._-]/)
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Truncate a string to maxLen characters.
 * @param {string} str
 * @param {number} maxLen
 */
export function truncate(str, maxLen = 120) {
  if (!str) return '—'
  return str.length > maxLen ? str.slice(0, maxLen) + '…' : str
}
