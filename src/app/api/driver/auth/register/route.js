import { prisma } from '@/lib/prisma'
import { hashPassword, signToken } from '@/lib/auth'
import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

const ALLOWED_VEHICLES = ['Motorcycle', 'Car', 'Rickshaw', 'Van', 'Bicycle']
const MIN_VEHICLE_IMAGES = 4

/**
 * Persists an inline base64 data URL (if a client sent one instead of an uploaded URL)
 * to S3 (when configured) or local /public storage, and returns the public URL.
 * Already-uploaded URLs are returned untouched.
 */
async function persistImage(value, folder = 'drivers') {
  if (!value || typeof value !== 'string') return ''
  const match = value.match(/^data:([A-Za-z-+/]+);base64,(.+)$/)
  if (!match) return value.trim()

  const contentType = match[1]
  const buffer = Buffer.from(match[2], 'base64')
  const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg'
  const fileName = `driver-${crypto.randomUUID().slice(0, 8)}.${ext}`

  const hasS3 = Boolean(
    (process.env.ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID) &&
    (process.env.SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY) &&
    (process.env.S3_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME)
  )
  if (hasS3) {
    try {
      const { uploadBufferToS3 } = await import('@/lib/s3')
      const result = await uploadBufferToS3(buffer, { fileName, contentType, folder })
      return result.url
    } catch (err) {
      console.warn('[DRIVER REGISTER] S3 upload failed, using local storage:', err.message)
    }
  }

  const dir = path.join(process.cwd(), 'public', folder)
  await fs.mkdir(dir, { recursive: true })
  const unique = `${Date.now()}-${fileName}`
  await fs.writeFile(path.join(dir, unique), buffer)
  return `/${folder}/${unique}`
}

const str = (v) => (typeof v === 'string' ? v.trim() : v == null ? '' : String(v).trim())

/**
 * POST /api/driver/auth/register
 * 6-step Driver Onboarding Endpoint
 *  1. Photo, Full Name (as CNIC), Email, Password
 *  2. Contact No 01 / 02, City, Full Address
 *  3. Date of Birth, CNIC No, CNIC Front / Back
 *  4. License Number, License Front / Back
 *  5. Vehicle Type, Vehicle Number, Vehicle Images (min 4)
 *  6. Live Selfie
 * Creates user with role DRIVER and its driverProfile in one transaction.
 */
