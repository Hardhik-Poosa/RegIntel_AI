import { colors } from '@regintel/ui-tokens';

/**
 * Format ISO date string into readable short date.
 */
export function formatDate(isoString?: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return isoString;
  }
}

/**
 * Returns color code corresponding to risk level.
 */
export function getRiskColor(riskLevel?: string): string {
  const level = (riskLevel ?? '').toUpperCase();
  return colors.risk[level as keyof typeof colors.risk] ?? colors.secondary;
}

/**
 * Returns color code corresponding to status.
 */
export function getStatusColor(status?: string): string {
  const s = (status ?? '').toUpperCase();
  return colors.status[s as keyof typeof colors.status] ?? colors.secondary;
}

/**
 * Normalises raw Axios/API errors into user-friendly message strings.
 */
export function getErrorMessage(err: any, fallback = 'An unexpected error occurred.'): string {
  if (!err?.response) {
    if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
    return 'Cannot connect to the server. Check your internet connection.';
  }
  const status = err.response.status;
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return "You don't have permission to perform this action.";
  if (status === 404) return 'The requested resource was not found.';
  if (status === 409) return err?.response?.data?.detail ?? 'A conflict occurred.';
  if (status === 422) return 'Invalid data submitted. Please check your inputs.';
  if (status >= 500) return 'Something went wrong on the server. Please try again later.';
  return err?.response?.data?.detail ?? fallback;
}

/**
 * Format percentage value.
 */
export function formatPercentage(val: number): string {
  return `${Math.round(val)}%`;
}
