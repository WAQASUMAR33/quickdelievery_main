import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import fs from 'node:fs'

const DB_DIR = path.join(process.cwd(), 'data', 'restaurants')
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true })
}

// In-memory cache of DB instances per vendor
const dbCache = new Map()

export function sanitizeVendorId(vendorId) {
  if (!vendorId) return 'default_vendor'
  return String(vendorId).replace(/[^a-zA-Z0-9_-]/g, '_')
}

export function getRestaurantDb(vendorId) {
  const safeId = sanitizeVendorId(vendorId)
  if (dbCache.has(safeId)) {
    return dbCache.get(safeId)
  }

  const dbPath = path.join(DB_DIR, `restaurant_${safeId}.db`)
  const db = new DatabaseSync(dbPath)
  
  // Enable foreign keys & WAL mode for high performance
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec('PRAGMA journal_mode = WAL;')

  initSchema(db, safeId)
  dbCache.set(safeId, db)
  return db
}

function initSchema(db, vendorId) {
  db.exec(`
    -- 1. Branches
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      address TEXT,
      phone TEXT,
      email TEXT,
      tax_rate REAL DEFAULT 16.0,
      service_charge_rate REAL DEFAULT 5.0,
      pra_pos_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 2. Staff Users & Roles
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      fullname TEXT,
      username TEXT UNIQUE,
      email TEXT,
      password TEXT,
      phone TEXT,
      role TEXT CHECK(role IN ('super_admin', 'branch_admin', 'cashier', 'order_taker', 'kitchen')) DEFAULT 'cashier',
      permissions TEXT, -- JSON array
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
    );

    -- 3. Halls
    CREATE TABLE IF NOT EXISTS halls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );

    -- 4. Tables
    CREATE TABLE IF NOT EXISTS tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      hall_id INTEGER,
      table_number TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      status TEXT CHECK(status IN ('available', 'occupied', 'reserved')) DEFAULT 'available',
      current_order_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
      FOREIGN KEY (hall_id) REFERENCES halls(id) ON DELETE CASCADE
    );

    -- 5. Categories
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      slug TEXT,
      image TEXT,
      sort_order INTEGER DEFAULT 1,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 6. Menu Items
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      category_id INTEGER,
      kitchen_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      image TEXT,
      is_available INTEGER DEFAULT 1,
      is_taxable INTEGER DEFAULT 1,
      tax_rate REAL DEFAULT 16.0,
      is_stock_deducted INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    -- 7. Recipes (BOM)
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE CASCADE
    );

    -- 8. Orders
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      user_id INTEGER,
      order_taker_id INTEGER,
      table_id INTEGER,
      hall_id INTEGER,
      order_number TEXT UNIQUE NOT NULL,
      order_type TEXT CHECK(order_type IN ('dine_in', 'takeaway', 'delivery')) DEFAULT 'dine_in',
      customer_name TEXT,
      customer_phone TEXT,
      delivery_address TEXT,
      rider_id INTEGER,
      subtotal REAL DEFAULT 0,
      discount_type TEXT DEFAULT 'fixed',
      discount_value REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      service_charge_rate REAL DEFAULT 0,
      service_charge_amount REAL DEFAULT 0,
      tax_rate REAL DEFAULT 16.0,
      tax_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      rounding_adjustment REAL DEFAULT 0,
      tendered_amount REAL DEFAULT 0,
      change_amount REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      payment_status TEXT CHECK(payment_status IN ('pending', 'partial', 'paid', 'refunded')) DEFAULT 'pending',
      order_status TEXT CHECK(order_status IN ('pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled', 'merged')) DEFAULT 'pending',
      pra_invoice_number TEXT,
      pra_qr_code TEXT,
      pra_status TEXT DEFAULT 'pending',
      pra_response TEXT,
      is_stock_deducted INTEGER DEFAULT 0,
      merged_into_order_id INTEGER,
      cancellation_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 9. Order Items
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER NOT NULL,
      kitchen_id INTEGER,
      quantity INTEGER DEFAULT 1,
      cancelled_quantity INTEGER DEFAULT 0,
      price REAL NOT NULL,
      cost_price REAL DEFAULT 0,
      subtotal REAL NOT NULL,
      notes TEXT,
      kitchen_status TEXT CHECK(kitchen_status IN ('pending', 'cooking', 'ready', 'served', 'cancelled')) DEFAULT 'pending',
      is_cancel INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 10. Order Payments
    CREATE TABLE IF NOT EXISTS order_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      branch_id INTEGER,
      payment_method TEXT NOT NULL,
      amount REAL NOT NULL,
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    -- 11. Kitchens
    CREATE TABLE IF NOT EXISTS kitchens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      printer_ip TEXT,
      printer_port INTEGER DEFAULT 9100,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 12. Inventory Items (Raw Materials)
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      category TEXT,
      unit TEXT NOT NULL,
      min_stock_alert REAL DEFAULT 5.0,
      cost_per_unit REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 13. Main Store Stocks
    CREATE TABLE IF NOT EXISTS main_store_stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL DEFAULT 0,
      last_purchase_price REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
    );

    -- 14. Kitchen Store Stocks
    CREATE TABLE IF NOT EXISTS kitchen_store_stocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      kitchen_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inventory_item_id) REFERENCES inventory_items(id) ON DELETE CASCADE,
      FOREIGN KEY (kitchen_id) REFERENCES kitchens(id) ON DELETE CASCADE
    );

    -- 15. Purchases (Inward)
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      vendor_id INTEGER,
      invoice_number TEXT,
      purchase_date DATE,
      subtotal REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      tax REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      paid_amount REAL DEFAULT 0,
      payment_status TEXT DEFAULT 'paid',
      payment_method TEXT DEFAULT 'cash',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. Purchase Items
    CREATE TABLE IF NOT EXISTS purchase_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      unit_cost REAL NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );

    -- 17. Stock Transfers
    CREATE TABLE IF NOT EXISTS stock_transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      from_store TEXT DEFAULT 'main_store',
      to_kitchen_id INTEGER,
      inventory_item_id INTEGER NOT NULL,
      quantity REAL NOT NULL,
      transfer_type TEXT CHECK(transfer_type IN ('issue', 'return')) DEFAULT 'issue',
      status TEXT DEFAULT 'completed',
      notes TEXT,
      created_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 18. Inventory Activity Logs
    CREATE TABLE IF NOT EXISTS inventory_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      inventory_item_id INTEGER NOT NULL,
      activity_type TEXT NOT NULL,
      quantity REAL NOT NULL,
      balance_after REAL,
      reference_id TEXT,
      user_id INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 19. Vendors (Suppliers)
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      company_name TEXT,
      phone TEXT,
      email TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 20. Vendor Ledgers
    CREATE TABLE IF NOT EXISTS vendor_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      vendor_id INTEGER NOT NULL,
      voucher_type TEXT NOT NULL,
      voucher_number TEXT,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      running_balance REAL DEFAULT 0,
      notes TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
    );

    -- 21. Customers (Khata Accounts)
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      credit_limit REAL DEFAULT 10000,
      current_balance REAL DEFAULT 0,
      loyalty_points INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 22. Customer Ledgers
    CREATE TABLE IF NOT EXISTS customer_ledgers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      customer_id INTEGER NOT NULL,
      order_id INTEGER,
      type TEXT NOT NULL,
      debit REAL DEFAULT 0,
      credit REAL DEFAULT 0,
      running_balance REAL DEFAULT 0,
      notes TEXT,
      user_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );

    -- 23. Reservations
    CREATE TABLE IF NOT EXISTS reservations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      party_size INTEGER DEFAULT 2,
      hall_id INTEGER,
      table_id INTEGER,
      reservation_date DATE NOT NULL,
      reservation_time TEXT NOT NULL,
      special_requests TEXT,
      status TEXT CHECK(status IN ('pending', 'confirmed', 'seated', 'cancelled', 'no_show')) DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 24. Delivery Riders
    CREATE TABLE IF NOT EXISTS riders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      vehicle_type TEXT DEFAULT 'motorcycle',
      vehicle_number TEXT,
      is_active INTEGER DEFAULT 1,
      current_status TEXT CHECK(current_status IN ('available', 'on_delivery', 'off_duty')) DEFAULT 'available',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 25. Waste Logs
    CREATE TABLE IF NOT EXISTS waste_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      inventory_item_id INTEGER NOT NULL,
      kitchen_id INTEGER,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      estimated_cost REAL DEFAULT 0,
      reason TEXT,
      logged_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 26. Attendances
    CREATE TABLE IF NOT EXISTS attendances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      user_id INTEGER NOT NULL,
      date DATE NOT NULL,
      clock_in TEXT,
      clock_out TEXT,
      total_hours REAL DEFAULT 0,
      status TEXT DEFAULT 'present',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 27. Expenses
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      user_id INTEGER,
      expense_category TEXT NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash_drawer',
      receipt_file TEXT,
      expense_date DATE DEFAULT (DATE('now')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 28. Day Ends (Z-Report)
    CREATE TABLE IF NOT EXISTS day_ends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      user_id INTEGER,
      opening_float REAL DEFAULT 0,
      opening_time DATETIME,
      closed_at DATETIME,
      business_date DATE NOT NULL,
      gross_sales REAL DEFAULT 0,
      net_sales REAL DEFAULT 0,
      total_orders INTEGER DEFAULT 0,
      total_covers_guests INTEGER DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      card_sales REAL DEFAULT 0,
      credit_khata_sales REAL DEFAULT 0,
      total_tax_collected REAL DEFAULT 0,
      total_service_charges REAL DEFAULT 0,
      total_discounts REAL DEFAULT 0,
      total_expenses_deducted REAL DEFAULT 0,
      expected_cash_in_drawer REAL DEFAULT 0,
      actual_cash_counted REAL DEFAULT 0,
      cash_difference REAL DEFAULT 0,
      status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
      closing_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 29. Printers
    CREATE TABLE IF NOT EXISTS printers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('receipt', 'kot')) DEFAULT 'receipt',
      connection_type TEXT CHECK(connection_type IN ('network', 'usb', 'browser')) DEFAULT 'network',
      ip_address TEXT,
      port INTEGER DEFAULT 9100,
      paper_width TEXT DEFAULT '80mm',
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 30. Settings
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      restaurant_name TEXT DEFAULT 'Rapid Food & Grill',
      tagline TEXT DEFAULT 'Chai, Karahi & BBQ Specialties',
      logo TEXT,
      phone TEXT DEFAULT '+92 300 1234567',
      email TEXT DEFAULT 'contact@rapidfood.com',
      address TEXT DEFAULT 'Main Boulevard, Gulberg III, Lahore',
      currency_symbol TEXT DEFAULT 'PKR',
      tax_registration_no TEXT DEFAULT 'NTN-8942183-1',
      invoice_header TEXT DEFAULT 'Welcome to Rapid Food - Authentic Taste',
      invoice_footer TEXT DEFAULT 'Thank you for dining with us! Free Wi-Fi: RapidGuest2026',
      pra_enabled INTEGER DEFAULT 1,
      pra_environment TEXT DEFAULT 'sandbox',
      pra_auth_token TEXT,
      pra_pos_id TEXT DEFAULT 'PRA-POS-9921',
      pra_pntn TEXT DEFAULT '1234567-8',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 31. Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id INTEGER,
      user_id INTEGER,
      event TEXT NOT NULL,
      auditable_type TEXT,
      auditable_id TEXT,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 32. Sync Nodes
    CREATE TABLE IF NOT EXISTS sync_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      node_identifier TEXT UNIQUE NOT NULL,
      node_type TEXT DEFAULT 'branch_local',
      endpoint_url TEXT,
      api_token TEXT,
      secret_key TEXT,
      last_ping_at DATETIME,
      sync_status TEXT DEFAULT 'online',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 33. Webhook Logs
    CREATE TABLE IF NOT EXISTS webhook_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sync_node_id INTEGER,
      direction TEXT DEFAULT 'outbound',
      event_name TEXT NOT NULL,
      payload TEXT,
      response_code INTEGER,
      status TEXT DEFAULT 'success',
      attempts INTEGER DEFAULT 1,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_tables_hall ON tables(hall_id);
    CREATE INDEX IF NOT EXISTS idx_tables_status ON tables(status);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_kitchen ON order_items(kitchen_id);
    CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
  `)

  // Check if initial seeding is needed
  const branchCount = db.prepare('SELECT COUNT(*) as count FROM branches').get()
  if (branchCount.count === 0) {
    seedRestaurantData(db, vendorId)
  }
}

