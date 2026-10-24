import { resolveVendorContext } from '@/lib/restaurant/auth'
import { getKhataOverview, recordCustomerPayment } from '@/lib/restaurant/service'
import { getRestaurantDb } from '@/lib/restaurant/db'

export async function GET(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const data = getKhataOverview(vendorId)
    return Response.json({ success: true, ...data })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vendorId } = await resolveVendorContext(request)
    const body = await request.json()

    if (body.type === 'customer_payment') {
      const data = recordCustomerPayment(vendorId, body)
      return Response.json({ success: true, ...data })
    }

    if (body.type === 'create_customer') {
      const db = getRestaurantDb(vendorId)
      const { name, phone, address = '', credit_limit = 10000 } = body
      db.prepare(`
        INSERT INTO customers (branch_id, name, phone, address, credit_limit, current_balance)
        VALUES (1, ?, ?, ?, ?, 0)
      `).run(name, phone, address, Number(credit_limit))

      const data = getKhataOverview(vendorId)
      return Response.json({ success: true, ...data })
    }

    if (body.type === 'supplier_payment') {
      const db = getRestaurantDb(vendorId)
      const { vendor_id, amount, notes = '' } = body
      const pay = Number(amount)
      const sup = db.prepare('SELECT * FROM vendors WHERE id = ?').get(vendor_id)
      if (sup) {
        const newBal = Math.max(0, Number(sup.balance) - pay)
        db.prepare('UPDATE vendors SET balance = ? WHERE id = ?').run(newBal, vendor_id)
        db.prepare(`
          INSERT INTO vendor_ledgers (branch_id, vendor_id, voucher_type, debit, credit, running_balance, notes)
          VALUES (1, ?, 'cash_payment', ?, 0, ?, ?)
        `).run(vendor_id, pay, newBal, notes || 'Payment voucher issued')
      }
      const data = getKhataOverview(vendorId)
      return Response.json({ success: true, ...data })
    }

    return Response.json({ success: false, error: 'Unknown khata action' }, { status: 400 })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 400 })
  }
}
