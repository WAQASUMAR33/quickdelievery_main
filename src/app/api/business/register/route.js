import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      email, businessName, firstName, lastName, cnicNo,
      categoryId, businessTypeId, businessCategoryId,
      phoneNumber1, phoneNumber2,
      buildingPlaceName, streetAddress, houseNumber,
      country, state, city, postalCode,
      urlCnicFront, urlCnicBack, ntnNo,
      bankName, bankIbanNo, bankAccountTitle, billingAddress,
      urlLogo, urlCoverPhoto, urlRestaurantImages,
      latitude, longitude,
    } = body

    // Required field validation
    if (
      !email || !businessName || !firstName || !lastName || !cnicNo ||
      !phoneNumber1 || !streetAddress || !state || !city || !postalCode ||
      !urlCnicFront || !urlCnicBack ||
      !bankName || !bankIbanNo || !bankAccountTitle || !billingAddress ||
      !businessTypeId || !businessCategoryId
    ) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const cleanEmail = email.toLowerCase().trim()

    // Enforce email verification check for merchant profile creation
    const user = await prisma.users.findUnique({
      where: { email: cleanEmail },
    })

    if (!user) {
      return Response.json(
        { success: false, error: 'Account not found. Please register and verify your email address first.' },
        { status: 403 }
      )
    }

    if (!user.emailVerification) {
      return Response.json(
        { success: false, error: 'Email verification required. Please verify your email before submitting your business profile.' },
        { status: 403 }
      )
    }

    // Upsert: update if business already exists, create otherwise
    const businessData = {
        businessName,
        firstName,
        lastName,
        cnicNo,
        categoryId: categoryId ? parseInt(categoryId) : null,
        businessTypeId: parseInt(businessTypeId),
        businessCategoryId: parseInt(businessCategoryId),
        phoneNumber1,
        phoneNumber2: phoneNumber2 || null,
        buildingPlaceName: buildingPlaceName || null,
        streetAddress,
        houseNumber: houseNumber || null,
        country: country || 'Pakistan',
        state,
        city,
        postalCode,
        urlCnicFront,
        urlCnicBack,
        ntnNo: ntnNo || null,
        bankName,
        bankIbanNo,
        bankAccountTitle,
        billingAddress,
        urlLogo: urlLogo || null,
        urlCoverPhoto: urlCoverPhoto || null,
        urlRestaurantImages: urlRestaurantImages || null,
        latitude:  latitude  != null ? parseFloat(latitude)  : null,
        longitude: longitude != null ? parseFloat(longitude) : null,
    }

    const business = await prisma.business.upsert({
      where: { email },
      update: businessData,
      create: { email, ...businessData },
    })

    return Response.json({ success: true, data: { id: business.id, email: business.email } })
  } catch (error) {
    console.error('Business registration error:', error)
    return Response.json({ success: false, error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
