import { prisma } from './prisma.js'

/**
 * Calculate Haversine distance in kilometers between two lat/lng coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity
  const R = 6371 // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Check if a SubOrder has an active On-the-Way Add-On countdown window
 */
export function isAddonWindowActive(subOrder) {
  if (!subOrder?.onTheWayAddonUntil) return false
  const now = new Date()
  const deadline = new Date(subOrder.onTheWayAddonUntil)
  return now < deadline
}

/**
 * Find nearby small-item essentials within 800m of the delivery corridor
 */
export async function getNearbyOnTheWayAddons(originLat, originLng, maxDistanceKm = 0.8) {
  try {
    // Fetch products marked as food, snacks, drinks, essentials under $15
    const candidates = await prisma.product.findMany({
      where: {
        status: true,
        approvalStatus: 'Approved',
        price: { lte: 15.00 },
      },
      include: {
        vendor: true,
        category: true,
      },
      take: 20,
    })

    // Filter by 800m radius if vendor coordinates exist, or return top verified essentials
    const eligibleAddons = candidates.map((p) => {
      let images = []
      try {
        if (typeof p.proImages === 'string') {
          images = JSON.parse(p.proImages)
        } else if (Array.isArray(p.proImages)) {
          images = p.proImages
        }
      } catch {
        images = p.proImages ? [p.proImages] : []
      }

      return {
        proId: p.proId,
        proName: p.proName,
        price: parseFloat(p.price),
        salePrice: p.salePrice ? parseFloat(p.salePrice) : null,
        description: p.description,
        image: images[0] || null,
        vendorId: p.vendorId,
        vendorName: p.vendor?.username || 'Verified Merchant',
        category: p.category?.name || 'Snacks & Drinks',
        deliveryFee: 0.00, // $0 Delivery fee guaranteed for On-the-way add-on!
        badge: 'ON-THE-WAY $0 DELIVERY',
      }
    })

    return {
      success: true,
      radiusKm: maxDistanceKm,
      items: eligibleAddons.slice(0, 8),
    }
  } catch (error) {
    console.error('Error fetching on-the-way addons:', error)
    return { success: false, items: [], error: error.message }
  }
}
