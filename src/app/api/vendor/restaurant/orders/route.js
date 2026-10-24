import { resolveVendorContext } from '@/lib/restaurant/auth'
import { createPosOrder, getRestaurantBootstrap } from '@/lib/restaurant/service'
import { getRestaurantDb } from '@/lib/restaurant/db'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const db = getRestaurantDb(vendorId)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')

    let query = `
      SELECT o.*, t.table_number, h.name as hall_name
      FROM orders o
      LEFT JOIN tables t ON o.table_id = t.id
      LEFT JOIN halls h ON o.hall_id = h.id
      WHERE 1=1
    `
    const params = []
    if (status) {
      query += ` AND o.order_status = ?`
      params.push(status)
    }
    if (type) {
      query += ` AND o.order_type = ?`
      params.push(type)
    }
    query += ` ORDER BY o.id DESC LIMIT 100`

    const orders = db.prepare(query).all(...params).map(order => {
      const items = db.prepare(`
        SELECT oi.*, mi.name as item_name, k.name as kitchen_name
        FROM order_items oi
        JOIN menu_items mi ON oi.menu_item_id = mi.id
        LEFT JOIN kitchens k ON oi.kitchen_id = k.id
        WHERE oi.order_id = ?
      `).all(order.id)
      return { ...order, items }
    })

    return Response.json({ success: true, orders })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const body = await request.json()
    const order = createPosOrder(vendorId, body)
    return Response.json({ success: true, order })
  } catch (error) {
    console.error('Create POS order error:', error)
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
