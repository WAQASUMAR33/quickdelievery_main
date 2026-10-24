import { getRestaurantDb } from './db.js'

export function getRestaurantBootstrap(vendorId) {
  const db = getRestaurantDb(vendorId)

  const branch = db.prepare('SELECT * FROM branches WHERE status = ? LIMIT 1').get('active') || db.prepare('SELECT * FROM branches LIMIT 1').get()
  const settings = db.prepare('SELECT * FROM settings WHERE branch_id = ? LIMIT 1').get(branch ? branch.id : 1) || db.prepare('SELECT * FROM settings LIMIT 1').get()
  const halls = db.prepare('SELECT * FROM halls ORDER BY sort_order ASC').all()
  const tables = db.prepare(`
    SELECT t.*, h.name as hall_name,
      o.order_number, o.total_amount as current_order_amount, o.order_type as current_order_type,
      o.created_at as order_time
    FROM tables t
    LEFT JOIN halls h ON t.hall_id = h.id
    LEFT JOIN orders o ON t.current_order_id = o.id
    ORDER BY t.table_number ASC
  `).all()

  const categories = db.prepare('SELECT * FROM categories WHERE is_active = 1 ORDER BY sort_order ASC').all()
  const menuItems = db.prepare(`
    SELECT m.*, c.name as category_name, k.name as kitchen_name
    FROM menu_items m
    LEFT JOIN categories c ON m.category_id = c.id
    LEFT JOIN kitchens k ON m.kitchen_id = k.id
    WHERE m.is_available = 1
    ORDER BY m.name ASC
  `).all()

  const kitchens = db.prepare('SELECT * FROM kitchens WHERE is_active = 1').all()
  const customers = db.prepare('SELECT * FROM customers ORDER BY name ASC').all()
  const staff = db.prepare("SELECT id, name, fullname, username, role, phone FROM users WHERE status = 'active'").all()
  const printers = db.prepare('SELECT * FROM printers ORDER BY is_default DESC').all()

  // Current Open Day-End Register
  const currentDayEnd = db.prepare(`
    SELECT * FROM day_ends WHERE status = 'open' ORDER BY id DESC LIMIT 1
  `).get() || null

  // Active Running Orders (Dine-in occupied, pending takeaways, pending deliveries)
  const activeOrders = db.prepare(`
    SELECT o.*, t.table_number, h.name as hall_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN halls h ON o.hall_id = h.id
    WHERE o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
    ORDER BY o.id DESC
  `).all().map(order => {
    const items = db.prepare(`
      SELECT oi.*, mi.name as item_name, k.name as kitchen_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      LEFT JOIN kitchens k ON oi.kitchen_id = k.id
      WHERE oi.order_id = ?
    `).all(order.id)
    return { ...order, items }
  })

  const branches = db.prepare('SELECT * FROM branches ORDER BY id ASC').all()
  const reservations = db.prepare(`
    SELECT r.*, h.name as hall_name, t.table_number
    FROM reservations r
    LEFT JOIN halls h ON r.hall_id = h.id
    LEFT JOIN tables t ON r.table_id = t.id
    ORDER BY r.reservation_date DESC, r.reservation_time ASC
  `).all()

  const recipes = db.prepare(`
    SELECT r.*, mi.name as menu_item_name, ii.name as inventory_item_name, ii.cost_per_unit
    FROM recipes r
    JOIN menu_items mi ON r.menu_item_id = mi.id
    JOIN inventory_items ii ON r.inventory_item_id = ii.id
    ORDER BY mi.name ASC
  `).all()

  return {
    branch,
    branches,
    settings,
    halls,
    tables,
    categories,
    menuItems,
    kitchens,
    customers,
    staff,
    printers,
    currentDayEnd,
    activeOrders,
    reservations,
    recipes
  }
}

