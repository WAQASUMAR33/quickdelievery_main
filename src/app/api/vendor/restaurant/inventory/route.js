import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getInventoryOverview, transferStock, logWaste } from '@/lib/restaurant/service'
import { getRestaurantDb } from '@/lib/restaurant/db'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const data = getInventoryOverview(vendorId)
    return Response.json({ success: true, ...data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const body = await request.json()

    if (body.action === 'transfer') {
      const data = transferStock(vendorId, body)
      return Response.json({ success: true, ...data })
    }

    if (body.action === 'waste') {
      const data = logWaste(vendorId, body)
      return Response.json({ success: true, ...data })
    }

    if (body.action === 'purchase') {
      const db = getRestaurantDb(vendorId)
      const { vendor_id, invoice_number, items = [], notes = '' } = body

      let total = 0
      items.forEach(i => total += (Number(i.quantity) * Number(i.unit_cost)))

      const pRes = db.prepare(`
        INSERT INTO purchases (branch_id, vendor_id, invoice_number, purchase_date, subtotal, total_amount, paid_amount, notes)
        VALUES (1, ?, ?, date('now'), ?, ?, ?, ?)
      `).run(vendor_id, invoice_number, total, total, total, notes)
      const pId = pRes.lastInsertRowid

      for (const item of items) {
        db.prepare(`
          INSERT INTO purchase_items (purchase_id, inventory_item_id, quantity, unit_cost, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(pId, item.inventory_item_id, item.quantity, item.unit_cost, Number(item.quantity) * Number(item.unit_cost))

        // Update Main Store Stock
        db.prepare(`
          UPDATE main_store_stocks
          SET quantity = quantity + ?, last_purchase_price = ?, updated_at = CURRENT_TIMESTAMP
          WHERE inventory_item_id = ?
        `).run(item.quantity, item.unit_cost, item.inventory_item_id)
      }

      const data = getInventoryOverview(vendorId)
      return Response.json({ success: true, ...data })
    }

    return Response.json({ success: false, error: 'Unknown inventory action' }, { status: 400 })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
