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

// Middleware to authenticate requests
export async function authenticateRequest(req) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided')
  }

  const token = authHeader.split('Bearer ')[1]
  const decoded = verifyToken(token)
  
  if (!decoded || !decoded.userId) {
    throw new Error('Invalid token')
  }

  const user = await prisma.users.findUnique({
    where: { id: decoded.userId }
  })

  if (!user) {
    throw new Error('User not found')
  }
  
  return user
}
