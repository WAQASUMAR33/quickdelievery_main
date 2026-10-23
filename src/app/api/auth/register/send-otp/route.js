import { prisma } from '@/lib/prisma'
import { sendVerificationOtpEmail } from '@/lib/simpleEmail'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email, role = 'CUSTOMER' } = await request.json()

    if (!email || typeof email !== 'string') {
      return Response.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()

    // 1. Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail },
    })

    if (existingUser) {
      return Response.json(
        {
          success: false,
          error: 'An account with this email address already exists. Please log in instead.',
        },
        { status: 400 }
      )
    }

    // 2. Generate secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // 3. Expiration: 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    // 4. Mark all previous unused OTPs for this email as used
    await prisma.passwordResetOtp.updateMany({
      where: {
        email: cleanEmail,
        used: false,
      },
      data: {
        used: true,
      },
    })

    // 5. Store new OTP in database
    await prisma.passwordResetOtp.create({
      data: {
        email: cleanEmail,
        otp,
        expiresAt,
        used: false,
      },
    })

    // 6. Send verification email via Hostinger SMTP
    const mailResult = await sendVerificationOtpEmail(cleanEmail, otp, role)

    if (!mailResult.success) {
      console.error('Failed to send verification OTP email:', mailResult.error)
      return Response.json(
        {
          success: false,
          error: `Failed to deliver verification email. ${mailResult.error || 'Please check your email address.'}`,
        },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: `A 6-digit verification code has been sent to ${cleanEmail}.`,
    })
  } catch (error) {
    console.error('Error in send-otp registration route:', error)
    return Response.json(
      { success: false, error: 'Internal server error while sending verification code.' },
      { status: 500 }
    )
  }
}
