import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email, otp, newPassword, confirmPassword } = await request.json()

    if (!email || !otp || !newPassword || !confirmPassword) {
      return Response.json(
        { success: false, error: 'All fields (email, OTP, new password, confirm password) are required' },
        { status: 400 }
      )
    }

    if (newPassword !== confirmPassword) {
      return Response.json(
        { success: false, error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return Response.json(
        { success: false, error: 'Password must be at least 6 characters long' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = String(otp).trim()

    // 1. Check if business exists
    const business = await prisma.business.findUnique({
      where: { email: cleanEmail },
    })

    // 2. Check if user exists in users table
    const user = await prisma.users.findFirst({
      where: { email: cleanEmail },
    })

    if (!business && !user) {
      return Response.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // 3. Verify OTP in database
    const resetRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!resetRecord) {
      return Response.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      )
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return Response.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    // 4. Hash the new password securely
    const hashedPassword = await hashPassword(newPassword)

    // 5. Update existing user or create vendor user in users table for business
    if (user) {
      await prisma.$transaction([
        prisma.users.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        }),
        prisma.passwordResetOtp.updateMany({
          where: { email: cleanEmail, used: false },
          data: { used: true },
        }),
      ])
    } else {
      // Vendor exists in businesses table but doesn't have a user account yet
      const displayName = [business?.firstName, business?.lastName].filter(Boolean).join(' ') || business?.businessName || cleanEmail.split('@')[0]
      const phone = business?.phoneNumber1 || business?.phoneNumber2 || ''

      await prisma.$transaction([
        prisma.users.create({
          data: {
            uid: crypto.randomUUID(),
            username: displayName,
            email: cleanEmail,
            phoneNumber: phone,
            role: 'VENDOR',
            emailVerification: true,
            type: 'local',
            password: hashedPassword,
          },
        }),
        prisma.passwordResetOtp.updateMany({
          where: { email: cleanEmail, used: false },
          data: { used: true },
        }),
      ])
    }

    return Response.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    })
  } catch (error) {
    console.error('Error in reset-password route:', error)
    return Response.json(
      { success: false, error: 'Internal server error while resetting password' },
      { status: 500 }
    )
  }
}