// ── POS Order Creation (Dine-In, Takeaway, Delivery) ───────────────────────────
export function createPosOrder(vendorId, data) {
  const db = getRestaurantDb(vendorId)

  const {
    branch_id = 1,
    user_id = 1,
    order_taker_id = 1,
    table_id = null,
    hall_id = null,
    order_type = 'dine_in',
    customer_name = 'Walk-in Guest',
    customer_phone = '',
    delivery_address = '',
    rider_id = null,
    items = [],
    discount_type = 'fixed',
    discount_value = 0,
    service_charge_rate = 5.0,
    tax_rate = 16.0,
    notes = ''
  } = data

  if (!items || items.length === 0) {
    throw new Error('Cannot create an order with empty items')
  }

  // Calculate totals
  let subtotal = 0
  items.forEach(i => {
    subtotal += (Number(i.price) * Number(i.quantity))
  })

  let discount_amount = 0
  if (discount_type === 'percentage') {
    discount_amount = (subtotal * (Number(discount_value) / 100))
  } else {
    discount_amount = Number(discount_value) || 0
  }
  discount_amount = Math.min(subtotal, Math.max(0, discount_amount))

  const taxableAmount = Math.max(0, subtotal - discount_amount)
  const service_charge_amount = order_type === 'dine_in' ? (taxableAmount * (Number(service_charge_rate) / 100)) : 0
  const tax_amount = taxableAmount * (Number(tax_rate) / 100)
  const total_amount = Math.round((taxableAmount + service_charge_amount + tax_amount) * 100) / 100

  // Generate sequence order number
  const todayStr = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const countRow = db.prepare(`SELECT count(*) as c FROM orders WHERE date(created_at) = date('now')`).get()
  const seq = (countRow.c + 1).toString().padStart(4, '0')
  const order_number = `RF-${todayStr}-${seq}`

  // PRA Invoicing generator (Punjab Revenue Authority format)
  const pra_pos_id = 'PRA-POS-7821'
  const pra_invoice_number = `${pra_pos_id}-${Date.now().toString().slice(-8)}`
  const pra_qr_code = `PRA-INVOICE:${pra_invoice_number}|TOTAL:${total_amount}|TAX:${Math.round(tax_amount)}|POS:${pra_pos_id}`

  // Insert Order
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      branch_id, user_id, order_taker_id, table_id, hall_id, order_number, order_type,
      customer_name, customer_phone, delivery_address, rider_id,
      subtotal, discount_type, discount_value, discount_amount,
      service_charge_rate, service_charge_amount, tax_rate, tax_amount, total_amount,
      payment_status, order_status, pra_invoice_number, pra_qr_code, pra_status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      'pending', 'preparing', ?, ?, 'synced'
    )
  `)

  const res = insertOrder.run(
    branch_id, user_id, order_taker_id, table_id, hall_id, order_number, order_type,
    customer_name, customer_phone, delivery_address, rider_id,
    subtotal, discount_type, discount_value, discount_amount,
    service_charge_rate, service_charge_amount, tax_rate, tax_amount, total_amount,
    pra_invoice_number, pra_qr_code
  )
  const orderId = res.lastInsertRowid

  // Insert items with kitchen station assignment
  const insertItem = db.prepare(`
    INSERT INTO order_items (
      order_id, menu_item_id, kitchen_id, quantity, price, cost_price, subtotal, notes, kitchen_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'cooking')
  `)

  for (const it of items) {
    const itemSubtotal = Number(it.price) * Number(it.quantity)
    insertItem.run(
      orderId,
      it.menu_item_id || it.id,
      it.kitchen_id || 1,
      it.quantity,
      it.price,
      it.cost_price || 0,
      itemSubtotal,
      it.notes || notes || null
    )
  }

  // If dine-in, mark table occupied and link order
  if (order_type === 'dine_in' && table_id) {
    db.prepare(`UPDATE tables SET status = 'occupied', current_order_id = ? WHERE id = ?`).run(orderId, table_id)
  }

  return getOrderDetails(vendorId, orderId)
}

// ── Get Single Order Details ───────────────────────────────────────────────────
export function getOrderDetails(vendorId, orderId) {
  const db = getRestaurantDb(vendorId)
  const order = db.prepare(`
    SELECT o.*, t.table_number, h.name as hall_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN halls h ON o.hall_id = h.id
    WHERE o.id = ?
  `).get(orderId)

  if (!order) return null

  const items = db.prepare(`
    SELECT oi.*, mi.name as item_name, k.name as kitchen_name
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    LEFT JOIN kitchens k ON oi.kitchen_id = k.id
    WHERE oi.order_id = ?
  `).all(orderId)

  const payments = db.prepare(`
    SELECT * FROM order_payments WHERE order_id = ?
  `).all(orderId)

  return { ...order, items, payments }
}

// ── Settle / Pay Order (Cash, Card, Split, Khata) ──────────────────────────────
export function settleOrder(vendorId, orderId, paymentData) {
  const db = getRestaurantDb(vendorId)
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId)
  if (!order) throw new Error('Order not found')

  const {
    payment_method = 'cash', // 'cash', 'card', 'split', 'credit_khata'
    tendered_amount = 0,
    cash_amount = paymentData.splitCash || paymentData.cash_amount || 0,
    card_amount = paymentData.splitCard || paymentData.card_amount || 0,
    customer_id = null,
    reference_number = '',
    notes = ''
  } = paymentData

  const total = Number(order.total_amount)
  let change_amount = 0
  let isPaid = true

  if (payment_method === 'cash') {
    const tendered = Number(tendered_amount) || total
    change_amount = Math.max(0, tendered - total)

    db.prepare(`
      INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number, notes)
      VALUES (?, ?, 'cash', ?, ?, ?)
    `).run(orderId, order.branch_id, total, 'CASH-PAYMENT', notes)
  } else if (payment_method === 'card') {
    db.prepare(`
      INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number, notes)
      VALUES (?, ?, 'card', ?, ?, ?)
    `).run(orderId, order.branch_id, total, reference_number || 'POS-CARD', notes)
  } else if (payment_method === 'split') {
    if (Number(cash_amount) > 0) {
      db.prepare(`
        INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number, notes)
        VALUES (?, ?, 'cash', ?, 'SPLIT-CASH', ?)
      `).run(orderId, order.branch_id, Number(cash_amount), notes)
    }
    if (Number(card_amount) > 0) {
      db.prepare(`
        INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number, notes)
        VALUES (?, ?, 'card', ?, ?, ?)
      `).run(orderId, order.branch_id, Number(card_amount), reference_number || 'SPLIT-CARD', notes)
    }
  } else if (payment_method === 'credit_khata') {
    // Record to customer khata ledger
    if (customer_id) {
      const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id)
      if (cust) {
        const newBal = Number(cust.current_balance) + total
        db.prepare('UPDATE customers SET current_balance = ? WHERE id = ?').run(newBal, customer_id)
        db.prepare(`
          INSERT INTO customer_ledgers (branch_id, customer_id, order_id, type, debit, credit, running_balance, notes)
          VALUES (?, ?, ?, 'order_credit', ?, 0, ?, ?)
        `).run(order.branch_id, customer_id, orderId, total, newBal, `Credit dine invoice #${order.order_number}`)
      }
    }
    db.prepare(`
      INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number, notes)
      VALUES (?, ?, 'credit_khata', ?, ?, ?)
    `).run(orderId, order.branch_id, total, `KHATA-CUST-${customer_id}`, notes)
  }

  // Update order status
  db.prepare(`
    UPDATE orders
    SET payment_status = 'paid',
        payment_method = ?,
        tendered_amount = ?,
        change_amount = ?,
        order_status = 'completed',
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(payment_method, Number(tendered_amount) || total, change_amount, orderId)

  // Mark order items served
  db.prepare(`UPDATE order_items SET kitchen_status = 'served' WHERE order_id = ?`).run(orderId)

  // Release table if dine-in
  if (order.table_id) {
    db.prepare(`
      UPDATE tables
      SET status = 'available', current_order_id = NULL
      WHERE id = ?
    `).run(order.table_id)
  }

  // Recipe BOM stock depletion from kitchen store
  depleteOrderRecipeStock(db, orderId, order.branch_id)

  // Update active day-end register cash sales
  updateDayEndTotals(db, order.branch_id, total, payment_method, order.tax_amount)

  return getOrderDetails(vendorId, orderId)
}

// ── Recipe BOM stock depletion ────────────────────────────────────────────────
function depleteOrderRecipeStock(db, orderId, branchId) {
  const items = db.prepare(`SELECT * FROM order_items WHERE order_id = ?`).all(orderId)

  for (const item of items) {
    const recipes = db.prepare(`SELECT * FROM recipes WHERE menu_item_id = ?`).all(item.menu_item_id)
    for (const rec of recipes) {
      const deductionQty = rec.quantity * item.quantity
      // Deplete from kitchen store
      db.prepare(`
        UPDATE kitchen_store_stocks
        SET quantity = MAX(0, quantity - ?)
        WHERE inventory_item_id = ? AND kitchen_id = ? AND branch_id = ?
      `).run(deductionQty, rec.inventory_item_id, item.kitchen_id || 1, branchId)

      // Log activity
      db.prepare(`
        INSERT INTO inventory_activity_logs (
          branch_id, inventory_item_id, activity_type, quantity, reference_id, notes
        ) VALUES (?, ?, 'recipe_deduction', ?, ?, ?)
      `).run(branchId, rec.inventory_item_id, deductionQty, `ORD-${orderId}`, `Auto-deducted for order #${orderId}`)
    }
  }

  db.prepare(`UPDATE orders SET is_stock_deducted = 1 WHERE id = ?`).run(orderId)
}

