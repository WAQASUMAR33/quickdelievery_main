import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 10
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const verified = searchParams.get('verified')

    // Build where clause — always restrict to DRIVER role
    const whereClause = { role: 'DRIVER' }

    if (search) {
      whereClause.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { phoneNumber: { contains: search } }
      ]
    }

    if (verified !== null && verified !== undefined) {
      whereClause.emailVerification = verified === 'true'
    }

    // Get drivers with pagination including their driver profile
    const drivers = await prisma.users.findMany({
      where: whereClause,
      include: {
        driverProfile: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    const formattedDrivers = drivers.map(user => {
      const dp = user.driverProfile
      return {
        id: user.id,
        uid: user.uid,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerification: user.emailVerification,
        type: user.type,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        driverProfile: dp || null,

        // Flattened driver fields
        cnicNumber: dp?.cnicNumber || '',
        licenseNumber: dp?.licenseNumber || '',
        homeAddress: dp?.homeAddress || '',
        bankName: dp?.bankName || '',
        bankAccountTitle: dp?.bankAccountTitle || '',
        bankAccountNumber: dp?.bankAccountNumber || '',
        profilePhotoUrl: dp?.profilePhotoUrl || '',
        equipmentDepositPaid: dp?.equipmentDepositPaid || false,
        smartphoneCompatible: dp?.smartphoneCompatible || false,
        vehicleType: dp?.vehicleType || '',
        emergencyContactName: dp?.emergencyContactName || '',
        emergencyContactPhone: dp?.emergencyContactPhone || '',
        preferredZone: dp?.preferredZone || '',
        shiftSchedule: dp?.shiftSchedule || '',
        dutyStatus: dp?.dutyStatus || 'OFF_DUTY',
      }
    })

    // Get total count
    const totalCount = await prisma.users.count({ where: whereClause })

    // Get statistics
    const totalDrivers = await prisma.users.count({ where: { role: 'DRIVER' } })
    const verifiedDrivers = await prisma.users.count({ where: { role: 'DRIVER', emailVerification: true } })
    const unverifiedDrivers = await prisma.users.count({ where: { role: 'DRIVER', emailVerification: false } })

    return Response.json({
      success: true,
      data: formattedDrivers,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      },
      stats: {
        totalDrivers,
        verifiedDrivers,
        unverifiedDrivers
      }
    })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return Response.json({
      success: false,
      error: 'Failed to fetch drivers'
    }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { id, emailVerification } = await request.json()
    
    if (!id) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const updateData = {}
    if (typeof emailVerification === 'boolean') {
      updateData.emailVerification = emailVerification
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerification: true,
        updatedAt: true
      }
    })

    return Response.json({
      success: true,
      data: updatedUser,
      message: 'Driver status updated successfully'
    })
  } catch (error) {
    console.error('Error updating driver status:', error)
    return Response.json({
      success: false,
      error: 'Failed to update driver status'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const rawId = searchParams.get('id')
    const userId = parseInt(rawId)
    if (!rawId || isNaN(userId)) {
      return Response.json({
        success: false,
        error: 'Invalid User ID'
      }, { status: 400 })
    }

    await prisma.users.delete({
      where: { id: userId }
    })

    return Response.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return Response.json({
      success: false,
      error: 'Failed to delete user'
    }, { status: 500 })
  }
}
