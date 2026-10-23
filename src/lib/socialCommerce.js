import { prisma } from './prisma.js'

/**
 * Social Commerce & Neighborhood Group Buying Engine
 * - GeoHash 7/8 spatial pooling
 * - Real-time "Make an Offer" bargaining state machine
 * - Shoppable video feed mapping
 */

const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz'

/**
 * Standard GeoHash encode algorithm (zero external dependencies)
 * Precision 7: ~153m x 153m (neighborhood apartment cluster/subdivision)
 */
export function encodeGeoHash(latitude, longitude, precision = 7) {
  let lat = parseFloat(latitude)
  let lon = parseFloat(longitude)
  let latMin = -90.0, latMax = 90.0
  let lonMin = -180.0, lonMax = 180.0
  let hash = ''
  let isEven = true
  let bit = 0
  let ch = 0

  while (hash.length < precision) {
    if (isEven) {
      const mid = (lonMin + lonMax) / 2
      if (lon >= mid) {
        ch |= 1 << (4 - bit)
        lonMin = mid
      } else {
        lonMax = mid
      }
    } else {
      const mid = (latMin + latMax) / 2
      if (lat >= mid) {
        ch |= 1 << (4 - bit)
        latMin = mid
      } else {
        latMax = mid
      }
    }

    isEven = !isEven
    if (bit < 4) {
      bit++
    } else {
      hash += BASE32[ch]
      bit = 0
      ch = 0
    }
  }

  return hash
}

/**
 * Find or register order in a 30-minute Neighborhood Pool
 * When 3+ orders are placed in the same GeoHash zone, bulk discount & $0 delivery are unlocked!
 */
export async function registerInNeighborhoodPool(lat, lon, precision = 7) {
  const geoHash = encodeGeoHash(lat, lon, precision)
  const now = new Date()

  // Find active pool in this geohash
  let pool = await prisma.neighborhoodPool.findFirst({
    where: {
      geoHash,
      status: 'ACTIVE',
      windowExpiresAt: { gt: now },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!pool) {
    // Initialize new 30-minute pool window
    const windowExpiresAt = new Date(now.getTime() + 30 * 60 * 1000)
    pool = await prisma.neighborhoodPool.create({
      data: {
        geoHash,
        windowExpiresAt,
        activeOrderCount: 1,
        discountApplied: false,
        status: 'ACTIVE',
      },
    })
  } else {
    // Increment active orders
    const newCount = pool.activeOrderCount + 1
    const unlockBulkDiscount = newCount >= 3

    pool = await prisma.neighborhoodPool.update({
      where: { id: pool.id },
      data: {
        activeOrderCount: newCount,
        discountApplied: unlockBulkDiscount,
      },
    })
  }

  return {
    pool,
    geoHash,
    activeNeighborsCount: pool.activeOrderCount,
    isGroupDiscountUnlocked: pool.discountApplied,
    minutesRemaining: Math.max(0, Math.round((pool.windowExpiresAt - now) / (60 * 1000))),
  }
}

/**
 * "Make an Offer" (Bargaining Mode) State Machine
 * PENDING -> ACCEPTED | COUNTERED | REJECTED | EXPIRED
 */
export async function createPriceOffer({
  userId,
  productId,
  vendorId,
  originalPrice,
  offeredPrice,
}) {
  const uId = parseInt(userId, 10)
  const pId = parseInt(productId, 10)
  const orig = parseFloat(originalPrice)
  const offer = parseFloat(offeredPrice)

  if (offer <= 0 || offer >= orig) {
    throw new Error('Offered price must be lower than original price and greater than 0')
  }

  // Minimum offer limit: at least 50% of original price
  if (offer < orig * 0.5) {
    throw new Error('Offer too low: minimum bargaining floor is 50% of catalog price')
  }

  // 2-hour decision timeout window
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000)

  const priceOffer = await prisma.priceOffer.create({
    data: {
      userId: uId,
      productId: pId,
      vendorId,
      originalPrice: orig,
      offeredPrice: offer,
      status: 'PENDING',
      expiresAt,
    },
  })

  return priceOffer
}

/**
 * Vendor response to price offer
 */
export async function respondToPriceOffer({ offerId, response, counterPrice }) {
  const oId = parseInt(offerId, 10)
  const existing = await prisma.priceOffer.findUnique({
    where: { id: oId },
  })

  if (!existing) throw new Error('Price offer not found')
  if (existing.status !== 'PENDING') {
    throw new Error(`Offer is already in '${existing.status}' status`)
  }

  if (new Date() > existing.expiresAt) {
    await prisma.priceOffer.update({
      where: { id: oId },
      data: { status: 'EXPIRED' },
    })
    throw new Error('This offer has expired')
  }

  let finalStatus = 'REJECTED'
  let finalCounter = null

  if (response === 'ACCEPT') {
    finalStatus = 'ACCEPTED'
  } else if (response === 'COUNTER') {
    finalStatus = 'COUNTERED'
    finalCounter = parseFloat(counterPrice)
    if (!finalCounter || finalCounter <= existing.offeredPrice) {
      throw new Error('Counter offer must be higher than customer offered price')
    }
  } else if (response === 'REJECT') {
    finalStatus = 'REJECTED'
  } else {
    throw new Error(`Invalid response: ${response}`)
  }

  const updated = await prisma.priceOffer.update({
    where: { id: oId },
    data: {
      status: finalStatus,
      counterPrice: finalCounter,
    },
  })

  return updated
}

/**
 * Shoppable Video Feed
 */
export async function getShoppableVideos() {
  const videos = await prisma.shoppableVideo.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return videos
}

export async function createShoppableVideo({
  title,
  videoUrl,
  thumbnailUrl,
  vendorId,
  taggedProductIds = [],
}) {
  const video = await prisma.shoppableVideo.create({
    data: {
      title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || null,
      vendorId,
      taggedProductIds: JSON.stringify(taggedProductIds),
    },
  })

  return video
}
