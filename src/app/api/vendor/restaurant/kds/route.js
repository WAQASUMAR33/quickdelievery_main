import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getKdsTickets, updateOrderItemStatus, updateTicketStatus } from '@/lib/restaurant/service'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const url = new URL(request.url)
    const stationId = url.searchParams.get('stationId')
    const data = getKdsTickets(vendorId, stationId)
    return Response.json({ success: true, ...data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const body = await request.json()

    if (body.type === 'item') {
      const res = updateOrderItemStatus(vendorId, body.itemId, body.status)
      return Response.json(res)
    }

    if (body.type === 'ticket') {
      const res = updateTicketStatus(vendorId, body.orderId, body.status)
      return Response.json(res)
    }

    return Response.json({ success: false, error: 'Invalid update type' }, { status: 400 })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
