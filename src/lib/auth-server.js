import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Check if user is verified and has proper data
export function checkUserVerification(user, userData) {
  if (!user) {
    return { isVerified: false, reason: 'No user' }
  }
  
  if (userData && !userData.emailVerification) {
    return { isVerified: false, reason: 'Database verification pending' }
  }
  
  // For custom auth, if we have a user and they are logged in, we assume verified 
  // unless we implement specific email verification logic.
  // The User model has emailVerification boolean.
  if (userData && userData.emailVerification) {
    return { isVerified: true, reason: 'Verified' }
  }

  return { isVerified: false, reason: 'Email not verified' }
}

function extractRequestToken(req) {
  const authHeader = req?.headers?.get?.('authorization') || req?.headers?.get?.('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.slice(7).trim()
    if (bearer && bearer !== 'GUEST_SESSION' && bearer !== 'null' && bearer !== 'undefined') {
      return bearer
    }
  }

  // Fallback 1: NextRequest cookies API
  const cookieToken =
    req?.cookies?.get?.('authToken')?.value ||
    req?.cookies?.get?.('token')?.value ||
    req?.cookies?.get?.('auth_token')?.value
  if (cookieToken && cookieToken !== 'GUEST_SESSION') {
    return decodeURIComponent(cookieToken)
  }

  // Fallback 2: Raw Cookie header
  const cookieHeader = req?.headers?.get?.('cookie') || ''
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)(?:authToken|token|auth_token)=([^;]+)/)
    if (match?.[1] && match[1] !== 'GUEST_SESSION') {
      return decodeURIComponent(match[1].trim())
    }
  }

  return null
}

// Middleware to authenticate requests
export async function authenticateRequest(req) {
  const token = extractRequestToken(req)
  if (!token) {
    throw new Error('No token provided')
  }

  const decoded = verifyToken(token)
  const rawUserId = decoded?.userId ?? decoded?.id

  if (!decoded || (!rawUserId && !decoded.email)) {
    throw new Error('Invalid token')
  }

  let user = null
  if (rawUserId !== undefined && rawUserId !== null && /^\d+$/.test(String(rawUserId))) {
    user = await prisma.users.findUnique({
      where: { id: Number(rawUserId) }
    })
  }
  if (!user && decoded.email) {
    user = await prisma.users.findFirst({
      where: { email: String(decoded.email).toLowerCase().trim() }
    })
  }

  if (!user) {
    throw new Error('User not found')
  }

  return user
}

// Non-throwing variant: returns the authenticated user, or null when no valid
// token is present. Use for endpoints that are public but must scope/authorize
// differently when a known user is calling (e.g. vendor product isolation).
export async function getAuthUser(req) {
  try {
    return await authenticateRequest(req)
  } catch {
    return null
  }
}

// Authorize a request against a set of allowed roles. Returns { user } on
// success, or { error, status } describing a 401 (no/invalid token) or 403
// (authenticated but wrong role) that the caller should return verbatim.
export async function requireRole(req, roles) {
  const user = await getAuthUser(req)
  if (!user) {
    return { error: 'Authentication required', status: 401 }
  }
  if (roles && roles.length && !roles.includes(user.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user }
}

// Roles allowed to manage catalog taxonomy and admin-level product operations.
export const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']
