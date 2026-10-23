/**
 * Unified Split-Fulfillment Engine
 * Decomposes multi-vendor, multi-vertical carts into Track A, B, and C fulfillment streams.
 */

export const FULFILLMENT_TRACKS = {
  TRACK_A: {
    code: 'TRACK_A_HYPERLOCAL_EXPRESS',
    title: 'Hyperlocal Express',
    badge: '30–45 MINS',
    icon: '⚡',
    description: 'Hot kitchen food & urgent pharmacy medicine delivered by express point-to-point courier.',
    slaMinutes: 45,
    slaCompensateThresholdMinutes: 60, // >15 mins past 45m SLA = 60 mins
    baseDeliveryFee: 2.50,
    verticals: ['FOOD', 'RESTAURANT', 'PHARMACY', 'MEDICINE', 'HEALTHCARE'],
  },
  TRACK_B: {
    code: 'TRACK_B_SCHEDULED_SLOT',
    title: 'Scheduled Slot Window',
    badge: 'SAME-DAY / WINDOW',
    icon: '📦',
    description: 'Temperature-controlled groceries, fresh produce, and laundry/home service slots.',
    slaMinutes: 180,
    baseDeliveryFee: 3.99,
    verticals: ['GROCERY', 'GROCERIES', 'FRESH', 'PRODUCE', 'SERVICES', 'LAUNDRY', 'CLEANING'],
    availableSlots: [
      { id: 'slot_morning', label: 'Morning (10:00 AM – 12:00 PM)', startHour: 10, endHour: 12 },
      { id: 'slot_afternoon', label: 'Afternoon (02:00 PM – 04:00 PM)', startHour: 14, endHour: 16 },
      { id: 'slot_evening', label: 'Evening (06:00 PM – 08:00 PM)', startHour: 18, endHour: 20 },
    ],
  },
  TRACK_C: {
    code: 'TRACK_C_STANDARD_COURIER',
    title: 'Standard Courier Shipping',
    badge: '2–4 DAYS',
    icon: '🚚',
    description: 'Fashion apparel, electronics, tech hardware, and home appliances.',
    slaDays: 3,
    baseDeliveryFee: 4.99,
    verticals: ['FASHION', 'APPAREL', 'CLOTHING', 'ELECTRONICS', 'TECH', 'HARDWARE', 'HOME_APPLIANCES'],
  },
}

/**
 * Classify a product into its fulfillment track based on vertical or category name
 */
export function classifyProductTrack(vertical = 'FOOD', categoryName = '') {
  const normVertical = (vertical || '').toUpperCase().trim()
  const normCat = (categoryName || '').toUpperCase().trim()

  // Track A check
  for (const v of FULFILLMENT_TRACKS.TRACK_A.verticals) {
    if (normVertical.includes(v) || normCat.includes(v)) {
      return FULFILLMENT_TRACKS.TRACK_A.code
    }
  }

  // Track B check
  for (const v of FULFILLMENT_TRACKS.TRACK_B.verticals) {
    if (normVertical.includes(v) || normCat.includes(v)) {
      return FULFILLMENT_TRACKS.TRACK_B.code
    }
  }

  // Default to Track C (standard courier for retail/fashion/tech/etc.)
  return FULFILLMENT_TRACKS.TRACK_C.code
}

/**
 * Decompose a multi-vendor cart into Master & Sub-Order fulfillment tracks
 */
