import { prisma } from '@/lib/prisma'

export async function POST(request) {
  try {
    const body = await request.json()

    const {
      email, businessName, firstName, lastName, cnicNo,
      businessTypeId, businessCategoryId,
      phoneNumber1, phoneNumber2,
      buildingPlaceName, streetAddress, houseNumber,
      state, city, postalCode,
      urlCnicFront, urlCnicBack, ntnNo,
      bankName, bankIbanNo, bankAccountTitle, billingAddress,
      urlLogo, urlCoverPhoto, urlRestaurantImages,
      latitude, longitude,
    } = body

    // Required field validation
    if (
      !email || !businessName || !firstName || !lastName || !cnicNo ||
      !businessTypeId || !businessCategoryId ||
      !phoneNumber1 || !streetAddress || !state || !city || !postalCode ||
      !urlCnicFront || !urlCnicBack ||
      !bankName || !bankIbanNo || !bankAccountTitle || !billingAddress
    ) {
      return Response.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // Check for duplicate email
    const existing = await prisma.business.findUnique({ where: { email } })
    if (existing) {
      return Response.json(
        { success: false, error: 'This email is already registered as a business' },
        { status: 400 }
      )
    }

    const business = await prisma.business.create({
      data: {
        email,
        businessName,
        firstName,
        lastName,
        cnicNo,
        businessTypeId: parseInt(businessTypeId),
        businessCategoryId: parseInt(businessCategoryId),
        phoneNumber1,
        phoneNumber2: phoneNumber2 || null,
        buildingPlaceName: buildingPlaceName || null,
        streetAddress,
        houseNumber: houseNumber || null,
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
    })

    return Response.json({ success: true, data: { id: business.id, email: business.email } })
  } catch (error) {
    console.error('Business registration error:', error)
    return Response.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
