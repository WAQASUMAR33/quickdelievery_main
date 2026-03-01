import { prisma } from '@/lib/prisma'
import { comparePassword, signToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return Response.json({ success: false, error: 'Email and password are required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // If user has no password (migrated from Firebase?), we can't login with password
    if (!user.password) {
      return Response.json({ success: false, error: 'Please reset your password to login' }, { status: 401 })
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return Response.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    // Generate Token
    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return Response.json({
      success: true,
      user: userWithoutPassword,
      token
    })

  } catch (error) {
    console.error('Login error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
