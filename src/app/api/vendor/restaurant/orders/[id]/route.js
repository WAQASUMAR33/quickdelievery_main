import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getOrderDetails, settleOrder } from '@/lib/restaurant/service'
import { getRestaurantDb } from '@/lib/restaurant/db'

export async function GET(request, { params }) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const { id } = await params
    const order = getOrderDetails(vendorId, id)
    if (!order) {
      return Response.json({ success: false, error: 'Order not found' }, { status: 404 })
    }
    return Response.json({ success: true, order })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const { id } = await params
    const body = await request.json()

    if (body.action === 'settle') {
      const order = settleOrder(vendorId, id, body)
      return Response.json({ success: true, order })
    }

    if (body.action === 'cancel') {
      const db = getRestaurantDb(vendorId)
      const current = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
      if (current && current.table_id) {
        db.prepare('UPDATE tables SET status = "available", current_order_id = NULL WHERE id = ?').run(current.table_id)
      }
      db.prepare(`
        UPDATE orders
        SET order_status = 'cancelled',
            cancellation_reason = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(body.reason || 'Cancelled by staff', id)

      db.prepare('UPDATE order_items SET kitchen_status = "cancelled", is_cancel = 1 WHERE order_id = ?').run(id)
      const order = getOrderDetails(vendorId, id)
      return Response.json({ success: true, order })
    }

    return Response.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Order action error:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
