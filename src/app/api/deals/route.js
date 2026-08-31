import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-server'
import {
  canManageFoodDeal,
  prismaFoodDeal,
  isPrismaMissingTableError,
  MISSING_DEALS_TABLE_HINT,
  normalizeCustomDealItems,
  serializeDealForManage,
  serializeDealForStorefront,
} from '@/lib/deals/helpers'

const dealIncludeDetailed = {
  product: {
    include: { category: true, subCategory: true, vendor: true },
  },
  ownerUser: { select: { uid: true, username: true } },
}

/** Active deals in-window: catalog (approved product) OR custom bundle with title. */
function storefrontWhereCompound() {
  const now = new Date()
  return {
    active: true,
    AND: [
      {
        OR: [{ startAt: null }, { startAt: { lte: now } }],
      },
      {
        OR: [{ endAt: null }, { endAt: { gte: now } }],
      },
      {
        OR: [
          {
            AND: [
              { productId: { not: null } },
              {
                product: {
                  status: true,
                  approvalStatus: 'Approved',
                },
              },
            ],
          },
          {
            AND: [{ productId: null }, { customTitle: { not: null } }],
          },
        ],
      },
    ],
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const scope = searchParams.get('scope') || 'storefront'
    const vertical = searchParams.get('vertical') // 'FOOD' or 'GROCERY'

    const foodDeal = prismaFoodDeal(prisma)
    if (!foodDeal) {
      if (scope === 'storefront') {
        return Response.json({ success: true, data: [] })
      }
      return Response.json(
        {
          success: false,
          error:
            'Food deals are not available yet. Run prisma migrate and prisma generate so the Prisma client matches the schema.',
        },
        { status: 503 },
      )
    }

    if (scope === 'storefront') {
      const where = storefrontWhereCompound()
      if (vertical) {
        where.vertical = vertical
      }

      const deals = await foodDeal.findMany({
        where,
        include: dealIncludeDetailed,
        orderBy: [{ sortOrder: 'asc' }, { dealId: 'asc' }],
      })
      const data = deals
        .map((d) => serializeDealForStorefront(d))
        .filter((row) => {
          if (row.product) return true
          return Boolean(row.isCustom && String(row.customTitle || '').trim())
        })
      return Response.json({ success: true, data })
    }

    if (scope === 'manage') {
      const authUser = await authenticateRequest(request)

      let where = {}
      if (authUser.role === 'ADMIN' || authUser.role === 'SUPER_ADMIN') {
        where = {}
      } else if (authUser.role === 'VENDOR') {
        where = {
          OR: [
            { product: { vendorId: authUser.uid } },
            { AND: [{ productId: null }, { vendorUid: authUser.uid }] },
          ],
        }
      } else {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }

      if (vertical) {
        where.vertical = vertical
      }

      const deals = await foodDeal.findMany({
        where,
        include: dealIncludeDetailed,
        orderBy: [{ sortOrder: 'asc' }, { dealId: 'desc' }],
      })
      const data = deals.map((d) => serializeDealForManage(d))
      return Response.json({ success: true, data })
    }


    return Response.json({ success: false, error: 'Invalid scope' }, { status: 400 })
  } catch (e) {
    if (isPrismaMissingTableError(e)) {
      const { searchParams } = new URL(request.url)
      const scope = searchParams.get('scope') || 'storefront'
      if (scope === 'storefront') {
        return Response.json({
          success: true,
          data: [],
          code: 'MISSING_DEALS_TABLE',
          hint: MISSING_DEALS_TABLE_HINT,
        })
      }
      return Response.json(
        { success: false, error: MISSING_DEALS_TABLE_HINT, code: 'MISSING_DEALS_TABLE' },
        { status: 503 },
      )
    }
    if (String(e.message).includes('token') || String(e.message).includes('No token')) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('GET /api/deals', e)
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const user = await authenticateRequest(request)
    const body = await request.json()
    const {
      dealKind,
      sortOrder = 0,
      active = true,
      badgeLabel = null,
      startAt = null,
      endAt = null,
      vendorUid: vendorUidRaw = null,
    } = body

    const foodDealDelegate = prismaFoodDeal(prisma)
    if (!foodDealDelegate || typeof foodDealDelegate.create !== 'function') {
      return Response.json(
        {
          success: false,
          error:
            'Food deals are not available yet. Run prisma migrate and prisma generate so the Prisma client matches the schema.',
        },
        { status: 503 },
      )
    }

    const isCustom = dealKind === 'custom' || body.isCustom === true

    if (!isCustom) {
      const { productId } = body
      const pid = parseInt(productId, 10)
      if (!Number.isFinite(pid)) {
        return Response.json({ success: false, error: 'productId is required for catalog deals' }, { status: 400 })
      }

      const product = await prisma.product.findUnique({ where: { proId: pid } })
      if (!product) {
        return Response.json({ success: false, error: 'Product not found' }, { status: 404 })
      }
      if (!canManageFoodDeal(user, product.vendorId)) {
        return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
      if (product.approvalStatus !== 'Approved' || !product.status) {
        return Response.json(
          { success: false, error: 'Only active, approved products can be added as deals' },
          { status: 400 },
        )
      }

      const img = body.customImageUrl != null ? String(body.customImageUrl).trim().slice(0, 500) || null : null

      const deal = await foodDealDelegate.create({
        data: {
          productId: pid,
          vendorUid: product.vendorId,
          customImageUrl: img,
          sortOrder: parseInt(sortOrder, 10) || 0,
          active: !!active,
          badgeLabel: badgeLabel ? String(badgeLabel).slice(0, 64) : null,
          startAt: startAt ? new Date(startAt) : null,
          endAt: endAt ? new Date(endAt) : null,
        },
        include: dealIncludeDetailed,
      })

      return Response.json({
        success: true,
        data: serializeDealForManage(deal),
      })
    }

    /** Custom bundle (typed lines, optional image / price hint). */
    const customTitle = String(body.customTitle ?? '').trim()
    if (!customTitle) {
      return Response.json({ success: false, error: 'customTitle is required for custom deals' }, { status: 400 })
    }
    const customItems = normalizeCustomDealItems(body.customItems ?? body.lines, { minLines: 1 })
    if (!customItems || !customItems.length) {
      return Response.json(
        { success: false, error: 'At least one food line item ({ name }) is required for custom deals' },
        { status: 400 },
      )
    }

    let vendorUid =
      vendorUidRaw && String(vendorUidRaw).trim() ? String(vendorUidRaw).trim().slice(0, 128) : null

    if (user.role === 'VENDOR') {
      vendorUid = user.uid
    } else if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      return Response.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (vendorUid && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
      const owner = await prisma.users.findUnique({
        where: { uid: vendorUid },
        select: { uid: true },
      })
      if (!owner) {
        return Response.json(
          { success: false, error: 'vendorUid must match an existing user account' },
          { status: 400 },
        )
      }
    }

    const customItemsJson = JSON.stringify(customItems)
    const img = body.customImageUrl != null ? String(body.customImageUrl).trim().slice(0, 500) || null : null
    const priceLbl =
      body.customPriceLabel != null ? String(body.customPriceLabel).trim().slice(0, 64) || null : null

    const deal = await foodDealDelegate.create({
      data: {
        // Omit productId (avoid `productId: null`) — Prisma can mis-classify the payload and
        // require `product: { connect }`. Omitting uses UncheckedCreateInput; DB stores NULL.
        vendorUid,
        customTitle: customTitle.slice(0, 255),
        customItemsJson,
        customImageUrl: img,
        customPriceLabel: priceLbl,
        sortOrder: parseInt(sortOrder, 10) || 0,
        active: !!active,
        badgeLabel: badgeLabel ? String(badgeLabel).slice(0, 64) : null,
        startAt: startAt ? new Date(startAt) : null,
        endAt: endAt ? new Date(endAt) : null,
      },
      include: dealIncludeDetailed,
    })

    return Response.json({
      success: true,
      data: serializeDealForManage(deal),
    })
  } catch (e) {
    if (isPrismaMissingTableError(e)) {
      return Response.json(
        { success: false, error: MISSING_DEALS_TABLE_HINT, code: 'MISSING_DEALS_TABLE' },
        { status: 503 },
      )
    }
    if (e.code === 'P2002') {
      return Response.json(
        { success: false, error: 'That product already has a deal. Edit or delete the existing deal first.' },
        { status: 409 },
      )
    }
    if (String(e.message).includes('token') || String(e.message).includes('No token')) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('POST /api/deals', e)
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}
