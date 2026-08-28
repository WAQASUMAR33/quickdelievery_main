import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Endpoint for Flutter App & Web to register/update their FCM Device Token
 * POST /api/notifications/register-token
 * Body: { userId, fcmToken, role }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, fcmToken, role } = body

    if (!fcmToken) {
      return NextResponse.json(
        { success: false, error: 'fcmToken is required' },
        { status: 400 }
      )
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId is required' },
        { status: 400 }
      )
    }

    const idStr = String(userId).trim()
    const idParsed = Number.parseInt(idStr, 10)

    // Find the user by ID or UID
    let user = null
    if (Number.isFinite(idParsed) && idParsed > 0 && idStr === String(idParsed)) {
      user = await prisma.users.findUnique({ where: { id: idParsed } })
    } else {
      user = await prisma.users.findUnique({ where: { uid: idStr } })
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in database' },
        { status: 404 }
      )
    }

    // Save FCM Token using raw SQL to ensure instant database persistence
    await prisma.$executeRawUnsafe(
      'UPDATE `users` SET `fcm_token` = ? WHERE `id` = ?',
      fcmToken,
      user.id
    )

    return NextResponse.json({
      success: true,
      message: 'FCM Token registered successfully for push notifications',
      user: {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        role: user.role,
        fcmToken,
      },
    })
  } catch (error) {
    console.error('Error registering FCM token:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
