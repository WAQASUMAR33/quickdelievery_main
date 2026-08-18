import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return Response.json(
        { success: false, error: 'Email and 6-digit verification code are required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = String(otp).trim()

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return Response.json(
        { success: false, error: 'Verification code must be a 6-digit number' },
        { status: 400 }
      )
    }

    // Find the latest active OTP for this email
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
        { success: false, error: 'Invalid verification code. Please check your email or request a new code.' },
        { status: 400 }
      )
    }

    // Check if expired (5 minutes window)
    if (new Date() > new Date(resetRecord.expiresAt)) {
      return Response.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    return Response.json({
      success: true,
      message: 'Verification code verified successfully',
    })
  } catch (error) {
    console.error('Error in verify-otp route:', error)
    return Response.json(
      { success: false, error: 'Internal server error while verifying code' },
      { status: 500 }
    )
  }
}
