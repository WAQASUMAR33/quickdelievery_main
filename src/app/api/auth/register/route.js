import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import crypto from 'crypto'

export async function POST(request) {
  try {
    const { email, password, displayName, phoneNumber, role = 'CUSTOMER', image, otp } = await request.json()

    if (!email || !password || !displayName) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()
    const cleanOtp = String(otp || '').trim()

    // 1. Enforce 6-digit OTP email verification
    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return Response.json(
        { success: false, error: 'A valid 6-digit email verification code is required.' },
        { status: 400 }
      )
    }

    // Verify OTP against database
    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        email: cleanEmail,
        otp: cleanOtp,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!otpRecord) {
      return Response.json(
        { success: false, error: 'Invalid verification code. Please check your email or request a new code.' },
        { status: 400 }
      )
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      return Response.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await prisma.passwordResetOtp.update({
      where: { id: otpRecord.id },
      data: { used: true },
    })

    // 2. Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: cleanEmail },
    })

    if (existingUser) {
      return Response.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    // Hash Password
    const hashedPassword = await hashPassword(password)
    const uid = crypto.randomUUID()

    // 3. Create User with emailVerification: true
    const user = await prisma.users.create({
      data: {
        email: cleanEmail,
        password: hashedPassword,
        username: displayName,
        phoneNumber: phoneNumber || '',
        role,
        uid,
        image: image || null,
        emailVerification: true,
        type: role === 'DRIVER' ? 'driver' : 'local',
      },
    })

    // 4. Initialize role-specific profile records
    if (role === 'CUSTOMER') {
      await prisma.customerProfile.create({
        data: {
          userId: user.uid,
        },
      }).catch((e) => console.warn('Could not auto-create customer profile:', e.message))
    } else if (role === 'DRIVER') {
      await prisma.driverProfile.create({
        data: {
          userId: user.id,
          cnicNumber: 'Pending Verification',
          licenseNumber: 'Pending Verification',
          homeAddress: 'Pending Address',
          bankName: 'JazzCash',
          bankAccountTitle: displayName,
          bankAccountNumber: phoneNumber || '03000000000',
        },
      }).catch((e) => console.warn('Could not auto-create driver profile:', e.message))
    }

    // 5. Generate Auth Token
    const token = signToken({ userId: user.id, email: user.email, role: user.role })

    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    const response = Response.json({
      success: true,
      user: userWithoutPassword,
      token,
    })
    response.headers.append(
      'Set-Cookie',
      `authToken=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
    )
    return response

  } catch (error) {
    console.error('Registration error:', error)
    return Response.json({ success: false, error: 'Internal server error: ' + error.message }, { status: 500 })
  }
}