export function decomposeCartItems(items = [], options = {}) {
  const { customerLocation = null, enableRoundUpDonation = true } = options

  // Group items by Track and Merchant
  const trackGroups = {
    [FULFILLMENT_TRACKS.TRACK_A.code]: {
      track: FULFILLMENT_TRACKS.TRACK_A,
      merchants: {},
      subtotal: 0,
      itemCount: 0,
    },
    [FULFILLMENT_TRACKS.TRACK_B.code]: {
      track: FULFILLMENT_TRACKS.TRACK_B,
      merchants: {},
      subtotal: 0,
      itemCount: 0,
    },
    [FULFILLMENT_TRACKS.TRACK_C.code]: {
      track: FULFILLMENT_TRACKS.TRACK_C,
      merchants: {},
      subtotal: 0,
      itemCount: 0,
    },
  }

  let cartSubtotal = 0
  let totalItemsCount = 0

  for (const item of items) {
    const qty = parseInt(item.quantity || 1, 10)
    const price = parseFloat(item.price || item.salePrice || 0)
    const lineTotal = price * qty
    const trackCode = item.fulfillmentTrack || classifyProductTrack(item.vertical, item.category?.name || item.catName)
    const merchantId = item.vendorId || item.vendorUid || item.vendor?.uid || 'default_merchant'
    const merchantName = item.vendor?.username || item.vendorName || item.brandName || 'Verified Partner'

    cartSubtotal += lineTotal
    totalItemsCount += qty

    const group = trackGroups[trackCode] || trackGroups[FULFILLMENT_TRACKS.TRACK_C.code]
    group.subtotal += lineTotal
    group.itemCount += qty

    if (!group.merchants[merchantId]) {
      group.merchants[merchantId] = {
        vendorId: merchantId,
        vendorName: merchantName,
        items: [],
        subtotal: 0,
        deliveryFee: group.track.baseDeliveryFee,
      }
    }

    group.merchants[merchantId].items.push({
      ...item,
      quantity: qty,
      unitPrice: price,
      lineTotal,
      fulfillmentTrack: trackCode,
    })
    group.merchants[merchantId].subtotal += lineTotal
  }

  // Calculate active sub-orders
  const subOrders = []
  let totalDeliveryFee = 0

  for (const [trackCode, group] of Object.entries(trackGroups)) {
    if (group.itemCount > 0) {
      for (const [vendorId, merchantData] of Object.entries(group.merchants)) {
        totalDeliveryFee += merchantData.deliveryFee

        // Calculate SLA / Delivery Window
        const now = new Date()
        let slaDeadline = null
        let scheduledSlot = null

        if (trackCode === FULFILLMENT_TRACKS.TRACK_A.code) {
          slaDeadline = new Date(now.getTime() + FULFILLMENT_TRACKS.TRACK_A.slaMinutes * 60 * 1000)
        } else if (trackCode === FULFILLMENT_TRACKS.TRACK_B.code) {
          scheduledSlot = FULFILLMENT_TRACKS.TRACK_B.availableSlots[0]
        }

        subOrders.push({
          vendorId,
          vendorName: merchantData.vendorName,
          fulfillmentTrack: trackCode,
          trackTitle: group.track.title,
          trackBadge: group.track.badge,
          trackIcon: group.track.icon,
          subtotal: Math.round(merchantData.subtotal * 100) / 100,
          deliveryFee: merchantData.deliveryFee,
          total: Math.round((merchantData.subtotal + merchantData.deliveryFee) * 100) / 100,
          slaDeadline,
          scheduledSlot,
          items: merchantData.items,
        })
      }
    }
  }

  // Calculate Service Charge (2.5%)
  const serviceCharge = Math.round(cartSubtotal * 0.025 * 100) / 100

  // Calculate Round-up Donation to nearest dollar
  const rawTotal = cartSubtotal + totalDeliveryFee + serviceCharge
  const ceilingTotal = Math.ceil(rawTotal)
  const roundUpDonation = enableRoundUpDonation && ceilingTotal > rawTotal
    ? Math.round((ceilingTotal - rawTotal) * 100) / 100
    : 0

  const finalMasterTotal = Math.round((rawTotal + roundUpDonation) * 100) / 100

  return {
    cartSubtotal: Math.round(cartSubtotal * 100) / 100,
    totalItemsCount,
    totalDeliveryFee: Math.round(totalDeliveryFee * 100) / 100,
    serviceCharge,
    roundUpDonation,
    finalMasterTotal,
    subOrders,
    hasTrackA: trackGroups[FULFILLMENT_TRACKS.TRACK_A.code].itemCount > 0,
    hasTrackB: trackGroups[FULFILLMENT_TRACKS.TRACK_B.code].itemCount > 0,
    hasTrackC: trackGroups[FULFILLMENT_TRACKS.TRACK_C.code].itemCount > 0,
  }
}
