import api from './client.js'

export const authApi = {
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data.data),
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data.data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }).then((r) => r.data.data),
  me: () => api.get('/auth/me').then((r) => r.data.data),
  changePassword: (payload) => api.post('/auth/change-password', payload).then((r) => r.data.data),
}
