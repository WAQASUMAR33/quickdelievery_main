import { prisma } from '@/lib/prisma'
import { authenticateRequest } from '@/lib/auth-server'
import {
  prismaFoodDeal,
  isPrismaMissingTableError,
  MISSING_DEALS_TABLE_HINT,
  normalizeCustomDealItems,
  canManageDealRecord,
  serializeDealForManage,
} from '@/lib/deals/helpers'

const dealIncludeDetailed = {
  product: {
    include: { category: true, subCategory: true, vendor: true },
  },
  ownerUser: { select: { uid: true, username: true } },
}

async function dealWithAuth(dealId, user) {
  const fd = prismaFoodDeal(prisma)
  if (!fd) {
    return {
      error:
        'Food deals are not available yet. Run prisma migrate and prisma generate so the Prisma client matches the schema.',
      status: 503,
    }
  }
  let deal
  try {
    deal = await fd.findUnique({
      where: { dealId: parseInt(dealId, 10) },
      include: dealIncludeDetailed,
    })
  } catch (e) {
    if (isPrismaMissingTableError(e)) {
      return { error: MISSING_DEALS_TABLE_HINT, status: 503, code: 'MISSING_DEALS_TABLE' }
    }
    throw e
  }
  if (!deal) return { error: 'Not found', status: 404 }
  if (!canManageDealRecord(user, deal)) return { error: 'Forbidden', status: 403 }
  return { deal }
}

export async function PUT(request, context) {
  try {
    const user = await authenticateRequest(request)
    const { id } = await context.params
    const { deal, error, status, code } = await dealWithAuth(id, user)
    if (error) return Response.json({ success: false, error, ...(code ? { code } : {}) }, { status })

    const body = await request.json()
    const { sortOrder, active, badgeLabel, startAt, endAt } = body

    const data = {}
    if (sortOrder !== undefined) data.sortOrder = parseInt(sortOrder, 10) || 0
    if (active !== undefined) data.active = !!active
    if (badgeLabel !== undefined) data.badgeLabel = badgeLabel ? String(badgeLabel).slice(0, 64) : null
    if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null
    if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null

    if (body.customImageUrl !== undefined) {
      const u = body.customImageUrl != null ? String(body.customImageUrl).trim().slice(0, 500) || null : null
      data.customImageUrl = u
    }

    if (body.customTitle !== undefined) {
      const t = String(body.customTitle ?? '').trim()
      data.customTitle = t ? t.slice(0, 255) : null
    }
    if (body.customItems !== undefined || body.lines !== undefined) {
      const items = normalizeCustomDealItems(body.customItems ?? body.lines, { minLines: 0 })
      data.customItemsJson = items && items.length > 0 ? JSON.stringify(items) : null
    }
    if (body.customPriceLabel !== undefined) {
      const u = body.customPriceLabel != null ? String(body.customPriceLabel).trim().slice(0, 64) || null : null
      data.customPriceLabel = u
    }
    if (body.productId !== undefined) {
      const pid = parseInt(body.productId, 10)
      data.productId = Number.isFinite(pid) ? pid : null
    }

    if (
      body.vendorUid !== undefined &&
      (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')
    ) {
      const v =
        body.vendorUid && String(body.vendorUid).trim()
          ? String(body.vendorUid).trim().slice(0, 128)
          : null
      if (v) {
        const owner = await prisma.users.findUnique({ where: { uid: v }, select: { uid: true } })
        if (!owner) {
          return Response.json({ success: false, error: 'vendorUid does not match a user' }, { status: 400 })
        }
      }
      data.vendorUid = v
    }

    const fd = prismaFoodDeal(prisma)
    if (!fd) {
      return Response.json(
        {
          success: false,
          error:
            'Food deals are not available yet. Run prisma migrate and prisma generate so the Prisma client matches the schema.',
        },
        { status: 503 },
      )
    }

    const updated = await fd.update({
      where: { dealId: deal.dealId },
      data,
      include: dealIncludeDetailed,
    })

    return Response.json({
      success: true,
      data: serializeDealForManage(updated),
    })
  } catch (e) {
    if (isPrismaMissingTableError(e)) {
      return Response.json(
        { success: false, error: MISSING_DEALS_TABLE_HINT, code: 'MISSING_DEALS_TABLE' },
        { status: 503 },
      )
    }
    if (String(e.message).includes('token') || String(e.message).includes('No token')) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('PUT /api/deals/[id]', e)
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(request, context) {
  try {
    const user = await authenticateRequest(request)
    const { id } = await context.params

    const { deal, error, status, code } = await dealWithAuth(id, user)
    if (error) return Response.json({ success: false, error, ...(code ? { code } : {}) }, { status })

    const fd = prismaFoodDeal(prisma)
    if (!fd) {
      return Response.json(
        {
          success: false,
          error:
            'Food deals are not available yet. Run prisma migrate and prisma generate so the Prisma client matches the schema.',
        },
        { status: 503 },
      )
    }

    await fd.delete({ where: { dealId: deal.dealId } })

    return Response.json({ success: true, message: 'Deal removed' })
  } catch (e) {
    if (isPrismaMissingTableError(e)) {
      return Response.json(
        { success: false, error: MISSING_DEALS_TABLE_HINT, code: 'MISSING_DEALS_TABLE' },
        { status: 503 },
      )
    }
    if (String(e.message).includes('token') || String(e.message).includes('No token')) {
      return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    console.error('DELETE /api/deals/[id]', e)
    return Response.json({ success: false, error: e.message }, { status: 500 })
  }
}
