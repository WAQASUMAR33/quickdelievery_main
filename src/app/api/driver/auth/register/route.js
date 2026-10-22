import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import crypto from 'crypto'

/**
 * POST /api/driver/auth/register
 * Unified Driver Registration Endpoint
 * Creates user with role DRIVER and populates driverProfile in one transaction.
 */
export async function POST(request) {
  try {
    const body = await request.json()

    // Support canonical keys and standard aliases
    const email = body.email?.trim()
    const password = body.password
    const displayName = (body.displayName || body.username || body.name || '').trim()
    const phoneNumber = (body.phoneNumber || body.phone || body.contactNo01 || body.phone01 || '').trim()
    const phoneNumber2 = (body.phoneNumber2 || body.phone2 || body.contactNo02 || body.phone02 || '').trim()
    const dateOfBirth = (body.dateOfBirth || body.dob || '').trim()
    const cnicNumber = (body.cnicNumber || body.cnic || '').trim()
    const city = (body.city || 'Lahore').trim()
    const homeAddress = (body.homeAddress || body.address || 'Lahore, Pakistan').trim()
    const vehicleType = (body.vehicleType || body.vehicle || 'Motorcycle').trim()
    const licenseNumber = (body.licenseNumber || body.license || '').trim()
    const licenseExpiryDate = (body.licenseExpiryDate || body.licenseExpiry || '').trim()
    const vehicleRegNumber = (body.vehicleRegNumber || body.vehicleRegNo || body.vehicleRegistrationNumber || '').trim()
    const preferredZone = (body.preferredZone || body.zone || 'Gulberg').trim()
    const shiftSchedule = (body.shiftSchedule || body.shift || 'Morning Shift (8 AM - 4 PM)').trim()
    const bankName = (body.bankName || body.payoutMethod || 'JazzCash').trim()
    const bankAccountTitle = (body.bankAccountTitle || displayName || 'Account Holder').trim()
    const bankAccountNumber = (body.bankAccountNumber || body.accountNumber || body.walletNumber || body.iban || phoneNumber || '03000000000').trim()
    const emergencyContactName = (body.emergencyContactName || body.emergencyName || 'Emergency Contact').trim()
    const emergencyContactPhone = (body.emergencyContactPhone || body.emergencyPhone || '').trim()
    const profilePhotoUrl = body.profilePhotoUrl || body.profilePhoto || body.selfieImage || ''
    const cnicFrontUrl = body.cnicFrontUrl || body.cnicFront || ''
    const cnicBackUrl = body.cnicBackUrl || body.cnicBack || ''
    const licenseFrontUrl = body.licenseFrontUrl || body.licenseFront || ''
    const licenseBackUrl = body.licenseBackUrl || body.licenseBack || ''
    const policeVerificationUrl = body.policeVerificationUrl || body.policeVerificationForm || ''
    const policeVerificationRequested = body.policeVerificationRequested ?? body.requestPoliceVerification ?? true

    if (!email || !password || !displayName) {
      return Response.json(
        { success: false, error: 'Email, password, and full name are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase()

    // Check if email already registered
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return Response.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(password)
    const uid = crypto.randomUUID()

    // Combine address with city
    const fullHomeAddress = city && !homeAddress.toLowerCase().includes(city.toLowerCase())
      ? `${homeAddress}, ${city}`.trim()
      : homeAddress

    // License representation (Bicycle riders don't need driving license)
    const isCycle = vehicleType.toLowerCase() === 'bicycle' || vehicleType.toLowerCase() === 'cycle'
    const fullLicenseNumber = isCycle
      ? 'NOT_REQUIRED_CYCLE'
      : (licenseExpiryDate ? `${licenseNumber || 'DL-PENDING'} (Exp: ${licenseExpiryDate})` : (licenseNumber || 'DL-PENDING'))

    // Create user and driverProfile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.users.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          username: displayName,
          phoneNumber: phoneNumber || '',
          role: 'DRIVER',
          uid,
          emailVerification: true,
          type: 'driver',
        },
      })

      const driverProfile = await tx.driverProfile.create({
        data: {
          userId: user.id,
          cnicNumber: cnicNumber || '35202-0000000-0',
          licenseNumber: fullLicenseNumber,
          homeAddress: fullHomeAddress || 'Lahore, Pakistan',
          bankName: bankName || 'JazzCash',
          bankAccountTitle: bankAccountTitle || displayName,
          bankAccountNumber: bankAccountNumber || '03000000000',
          profilePhotoUrl: profilePhotoUrl || `https://i.pravatar.cc/150?u=${user.id}`,
          vehicleType: isCycle ? 'Bicycle' : (vehicleType === 'Car' ? 'Car' : 'Motorcycle'),
          vehicleNumberFrontUrl: vehicleRegNumber || '',
          cnicFrontUrl: cnicFrontUrl || '',
          cnicBackUrl: cnicBackUrl || '',
          licenseFrontUrl: isCycle ? '' : (licenseFrontUrl || ''),
          licenseBackUrl: isCycle ? '' : (licenseBackUrl || ''),
          vehicleRegCertFrontUrl: policeVerificationUrl || (policeVerificationRequested ? 'REQUESTED_POLICE_CLEARANCE' : ''),
          vehicleRegCertBackUrl: phoneNumber2 ? `Contact 2: ${phoneNumber2}${dateOfBirth ? ` | DOB: ${dateOfBirth}` : ''}` : (dateOfBirth ? `DOB: ${dateOfBirth}` : ''),
          preferredZone: preferredZone || 'Gulberg',
          shiftSchedule: shiftSchedule || 'Morning Shift (8 AM - 4 PM)',
          emergencyContactName: emergencyContactName || 'Emergency Contact',
          emergencyContactPhone: emergencyContactPhone || '',
          equipmentDepositPaid: true,
          smartphoneCompatible: true,
          dutyStatus: 'OFF_DUTY',
        },
      })

      return { user, driverProfile }
    })

    const token = signToken({
      userId: result.user.id,
      email: result.user.email,
      role: result.user.role,
    })

    const { password: _, ...userWithoutPassword } = result.user

    return Response.json({
      success: true,
      user: {
        ...userWithoutPassword,
        driverProfile: result.driverProfile,
      },
      token,
      message: 'Driver registration successful',
    })
  } catch (error) {
    console.error('Driver registration error:', error)
    return Response.json(
      { success: false, error: error.message || 'Internal server error during driver registration' },
      { status: 500 }
    )
  }
}
