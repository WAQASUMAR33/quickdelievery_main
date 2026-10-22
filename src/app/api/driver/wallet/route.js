import { prisma } from '@/lib/prisma'

const COD_REMITTANCE_LIMIT = 15000 // In PKR / local currency

/**
 * GET /api/driver/wallet
 * Returns driver's earnings, tip breakdown, and floating Cash on Delivery (COD) pocket balance.
 * Query: ?driverId=<id>
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverIdParam = searchParams.get('driverId')

    if (!driverIdParam) {
      return Response.json(
        { success: false, error: 'driverId parameter is required' },
        { status: 400 }
      )
    }

    const driverId = parseInt(driverIdParam, 10)

    // Fetch driver profile
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true },
        },
      },
    })

    // Fetch all delivered orders for this driver
    const deliveredOrders = await prisma.order.findMany({
      where: {
        driverId,
        status: 'DELIVERED',
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        totalAmount: true,
        serviceCharge: true,
        paymentMethod: true,
        updatedAt: true,
        shippingAddress: true,
      },
    })

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    let todayEarnings = 0
    let weeklyEarnings = 0
    let totalEarnings = 0
    let codCashInHand = 0
    let todayDeliveriesCount = 0

    for (const o of deliveredOrders) {
      const orderDate = new Date(o.updatedAt)
      const fare = parseFloat(o.serviceCharge) || 150 // default delivery fare Rs. 150
      const orderTotal = parseFloat(o.totalAmount) || 0
      const isCod = ['COD', 'CASH', 'Cash', 'cash', 'cod'].includes(o.paymentMethod || '')

      totalEarnings += fare

      if (orderDate >= startOfToday) {
        todayEarnings += fare
        todayDeliveriesCount += 1
      }

      if (orderDate >= startOfWeek) {
        weeklyEarnings += fare
      }

      // If customer paid cash on delivery, rider holds that cash in pocket
      if (isCod) {
        codCashInHand += orderTotal
      }
    }

    // Remittance health check
    let remittanceStatus = 'HEALTHY'
    if (codCashInHand >= COD_REMITTANCE_LIMIT) {
      remittanceStatus = 'LIMIT_EXCEEDED'
    } else if (codCashInHand >= COD_REMITTANCE_LIMIT * 0.7) {
      remittanceStatus = 'WARNING'
    }

    return Response.json({
      success: true,
      data: {
        driverId,
        driverName: profile?.user?.username || 'Driver',
        bankDetails: {
          bankName: profile?.bankName || 'Meezan Bank',
          accountTitle: profile?.bankAccountTitle || profile?.user?.username || '',
          accountNumber: profile?.bankAccountNumber || '',
        },
        earnings: {
          today: Math.round(todayEarnings * 10) / 10,
          thisWeek: Math.round(weeklyEarnings * 10) / 10,
          lifetime: Math.round(totalEarnings * 10) / 10,
          completedTrips: deliveredOrders.length,
          todayTrips: todayDeliveriesCount,
        },
        codWallet: {
          cashInHand: Math.round(codCashInHand * 10) / 10,
          remittanceLimit: COD_REMITTANCE_LIMIT,
          remainingCapacity: Math.max(0, COD_REMITTANCE_LIMIT - codCashInHand),
          status: remittanceStatus,
          canAcceptCodOrders: codCashInHand < COD_REMITTANCE_LIMIT,
        },
        recentTransactions: deliveredOrders.slice(0, 10).map((o) => ({
          orderId: o.id,
          date: o.updatedAt,
          earning: parseFloat(o.serviceCharge) || 150,
          collectedAmount: parseFloat(o.totalAmount) || 0,
          paymentMethod: o.paymentMethod || 'PREPAID',
          address: o.shippingAddress,
        })),
      },
    })
  } catch (error) {
    console.error('Error fetching driver wallet:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch driver wallet' },
      { status: 500 }
    )
  }
}
