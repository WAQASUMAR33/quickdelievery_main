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
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (verified !== null && verified !== undefined) {
      whereClause.emailVerification = verified === 'true'
    }

    // Get drivers with pagination
    const drivers = await prisma.users.findMany({
      where: whereClause,
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerification: true,
        type: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Get total count
    const totalCount = await prisma.users.count({ where: whereClause })

    // Get statistics
    const stats = await prisma.users.groupBy({
      by: ['role'],
      _count: { role: true }
    })

    const totalDrivers = await prisma.users.count({ where: { role: 'DRIVER' } })
    const verifiedDrivers = await prisma.users.count({ where: { role: 'DRIVER', emailVerification: true } })
    const unverifiedDrivers = await prisma.users.count({ where: { role: 'DRIVER', emailVerification: false } })

    return Response.json({
      success: true,
      data: drivers,
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
    const { id, username, email, phoneNumber, role, emailVerification } = await request.json()
    
    if (!id) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: {
        username,
        email,
        phoneNumber,
        role,
        emailVerification
      },
      select: {
        id: true,
        uid: true,
        username: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerification: true,
        type: true,
        updatedAt: true
      }
    })

    return Response.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return Response.json({
      success: false,
      error: 'Failed to update user'
    }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return Response.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    await prisma.users.delete({
      where: { id }
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
