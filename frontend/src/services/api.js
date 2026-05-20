import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — strip Content-Type for FormData so the browser sets
// multipart/form-data with the correct boundary automatically.
api.interceptors.request.use(
  (config) => {
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    console.log('[API] Request:', config.method.toUpperCase(), config.url)
    console.log('[API] Full URL:', config.baseURL + config.url)
    return config
  },
  (error) => {
    console.error('[API] Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('[API] Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('[API] Response Error:', error.response?.status, error.config?.url)
    console.error('[API] Error Details:', error.response?.data)
    return Promise.reject(error)
  }
)

export default api
