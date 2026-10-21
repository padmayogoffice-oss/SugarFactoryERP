import api from './client.js'

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
