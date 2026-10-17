/**
 * Auth context. Owns the session, the permission list and the navigation tree,
 * and exposes `can`/`canAny` for permission-aware rendering. The client-side
 * checks only shape the UI; the API re-checks every request.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authApi, navigationApi } from '../api/endpoints'
import { tokenStore } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [permissions, setPermissions] = useState([])
  const [navigation, setNavigation] = useState(null)
  const [loading, setLoading] = useState(Boolean(tokenStore.getAccess()))

  /**
   * Loads the current user together with the permission-filtered navigation in
   * one step, so the session and the route table can never disagree.
   */
  const loadSession = useCallback(async () => {
    const me = await authApi.me()
    const tree = await navigationApi.tree()
    setUser(me.user)
    setPermissions(me.permissions || [])
    setNavigation(tree)
    return me
  }, [])

  useEffect(() => {
    if (!tokenStore.getAccess()) {
      setLoading(false)
      return
    }
    loadSession()
      .catch(() => {
        tokenStore.clear()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [loadSession])

  const login = useCallback(
    async (credentials) => {
      const data = await authApi.login(credentials)
      tokenStore.set({ accessToken: data.accessToken, refreshToken: data.refreshToken })
      const me = await loadSession()
      return me
    },
    [loadSession],
  )

  const logout = useCallback(async () => {
    const refreshToken = tokenStore.getRefresh()
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch {
      // Logging out locally is enough if the server call fails.
    }
    tokenStore.clear()
    setUser(null)
    setPermissions([])
    setNavigation(null)
  }, [])

  /**
   * Permission check mirroring the backend: super admins hold `*`, and a
   * `<module>:<submodule>:<action>` key is granted by an exact match.
   */
  const can = useCallback(
    (permission) => {
      if (!permission) return true
      if (permissions.includes('*')) return true
      return permissions.includes(permission)
    },
    [permissions],
  )

  const canAny = useCallback((list) => list.some((permission) => can(permission)), [can])

  const value = useMemo(
    () => ({
      user,
      permissions,
      navigation,
      loading,
      isAuthenticated: Boolean(user),
      isSuperAdmin: Boolean(user?.isSuperAdmin),
      login,
      logout,
      can,
      canAny,
      reloadNavigation: loadSession,
    }),
    [user, permissions, navigation, loading, login, logout, can, canAny, loadSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside an AuthProvider')
  return context
}

export default AuthContext
