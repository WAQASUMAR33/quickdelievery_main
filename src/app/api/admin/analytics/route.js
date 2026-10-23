import { prisma } from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/analytics?range=7d|30d|90d|all
 * Generates comprehensive dashboard statistics, time-series chart data, category distribution,
 * and operations telemetry.
 */
export async function GET(request) {
  try {
    const authUser = await getAuthUser(request)

    // Ensure only ADMIN or SUPER_ADMIN access
    if (!authUser || (authUser.role !== 'ADMIN' && authUser.role !== 'SUPER_ADMIN')) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'

    // Determine cutoff date for time range
    const now = new Date()
    let daysToInclude = 7
    if (range === '30d') daysToInclude = 30
    else if (range === '90d') daysToInclude = 90
    else if (range === 'today') daysToInclude = 1
    else if (range === 'all') daysToInclude = 365

    const cutoffDate = new Date(now.getTime() - daysToInclude * 24 * 60 * 60 * 1000)

    // Run parallel queries against AWS RDS MySQL
    const [
      allOrders,
      allProducts,
      allCategories,
      allUsers,
      driverProfiles,
      allBusinesses,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: cutoffDate } },
        include: {
          orderItems: {
            include: {
              product: {
                select: { proId: true, proName: true, price: true, catId: true }
              }
            }
          },
          user: {
            select: { id: true, username: true, email: true, phoneNumber: true }
          }
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.findMany({
        select: {
          proId: true,
          proName: true,
          price: true,
          stock: true,
          status: true,
          approvalStatus: true,
          catId: true,
          vendorId: true,
          vertical: true,
          category: { select: { id: true, name: true, vertical: true } },
        },
      }),
      prisma.category.findMany({
        select: { id: true, name: true, vertical: true },
      }),
      prisma.users.findMany({
        select: {
          id: true,
          username: true,
          email: true,
          phoneNumber: true,
          role: true,
          emailVerification: true,
          createdAt: true,
        },
      }),
      prisma.driverProfile.findMany({
        include: {
          user: {
            select: { id: true, username: true, email: true, phoneNumber: true }
          }
        }
      }),
      prisma.business.findMany({
        select: {
          id: true,
          businessName: true,
          email: true,
          phoneNumber1: true,
          city: true,
          state: true,
          vertical: true,
          verificationStatus: true,
          urlLogo: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // ── 1. Financial & Order Volume Overview ──
    let grossRevenue = 0
    let deliveredRevenue = 0
    let pendingOrders = 0
    let processingOrders = 0
    let shippedOrders = 0
    let deliveredOrders = 0
    let cancelledOrders = 0
    let foodOrdersCount = 0
    let groceryOrdersCount = 0
    let codOrdersCount = 0
    let cardOrdersCount = 0

    const statusCounts = {
      PENDING: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    }

    for (const order of allOrders) {
      const amt = parseFloat(order.totalAmount || 0)
      grossRevenue += amt

      if (order.vertical === 'GROCERY') groceryOrdersCount++
      else foodOrdersCount++

      if (order.paymentMethod === 'CASH_ON_DELIVERY') codOrdersCount++
      else cardOrdersCount++

      if (order.status === 'DELIVERED') {
        deliveredRevenue += amt
        deliveredOrders++
        statusCounts.DELIVERED++
      } else if (order.status === 'PROCESSING') {
        processingOrders++
        statusCounts.PROCESSING++
      } else if (order.status === 'SHIPPED') {
        shippedOrders++
        statusCounts.SHIPPED++
      } else if (order.status === 'CANCELLED') {
        cancelledOrders++
        statusCounts.CANCELLED++
      } else {
        pendingOrders++
        statusCounts.PENDING++
      }
    }

    const totalOrdersCount = allOrders.length
    const avgOrderValue = totalOrdersCount > 0 ? grossRevenue / totalOrdersCount : 0
    const deliverySuccessRate = totalOrdersCount > 0
      ? Math.round((deliveredOrders / (totalOrdersCount - pendingOrders || 1)) * 100)
      : 100

    // ── 2. Time-Series Chart Data (Daily Timeline) ──
    const chartMap = new Map()
    const numBuckets = Math.min(daysToInclude, 30)
    for (let i = numBuckets - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      chartMap.set(key, { date: key, label, revenue: 0, orders: 0, delivered: 0 })
    }

    for (const order of allOrders) {
      const key = new Date(order.createdAt).toISOString().split('T')[0]
      const bucket = chartMap.get(key)
      if (bucket) {
        bucket.revenue += parseFloat(order.totalAmount || 0)
        bucket.orders += 1
        if (order.status === 'DELIVERED') bucket.delivered += 1
      }
    }

    const chartTimeline = Array.from(chartMap.values()).map((item) => {
      return {
        ...item,
        revenue: Math.round(item.revenue * 100) / 100,
        orders: item.orders,
        actualRevenue: item.revenue,
        actualOrders: item.orders,
      }
    })

    // ── 3. Category Distribution ──
    const categoryStats = allCategories.map((cat) => {
      const catProds = allProducts.filter((p) => p.catId === cat.id)
      const catRevenue = catProds.reduce((sum, p) => sum + (parseFloat(p.price || 0) * (p.stock || 1)), 0)
      return {
        id: cat.id,
        name: cat.name,
        vertical: cat.vertical || 'RETAIL',
        productCount: catProds.length,
        estimatedValue: Math.round(catRevenue),
      }
    }).sort((a, b) => b.productCount - a.productCount)

    const totalProductCount = allProducts.length
    const categoryDistribution = categoryStats.map((c) => ({
      ...c,
      percentage: totalProductCount > 0 ? Math.round((c.productCount / totalProductCount) * 100) : 0,
    }))

    // ── 4. Vendors & Store Statistics ──
    const vendorUsers = allUsers.filter((u) => u.role === 'VENDOR')
    const totalVendorsCount = allBusinesses.length || vendorUsers.length
    const approvedBusinesses = allBusinesses.filter(b => b.verificationStatus === 'APPROVED').length
    const pendingBusinesses = allBusinesses.filter(b => b.verificationStatus === 'PENDING').length
    const foodVendors = allBusinesses.filter(b => b.vertical === 'FOOD').length
    const groceryVendors = allBusinesses.filter(b => b.vertical === 'GROCERY').length
    const retailVendors = allBusinesses.filter(b => b.vertical === 'SHOP' || b.vertical === 'RETAIL').length

    const vendorRoster = allBusinesses.map((b) => {
      const storeProducts = allProducts.filter(p => p.vendorId === b.email || p.vendorId === String(b.id)).length
      return {
        id: b.id,
        name: b.businessName,
        email: b.email,
        phone: b.phoneNumber1 || '—',
        city: b.city || '—',
        state: b.state || '',
        vertical: b.vertical || 'FOOD',
        status: b.verificationStatus,
        productCount: storeProducts,
      }
    })

    // ── 5. Drivers & Fleet Telemetry Statistics ──
    const driverUsers = allUsers.filter((u) => u.role === 'DRIVER')
    const totalDriversCount = driverProfiles.length || driverUsers.length
    const onDutyDrivers = driverProfiles.filter(d => d.dutyStatus === 'ON_DUTY').length
    const onDeliveryDrivers = driverProfiles.filter(d => d.dutyStatus === 'ON_DELIVERY').length
    const offDutyDrivers = driverProfiles.filter(d => d.dutyStatus === 'OFF_DUTY').length

    const activeDriversComputed = onDutyDrivers + onDeliveryDrivers

    // Real driver roster from driver profiles
    const driverRoster = driverProfiles.map(dp => ({
      id: dp.id,
      name: dp.user?.username || 'Driver Partner',
      phone: dp.user?.phoneNumber || '—',
      email: dp.user?.email || '—',
      vehicle: dp.vehicleType || 'Motorcycle',
      status: dp.dutyStatus || 'OFF_DUTY',
      shift: dp.shiftSchedule || 'Standard',
      deliveriesToday: allOrders.filter(o => o.driverId === dp.id && o.status === 'DELIVERED').length,
    }))

    // ── 6. Customers & User Base Statistics ──
    const customerUsers = allUsers.filter((u) => u.role === 'CUSTOMER')
    const totalCustomers = customerUsers.length
    const verifiedUsers = allUsers.filter((u) => u.emailVerification).length
    const newCustomersThisPeriod = allUsers.filter(u => u.createdAt >= cutoffDate && u.role === 'CUSTOMER').length

    // ── 7. Products & Inventory Health ──
    const approvedProducts = allProducts.filter((p) => p.approvalStatus === 'Approved').length
    const pendingProducts = allProducts.filter((p) => p.approvalStatus === 'Pending').length
    const lowStockProducts = allProducts.filter((p) => p.stock < 10).length
    const outOfStockProducts = allProducts.filter((p) => p.stock === 0).length
    const activeProducts = allProducts.filter((p) => p.status).length
    const foodProductsCount = allProducts.filter((p) => p.vertical === 'FOOD').length
    const groceryProductsCount = allProducts.filter((p) => p.vertical === 'GROCERY').length

    // ── 8. Top Selling Products based on actual order items ──
    const salesByProductId = {}
    for (const order of allOrders) {
      for (const item of (order.orderItems || [])) {
        const pid = item.productId || item.product?.proId
        if (!pid) continue
        if (!salesByProductId[pid]) {
          salesByProductId[pid] = { count: 0, revenue: 0 }
        }
        const qty = item.quantity || 1
        const price = parseFloat(item.price || item.product?.price || 0)
        salesByProductId[pid].count += qty
        salesByProductId[pid].revenue += price * qty
      }
    }

    const topProducts = allProducts
      .map(p => {
        const sales = salesByProductId[p.proId] || { count: 0, revenue: 0 }
        return {
          id: p.proId,
          name: p.proName,
          price: parseFloat(p.price || 0),
          category: p.category?.name || 'General',
          salesCount: sales.count,
          revenue: Math.round(sales.revenue * 100) / 100,
        }
      })
      .sort((a, b) => (b.salesCount - a.salesCount) || (b.revenue - a.revenue))
      .slice(0, 5)

    return Response.json({
      success: true,
      timestamp: Date.now(),
      range,
      kpis: {
        grossRevenue: Math.round(grossRevenue * 100) / 100,
        actualGrossRevenue: Math.round(grossRevenue * 100) / 100,
        deliveredRevenue: Math.round(deliveredRevenue * 100) / 100,
        totalOrders: totalOrdersCount,
        actualOrders: totalOrdersCount,
        pendingOrders,
        processingOrders,
        shippedOrders,
        deliveredOrders,
        cancelledOrders,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        deliverySuccessRate,
        totalCustomers,
        totalVendors: totalVendorsCount,
        totalDrivers: totalDriversCount,
        activeDrivers: activeDriversComputed,
        totalProducts: totalProductCount,
        approvedProducts,
        pendingProducts,
        lowStockProducts,
        activeProducts,
        verifiedUsers,
      },
      vendorStats: {
        total: totalVendorsCount,
        approved: approvedBusinesses,
        pending: pendingBusinesses,
        foodVendors,
        groceryVendors,
        retailVendors,
        stores: vendorRoster,
      },
      driverStats: {
        total: totalDriversCount,
        active: activeDriversComputed,
        onDuty: onDutyDrivers,
        onDelivery: onDeliveryDrivers,
        offDuty: offDutyDrivers,
        avgDropoffTime: '—',
        fleetOnTimeRate: totalOrdersCount > 0 ? `${deliverySuccessRate}%` : '—',
        drivers: driverRoster,
      },
      orderStats: {
        total: totalOrdersCount,
        pending: pendingOrders,
        processing: processingOrders,
        shipped: shippedOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
        foodOrders: foodOrdersCount,
        groceryOrders: groceryOrdersCount,
        codOrders: codOrdersCount,
        cardOrders: cardOrdersCount,
      },
      customerStats: {
        total: totalCustomers,
        verified: verifiedUsers,
        newThisPeriod: newCustomersThisPeriod,
      },
      productStats: {
        total: totalProductCount,
        approved: approvedProducts,
        pending: pendingProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        foodProducts: foodProductsCount,
        groceryProducts: groceryProductsCount,
      },
      chartTimeline,
      orderStatusBreakdown: [
        { status: 'DELIVERED', label: 'Delivered', count: deliveredOrders, color: '#10B981' },
        { status: 'PROCESSING', label: 'In Kitchen / Prep', count: processingOrders, color: '#3B82F6' },
        { status: 'SHIPPED', label: 'Out for Delivery', count: shippedOrders, color: '#8B5CF6' },
        { status: 'PENDING', label: 'Pending Dispatch', count: pendingOrders, color: '#F59E0B' },
        { status: 'CANCELLED', label: 'Cancelled', count: cancelledOrders, color: '#EF4444' },
      ],
      categoryDistribution: categoryDistribution.slice(0, 5),
      topProducts,
    })
  } catch (error) {
    console.error('Error generating admin analytics:', error)
    return Response.json({ success: false, error: 'Failed to generate analytics' }, { status: 500 })
  }
}
