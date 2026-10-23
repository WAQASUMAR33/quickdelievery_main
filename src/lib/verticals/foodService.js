import { prisma } from '../prisma.js'

/**
 * Food & Dining Specialized Service
 * Handles modifiers, ingredient add-ons, kitchen prep tracking, and table reservations.
 */

export const BOOKING_STATUS = {
  REQUESTED: 'REQUESTED',
  CONFIRMED: 'CONFIRMED',
  SEATED: 'SEATED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

/**
 * Calculate customized food item pricing based on selected modifier groups
 */
export function calculateFoodItemPrice(basePrice, selectedModifiers = []) {
  let totalModifierExtra = 0
  for (const mod of selectedModifiers) {
    if (mod && mod.additionalPrice) {
      totalModifierExtra += parseFloat(mod.additionalPrice) || 0
    }
  }
  const itemTotal = parseFloat(basePrice) + totalModifierExtra
  return {
    basePrice: parseFloat(basePrice),
    modifierTotal: totalModifierExtra,
    finalItemPrice: Math.round(itemTotal * 100) / 100,
  }
}

/**
 * Filter restaurant items by dietary badges and allergen warnings
 */
export function filterFoodByDietaryPreferences(products, preferences = {}) {
  const { halalOnly, veganOnly, glutenFree, excludeAllergens = [] } = preferences

  return products.filter((product) => {
    const badges = (product.dietaryBadges || '').toUpperCase().split(',').map((b) => b.trim())
    const allergens = (product.allergens || '').toLowerCase().split(',').map((a) => a.trim())

    if (halalOnly && !badges.includes('HALAL')) return false
    if (veganOnly && !badges.includes('VEGAN')) return false
    if (glutenFree && !badges.includes('GLUTEN_FREE')) return false

    // Check allergen conflict
    for (const allergen of excludeAllergens) {
      if (allergens.includes(allergen.toLowerCase().trim())) {
        return false
      }
    }

    return true
  })
}

/**
 * Create a dine-in table booking with optional pre-ordered dishes
 */
export async function createTableBooking({
  userId,
  vendorId,
  bookingDate,
  guestCount,
  specialRequests,
  dineInPreOrders = [],
}) {
  if (!userId) throw new Error('Customer user ID is required')
  if (!vendorId) throw new Error('Restaurant vendor ID is required')
  if (!bookingDate) throw new Error('Booking date & time is required')
  if (!guestCount || guestCount < 1) throw new Error('Valid guest count (minimum 1) is required')

  const booking = await prisma.tableBooking.create({
    data: {
      userId: parseInt(userId, 10),
      vendorId,
      bookingDate: new Date(bookingDate),
      guestCount: parseInt(guestCount, 10),
      specialRequests: specialRequests || null,
      dineInPreOrderJson: dineInPreOrders.length > 0 ? JSON.stringify(dineInPreOrders) : null,
      status: BOOKING_STATUS.REQUESTED,
    },
  })

  return booking
}

/**
 * Update table reservation state machine
 */
export async function updateTableBookingStatus({ bookingId, status, tableNumber }) {
  const bId = parseInt(bookingId, 10)
  const existing = await prisma.tableBooking.findUnique({
    where: { id: bId },
  })

  if (!existing) throw new Error('Table reservation not found')

  if (!Object.values(BOOKING_STATUS).includes(status)) {
    throw new Error(`Invalid table booking status: ${status}`)
  }

  const updated = await prisma.tableBooking.update({
    where: { id: bId },
    data: {
      status,
      tableNumber: tableNumber !== undefined ? tableNumber : existing.tableNumber,
    },
  })

  return updated
}

/**
 * Kitchen preparation time tracking
 */
export async function updateKitchenPrepStatus({ subOrderId, prepTimeMinutes, kitchenStatus }) {
  const sId = parseInt(subOrderId, 10)
  const readyEstimate = new Date(Date.now() + (prepTimeMinutes || 20) * 60 * 1000)

  const updatedSubOrder = await prisma.subOrder.update({
    where: { id: sId },
    data: {
      status: kitchenStatus || 'PREPARING',
      slaDeadline: readyEstimate,
    },
  })

  return updatedSubOrder
}
