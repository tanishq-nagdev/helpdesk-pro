import axios from 'axios'

// In production the frontend nginx proxies /api → backend.
// In local dev vite.config.js proxies /api → backend container.
// Either way, we always hit relative /api paths.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,          // send session cookie cross-origin
  headers: { 'Content-Type': 'application/json' },
})

export default api
