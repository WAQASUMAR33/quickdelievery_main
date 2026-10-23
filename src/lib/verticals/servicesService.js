import { prisma } from '../prisma.js'
import { calculateDistanceKm } from '../addonEngine.js'

/**
 * Home & Personal Services Specialized Service
 * Slot booking, service radius verification, upfront quotation, technician dispatch
 */

export const SERVICE_STATUS = {
  BOOKED: 'BOOKED',
  QUOTATION_ACCEPTED: 'QUOTATION_ACCEPTED',
  TECHNICIAN_DISPATCHED: 'TECHNICIAN_DISPATCHED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}

/**
 * Verify if customer delivery address is within merchant service radius
 */
export function verifyServiceRadius(vendorLat, vendorLon, customerLat, customerLon, maxRadiusKm = 15.0) {
  const dist = calculateDistanceKm(vendorLat, vendorLon, customerLat, customerLon)
  const isWithinRadius = dist <= maxRadiusKm
  return {
    isWithinRadius,
    distanceKm: Math.round(dist * 100) / 100,
    maxRadiusKm,
  }
}

/**
 * Book a Home & Personal Service slot
 */
export async function bookServiceSlot({
  userId,
  subOrderId,
  serviceName,
  vendorId,
  customerLat,
  customerLon,
  vendorLat,
  vendorLon,
  maxServiceRadiusKm = 15.0,
  slotDate,
  slotWindow,
  quotationAmount,
}) {
  if (!userId) throw new Error('Customer user ID is required')
  if (!serviceName) throw new Error('Service name is required')
  if (!vendorId) throw new Error('Service provider vendor ID is required')
  if (!slotDate) throw new Error('Service slot date is required')
  if (!slotWindow) throw new Error('Service slot window is required')

  // Verify distance radius if coordinates provided
  if (customerLat && customerLon && vendorLat && vendorLon) {
    const radiusCheck = verifyServiceRadius(vendorLat, vendorLon, customerLat, customerLon, maxServiceRadiusKm)
    if (!radiusCheck.isWithinRadius) {
      throw new Error(
        `Service address is out of range (${radiusCheck.distanceKm} km). Maximum service radius is ${maxServiceRadiusKm} km.`
      )
    }
  }

  const booking = await prisma.serviceBooking.create({
    data: {
      userId: parseInt(userId, 10),
      subOrderId: subOrderId ? parseInt(subOrderId, 10) : null,
      serviceName,
      vendorId,
      serviceLatitude: customerLat ? parseFloat(customerLat) : null,
      serviceLongitude: customerLon ? parseFloat(customerLon) : null,
      maxServiceRadiusKm: parseFloat(maxServiceRadiusKm),
      slotDate: new Date(slotDate),
      slotWindow,
      quotationAmount: quotationAmount ? parseFloat(quotationAmount) : null,
      quotationAccepted: false,
      status: SERVICE_STATUS.BOOKED,
    },
  })

  return booking
}

/**
 * Upfront quotation acceptance
 */
export async function acceptServiceQuotation({ bookingId, userId }) {
  const bId = parseInt(bookingId, 10)
  const existing = await prisma.serviceBooking.findUnique({
    where: { id: bId },
  })

  if (!existing) throw new Error('Service booking not found')
  if (existing.userId !== parseInt(userId, 10)) {
    throw new Error('Unauthorized: only the booking owner can accept quotations')
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bId },
    data: {
      quotationAccepted: true,
      status: SERVICE_STATUS.QUOTATION_ACCEPTED,
    },
  })

  return updated
}

/**
 * Dispatch technician to customer premise
 */
export async function dispatchTechnician({ bookingId, technicianName, technicianPhone }) {
  const bId = parseInt(bookingId, 10)
  const existing = await prisma.serviceBooking.findUnique({
    where: { id: bId },
  })

  if (!existing) throw new Error('Service booking not found')
  if (!technicianName || !technicianPhone) {
    throw new Error('Technician name and contact phone number are required for dispatch')
  }

  const updated = await prisma.serviceBooking.update({
    where: { id: bId },
    data: {
      technicianName,
      technicianPhone,
      status: SERVICE_STATUS.TECHNICIAN_DISPATCHED,
    },
  })

  return updated
}
