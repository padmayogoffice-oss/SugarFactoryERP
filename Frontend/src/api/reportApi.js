import api from './client.js'

export const reportApi = {
  meta: () => api.get('/reports/meta').then((r) => r.data.data),
  get: (key, params) => api.get(`/reports/${key}`, { params }).then((r) => r.data.data),
}
