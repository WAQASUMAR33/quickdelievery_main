import { NextResponse } from 'next/server'
import { getAuthUser, ADMIN_ROLES } from '@/lib/auth-server'
import { DEFAULT_RAPIDRIDE_SETTINGS } from '@/lib/rapidRideFormula'
import {
  getRapidRideSettings,
  saveRapidRideSettings,
} from '@/lib/rapidRideSettings'

/**
 * GET /api/admin/driver-settings
 * Public/shared read endpoint used by Admin Dashboard, Customer RapidRide Booking, and Driver Bid Portal.
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const bypassCache = searchParams.get('fresh') === 'true' || searchParams.get('admin') === 'true'
    const settings = await getRapidRideSettings({ bypassCache })

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error('Failed to load RapidRide driver settings:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to load driver settings' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/admin/driver-settings
 * Updates RapidRide Fare Calculation, Basic Platform Fee, and Baggage Fare Calculation formulas.
 */
export async function PUT(request) {
  try {
    const authUser = await getAuthUser(request)
    if (authUser && !ADMIN_ROLES.includes(authUser.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const payload = body?.resetToDefaults ? DEFAULT_RAPIDRIDE_SETTINGS : body
    const updatedBy = authUser?.username || authUser?.email || body?.updatedBy || 'Admin'

    const saved = await saveRapidRideSettings(payload, updatedBy)

    return NextResponse.json({
      success: true,
      data: saved,
      message: body?.resetToDefaults
        ? 'RapidRide driver & fare settings reset to factory defaults'
        : 'RapidRide fare & baggage calculation settings saved successfully',
    })
  } catch (error) {
    console.error('Failed to save RapidRide driver settings:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save driver settings' },
      { status: 500 }
    )
  }
}

