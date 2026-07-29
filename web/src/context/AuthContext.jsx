import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

// ── Context ───────────────────────────────────────────
const AuthContext = createContext(null)

// ── Provider ─────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)      // { id, email, role, organization_id }
  const [token, setToken]     = useState(null)
  const [loading, setLoading] = useState(true)       // initial hydration

  // ── Hydrate from localStorage on first load ────────
  useEffect(() => {
    const storedToken = localStorage.getItem('rg_token')
    const storedUser  = localStorage.getItem('rg_user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch {
        localStorage.removeItem('rg_token')
        localStorage.removeItem('rg_user')
      }
    }
    setLoading(false)
  }, [])

  // ── login ─────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    // Step 1 — get token
    const { data: tokenData } = await authAPI.login(email, password)
    const accessToken = tokenData.access_token

    // Persist token first so the next request gets it
    localStorage.setItem('rg_token', accessToken)
    setToken(accessToken)

    // Step 2 — fetch user profile
    const { data: meData } = await authAPI.me()
    const userData = { ...meData }

    localStorage.setItem('rg_user', JSON.stringify(userData))
    setUser(userData)

    return userData
  }, [])

  // ── logout ────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem('rg_token')
    localStorage.removeItem('rg_user')
    setToken(null)
    setUser(null)
  }, [])

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// ── Hook ─────────────────────────────────────────────
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