function seedRestaurantData(db, vendorId) {
  // 1. Branches
  db.prepare(`
    INSERT INTO branches (name, code, address, phone, email, tax_rate, service_charge_rate, pra_pos_id)
    VALUES ('Main Branch - Gulberg', 'MB-01', 'Block H, Gulberg II, Lahore', '+92 42 35789123', 'gulberg@rapidfood.com', 16.0, 5.0, 'PRA-GUL-01')
  `).run()

  // 2. Settings
  db.prepare(`
    INSERT INTO settings (branch_id, restaurant_name, tagline, phone, email, address, currency_symbol, tax_registration_no, pra_enabled, pra_pos_id)
    VALUES (1, 'Rapid Food & Grill', 'Chai Khas & Multi-Cuisine Dining', '+92 42 35789123', 'info@rapidfood.com', 'Block H, Gulberg II, Lahore', 'Rs.', 'STRN-7239102-4', 1, 'PRA-POS-7821')
  `).run()

  // 3. Kitchen Stations
  db.prepare(`INSERT INTO kitchens (branch_id, name, printer_ip, printer_port) VALUES (1, 'Desi Karahi & Handi', '192.168.1.101', 9100)`).run()
  db.prepare(`INSERT INTO kitchens (branch_id, name, printer_ip, printer_port) VALUES (1, 'Live Charcoal BBQ', '192.168.1.102', 9100)`).run()
  db.prepare(`INSERT INTO kitchens (branch_id, name, printer_ip, printer_port) VALUES (1, 'Fast Food & Appetizers', '192.168.1.103', 9100)`).run()
  db.prepare(`INSERT INTO kitchens (branch_id, name, printer_ip, printer_port) VALUES (1, 'Chai, Coffee & Beverages', '192.168.1.104', 9100)`).run()

  // 4. Staff Users & Roles
  db.prepare(`INSERT INTO users (branch_id, name, fullname, username, email, role, permissions) VALUES (1, 'Admin Manager', 'Kashif Ali', 'admin_gulberg', 'kashif@rapidfood.com', 'super_admin', '["all"]')`).run()
  db.prepare(`INSERT INTO users (branch_id, name, fullname, username, email, role, permissions) VALUES (1, 'Cashier Counter 1', 'Bilal Ahmed', 'cashier1', 'cashier1@rapidfood.com', 'cashier', '["pos","orders","dayend","expenses"]')`).run()
  db.prepare(`INSERT INTO users (branch_id, name, fullname, username, email, role, permissions) VALUES (1, 'Captain Tariq', 'Tariq Mehmood', 'waiter_tariq', 'tariq@rapidfood.com', 'order_taker', '["pos","orders"]')`).run()
  db.prepare(`INSERT INTO users (branch_id, name, fullname, username, email, role, permissions) VALUES (1, 'Chef Rasheed', 'Rasheed Khan', 'chef_desi', 'chef@rapidfood.com', 'kitchen', '["kitchen_kds"]')`).run()

  // 5. Halls
  db.prepare(`INSERT INTO halls (branch_id, name, description, sort_order) VALUES (1, 'Ground Floor Hall', 'Main public dining area with central AC', 1)`).run()
  db.prepare(`INSERT INTO halls (branch_id, name, description, sort_order) VALUES (1, 'Executive Family Hall', 'Private family cabins and partitioned dining', 2)`).run()
  db.prepare(`INSERT INTO halls (branch_id, name, description, sort_order) VALUES (1, 'Open Sky Terrace', 'Rooftop ambient terrace with fairy lights', 3)`).run()
  db.prepare(`INSERT INTO halls (branch_id, name, description, sort_order) VALUES (1, 'VIP Lounge & Majlis', 'Carpeted floor seating and executive sofa section', 4)`).run()

  // 6. Tables (4 per hall = 16 tables)
  const halls = [
    { id: 1, prefix: 'G', count: 5, caps: [2, 4, 4, 6, 8] },
    { id: 2, prefix: 'F', count: 4, caps: [4, 6, 6, 10] },
    { id: 3, prefix: 'T', count: 4, caps: [2, 4, 4, 6] },
    { id: 4, prefix: 'VIP', count: 3, caps: [8, 12, 16] },
  ]

  for (const h of halls) {
    for (let i = 1; i <= h.count; i++) {
      const cap = h.caps[i - 1] || 4
      const status = (h.id === 1 && i === 2) ? 'occupied' : (h.id === 2 && i === 3) ? 'reserved' : 'available'
      db.prepare(`
        INSERT INTO tables (branch_id, hall_id, table_number, capacity, status)
        VALUES (1, ?, ?, ?, ?)
      `).run(h.id, `${h.prefix}-${i < 10 ? '0' + i : i}`, cap, status)
    }
  }

  // 7. Categories
  const categories = [
    { name: 'Specialty Karahi & Handi', slug: 'karahi-handi', sort: 1 },
    { name: 'Charcoal BBQ Skewers', slug: 'bbq', sort: 2 },
    { name: 'Burgers & Sandwiches', slug: 'burgers', sort: 3 },
    { name: 'Tandoor Breads & Naan', slug: 'breads', sort: 4 },
    { name: 'Chai Khas & Beverages', slug: 'chai-drinks', sort: 5 },
    { name: 'Desserts & Sweet Treats', slug: 'desserts', sort: 6 },
  ]
  for (const cat of categories) {
    db.prepare(`INSERT INTO categories (branch_id, name, slug, sort_order) VALUES (1, ?, ?, ?)`).run(cat.name, cat.slug, cat.sort)
  }

  // 8. Raw Inventory Items
  const inventory = [
    { name: 'Fresh Boneless Chicken', code: 'RAW-001', cat: 'Meat', unit: 'kg', min: 10, cost: 650 },
    { name: 'Mutton Champ & Shank', code: 'RAW-002', cat: 'Meat', unit: 'kg', min: 5, cost: 1800 },
    { name: 'Pure Desi Ghee', code: 'RAW-003', cat: 'Dairy', unit: 'kg', min: 8, cost: 1900 },
    { name: 'Fresh Cream 200ml', code: 'RAW-004', cat: 'Dairy', unit: 'pcs', min: 15, cost: 160 },
    { name: 'Basmati Rice Premium', code: 'RAW-005', cat: 'Grains', unit: 'kg', min: 20, cost: 320 },
    { name: 'Special Karahi Spice Blend', code: 'RAW-006', cat: 'Spices', unit: 'kg', min: 5, cost: 850 },
    { name: 'Fresh Garlic & Ginger Paste', code: 'RAW-007', cat: 'Vegetables', unit: 'kg', min: 5, cost: 350 },
    { name: 'Full Cream Milk', code: 'RAW-008', cat: 'Dairy', unit: 'ltr', min: 30, cost: 220 },
    { name: 'Peshawari Tea Leaves', code: 'RAW-009', cat: 'Dry', unit: 'kg', min: 4, cost: 950 },
    { name: 'Refined White Flour (Maida)', code: 'RAW-010', cat: 'Dry', unit: 'kg', min: 25, cost: 130 },
    { name: 'Burger Buns 4-inch', code: 'RAW-011', cat: 'Bakery', unit: 'pcs', min: 30, cost: 45 },
    { name: 'Cooking Oil Premium', code: 'RAW-012', cat: 'Oils', unit: 'ltr', min: 20, cost: 480 },
  ]

  for (const item of inventory) {
    const res = db.prepare(`
      INSERT INTO inventory_items (branch_id, name, code, category, unit, min_stock_alert, cost_per_unit)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `).run(item.name, item.code, item.cat, item.unit, item.min, item.cost)

    const itemId = res.lastInsertRowid

    // Seed Main Store Stock
    db.prepare(`
      INSERT INTO main_store_stocks (branch_id, inventory_item_id, quantity, last_purchase_price)
      VALUES (1, ?, ?, ?)
    `).run(itemId, item.min * 4, item.cost)

    // Seed Kitchen Store Stock (Stations 1, 2, 3, 4)
    db.prepare(`
      INSERT INTO kitchen_store_stocks (branch_id, kitchen_id, inventory_item_id, quantity)
      VALUES (1, 1, ?, ?)
    `).run(itemId, item.min * 1.5)
  }

  // 9. Menu Items & Recipes (BOM)
  const menuItems = [
    { catId: 1, kId: 1, name: 'Chicken White Handi (Full)', price: 1650, cost: 780, desc: 'Tender chicken cubes braised in thick cream, desi ghee, green chilies and white pepper' },
    { catId: 1, kId: 1, name: 'Desi Murgh Shinwari Karahi (Half)', price: 1250, cost: 550, desc: 'Peshawari style wok chicken prepared only with fresh tomatoes, salt, black pepper and animal fat' },
    { catId: 1, kId: 1, name: 'Mutton Peshawari Karahi (1 KG)', price: 2850, cost: 1650, desc: 'Fresh mutton prepared live in desi ghee with ginger slivers and rich green gravy' },
    { catId: 2, kId: 2, name: 'Chicken Malai Boti (8 Pcs)', price: 890, cost: 360, desc: 'Melt-in-mouth chicken cubes marinated in creamy yoghurt, cardamom and mild herbs' },
    { catId: 2, kId: 2, name: 'Mutton Seekh Kabab (4 Pcs)', price: 1100, cost: 520, desc: 'Minced mutton skewers infused with crushed coriander, cumin and onion pearls' },
    { catId: 2, kId: 2, name: 'Charcoal Grilled Wings (6 Pcs)', price: 650, cost: 240, desc: 'Smoky spiced chicken wings charred over coal with peri-peri glaze' },
    { catId: 3, kId: 3, name: 'Rapid Crispy Zinger Burger', price: 620, cost: 260, desc: 'Golden crunchy chicken thigh fillet with iceberg lettuce and secret tangy sauce' },
    { catId: 3, kId: 3, name: 'Smash Beef Double Patty Burger', price: 920, cost: 440, desc: 'Two smashed prime beef patties with melted cheddar and caramelized shallots' },
    { catId: 4, kId: 1, name: 'Roghni Garlic Naan', price: 120, cost: 35, desc: 'Fluffy tandoor baked bread brushed with butter, roasted sesame and minced garlic' },
    { catId: 4, kId: 1, name: 'Cheese Stuffed Kulcha Naan', price: 290, cost: 110, desc: 'Crispy naan stuffed with stretchy mozzarella, cheddar and fresh herbs' },
    { catId: 5, kId: 4, name: 'Matka Karak Chai Khas', price: 180, cost: 55, desc: 'Authentic clay pot brewed dense milky tea slow-cooked over burning coals' },
    { catId: 5, kId: 4, name: 'Kashmiri Pink Chai with Pistachio', price: 240, cost: 80, desc: 'Traditional brewing with crushed almonds, pistachios and creamy clotted cream' },
    { catId: 5, kId: 4, name: 'Mint Lemonade Chiller', price: 280, cost: 65, desc: 'Crushed mint, fresh lime juice, black salt and soda over crushed ice' },
    { catId: 6, kId: 4, name: 'Hot Gulab Jamun with Rabri (2 Pcs)', price: 340, cost: 110, desc: 'Warm cottage cheese spheres soaked in saffron syrup topped with chilled rabri' },
  ]

  for (const item of menuItems) {
    const res = db.prepare(`
      INSERT INTO menu_items (branch_id, category_id, kitchen_id, name, description, price, cost_price, is_available, is_taxable, tax_rate, is_stock_deducted)
      VALUES (1, ?, ?, ?, ?, ?, ?, 1, 1, 16.0, 1)
    `).run(item.catId, item.kId, item.name, item.desc, item.price, item.cost)

    const mId = res.lastInsertRowid

    // Associate basic recipe BOM
    if (item.catId === 1) {
      db.prepare(`INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit, notes) VALUES (?, 1, 0.8, 'kg', 'Chicken')`).run(mId)
      db.prepare(`INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit, notes) VALUES (?, 3, 0.15, 'kg', 'Desi Ghee')`).run(mId)
      db.prepare(`INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit, notes) VALUES (?, 4, 1, 'pcs', 'Cream')`).run(mId)
    } else if (item.catId === 5) {
      db.prepare(`INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit, notes) VALUES (?, 8, 0.25, 'ltr', 'Fresh Milk')`).run(mId)
      db.prepare(`INSERT INTO recipes (menu_item_id, inventory_item_id, quantity, unit, notes) VALUES (?, 9, 0.02, 'kg', 'Tea Leaves')`).run(mId)
    }
  }

  // 10. Sample Khata Customers
  const customers = [
    { name: 'Dr. Salman Hashmi', phone: '03008451122', address: 'Model Town Block C', credit: 25000, balance: 3400, points: 180 },
    { name: 'Engr. Zohaib Raza', phone: '03219488331', address: 'DHA Phase 5', credit: 40000, balance: 0, points: 420 },
    { name: 'Haji Mukhtar Traders', phone: '03334219001', address: 'Gulberg Main Market', credit: 60000, balance: 12500, points: 650 },
    { name: 'Mian Fawad Iqbal', phone: '03125556677', address: 'Cantt Officers Colony', credit: 30000, balance: 1800, points: 95 },
  ]
  for (const c of customers) {
    const r = db.prepare(`
      INSERT INTO customers (branch_id, name, phone, address, credit_limit, current_balance, loyalty_points)
      VALUES (1, ?, ?, ?, ?, ?, ?)
    `).run(c.name, c.phone, c.address, c.credit, c.balance, c.points)

    if (c.balance > 0) {
      db.prepare(`
        INSERT INTO customer_ledgers (branch_id, customer_id, type, debit, credit, running_balance, notes)
        VALUES (1, ?, 'order_credit', ?, 0, ?, 'Previous monthly dining invoice balance')
      `).run(r.lastInsertRowid, c.balance, c.balance)
    }
  }

  // 11. Sample Suppliers (Vendors)
  const suppliers = [
    { name: 'Al-Madina Poultry Farm', company: 'Al-Madina Meat Suppliers', phone: '03214433221', address: 'Tollinton Market Lahore', balance: 18500 },
    { name: 'Punjab Dairy Cooperative', company: 'Punjab Dairy & Ghee Mart', phone: '03009988776', address: 'Raiwind Road Farms', balance: 24200 },
    { name: 'Lahore Spices & Herbs Co', company: 'Lahore Masala Center', phone: '03348877112', address: 'Akbari Mandi, Lahore', balance: 6400 },
  ]
  for (const s of suppliers) {
    const r = db.prepare(`
      INSERT INTO vendors (branch_id, name, company_name, phone, address, balance)
      VALUES (1, ?, ?, ?, ?, ?)
    `).run(s.name, s.company, s.phone, s.address, s.balance)

    db.prepare(`
      INSERT INTO vendor_ledgers (branch_id, vendor_id, voucher_type, voucher_number, debit, credit, running_balance, notes)
      VALUES (1, ?, 'purchase_invoice', 'INV-SUP-901', 0, ?, ?, 'Opening invoice credit balance')
    `).run(r.lastInsertRowid, s.balance, s.balance)
  }

  // 12. Delivery Riders
  db.prepare(`INSERT INTO riders (branch_id, name, phone, vehicle_type, vehicle_number, current_status) VALUES (1, 'Shahid Mehmood', '03014499112', 'Honda 125', 'LEZ-4921', 'available')`).run()
  db.prepare(`INSERT INTO riders (branch_id, name, phone, vehicle_type, vehicle_number, current_status) VALUES (1, 'Usman Farooq', '03228833445', 'Yamaha YBR', 'LHR-8812', 'on_delivery')`).run()

  // 13. Printers
  db.prepare(`INSERT INTO printers (branch_id, name, type, connection_type, ip_address, port, paper_width, is_default) VALUES (1, 'Counter Cashier Thermal', 'receipt', 'network', '192.168.1.200', 9100, '80mm', 1)`).run()
  db.prepare(`INSERT INTO printers (branch_id, name, type, connection_type, ip_address, port, paper_width, is_default) VALUES (1, 'Kitchen Master KOT', 'kot', 'network', '192.168.1.201', 9100, '80mm', 0)`).run()

  // 14. Active Running Orders & Table Association
  // Table G-02 is currently occupied with Order #RF-1001
  const orderRes = db.prepare(`
    INSERT INTO orders (
      branch_id, user_id, order_taker_id, table_id, hall_id, order_number, order_type,
      customer_name, customer_phone, subtotal, discount_amount, service_charge_rate, service_charge_amount,
      tax_rate, tax_amount, total_amount, payment_status, order_status, pra_invoice_number, pra_status
    ) VALUES (
      1, 2, 3, 2, 1, 'RF-1001', 'dine_in',
      'Hamza Sheikh', '03001239874', 2780, 0, 5.0, 139,
      16.0, 467, 3386, 'pending', 'preparing', 'PRA-2026-901238', 'synced'
    )
  `).run()
  const activeOrderId = orderRes.lastInsertRowid

  // Connect table to current order
  db.prepare(`UPDATE tables SET current_order_id = ? WHERE id = 2`).run(activeOrderId)

  // Order Items for RF-1001
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, notes, kitchen_status)
    VALUES (?, 1, 1, 1, 1650, 1650, 'Mild spice, extra ginger garnishing', 'cooking')
  `).run(activeOrderId)
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, notes, kitchen_status)
    VALUES (?, 9, 1, 3, 120, 360, 'Hot crispy', 'ready')
  `).run(activeOrderId)
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, notes, kitchen_status)
    VALUES (?, 11, 4, 3, 180, 540, 'Karak sweet', 'cooking')
  `).run(activeOrderId)
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, notes, kitchen_status)
    VALUES (?, 13, 4, 1, 280, 280, 'Less ice', 'served')
  `).run(activeOrderId)

  // 15. A sample completed order for today's sales
  const compOrderRes = db.prepare(`
    INSERT INTO orders (
      branch_id, user_id, order_taker_id, order_number, order_type,
      customer_name, customer_phone, subtotal, discount_amount, service_charge_rate, service_charge_amount,
      tax_rate, tax_amount, total_amount, tendered_amount, change_amount, payment_method, payment_status, order_status,
      pra_invoice_number, pra_status, is_stock_deducted
    ) VALUES (
      1, 2, 3, 'RF-1000', 'takeaway',
      'Noman Butt', '03215557788', 1510, 100, 0, 0,
      16.0, 225.6, 1635.6, 2000, 364.4, 'cash', 'paid', 'completed',
      'PRA-2026-901237', 'synced', 1
    )
  `).run()
  const compOrderId = compOrderRes.lastInsertRowid

  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, kitchen_status)
    VALUES (?, 4, 2, 1, 890, 890, 'served')
  `).run(compOrderId)
  db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, kitchen_id, quantity, price, subtotal, kitchen_status)
    VALUES (?, 7, 3, 1, 620, 620, 'served')
  `).run(compOrderId)

  db.prepare(`
    INSERT INTO order_payments (order_id, branch_id, payment_method, amount, reference_number)
    VALUES (?, 1, 'cash', 1635.6, 'CASH-DRAWER')
  `).run(compOrderId)

  // 16. Current Open Day-End Register
  db.prepare(`
    INSERT INTO day_ends (
      branch_id, user_id, opening_float, opening_time, business_date,
      gross_sales, net_sales, total_orders, cash_sales, card_sales, total_tax_collected,
      expected_cash_in_drawer, actual_cash_counted, status
    ) VALUES (
      1, 2, 15000, CURRENT_TIMESTAMP, DATE('now'),
      1510, 1635.6, 1, 1635.6, 0, 225.6,
      16635.6, 0, 'open'
    )
  `).run()

  // 17. Sample Daily Expense
  db.prepare(`
    INSERT INTO expenses (branch_id, user_id, expense_category, title, amount, payment_method, notes)
    VALUES (1, 2, 'Kitchen Supplies', 'Fresh Coriander, Green Chilies & Lemons from Local Vendor', 850, 'cash_drawer', 'Paid cash from drawer')
  `).run()

  // 18. Sample Reservation
  db.prepare(`
    INSERT INTO reservations (branch_id, customer_name, customer_phone, party_size, hall_id, table_id, reservation_date, reservation_time, special_requests, status)
    VALUES (1, 'Dr. Salman Hashmi', '03008451122', 6, 2, 7, DATE('now'), '08:30 PM', 'Anniversary celebration, needs quiet corner table', 'confirmed')
  `).run()
}
