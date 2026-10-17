/**
 * Axios client shared by every API wrapper.
 *
 * It attaches the access token to each request and transparently refreshes an
 * expired session: a single refresh call is shared across concurrent 401s so
 * parallel requests cannot each rotate the token, and an unrecoverable failure
 * clears the stored session and redirects to the login page.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'

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

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A single in-flight refresh is shared so parallel 401s do not each rotate.
let refreshPromise = null

async function refreshSession() {
  const refreshToken = tokenStore.getRefresh()
  if (!refreshToken) throw new Error('No refresh token')

  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken })
  tokenStore.set({ accessToken: data.data.accessToken, refreshToken: data.data.refreshToken })
  return data.data.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/auth/refresh')
    const isAuthEntryCall = /\/auth\/(login|register)\/?$/.test(original?.url?.split('?')[0] || '')

    if (status === 401 && !original?._retried && !isRefreshCall && !isAuthEntryCall) {
      original._retried = true
      try {
        refreshPromise = refreshPromise || refreshSession()
        const accessToken = await refreshPromise
        refreshPromise = null
        original.headers.Authorization = `Bearer ${accessToken}`
        return api(original)
      } catch (refreshError) {
        refreshPromise = null
        tokenStore.clear()
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login')
        }
        return Promise.reject(refreshError)
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
