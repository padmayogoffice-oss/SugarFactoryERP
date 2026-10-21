/**
 * Axios client shared by every API wrapper.
 *
 * It attaches the access token to each request and transparently refreshes an
 * expired session: a single refresh call is shared across concurrent 401s so
 * parallel requests cannot each rotate the token, and an unrecoverable failure
 * clears the stored session and redirects to the login page.
 */
import axios from 'axios'
import BASE_URL from '../config/api'

const ACCESS_TOKEN_KEY = 'sferp.accessToken'
const REFRESH_TOKEN_KEY = 'sferp.refreshToken'

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set({ accessToken, refreshToken }) {
    if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const api = axios.create({ baseURL: BASE_URL, timeout: 20000 })

let refreshPromise = null

async function refreshSession() {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) throw new Error('No refresh token')

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  const accessToken = data?.data?.accessToken
  const nextRefreshToken = data?.data?.refreshToken
  if (!accessToken || !nextRefreshToken) {
    throw new Error('Refresh response did not include a complete session')
  }
  tokenStore.set({ accessToken, refreshToken: nextRefreshToken })
  return accessToken
}

function getRefreshedAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

function getTokenExpiry(token) {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='))
    const expiry = JSON.parse(decoded).exp
    return Number.isFinite(expiry) ? expiry * 1000 : null
  } catch {
    return null
  }
}

function isAuthEntryCall(url = '') {
  return /\/auth\/(login|register)\/?$/.test(url.split('?')[0])
}

function redirectToLogin() {
  if (!window.location.pathname.startsWith('/login')) {
    window.location.assign('/login')
  }
}

api.interceptors.request.use(async (config) => {
  let token = tokenStore.getAccess()
  const expiresAt = token ? getTokenExpiry(token) : null
  const needsRefresh = !token || (expiresAt !== null && expiresAt <= Date.now() + 60_000)

  if (needsRefresh && tokenStore.getRefresh() && !isAuthEntryCall(config.url)) {
    try {
      token = await getRefreshedAccessToken()
    } catch (error) {
      tokenStore.clear()
      redirectToLogin()
      return Promise.reject(error)
    }
  }

  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (status === 401 && !original?._retried && !isRefreshCall && !isAuthEntryCall(original?.url)) {
      original._retried = true
      try {
        const currentToken = tokenStore.getAccess()
        const sentAuthorization = original.headers?.get?.('Authorization') || original.headers?.Authorization
        const sentToken = sentAuthorization?.startsWith('Bearer ') ? sentAuthorization.slice(7) : null
        const accessToken =
          currentToken && currentToken !== sentToken ? currentToken : await getRefreshedAccessToken()
        if (!accessToken) throw new Error('Unable to renew the access token')
        original.headers.set('Authorization', `Bearer ${accessToken}`)
        return api(original)
      } catch (error) {
        tokenStore.clear()
        redirectToLogin()
        return Promise.reject(error)
      }
    }

    return Promise.reject(error)
  },
)

/** Normalises API failures into a message plus optional field errors. */
export function apiError(error) {
  const payload = error?.response?.data?.error
  if (payload) {
    return { message: payload.message || 'Request failed', details: payload.details || [] }
  }
  if (error?.request) return { message: 'Cannot reach the server. Is the API running?', details: [] }
  return { message: error?.message || 'Unexpected error', details: [] }
}

export default api
