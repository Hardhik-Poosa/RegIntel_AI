import axios from 'axios'

// ──────────────────────────────────────────────────────
//  Axios instance — all requests automatically get the
//  Bearer token injected via the request interceptor.
// ──────────────────────────────────────────────────────
// In production (Vercel), set VITE_API_URL to your Railway/Render backend URL.
// In development, the Vite proxy forwards /api → localhost:8000.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  timeout: 15000,
})

/**
 * Normalise any Axios error into a user-friendly string.
 * Never exposes raw stack traces or internal JSON to the UI.
 *
 * @param {import('axios').AxiosError} err
 * @param {string}                     [fallback]
 * @returns {string}
 */
export function getErrorMessage(err, fallback = 'An unexpected error occurred.') {
  if (!err?.response) {
    // Network offline / DNS failure / CORS / timeout
    if (err?.code === 'ECONNABORTED') return 'Request timed out. Please try again.'
    return 'Cannot connect to the server. Check your internet connection.'
  }
  const status = err.response.status
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return "You don't have permission to perform this action."
  if (status === 404) return 'The requested resource was not found.'
  if (status === 409) return err?.response?.data?.detail ?? 'A conflict occurred. The record may already exist.'
  if (status === 422) return 'Invalid data submitted. Please check your inputs.'
  if (status >= 500) return 'Something went wrong on the server. Please try again later.'
  return err?.response?.data?.detail ?? fallback
}

// ── Request interceptor: attach token ──────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('rg_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 globally ─────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('rg_token')
      localStorage.removeItem('rg_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ──────────────────────────────────────────────────────
//  Auth endpoints
// ──────────────────────────────────────────────────────
export const authAPI = {
  /**
   * Login via OAuth2 form (username = email).
   * Returns { access_token, token_type }
   */
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  /**
   * Register new organisation + admin user.
   * payload: { email, password, organization: { name, industry } }
   */
  register: (payload) => api.post('/auth/register', payload),

  /** Fetch logged-in user profile. */
  me: () => api.get('/users/me'),
}

// ──────────────────────────────────────────────────────
//  Dashboard
// ──────────────────────────────────────────────────────
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/'),
}

// ──────────────────────────────────────────────────────
//  Controls
// ──────────────────────────────────────────────────────
export const controlsAPI = {
  getAll: (skip = 0, limit = 100) =>
    api.get('/controls/', { params: { skip, limit } }),
  getById: (id) => api.get(`/controls/${id}`),
  create: (payload) => api.post('/controls/', payload),
  update: (id, payload) => api.put(`/controls/${id}`, payload),
  delete: (id) => api.delete(`/controls/${id}`),
  getAIStatus: (id) => api.get(`/controls/${id}/ai-status`),
}

// ──────────────────────────────────────────────────────
//  Audit Logs
// ──────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: () => api.get('/audit/'),
}

// ──────────────────────────────────────────────────────────────────────────────
//  Compliance
// ──────────────────────────────────────────────────────────────────────────────
export const complianceAPI = {
  getScore:    () => api.get('/compliance/score'),
  getDetailed: () => api.get('/compliance/score/detailed'),
}

// ──────────────────────────────────────────────────────
//  AI
// ──────────────────────────────────────────────────────
export const aiAPI = {
  chat: (prompt) => api.post('/ai/chat', null, { params: { prompt } }),
}

// ──────────────────────────────────────────────────────
//  Admin (internal observability)
// ──────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
}

// ──────────────────────────────────────────────────────
//  Users / Organisation management
// ──────────────────────────────────────────────────────
export const usersAPI = {
  me:          ()                => api.get('/users/me'),
  list:        ()                => api.get('/users/'),
  invite:      (payload)         => api.post('/users/invite', payload),
  changeRole:  (userId, role)    => api.patch(`/users/${userId}/role`, { role }),
  remove:      (userId)          => api.delete(`/users/${userId}`),
}

export default api
