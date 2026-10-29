import { prisma } from '@/lib/prisma'
import { calculateDriverPayout } from '@/lib/rapidRideFormula'
import { getRapidRideSettings } from '@/lib/rapidRideSettings'

/**
 * GET /api/driver/wallet
 * Returns driver's earnings (Store/Food Orders + RapidRide Trips net of Platform Fee),
 * tip breakdown, and floating Cash on Delivery (COD) pocket balance.
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
    const settings = await getRapidRideSettings()
    const codRemittanceLimit = settings.platformFee.codRemittanceLimit || 15000
    const defaultDeliveryBaseFee = settings.platformFee.deliveryOrderBaseFee || 150

    // Fetch driver profile
    const profile = await prisma.driverProfile.findUnique({
      where: { userId: driverId },
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true },
        },
      },
    })

    // Fetch delivered orders & completed RapidRide trips for this driver
    const [deliveredOrders, completedRides] = await Promise.all([
      prisma.order.findMany({
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
      }),
      prisma.rideRequest.findMany({
        where: {
          driverId,
          status: 'COMPLETED',
        },
        orderBy: { updatedAt: 'desc' },
        take: 50,
        select: {
          id: true,
          serviceType: true,
          customerFare: true,
          finalFare: true,
          paymentMethod: true,
          dropoffAddress: true,
          updatedAt: true,
        },
      }),
    ])

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
      const fare = parseFloat(o.serviceCharge) || defaultDeliveryBaseFee
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

      if (isCod) {
        codCashInHand += orderTotal
      }
    }

    for (const r of completedRides) {
      const rideDate = new Date(r.updatedAt)
      const grossFare = parseFloat(r.finalFare || r.customerFare) || 0
      const payout = calculateDriverPayout(grossFare, settings)
      const netEarning = payout.driverNetEarning
      const isCash = ['CASH', 'COD', 'cash'].includes(r.paymentMethod || 'CASH')

      totalEarnings += netEarning

      if (rideDate >= startOfToday) {
        todayEarnings += netEarning
        todayDeliveriesCount += 1
      }

      if (rideDate >= startOfWeek) {
        weeklyEarnings += netEarning
      }

      // On Cash RapidRide trips, driver collects grossFare and owes totalPlatformFee to platform
      if (isCash) {
        codCashInHand += payout.totalPlatformFee
      }
    }

    // Remittance health check
    let remittanceStatus = 'HEALTHY'
    if (codCashInHand >= codRemittanceLimit) {
      remittanceStatus = 'LIMIT_EXCEEDED'
    } else if (codCashInHand >= codRemittanceLimit * 0.7) {
      remittanceStatus = 'WARNING'
    }

    return Response.json({
      success: true,
      data: {
        driverId,
        driverName: profile?.user?.username || 'Driver',
        platformFeeFormula: settings.platformFee,
        bankDetails: {
          bankName: profile?.bankName || 'Meezan Bank',
          accountTitle: profile?.bankAccountTitle || profile?.user?.username || '',
          accountNumber: profile?.bankAccountNumber || '',
        },
        earnings: {
          today: Math.round(todayEarnings * 10) / 10,
          thisWeek: Math.round(weeklyEarnings * 10) / 10,
          lifetime: Math.round(totalEarnings * 10) / 10,
          completedTrips: deliveredOrders.length + completedRides.length,
          todayTrips: todayDeliveriesCount,
        },
        codWallet: {
          cashInHand: Math.round(codCashInHand * 10) / 10,
          remittanceLimit: codRemittanceLimit,
          remainingCapacity: Math.max(0, codRemittanceLimit - codCashInHand),
          status: remittanceStatus,
          canAcceptCodOrders: codCashInHand < codRemittanceLimit,
        },
        recentTransactions: [
          ...deliveredOrders.slice(0, 6).map((o) => ({
            orderId: `ORD-${o.id}`,
            date: o.updatedAt,
            earning: parseFloat(o.serviceCharge) || defaultDeliveryBaseFee,
            collectedAmount: parseFloat(o.totalAmount) || 0,
            paymentMethod: o.paymentMethod || 'PREPAID',
            address: o.shippingAddress,
          })),
          ...completedRides.slice(0, 6).map((r) => {
            const gross = parseFloat(r.finalFare || r.customerFare) || 0
            const payout = calculateDriverPayout(gross, settings)
            return {
              orderId: `RIDE-${r.id}`,
              date: r.updatedAt,
              earning: payout.driverNetEarning,
              platformFee: payout.totalPlatformFee,
              collectedAmount: gross,
              paymentMethod: r.paymentMethod || 'CASH',
              address: r.dropoffAddress,
            }
          }),
        ]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10),
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

/**
 * POST /api/driver/wallet
 * Driver submits Cash-on-Delivery (COD) remittance proof / bank deposit receipt.
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { driverId, amount, transactionRef, depositSlipUrl } = body

    if (!driverId || !amount) {
      return Response.json(
        { success: false, error: 'driverId and remittance amount are required' },
        { status: 400 }
      )
    }

    const numericDriverId = parseInt(driverId, 10)
    const remitAmount = parseFloat(amount)

    return Response.json({
      success: true,
      message: `Remittance of Rs. ${remitAmount.toLocaleString()} submitted successfully. Awaiting finance confirmation.`,
      data: {
        driverId: numericDriverId,
        amountRemitted: remitAmount,
        transactionRef: transactionRef || `REMIT-${Date.now().toString().slice(-6)}`,
        status: 'SUBMITTED',
        depositSlipUrl: depositSlipUrl || null,
        submittedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Error submitting driver remittance:', error)
    return Response.json(
      { success: false, error: 'Failed to submit remittance' },
      { status: 500 }
    )
  }
}
