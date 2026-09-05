import { prisma } from '@/lib/prisma'
import { sendOtpEmail } from '@/lib/simpleEmail'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return Response.json({ success: false, error: 'Valid email is required' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // 1. Verify business or user exists in database
    const business = await prisma.business.findUnique({
      where: { email: cleanEmail },
    })
    const user = !business ? await prisma.users.findFirst({
      where: { email: cleanEmail },
    }) : null

    if (!business && !user) {
      return Response.json(
        { success: false, error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // 2. Generate a secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString()

    // 3. Expiration: exactly 5 minutes from now
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

    // 4. Mark all previous unused OTPs for this email as used/invalidated
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

    console.log(`🔑 [DEV DEBUG] Generated 6-Digit OTP for ${cleanEmail}: ${otp} (Expires: ${expiresAt.toISOString()})`)

    // 6. Send OTP email via SMTP
    const emailResult = await sendOtpEmail(cleanEmail, otp)

    if (!emailResult.success) {
      console.error('Failed to dispatch OTP email:', emailResult.error)
      return Response.json(
        { success: false, error: `Failed to send email: ${emailResult.error}` },
        { status: 500 }
      )
    }

    return Response.json({
      success: true,
      message: 'A 6-digit verification code has been sent to your email. It is valid for 5 minutes.',
      expiresIn: 300, // seconds
    })
  } catch (error) {
    console.error('Error in send-otp route:', error)
    return Response.json(
      { success: false, error: 'Internal server error while sending verification code' },
      { status: 500 }
    )
  }
}
