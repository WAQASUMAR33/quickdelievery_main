import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const uid = searchParams.get('uid')
    const email = searchParams.get('email')

    if (!uid && !email) {
      return Response.json({ success: false, error: 'User UID or email required' }, { status: 400 })
    }

    let user;
    if (uid) {
      user = await prisma.users.findUnique({
        where: { uid },
        include: { customerProfile: true }
      })
    } else {
      user = await prisma.users.findUnique({
        where: { email },
        include: { customerProfile: true }
      })
    }

    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Merge base user data with customerProfile data
    const profile = {
      uid: user.uid,
      username: user.username,
      email: user.email,
      phoneNumber: user.phoneNumber,
      address: user.customerProfile?.address || null,
      city: user.customerProfile?.city || null,
      state: user.customerProfile?.state || null,
      zipCode: user.customerProfile?.zipCode || null,
      dateOfBirth: user.customerProfile?.dateOfBirth || null,
      gender: user.customerProfile?.gender || null,
    }

    return Response.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error fetching customer profile:', error)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const { uid, address, city, state, zipCode, dateOfBirth, gender } = body

    if (!uid) {
      return Response.json({ success: false, error: 'User UID required' }, { status: 400 })
    }

    // Check if user exists
    const user = await prisma.users.findUnique({ where: { uid } })
    if (!user) {
      return Response.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    // Upsert customer profile
    const profile = await prisma.customerProfile.upsert({
      where: { userId: uid },
      update: {
        address: address !== undefined ? address : undefined,
        city: city !== undefined ? city : undefined,
        state: state !== undefined ? state : undefined,
        zipCode: zipCode !== undefined ? zipCode : undefined,
        dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : undefined,
        gender: gender !== undefined ? gender : undefined,
      },
      create: {
        userId: uid,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        dateOfBirth: dateOfBirth || null,
        gender: gender || null,
      }
    })

    return Response.json({ success: true, data: profile })
  } catch (error) {
    console.error('Error updating customer profile:', error)
    return Response.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