// ── Update active day-end register ───────────────────────────────────────────
function updateDayEndTotals(db, branchId, amount, method, tax) {
  const current = db.prepare(`SELECT * FROM day_ends WHERE status = 'open' ORDER BY id DESC LIMIT 1`).get()
  if (!current) return

  const isCash = method === 'cash' || method === 'split'
  const isCard = method === 'card'
  const isKhata = method === 'credit_khata'

  const cashAdd = isCash ? amount : 0
  const cardAdd = isCard ? amount : 0
  const khataAdd = isKhata ? amount : 0

  db.prepare(`
    UPDATE day_ends
    SET gross_sales = gross_sales + ?,
        net_sales = net_sales + ?,
        total_orders = total_orders + 1,
        cash_sales = cash_sales + ?,
        card_sales = card_sales + ?,
        credit_khata_sales = credit_khata_sales + ?,
        total_tax_collected = total_tax_collected + ?,
        expected_cash_in_drawer = expected_cash_in_drawer + ?
    WHERE id = ?
  `).run(amount, amount, cashAdd, cardAdd, khataAdd, tax || 0, cashAdd, current.id)
}

// ── Kitchen Display System (KDS) ──────────────────────────────────────────────
export function getKdsTickets(vendorId, stationId = null) {
  const db = getRestaurantDb(vendorId)

  let query = `
    SELECT o.id as order_id, o.order_number, o.order_type, o.created_at, o.order_status,
      t.table_number, h.name as hall_name
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    LEFT JOIN halls h ON o.hall_id = h.id
    WHERE o.order_status IN ('pending', 'confirmed', 'preparing', 'ready')
    ORDER BY o.created_at ASC
  `
  const activeOrders = db.prepare(query).all()

  const tickets = []
  for (const o of activeOrders) {
    let itemQuery = `
      SELECT oi.*, mi.name as item_name, k.name as kitchen_name
      FROM order_items oi
      JOIN menu_items mi ON oi.menu_item_id = mi.id
      JOIN kitchens k ON oi.kitchen_id = k.id
      WHERE oi.order_id = ?
    `
    const params = [o.order_id]
    if (stationId && stationId !== 'all') {
      itemQuery += ` AND oi.kitchen_id = ?`
      params.push(stationId)
    }

    const items = db.prepare(itemQuery).all(...params)
    if (items.length > 0) {
      // Calculate elapsed minutes
      const elapsedMs = Date.now() - new Date(o.created_at).getTime()
      const elapsedMinutes = Math.floor(elapsedMs / 60000)

      tickets.push({
        ...o,
        elapsedMinutes,
        items
      })
    }
  }

  const kitchens = db.prepare('SELECT * FROM kitchens WHERE is_active = 1').all()
  return { tickets, kitchens }
}

