import { authenticateRequest } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const uid = searchParams.get('uid')
  const email = searchParams.get('email')

  if (uid) {
    // Get user by UID (for client-side loading)
    try {
      const user = await prisma.users.findUnique({
        where: { uid }
      })

      if (!user) {
        return Response.json({
          success: false,
          error: 'User not found'
        }, { status: 404 })
      }

      return Response.json({ success: true, user })
    } catch (error) {
      console.error('Database error:', error)
      return Response.json({
        success: false,
        error: 'Database error'
      }, { status: 500 })
    }
  } else if (email) {
    // Get user by email (for verification check)
    try {
      const user = await prisma.users.findFirst({
        where: { email: email.toLowerCase().trim() }
      })

      if (!user) {
        return Response.json({
          success: false,
          error: 'User not found'
        }, { status: 404 })
      }

      return Response.json({ success: true, user })
    } catch (error) {
      console.error('Database error:', error)
      return Response.json({ error: 'Database error' }, { status: 500 })
    }
  } else {
    // Authenticated request (for server-side)
    try {
      const user = await authenticateRequest(request)

      // If user is admin, return all users
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        const users = await prisma.users.findMany({
          orderBy: { createdAt: 'desc' }
        })
        return Response.json({ success: true, data: users })
      }

      // Otherwise return just the current user profile
      return Response.json({ success: true, user })
    } catch (error) {
      console.error('Authentication error:', error)
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
}

export async function POST(request) {
  try {
    const { uid, username, email, phoneNumber, role = 'CUSTOMER', type = 'user' } = await request.json()

    if (!uid || !email) {
      return Response.json({
        success: false,
        error: 'UID and email are required'
      }, { status: 400 })
    }

    // Check if user already exists by UID or email
    const existingUser = await prisma.users.findFirst({
      where: {
        OR: [
          { uid },
          { email }
        ]
      }
    })

    if (existingUser) {
      // Update existing user with new UID if needed
      if (existingUser.uid !== uid) {
        const updatedUser = await prisma.users.update({
          where: { id: existingUser.id },
          data: {
            uid,
            username: username || existingUser.username,
            phoneNumber: phoneNumber || existingUser.phoneNumber,
            role: role || existingUser.role,
            type: type || existingUser.type
          }
        })
        return Response.json({
          success: true,
          user: updatedUser,
          message: 'User updated successfully'
        })
      }

      return Response.json({
        success: true,
        user: existingUser,
        message: 'User already exists'
      })
    }

    // Create new user
    const user = await prisma.users.create({
      data: {
        uid,
        username: username || email.split('@')[0],
        email,
        phoneNumber: phoneNumber || '',
        role,
        emailVerification: false,
        type
      }
    })

    return Response.json({ success: true, user })
  } catch (error) {
    console.error('User creation error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { uid, emailVerification } = await request.json()

    if (!uid) {
      return Response.json({
        success: false,
        error: 'UID is required'
      }, { status: 400 })
    }

    const user = await prisma.users.update({
      where: { uid },
      data: { emailVerification }
    })

    return Response.json({ success: true, user })
  } catch (error) {
    console.error('User update error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')

    if (!uid) {
      return Response.json({
        success: false,
        error: 'UID is required'
      }, { status: 400 })
    }

    await prisma.users.delete({
      where: { uid }
    })

    return Response.json({ success: true })
  } catch (error) {
    console.error('User deletion error:', error)
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}