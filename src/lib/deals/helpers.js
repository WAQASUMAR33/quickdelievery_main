/** Prisma delegate is missing until `prisma generate` is run after adding FoodDeal to the schema. */
export function prismaFoodDeal(prismaClient) {
  const fd = prismaClient?.foodDeal
  return fd && typeof fd.findMany === 'function' ? fd : null
}

/** Schema exists in prisma/schema but migrate was not applied (table missing in DB). */
export function isPrismaMissingTableError(e) {
  return e?.code === 'P2021'
}

export const MISSING_DEALS_TABLE_HINT =
  'The food_deals table is missing. Stop the dev server, then run: npx prisma migrate deploy'

/** Returns true when the user may create/update/delete deals for products owned by `productVendorUid`. */
export function canManageFoodDeal(user, productVendorUid) {
  if (!user) return false
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true
  if (user.role === 'VENDOR' && user.uid === productVendorUid) return true
  return false
}

/** Permissions for catalog deals (linked product) and custom deals (vendorUid / admins). */
export function canManageDealRecord(user, deal) {
  if (!user || !deal) return false
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true
  if (user.role !== 'VENDOR') return false
  if (deal.productId != null && deal.product?.vendorId) {
    return String(user.uid) === String(deal.product.vendorId)
  }
  if (deal.productId != null) return false
  if (!deal.vendorUid) return false
  return String(user.uid) === String(deal.vendorUid)
}

export function parseProductForClient(product) {
  if (!product) return product
  try {
    return {
      ...product,
      proImages: product.proImages ? JSON.parse(product.proImages) : null,
      keyFeatures: product.keyFeatures ? JSON.parse(product.keyFeatures) : null,
      variations: product.variations ? JSON.parse(product.variations) : null,
      reviews: product.reviews ? JSON.parse(product.reviews) : null,
    }
  } catch {
    return { ...product, proImages: null, keyFeatures: null, variations: null, reviews: null }
  }
}

export function parseCustomItemsJson(customItemsJson) {
  if (!customItemsJson) return []
  try {
    const arr = typeof customItemsJson === 'string' ? JSON.parse(customItemsJson) : customItemsJson
    if (!Array.isArray(arr)) return []
    return arr
      .map((x) => {
        if (typeof x === 'string') return { name: x.trim() }
        const name = String(x?.name || x?.proName || '').trim()
        return {
          proId: x?.proId != null ? Number(x.proId) : null,
          name,
          price: x?.price != null ? Number(x.price) : null,
          quantity: x?.quantity != null ? Number(x.quantity) : 1,
          image: x?.image || null,
          sku: x?.sku || null,
        }
      })
      .filter((x) => x.name && x.name.length > 0)
  } catch {
    return []
  }
}

function coerceCustomItemsPayload(bodyItems) {
  if (!bodyItems && bodyItems !== 0) return []
  try {
    const arr = typeof bodyItems === 'string' ? JSON.parse(bodyItems) : bodyItems
    if (!Array.isArray(arr)) return []
    return arr
      .map((x) => {
        if (typeof x === 'string') return { name: x.trim() }
        const name = String(x?.name || x?.proName || '').trim()
        return {
          proId: x?.proId != null ? Number(x.proId) : null,
          name,
          price: x?.price != null ? Number(x.price) : null,
          quantity: x?.quantity != null ? Number(x.quantity) : 1,
          image: x?.image || null,
          sku: x?.sku || null,
        }
      })
      .filter((x) => x.name && x.name.length > 0)
  } catch {
    return []
  }
}

/** Validate and normalize `{ name, proId, price, quantity }[]`; returns null if invalid. */
export function normalizeCustomDealItems(bodyItems, { minLines = 1 } = {}) {
  const lines = coerceCustomItemsPayload(bodyItems)
  if (lines.length < minLines) return null
  return lines
}

export function serializeDealForManage(dealRow) {
  const customItems = parseCustomItemsJson(dealRow.customItemsJson)
  const isCustom = dealRow.productId == null
  return {
    dealId: dealRow.dealId,
    productId: dealRow.productId,
    vendorUid: dealRow.vendorUid || null,
    sortOrder: dealRow.sortOrder,
    active: dealRow.active,
    badgeLabel: dealRow.badgeLabel,
    startAt: dealRow.startAt,
    endAt: dealRow.endAt,
    createdAt: dealRow.createdAt,
    updatedAt: dealRow.updatedAt,
    product: dealRow.product ? parseProductForClient(dealRow.product) : null,
    isCustom,
    customTitle: dealRow.customTitle || null,
    customItems,
    customImageUrl: dealRow.customImageUrl || null,
    customPriceLabel: dealRow.customPriceLabel || null,
    ownerUsername: dealRow.ownerUser?.username || null,
  }
}

export function serializeDealForStorefront(dealRow) {
  const customItems = parseCustomItemsJson(dealRow.customItemsJson)
  const isCustom = dealRow.productId == null
  return {
    dealId: dealRow.dealId,
    sortOrder: dealRow.sortOrder,
    badgeLabel: dealRow.badgeLabel,
    startAt: dealRow.startAt,
    endAt: dealRow.endAt,
    product: dealRow.product ? parseProductForClient(dealRow.product) : null,
    isCustom,
    customTitle: dealRow.customTitle || null,
    customItems,
    customImageUrl: dealRow.customImageUrl || null,
    customPriceLabel: dealRow.customPriceLabel || null,
    vendorUid: dealRow.vendorUid || null,
    ownerUsername: dealRow.ownerUser?.username || null,
  }
}
