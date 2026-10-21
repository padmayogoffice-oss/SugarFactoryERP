import api from './client.js'

export const transliterateApi = {
  convert: (text) => api.post('/transliterate', { text }).then((r) => r.data.data),
}
