import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getDayEndOverview, openDayEndRegister, closeDayEndRegister } from '@/lib/restaurant/service'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const data = getDayEndOverview(vendorId)
    return Response.json({ success: true, ...data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const body = await request.json()

    if (body.action === 'open') {
      const data = openDayEndRegister(vendorId, body.opening_float)
      return Response.json({ success: true, ...data })
    }

    if (body.action === 'close') {
      const data = closeDayEndRegister(vendorId, body)
      return Response.json({ success: true, ...data })
    }

    return Response.json({ success: false, error: 'Invalid day-end action' }, { status: 400 })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
