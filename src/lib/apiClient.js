// Client-side fetch helpers that attach the logged-in user's JWT so API routes
// can authenticate and authorize the request (e.g. vendor product isolation).
// The token is stored in localStorage as 'authToken' by AuthContext on login.

export function authHeaders(extra = {}) {
  if (typeof window === 'undefined') return { ...extra }
  const token = localStorage.getItem('authToken')
  if (!token || token === 'GUEST_SESSION') return { ...extra }
  return { ...extra, Authorization: `Bearer ${token}` }
}

export function authFetch(url, options = {}) {
  return fetch(url, { ...options, headers: authHeaders(options.headers) })
}
