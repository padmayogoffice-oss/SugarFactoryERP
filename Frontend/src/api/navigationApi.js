import api from './client.js'

export const navigationApi = {
  tree: () => api.get('/navigation/navigation').then((r) => r.data.data),
}