export function updateOrderItemStatus(vendorId, itemId, newStatus) {
  const db = getRestaurantDb(vendorId)
  db.prepare(`UPDATE order_items SET kitchen_status = ? WHERE id = ?`).run(newStatus, itemId)
  return { success: true, itemId, newStatus }
}

export function updateTicketStatus(vendorId, orderId, newStatus) {
  const db = getRestaurantDb(vendorId)
  db.prepare(`UPDATE orders SET order_status = ? WHERE id = ?`).run(newStatus, orderId)
  db.prepare(`UPDATE order_items SET kitchen_status = ? WHERE order_id = ?`).run(
    newStatus === 'ready' ? 'ready' : newStatus === 'preparing' ? 'cooking' : 'served',
    orderId
  )
  return { success: true, orderId, newStatus }
}

// ── Multi-Store Inventory & Purchasing ─────────────────────────────────────────
export function getInventoryOverview(vendorId) {
  const db = getRestaurantDb(vendorId)

  const items = db.prepare(`
    SELECT ii.*,
      COALESCE(ms.quantity, 0) as main_store_stock,
      COALESCE(ms.last_purchase_price, ii.cost_per_unit) as purchase_price,
      COALESCE((SELECT SUM(quantity) FROM kitchen_store_stocks WHERE inventory_item_id = ii.id), 0) as kitchen_store_stock
    FROM inventory_items ii
    LEFT JOIN main_store_stocks ms ON ms.inventory_item_id = ii.id
    WHERE ii.is_active = 1
    ORDER BY ii.name ASC
  `).all()

  const lowStockItems = items.filter(it => (it.main_store_stock + it.kitchen_store_stock) <= it.min_stock_alert)

  const transfers = db.prepare(`
    SELECT st.*, ii.name as item_name, ii.unit, k.name as to_kitchen_name
    FROM stock_transfers st
    JOIN inventory_items ii ON st.inventory_item_id = ii.id
    LEFT JOIN kitchens k ON st.to_kitchen_id = k.id
    ORDER BY st.created_at DESC LIMIT 20
  `).all()

  const wasteLogs = db.prepare(`
    SELECT wl.*, ii.name as item_name, k.name as kitchen_name
    FROM waste_logs wl
    JOIN inventory_items ii ON wl.inventory_item_id = ii.id
    LEFT JOIN kitchens k ON wl.kitchen_id = k.id
    ORDER BY wl.created_at DESC LIMIT 20
  `).all()

  const kitchens = db.prepare('SELECT * FROM kitchens WHERE is_active = 1').all()
  const suppliers = db.prepare("SELECT * FROM vendors WHERE status = 'active'").all()

  return {
    items,
    lowStockItems,
    transfers,
    wasteLogs,
    kitchens,
    suppliers
  }
}

