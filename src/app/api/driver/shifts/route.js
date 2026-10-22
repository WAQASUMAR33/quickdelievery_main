import { prisma } from '@/lib/prisma'

const AVAILABLE_ZONES = [
  { id: 'gulberg', name: 'Gulberg Commercial & Residential', city: 'Lahore', activeDemand: 'HIGH' },
  { id: 'dha', name: 'DHA Phases 1-6', city: 'Lahore', activeDemand: 'VERY_HIGH' },
  { id: 'johar_town', name: 'Johar Town & Emporium Corridor', city: 'Lahore', activeDemand: 'HIGH' },
  { id: 'model_town', name: 'Model Town & Garden Town', city: 'Lahore', activeDemand: 'MEDIUM' },
  { id: 'bahria', name: 'Bahria Town & Canal Road', city: 'Lahore', activeDemand: 'MEDIUM' },
]

const STANDARD_SHIFTS = [
  { id: 'morning', title: 'Morning Breakfast Shift', timeRange: '08:00 AM – 02:00 PM', bonusMultiplier: '1.0x' },
  { id: 'afternoon', title: 'Afternoon Lunch Shift', timeRange: '12:00 PM – 05:00 PM', bonusMultiplier: '1.1x' },
  { id: 'dinner_peak', title: 'Dinner Peak Rush Shift', timeRange: '06:00 PM – 11:30 PM', bonusMultiplier: '1.3x' },
  { id: 'night_owl', title: 'Late Night Delivery Shift', timeRange: '11:00 PM – 04:00 AM', bonusMultiplier: '1.4x' },
]

/**
 * GET /api/driver/shifts
 * Returns available zones and shift roster.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const driverId = searchParams.get('driverId')

    let currentBooking = null
    if (driverId) {
      const profile = await prisma.driverProfile.findUnique({
        where: { userId: parseInt(driverId, 10) },
        select: { preferredZone: true, shiftSchedule: true, dutyStatus: true },
      })
      if (profile) {
        currentBooking = {
          zone: profile.preferredZone,
          shift: profile.shiftSchedule,
          dutyStatus: profile.dutyStatus,
        }
      }
    }

    return Response.json({
      success: true,
      data: {
        zones: AVAILABLE_ZONES,
        shifts: STANDARD_SHIFTS,
        currentBooking,
      },
    })
  } catch (error) {
    console.error('Error fetching shifts:', error)
    return Response.json(
      { success: false, error: 'Failed to fetch shifts roster' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/driver/shifts
 * Rider books or updates their active zone and shift roster.
 * Body: { driverId: number, zone: string, shift: string }
 */
export async function POST(request) {
  try {
    const { driverId, zone, shift } = await request.json()

    if (!driverId) {
      return Response.json(
        { success: false, error: 'driverId is required' },
        { status: 400 }
      )
    }

    const updatedProfile = await prisma.driverProfile.update({
      where: { userId: parseInt(driverId, 10) },
      data: {
        preferredZone: zone || 'Gulberg',
        shiftSchedule: shift || 'dinner_peak',
      },
    })

    return Response.json({
      success: true,
      message: `Shift booked successfully for ${zone} (${shift})`,
      data: {
        zone: updatedProfile.preferredZone,
        shift: updatedProfile.shiftSchedule,
      },
    })
  } catch (error) {
    console.error('Error booking shift:', error)
    return Response.json(
      { success: false, error: error.message || 'Failed to book shift' },
      { status: 500 }
    )
  }
}
