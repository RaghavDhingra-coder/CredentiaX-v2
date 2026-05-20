import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      setUser(data.data.user)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { checkAuth() }, [checkAuth])

  const register = async (credentials) => {
    const { data } = await api.post('/auth/register', credentials)
    setUser(data.data.user)
    return data.data.user
  }

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    setUser(data.data.user)
    return data.data.user
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
