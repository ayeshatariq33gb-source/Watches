import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client.js'
import { AuthContext } from './auth.js'

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('maison-aurel-token') || '')
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('maison-aurel-user')) } catch { return null }
  })
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('maison-aurel-token')))

  const clearSession = useCallback(() => {
    localStorage.removeItem('maison-aurel-token')
    localStorage.removeItem('maison-aurel-user')
    setToken('')
    setUser(null)
    window.dispatchEvent(new Event('maison-aurel:session-ended'))
  }, [])

  useEffect(() => {
    if (!token) return
    let active = true
    apiRequest('/auth/me').then(({ user: currentUser }) => {
      if (!active) return
      setUser(currentUser)
      localStorage.setItem('maison-aurel-user', JSON.stringify(currentUser))
    }).catch((error) => {
      if (active && error.status === 401) clearSession()
    }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token, clearSession])

  const saveSession = useCallback((session) => {
    localStorage.setItem('maison-aurel-token', session.token)
    localStorage.setItem('maison-aurel-user', JSON.stringify(session.user))
    setToken(session.token)
    setUser(session.user)
  }, [])
  const login = useCallback(async (credentials) => {
    const session = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(credentials), token: '' })
    saveSession(session)
    return session.user
  }, [saveSession])
  const register = useCallback(async (details) => {
    const session = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(details), token: '' })
    saveSession(session)
    return session.user
  }, [saveSession])
  const logout = useCallback(async () => {
    try { if (token) await apiRequest('/auth/logout') } finally { clearSession() }
  }, [token, clearSession])
  const updateUser = useCallback((nextUser) => {
    setUser(nextUser)
    localStorage.setItem('maison-aurel-user', JSON.stringify(nextUser))
  }, [])
  const value = useMemo(() => ({ token, user, loading, login, register, logout, updateUser }), [token, user, loading, login, register, logout, updateUser])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}