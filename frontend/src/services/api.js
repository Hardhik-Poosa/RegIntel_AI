import axios from 'axios'

// ──────────────────────────────────────────────────────
//  Axios instance — all requests automatically get the
//  Bearer token injected via the request interceptor.
// ──────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
})

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
}

// ──────────────────────────────────────────────────────
//  Audit Logs
// ──────────────────────────────────────────────────────
export const auditAPI = {
  getLogs: () => api.get('/audit/'),
}

// ──────────────────────────────────────────────────────
//  Compliance
// ──────────────────────────────────────────────────────
export const complianceAPI = {
  getScore: () => api.get('/compliance/score'),
}

// ──────────────────────────────────────────────────────
//  AI
// ──────────────────────────────────────────────────────
export const aiAPI = {
  chat: (prompt) => api.post('/ai/chat', null, { params: { prompt } }),
}

export default api
