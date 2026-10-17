const PRODUCTION_API_BASE_URL = 'https://watches-3yq6.onrender.com/api/v1'
const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
const isLocalApiUrl = configuredApiBaseUrl && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i.test(configuredApiBaseUrl)

// A Vercel build cannot reach a developer's localhost. Fall back to Render if
// the local example value was accidentally added to Vercel's environment.
const API_BASE_URL = (import.meta.env.PROD && isLocalApiUrl
  ? PRODUCTION_API_BASE_URL
  : configuredApiBaseUrl || PRODUCTION_API_BASE_URL).replace(/\/+$/, '')

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
