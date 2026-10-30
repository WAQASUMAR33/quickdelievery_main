import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/admin/vendors/[id]
// Returns complete vendor user account, full business profile (including documents, images, GPS, bank),
// catalog products, food deals, categories, and operational statistics.
export async function GET(request, context) {
  try {
    const resolvedParams = await Promise.resolve(context.params)
    const rawId = resolvedParams?.id

    if (!rawId) {
      return NextResponse.json({ success: false, error: 'Vendor ID is required' }, { status: 400 })
    }

    const numericId = /^\d+$/.test(String(rawId)) ? parseInt(String(rawId), 10) : null

    // 1. Resolve Vendor User by numeric id or uid
    let vendor = null
    if (numericId !== null) {
      vendor = await prisma.users.findUnique({
        where: { id: numericId },
        include: {
          wallet: true,
          ownedFoodDeals: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    if (!vendor) {
      vendor = await prisma.users.findUnique({
        where: { uid: String(rawId) },
        include: {
          wallet: true,
          ownedFoodDeals: {
            orderBy: { createdAt: 'desc' },
          },
        },
      })
    }

    // Fallback: if rawId was a Business.id without matching Users.id
    let business = null
    if (!vendor && numericId !== null) {
      business = await prisma.business.findUnique({
        where: { id: numericId },
        include: {
          category: true,
          businessType: true,
          businessCategory: true,
        },
      })
      if (business?.email) {
        vendor = await prisma.users.findFirst({
          where: { email: { equals: business.email.trim() } },
          include: {
            wallet: true,
            ownedFoodDeals: {
              orderBy: { createdAt: 'desc' },
            },
          },
        })
      }
    }

    if (!vendor && !business) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 })
    }

    // 2. Fetch Business Profile if not already loaded
    if (!business && vendor?.email) {
      business = await prisma.business.findFirst({
        where: { email: { equals: vendor.email.trim() } },
        include: {
          category: true,
          businessType: true,
          businessCategory: true,
        },
      })
    }

    // 3. Fetch Vendor Products, Categories, and Order Metrics in parallel
    const [products, categories, orderItems, subOrders] = await Promise.all([
      vendor?.uid
        ? prisma.product.findMany({
            where: { vendorId: vendor.uid },
            include: {
              category: { select: { id: true, name: true, code: true } },
              subCategory: { select: { subCatId: true, subCatName: true } },
              productCategory: { select: { productCategoryId: true, productCategoryName: true } },
            },
            orderBy: { createdAt: 'desc' },
          })
        : Promise.resolve([]),
      prisma.category.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, name: true, code: true, vertical: true },
        orderBy: { name: 'asc' },
      }),
      vendor?.uid
        ? prisma.orderItem.findMany({
            where: { product: { vendorId: vendor.uid } },
            select: { id: true, quantity: true, price: true, orderId: true },
          })
        : Promise.resolve([]),
      vendor?.uid
        ? prisma.subOrder.findMany({
            where: { vendorId: vendor.uid },
            select: { id: true, status: true, subtotal: true, createdAt: true },
          })
        : Promise.resolve([]),
    ])

    // Sanitize sensitive auth fields from vendor user object
    const safeVendor = vendor
      ? {
          id: vendor.id,
          uid: vendor.uid,
          username: vendor.username,
          email: vendor.email,
          phoneNumber: vendor.phoneNumber,
          role: vendor.role,
          type: vendor.type,
          emailVerification: vendor.emailVerification,
          image: vendor.image,
          createdAt: vendor.createdAt,
          updatedAt: vendor.updatedAt,
          wallet: vendor.wallet
            ? {
                balance: Number(vendor.wallet.balance || 0),
                escrowBalance: Number(vendor.wallet.escrowBalance || 0),
                currency: vendor.wallet.currency || 'PKR',
              }
            : null,
          ownedFoodDeals: vendor.ownedFoodDeals || [],
        }
      : null

    const serializedProducts = products.map((p) => ({
      proId: p.proId,
      proName: p.proName,
      sku: p.sku,
      barcode: p.barcode,
      price: Number(p.price || 0),
      salePrice: p.salePrice != null ? Number(p.salePrice) : null,
      cost: Number(p.cost || 0),
      discount: Number(p.discount || 0),
      stock: p.stock,
      qnty: p.qnty,
      status: p.status,
      approvalStatus: p.approvalStatus,
      vertical: p.vertical,
      brandName: p.brandName,
      proImages: p.proImages,
      category: p.category,
      subCategory: p.subCategory,
      productCategory: p.productCategory,
      createdAt: p.createdAt,
    }))

    const stockValue = serializedProducts.reduce((sum, p) => sum + p.price * (p.stock || 0), 0)
    const orderRevenue = orderItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * (item.quantity || 1),
      0
    )
    const subOrderRevenue = subOrders.reduce((sum, so) => sum + Number(so.subtotal || 0), 0)
    const uniqueOrders = new Set(orderItems.map((i) => i.orderId)).size + subOrders.length

    const stats = {
      totalProducts: serializedProducts.length,
      approvedProducts: serializedProducts.filter((p) => p.approvalStatus === 'Approved').length,
      pendingProducts: serializedProducts.filter((p) => p.approvalStatus === 'Pending').length,
      rejectedProducts: serializedProducts.filter((p) => p.approvalStatus === 'Rejected').length,
      activeDeals: (vendor?.ownedFoodDeals || []).filter((d) => d.active).length,
      stockValue,
      totalOrders: uniqueOrders,
      grossSales: orderRevenue + subOrderRevenue,
    }

    return NextResponse.json({
      success: true,
      data: {
        vendor: safeVendor,
        business: business ?? null,
        products: serializedProducts,
        categories,
        stats,
      },
    })
  } catch (error) {
    console.error('Error fetching vendor detail:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load vendor details' },
      { status: 500 }
    )
  }
}

