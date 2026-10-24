import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getRestaurantBootstrap } from '@/lib/restaurant/service'

export async function GET(request) {
  try {
    let vendorId = 'default_vendor'
    try {
      const ctx = await resolveVendorContext(request)
      if (ctx?.vendorId) vendorId = ctx.vendorId
    } catch (authErr) {
      console.warn('Vendor context resolution warning:', authErr?.message)
    }

    try {
      const data = getRestaurantBootstrap(vendorId)
      return Response.json({ success: true, vendorId, ...data })
    } catch (dbErr) {
      console.error(`Restaurant bootstrap error for vendor [${vendorId}], attempting default fallback:`, dbErr)
      const fallbackData = getRestaurantBootstrap('default_vendor')
      return Response.json({ success: true, vendorId: 'default_vendor', ...fallbackData, warning: dbErr.message })
    }
  } catch (error) {
    console.error('Fatal restaurant bootstrap error:', error)
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}
