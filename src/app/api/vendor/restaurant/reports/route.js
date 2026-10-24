import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getReportsData } from '@/lib/restaurant/service'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const data = getReportsData(vendorId)
    return Response.json({ success: true, ...data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
