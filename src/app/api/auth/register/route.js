import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email, password, displayName, phoneNumber, role = 'CUSTOMER' } = await request.json()

    if (!email || !password || !displayName) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email }
    })

    if (existingUser) {
      return Response.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    // Hash Password
    const hashedPassword = await hashPassword(password)

    // Generate random UID for backward compatibility
    const uid = crypto.randomUUID()

    // Create User
    const user = await prisma.users.create({
      data: {
        email,
        password: hashedPassword,
        username: displayName,
        phoneNumber: phoneNumber || '',
        role,
        uid,
        emailVerification: false, // Default to false, can implement verify email later
        type: 'local'
      }
    })

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
    console.error('Registration error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