export function transferStock(vendorId, { inventory_item_id, to_kitchen_id, quantity, notes = '' }) {
  const db = getRestaurantDb(vendorId)
  const qty = Number(quantity)
  if (qty <= 0) throw new Error('Quantity must be greater than 0')

  // Deduct from Main Store
  db.prepare(`
    UPDATE main_store_stocks
    SET quantity = MAX(0, quantity - ?)
    WHERE inventory_item_id = ?
  `).run(qty, inventory_item_id)

  // Upsert into Kitchen Store
  const existing = db.prepare(`
    SELECT * FROM kitchen_store_stocks WHERE inventory_item_id = ? AND kitchen_id = ?
  `).get(inventory_item_id, to_kitchen_id)

  if (existing) {
    db.prepare(`
      UPDATE kitchen_store_stocks
      SET quantity = quantity + ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(qty, existing.id)
  } else {
    db.prepare(`
      INSERT INTO kitchen_store_stocks (branch_id, kitchen_id, inventory_item_id, quantity)
      VALUES (1, ?, ?, ?)
    `).run(to_kitchen_id, inventory_item_id, qty)
  }

  // Record transfer log
  db.prepare(`
    INSERT INTO stock_transfers (branch_id, from_store, to_kitchen_id, inventory_item_id, quantity, notes)
    VALUES (1, 'main_store', ?, ?, ?, ?)
  `).run(to_kitchen_id, inventory_item_id, qty, notes)

  return getInventoryOverview(vendorId)
}

export function logWaste(vendorId, { inventory_item_id, kitchen_id = null, quantity, reason, unit = 'kg', estimated_cost = 0 }) {
  const db = getRestaurantDb(vendorId)
  const qty = Number(quantity)

  // Deduct stock
  if (kitchen_id) {
    db.prepare(`UPDATE kitchen_store_stocks SET quantity = MAX(0, quantity - ?) WHERE inventory_item_id = ? AND kitchen_id = ?`).run(qty, inventory_item_id, kitchen_id)
  } else {
    db.prepare(`UPDATE main_store_stocks SET quantity = MAX(0, quantity - ?) WHERE inventory_item_id = ?`).run(qty, inventory_item_id)
  }

  db.prepare(`
    INSERT INTO waste_logs (
      branch_id,
      inventory_item_id,
      kitchen_id,
      quantity,
      unit,
      estimated_cost,
      reason,
      logged_by
    ) VALUES (
      1,
      ?,
      ?,
      ?,
      ?,
      ?,
      ?,
      'Store Manager'
    )
  `).run(inventory_item_id, kitchen_id, qty, unit, estimated_cost, reason)

  return getInventoryOverview(vendorId)
}

// ── Customer & Supplier Khata Ledgers ──────────────────────────────────────────
export function getKhataOverview(vendorId) {
  const db = getRestaurantDb(vendorId)

  const customers = db.prepare('SELECT * FROM customers ORDER BY current_balance DESC').all()
  const customerLedgers = db.prepare(`
    SELECT cl.*, c.name as customer_name, c.phone as customer_phone
    FROM customer_ledgers cl
    JOIN customers c ON cl.customer_id = c.id
    ORDER BY cl.created_at DESC LIMIT 50
  `).all()

  const suppliers = db.prepare('SELECT * FROM vendors ORDER BY balance DESC').all()
  const supplierLedgers = db.prepare(`
    SELECT vl.*, v.name as supplier_name, v.company_name
    FROM vendor_ledgers vl
    JOIN vendors v ON vl.vendor_id = v.id
    ORDER BY vl.created_at DESC LIMIT 50
  `).all()

  return { customers, customerLedgers, suppliers, supplierLedgers }
}

export function recordCustomerPayment(vendorId, { customer_id, amount, notes = '' }) {
  const db = getRestaurantDb(vendorId)
  const payAmount = Number(amount)
  if (payAmount <= 0) throw new Error('Payment amount must be greater than zero')

  const cust = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id)
  if (!cust) throw new Error('Customer not found')

  const newBalance = Math.max(0, Number(cust.current_balance) - payAmount)
  db.prepare('UPDATE customers SET current_balance = ? WHERE id = ?').run(newBalance, customer_id)

  db.prepare(`
    INSERT INTO customer_ledgers (branch_id, customer_id, type, debit, credit, running_balance, notes)
    VALUES (1, ?, 'cash_received', 0, ?, ?, ?)
  `).run(customer_id, payAmount, newBalance, notes || 'Cash payment received against credit khata')

  return getKhataOverview(vendorId)
}

// ── Day-End Closing & Z-Report ─────────────────────────────────────────────────
export function getDayEndOverview(vendorId) {
  const db = getRestaurantDb(vendorId)

  const current = db.prepare(`
    SELECT * FROM day_ends WHERE status = 'open' ORDER BY id DESC LIMIT 1
  `).get()

  const closedHistory = db.prepare(`
    SELECT * FROM day_ends WHERE status = 'closed' ORDER BY id DESC LIMIT 10
  `).all()

  const todayExpenses = db.prepare(`
    SELECT * FROM expenses WHERE date(expense_date) = date('now') ORDER BY id DESC
  `).all()

  const totalExpenseAmount = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  return {
    current,
    closedHistory,
    todayExpenses,
    totalExpenseAmount
  }
}

export function openDayEndRegister(vendorId, openingFloat) {
  const db = getRestaurantDb(vendorId)
  const floatVal = Number(openingFloat) || 0

  const existing = db.prepare(`SELECT * FROM day_ends WHERE status = 'open' LIMIT 1`).get()
  if (existing) throw new Error('A register session is already open.')

  db.prepare(`
    INSERT INTO day_ends (
      branch_id, user_id, opening_float, opening_time, business_date,
      expected_cash_in_drawer, status
    ) VALUES (
      1, 1, ?, CURRENT_TIMESTAMP, date('now'), ?, 'open'
    )
  `).run(floatVal, floatVal)

  return getDayEndOverview(vendorId)
}

export function closeDayEndRegister(vendorId, { actual_cash_counted, closing_notes = '' }) {
  const db = getRestaurantDb(vendorId)
  const current = db.prepare(`SELECT * FROM day_ends WHERE status = 'open' ORDER BY id DESC LIMIT 1`).get()
  if (!current) throw new Error('No open register found to close.')

  const counted = Number(actual_cash_counted) || 0
  const expected = Number(current.expected_cash_in_drawer) || 0
  const difference = counted - expected // Positive = overage, Negative = shortage

  db.prepare(`
    UPDATE day_ends
    SET actual_cash_counted = ?,
        cash_difference = ?,
        closed_at = CURRENT_TIMESTAMP,
        closing_notes = ?,
        status = 'closed'
    WHERE id = ?
  `).run(counted, difference, closing_notes, current.id)

  return getDayEndOverview(vendorId)
}

// ── Analytics & Executive Reports ─────────────────────────────────────────────
export function getReportsData(vendorId) {
  const db = getRestaurantDb(vendorId)

  // Total Lifetime & Today Stats
  const todaySales = db.prepare(`
    SELECT
      COUNT(id) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(SUM(tax_amount), 0) as total_tax,
      COALESCE(SUM(discount_amount), 0) as total_discount
    FROM orders
    WHERE date(created_at) = date('now') AND order_status != 'cancelled'
  `).get()

  // Top Selling Dishes
  const topDishes = db.prepare(`
    SELECT mi.name, mi.price, COUNT(oi.id) as order_count, SUM(oi.quantity) as total_qty, SUM(oi.subtotal) as total_sales
    FROM order_items oi
    JOIN menu_items mi ON oi.menu_item_id = mi.id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_status != 'cancelled'
    GROUP BY mi.id
    ORDER BY total_qty DESC
    LIMIT 6
  `).all()

  // Category sales breakdown
  const categorySales = db.prepare(`
    SELECT c.name, COUNT(oi.id) as orders, COALESCE(SUM(oi.subtotal), 0) as sales
    FROM categories c
    JOIN menu_items mi ON c.id = mi.category_id
    JOIN order_items oi ON mi.id = oi.menu_item_id
    JOIN orders o ON oi.order_id = o.id
    WHERE o.order_status != 'cancelled'
    GROUP BY c.id
    ORDER BY sales DESC
  `).all()

  // Recent 10 Orders
  const recentOrders = db.prepare(`
    SELECT o.*, t.table_number
    FROM orders o
    LEFT JOIN tables t ON o.table_id = t.id
    ORDER BY o.created_at DESC
    LIMIT 10
  `).all()

  return {
    todaySales,
    topDishes,
    categorySales,
    recentOrders
  }
}
