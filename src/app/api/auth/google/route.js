import { prisma } from '@/lib/prisma'
import { signToken } from '@/lib/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { email, displayName, photoURL, uid, role } = body

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return Response.json(
        { success: false, error: 'Valid Gmail or email address is required' },
        { status: 400 }
      )
    }

    const cleanEmail = email.toLowerCase().trim()
    const validRoles = ['CUSTOMER', 'VENDOR', 'DRIVER']
    const requestedRole = validRoles.includes(role?.toUpperCase()) ? role.toUpperCase() : 'CUSTOMER'

    // 1. Check if user already exists
    let user = await prisma.users.findFirst({
      where: { email: cleanEmail },
      include: {
        driverProfile: true,
        customerProfile: true,
      },
    })

    let isNewUser = false

    if (!user) {
      // 2. Auto-provision new user via Google
      isNewUser = true
      const generatedUid = uid || `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`
      const username = displayName?.trim() || cleanEmail.split('@')[0]

      user = await prisma.users.create({
        data: {
          uid: generatedUid,
          username,
          email: cleanEmail,
          phoneNumber: '',
          role: requestedRole,
          emailVerification: true,
          type: 'google',
          image: photoURL || null,
        },
        include: {
          driverProfile: true,
          customerProfile: true,
        },
      })

      // Initialize role-specific profile records
      if (requestedRole === 'CUSTOMER') {
        await prisma.customerProfile.create({
          data: {
            userId: user.uid,
          },
        }).catch((e) => console.warn('[AUTH GOOGLE] CustomerProfile create warning:', e.message))
      } else if (requestedRole === 'DRIVER') {
        await prisma.driverProfile.create({
          data: {
            userId: user.id,
            cnicNumber: 'Pending Verification',
            licenseNumber: 'Pending Verification',
            homeAddress: 'Pending Address',
            bankName: 'JazzCash',
            bankAccountTitle: username,
            bankAccountNumber: '03000000000',
          },
        }).catch((e) => console.warn('[AUTH GOOGLE] DriverProfile create warning:', e.message))
      } else if (requestedRole === 'VENDOR') {
        await prisma.vendorTrustScore.create({
          data: {
            vendorId: user.uid,
            trustScore: 5.0,
          },
        }).catch(() => {})
      }
    } else {
      // Update image or emailVerification if needed
      const updateData = {}
      if (!user.emailVerification) {
        updateData.emailVerification = true
      }
      if (!user.image && photoURL) {
        updateData.image = photoURL
      }
      if (Object.keys(updateData).length > 0) {
        user = await prisma.users.update({
          where: { id: user.id },
          data: updateData,
          include: {
            driverProfile: true,
            customerProfile: true,
          },
        })
      }
    }

    // 3. Generate Auth JWT Token
    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    // 4. Strip sensitive data
    const { password: _, ...userWithoutPassword } = user

    // 5. Determine whether onboarding/registration steps are complete for each role
    let isOnboardingComplete = true
    let requiredStep = null
    let redirectUrl = '/'
    let business = null

    if (user.role === 'VENDOR') {
      business = await prisma.business.findFirst({
        where: { email: cleanEmail }
      })
      const isVendorComplete = Boolean(business && business.businessName)
      if (!isVendorComplete || isNewUser) {
        isOnboardingComplete = false
        requiredStep = 'BUSINESS_REGISTRATION'
        redirectUrl = `/business-register?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(user.username || '')}`
      } else {
        isOnboardingComplete = true
        redirectUrl = '/vendor/dashboard'
      }
    } else if (user.role === 'DRIVER') {
      const driverProf = user.driverProfile
      const isDriverComplete = Boolean(
        driverProf &&
        driverProf.cnicNumber &&
        driverProf.cnicNumber !== 'Pending Verification' &&
        driverProf.licenseNumber &&
        driverProf.licenseNumber !== 'Pending Verification' &&
        user.phoneNumber &&
        user.phoneNumber.trim().length >= 7
      )
      if (!isDriverComplete || isNewUser) {
        isOnboardingComplete = false
        requiredStep = 'DRIVER_ONBOARDING'
        redirectUrl = `/driver/register?email=${encodeURIComponent(cleanEmail)}&name=${encodeURIComponent(user.username || '')}`
      } else {
        isOnboardingComplete = true
        redirectUrl = '/driver/profile'
      }
    } else if (user.role === 'CUSTOMER') {
      const hasPhone = Boolean(user.phoneNumber && user.phoneNumber.trim().length >= 7)
      if (isNewUser || !hasPhone) {
        isOnboardingComplete = false
        requiredStep = 'CUSTOMER_PROFILE_COMPLETION'
        redirectUrl = `/customer?tab=profile&completeProfile=1`
      } else {
        isOnboardingComplete = true
        redirectUrl = '/customer'
      }
    } else if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      isOnboardingComplete = true
      redirectUrl = '/admin/dashboard'
    }

    const response = Response.json({
      success: true,
      user: userWithoutPassword,
      token,
      isNewUser,
      isOnboardingComplete,
      requiredStep,
      redirectUrl,
      business: business || null,
    })

    // Set secure cookie
    response.headers.append(
      'Set-Cookie',
      `authToken=${encodeURIComponent(token)}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`
    )

    return response
  } catch (error) {
    console.error('[AUTH GOOGLE] Sign in error:', error)
    return Response.json(
      { success: false, error: 'Internal server error: ' + error.message },
      { status: 500 }
    )
  }
}

