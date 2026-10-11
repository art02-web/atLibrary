import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/services'
import { TOKEN_KEY } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while restoring the session

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setUser(null)
  }, [])

  // Restore the session on page load if a token exists
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    authApi
      .me()
      .then(({ data }) => setUser(data.user))
      .catch(logout)
      .finally(() => setLoading(false))
  }, [logout])

  // The Axios interceptor fires this when the token expires
  useEffect(() => {
    window.addEventListener('auth:logout', logout)
    return () => window.removeEventListener('auth:logout', logout)
  }, [logout])

  const saveSession = (token, nextUser) => {
    localStorage.setItem(TOKEN_KEY, token)
    setUser(nextUser)
  }

  const login = async (credentials) => {
    const { data } = await authApi.login(credentials)
    saveSession(data.token, data.user)
    return data.user
  }

  const register = async (form) => {
    const { data } = await authApi.register(form)
    saveSession(data.token, data.user)
    return data.user
  }

  const value = {
    user,
    loading,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    setUser,
    saveSession,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
