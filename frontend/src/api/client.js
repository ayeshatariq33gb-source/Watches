const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

export async function apiRequest(path, options = {}) {
  const token = options.token ?? localStorage.getItem('maison-aurel-token')
  const headers = new Headers(options.headers || {})
  if (options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const error = new Error(payload.error?.message || `Request failed (${response.status}).`)
    error.status = response.status
    error.details = payload.error?.details
    throw error
  }
  return payload.data
}

export { API_BASE_URL }