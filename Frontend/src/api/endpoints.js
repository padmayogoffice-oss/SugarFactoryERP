import api from './client'

/** Thin wrappers around the REST surface, one per backend concern. */
export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data.data),
}

export const navigationApi = {
  tree: () => api.get('/navigation/navigation').then((r) => r.data.data),
}

export const dashboardApi = {
  summary: () => api.get('/dashboard/dashboard').then((r) => r.data.data),
  overview: () => api.get('/dashboard/overview').then((r) => r.data.data),
}

export const reportApi = {
  meta: () => api.get('/reports/meta').then((r) => r.data.data),
  get: (key, params) => api.get(`/reports/${key}`, { params }).then((r) => r.data.data),
}

export const accessApi = {
  users: (params) => api.get('/access/users', { params }).then((r) => r.data),
  userOptions: () => api.get('/access/users/options').then((r) => r.data.data),
  createUser: (payload) => api.post('/access/users', payload).then((r) => r.data.data),
  updateUser: (id, payload) => api.put(`/access/users/${id}`, payload).then((r) => r.data.data),
  deleteUser: (id) => api.delete(`/access/users/${id}`).then((r) => r.data.data),
  roles: (params) => api.get('/access/roles', { params }).then((r) => r.data),
  roleOptions: () => api.get('/access/roles/options').then((r) => r.data.data),
  createRole: (payload) => api.post('/access/roles', payload).then((r) => r.data.data),
  updateRole: (id, payload) => api.put(`/access/roles/${id}`, payload).then((r) => r.data.data),
  deleteRole: (id) => api.delete(`/access/roles/${id}`).then((r) => r.data.data),
  permissions: () => api.get('/access/permissions').then((r) => r.data.data),
  activityLogs: (params) => api.get('/access/activity-logs', { params }).then((r) => r.data),
}

/**
 * Generic resource client. `moduleKey`/`submoduleKey` map directly onto the
 * generated backend routes, so any registry submodule is usable from one API.
 */
export function resourceApi(moduleKey, submoduleKey) {
  const base = `/${moduleKey}/${submoduleKey}`
  return {
    list: (params) => api.get(base, { params }).then((r) => r.data),
    get: (id) => api.get(`${base}/${id}`).then((r) => r.data.data),
    options: (params) => api.get(`${base}/options`, { params }).then((r) => r.data.data),
    create: (payload) => api.post(base, payload).then((r) => r.data.data),
    update: (id, payload) => api.put(`${base}/${id}`, payload).then((r) => r.data.data),
    remove: (id) => api.delete(`${base}/${id}`).then((r) => r.data.data),
  }
}
