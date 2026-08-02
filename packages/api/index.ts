import axios, { AxiosInstance } from 'axios';
import { TokenStorage, defaultWebStorage } from '@regintel/auth';

let activeStorage: TokenStorage = defaultWebStorage;
let apiBaseUrl = '/api/v1';

export function configureApi(options: { baseURL?: string; tokenStorage?: TokenStorage }) {
  if (options.baseURL) apiBaseUrl = options.baseURL;
  if (options.tokenStorage) activeStorage = options.tokenStorage;
}

export const api: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await activeStorage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await activeStorage.clearToken();
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──
export const authAPI = {
  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append('username', email);
    form.append('password', password);
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  register: (payload: any) => api.post('/auth/register', payload),
  me: () => api.get('/users/me'),
};

// ── Dashboard API ──
export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/'),
};

// ── Controls API ──
export const controlsAPI = {
  getAll: () => api.get('/controls/'),
  getById: (id: string) => api.get(`/controls/${id}`),
  create: (data: any) => api.post('/controls/', data),
  update: (id: string, data: any) => api.put(`/controls/${id}`, data),
  delete: (id: string) => api.delete(`/controls/${id}`),
  triggerAI: (id: string) => api.post(`/controls/${id}/ai-analysis`),
};

// ── Frameworks API ──
export const frameworksAPI = {
  getAll: () => api.get('/frameworks/'),
  getInstalled: () => api.get('/frameworks/installed'),
  install: (id: string) => api.post(`/frameworks/${id}/install`),
};

// ── Copilot API ──
export const copilotAPI = {
  chat: (message: string, context?: any) => api.post('/copilot/chat', { message, context }),
};

// ── Risk Engine API ──
export const riskAPI = {
  getForecast: () => api.get('/risk/forecast'),
  getSnapshots: () => api.get('/risk/snapshots'),
};

// ── Evidence API ──
export const evidenceAPI = {
  getAll: () => api.get('/evidence/'),
  upload: (formData: FormData) => api.post('/evidence/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  validateAI: (id: string) => api.post(`/evidence/${id}/validate`),
};

// ── Integrations API ──
export const integrationsAPI = {
  scanGitHub: (repo: string) => api.post('/integrations/github/scan', { repo }),
  getIntegrations: () => api.get('/integrations/'),
};

// ── Monitors API ──
export const monitorsAPI = {
  runGitHub: (repo: string, token?: string, controlId?: string) => api.post('/monitors/run-github', { repo, token, control_id: controlId || null }),
  runControlGaps: () => api.post('/monitors/run-control-gaps'),
  runEvidenceGaps: () => api.post('/monitors/run-evidence-gaps'),
  runAWS: (controlId?: string) => api.post('/monitors/run-aws', null, { params: controlId ? { control_id: controlId } : {} }),
  runEvidenceExpiration: () => api.post('/monitors/run-evidence-expiration'),
  recalculatePosture: () => api.post('/monitors/recalculate-posture'),
  runAll: () => api.post('/monitors/run-all'),
  getHealth: () => api.get('/monitors/health'),
  getChanges: (limit?: number) => api.get('/monitors/changes', { params: limit ? { limit } : {} }),
  getAssets: (limit?: number) => api.get('/monitors/assets', { params: limit ? { limit } : {} }),
  getRules: () => api.get('/monitors/rules'),
  getScans: (limit?: number) => api.get('/monitors/scans', { params: limit ? { limit } : {} }),
  getJobs: (limit?: number) => api.get('/monitors/jobs', { params: limit ? { limit } : {} }),
  getTimeline: (limit?: number) => api.get('/monitors/timeline', { params: limit ? { limit } : {} }),
  list: (limit?: number) => api.get('/monitors/', { params: limit ? { limit } : {} }),
};

// ── Reports API ──
export const reportsAPI = {
  getExecutiveSummary: () => api.get('/reports/executive'),
  exportPDF: () => api.get('/reports/pdf', { responseType: 'blob' }),
};