export async function POST(request) {
  try {
    const body = await request.json()

    // ── Step 1 ──
    const email = str(body.email).toLowerCase()
    const password = body.password || ''
    const confirmPassword = body.confirmPassword ?? body.passwordConfirmation ?? password
    const displayName = str(body.displayName || body.fullName || body.username || body.name)
    // ── Step 2 ──
    const phoneNumber = str(body.phoneNumber || body.contactNo01 || body.phone01 || body.phone)
    const phoneNumber2 = str(body.phoneNumber2 || body.contactNo02 || body.phone02 || body.phone2)
    const city = str(body.city)
    const homeAddress = str(body.homeAddress || body.fullAddress || body.address)
    // ── Step 3 ──
    const dateOfBirth = str(body.dateOfBirth || body.dob)
    const cnicNumber = str(body.cnicNumber || body.cnic)
    // ── Step 4 ──
    const licenseNumber = str(body.licenseNumber || body.license)
    // ── Step 5 ──
    const rawVehicle = str(body.vehicleType || body.vehicle) || 'Motorcycle'
    const vehicleType = ALLOWED_VEHICLES.find((v) => v.toLowerCase() === rawVehicle.toLowerCase()) || 'Motorcycle'
    const vehicleNumber = str(body.vehicleNumber || body.vehicleRegNumber || body.vehicleRegNo).toUpperCase()
    const vehicleImagesInput = Array.isArray(body.vehicleImages) ? body.vehicleImages.filter(Boolean) : []

    // ── Validation ──
    const missing = []
    if (!displayName) missing.push('Full name')
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) missing.push('Valid email')
    if (!password || password.length < 6) missing.push('Password (min 6 characters)')
    if (!phoneNumber) missing.push('Contact No 01')
    if (!city) missing.push('City')
    if (!homeAddress) missing.push('Full address')
    if (!dateOfBirth) missing.push('Date of birth')
    if (!cnicNumber) missing.push('CNIC number')
    if (!licenseNumber) missing.push('License number')
    if (!vehicleNumber) missing.push('Vehicle number')
    if (missing.length) {
      return Response.json({ success: false, error: `Required: ${missing.join(', ')}` }, { status: 400 })
    }
    if (password !== confirmPassword) {
      return Response.json({ success: false, error: 'Passwords do not match' }, { status: 400 })
    }
    if (vehicleImagesInput.length < MIN_VEHICLE_IMAGES) {
      return Response.json(
        { success: false, error: `Please upload at least ${MIN_VEHICLE_IMAGES} vehicle images` },
        { status: 400 }
      )
    }

    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      return Response.json({ success: false, error: 'An account with this email already exists' }, { status: 400 })
    }

    // ── Persist any inline images ──
    const [profilePhotoUrl, cnicFrontUrl, cnicBackUrl, licenseFrontUrl, licenseBackUrl, selfieUrl] = await Promise.all([
      persistImage(body.profilePhotoUrl || body.profilePhoto, 'drivers/profile'),
      persistImage(body.cnicFrontUrl || body.cnicFront, 'drivers/cnic'),
      persistImage(body.cnicBackUrl || body.cnicBack, 'drivers/cnic'),
      persistImage(body.licenseFrontUrl || body.licenseFront, 'drivers/license'),
      persistImage(body.licenseBackUrl || body.licenseBack, 'drivers/license'),
      persistImage(body.selfieUrl || body.selfieImage || body.liveSelfie, 'drivers/selfie'),
    ])
    const vehicleImages = await Promise.all(vehicleImagesInput.map((img) => persistImage(img, 'drivers/vehicle')))

    const docErrors = []
    if (!profilePhotoUrl) docErrors.push('Profile photo')
    if (!cnicFrontUrl || !cnicBackUrl) docErrors.push('CNIC front & back')
    if (!licenseFrontUrl || !licenseBackUrl) docErrors.push('License front & back')
    if (!selfieUrl) docErrors.push('Live selfie')
    if (docErrors.length) {
      return Response.json({ success: false, error: `Missing documents: ${docErrors.join(', ')}` }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const uid = crypto.randomUUID()
    const fullHomeAddress = homeAddress.toLowerCase().includes(city.toLowerCase())
      ? homeAddress
      : `${homeAddress}, ${city}`

    const baseProfile = {
      cnicNumber,
      licenseNumber,
      homeAddress: fullHomeAddress,
      // Payout details are collected later from the driver profile screen
      bankName: str(body.bankName) || 'Pending',
      bankAccountTitle: str(body.bankAccountTitle) || displayName,
      bankAccountNumber: str(body.bankAccountNumber) || phoneNumber,
      profilePhotoUrl,
      vehicleType,
      cnicFrontUrl,
      cnicBackUrl,
      licenseFrontUrl,
      licenseBackUrl,
      vehicleNumberFrontUrl: vehicleImages[0] || '',
      emergencyContactName: str(body.emergencyContactName) || null,
      emergencyContactPhone: str(body.emergencyContactPhone) || null,
      preferredZone: str(body.preferredZone) || null,
      shiftSchedule: str(body.shiftSchedule) || null,
      equipmentDepositPaid: false,
      smartphoneCompatible: true,
      dutyStatus: 'OFF_DUTY',
    }
    const wizardFields = {
      city,
      dateOfBirth,
      contactNo2: phoneNumber2 || null,
      vehicleNumber,
      vehicleImages,
      selfieUrl,
    }
    // Legacy column packing, used only if the new DB columns have not been migrated yet
    const legacyFields = {
      vehicleRegCertFrontUrl: selfieUrl.slice(0, 500),
      vehicleRegCertBackUrl: `Vehicle: ${vehicleNumber} | DOB: ${dateOfBirth}${phoneNumber2 ? ` | Contact 2: ${phoneNumber2}` : ''}`.slice(0, 500),
    }

    const createAll = (profileData) =>
      prisma.$transaction(async (tx) => {
        const user = await tx.users.create({
          data: {
            email,
            password: hashedPassword,
            username: displayName,
            phoneNumber,
            role: 'DRIVER',
            uid,
            emailVerification: true,
            type: 'driver',
            image: profilePhotoUrl,
          },
        })
        const driverProfile = await tx.driverProfile.create({ data: { userId: user.id, ...profileData } })
        return { user, driverProfile }
      })

    let result
    try {
      result = await createAll({ ...baseProfile, ...wizardFields })
    } catch (err) {
      const msg = String(err?.message || '')
      const columnMissing = err?.code === 'P2022' || /Unknown (column|argument)|does not exist/i.test(msg)
      if (!columnMissing) throw err
      console.warn('[DRIVER REGISTER] New onboarding columns missing, using legacy fields. Run `prisma migrate deploy`.')
      result = await createAll({ ...baseProfile, ...legacyFields })
    }

    const token = signToken({ userId: result.user.id, email: result.user.email, role: result.user.role })
    const { password: _, ...userWithoutPassword } = result.user

    return Response.json({
      success: true,
      user: { ...userWithoutPassword, driverProfile: result.driverProfile },
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
