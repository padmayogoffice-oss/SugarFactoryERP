import api from './client.js'

export const dashboardApi = {
  summary: () => api.get('/dashboard/dashboard').then((r) => r.data.data),
  overview: () => api.get('/dashboard/overview').then((r) => r.data.data),
}
