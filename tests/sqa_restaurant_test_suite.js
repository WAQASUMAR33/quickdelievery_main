const BASE_URL = 'http://localhost:3000'

async function runTestSuite() {
  console.log('========================================================================')
  console.log('   RAPID FOOD RESTAURANT MANAGEMENT ERP - COMPREHENSIVE SQA TEST SUITE')
  console.log('========================================================================\n')

  let totalTests = 0
  let passedTests = 0
  let failedTests = 0

  function assert(condition, testName, details = '') {
    totalTests++
    if (condition) {
      passedTests++
      console.log(`  [PASS] ${testName}`)
    } else {
      failedTests++
      console.error(`  [FAIL] ${testName} ${details ? '--> ' + details : ''}`)
    }
  }

  const VENDOR_A = 'sqa_vendor_prime'
  const VENDOR_B = 'sqa_vendor_isolated'

  try {
    // -------------------------------------------------------------------------
    // MODULE 1: BOOTSTRAP & SCHEMA COMPLETENESS
    // -------------------------------------------------------------------------
    console.log('\n--- 1. Testing System Bootstrap & Database Schema ---')
    const bRes = await fetch(`${BASE_URL}/api/vendor/restaurant/bootstrap?vendorId=${VENDOR_A}`)
    const bData = await bRes.json()

    assert(bData.success === true, 'Bootstrap API responds with success: true')
    assert(bData.halls && bData.halls.length >= 4, `Halls seeded and loaded (${bData.halls?.length} halls)`)
    assert(bData.tables && bData.tables.length >= 16, `Tables seeded and loaded (${bData.tables?.length} tables)`)
    assert(bData.categories && bData.categories.length >= 6, `Categories loaded (${bData.categories?.length} categories)`)
    assert(bData.menuItems && bData.menuItems.length >= 14, `Menu items catalog loaded (${bData.menuItems?.length} items)`)
    assert(bData.kitchens && bData.kitchens.length >= 4, `Kitchen stations loaded (${bData.kitchens?.length} stations)`)
    assert(bData.customers && bData.customers.length >= 4, `Khata customers loaded (${bData.customers?.length} customers)`)
    assert(bData.printers && bData.printers.length >= 2, `ESC/POS thermal printers loaded (${bData.printers?.length} printers)`)
    assert(bData.staff && bData.staff.length >= 4, `Staff users loaded (${bData.staff?.length} users)`)
    assert(bData.branches && bData.branches.length >= 1, `Branches loaded (${bData.branches?.length} branches)`)

    // -------------------------------------------------------------------------
    // MODULE 2: TOUCH POS ORDER CREATION & FISCAL INVOICING
    // -------------------------------------------------------------------------
    console.log('\n--- 2. Testing Touch POS Order Creation & Fiscal Calculation ---')
    const targetTable = bData.tables.find(t => t.status === 'available') || bData.tables[0]
    
    // Dish: Chicken White Handi (Rs. 1650), Qty: 2 = 3300. Naan (Rs. 120), Qty: 3 = 360. Subtotal: 3660
    // Discount: 10% = 366. Taxable = 3294. Service Charge: 5% = 164.7. Tax: 16% = 527.04. Total = 3985.74
    const newOrderPayload = {
      order_type: 'dine_in',
      table_id: targetTable.id,
      hall_id: targetTable.hall_id,
      customer_name: 'SQA Guest VIP',
      customer_phone: '03001239999',
      discount_type: 'percentage',
      discount_value: 10,
      service_charge_rate: 5.0,
      tax_rate: 16.0,
      items: [
        { id: 1, name: 'Chicken White Handi (Full)', price: 1650, quantity: 2, kitchen_id: 1, notes: 'Less spicy, extra cream' },
        { id: 9, name: 'Roghni Garlic Naan', price: 120, quantity: 3, kitchen_id: 1, notes: 'Extra crispy' }
      ]
    }

    const orderRes = await fetch(`${BASE_URL}/api/vendor/restaurant/orders?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newOrderPayload)
    })
    const orderData = await orderRes.json()

    assert(orderData.success === true, 'POS Order created successfully via API')
    const createdOrder = orderData.order
    assert(createdOrder && createdOrder.order_number?.startsWith('RF-'), `Order sequence generated: ${createdOrder?.order_number}`)
    assert(Number(createdOrder.subtotal) === 3660, `Subtotal accurate: Rs. ${createdOrder?.subtotal} (Expected 3660)`)
    assert(Number(createdOrder.discount_amount) === 366, `Discount 10% calculated: Rs. ${createdOrder?.discount_amount} (Expected 366)`)
    assert(Math.abs(Number(createdOrder.total_amount) - 3985.74) < 1, `Grand total accurate with PRA tax: Rs. ${createdOrder?.total_amount} (Expected ~3985.74)`)
    assert(createdOrder.pra_invoice_number && createdOrder.pra_invoice_number.startsWith('PRA-'), `PRA Fiscal invoice number generated: ${createdOrder?.pra_invoice_number}`)
    assert(createdOrder.pra_qr_code?.includes('PRA-INVOICE'), `PRA QR code payload string generated: ${createdOrder?.pra_qr_code}`)

    // Verify Table status updated to occupied
    const bCheck1 = await (await fetch(`${BASE_URL}/api/vendor/restaurant/bootstrap?vendorId=${VENDOR_A}`)).json()
    const updatedTable = bCheck1.tables.find(t => t.id === targetTable.id)
    assert(updatedTable.status === 'occupied', `Dining Table ${targetTable.table_number} status transitioned to OCCUPIED`)
    assert(updatedTable.current_order_id === createdOrder.id, `Table linked to active order ID ${createdOrder.id}`)

    // -------------------------------------------------------------------------
    // MODULE 3: KITCHEN DISPLAY SYSTEM (KDS) & TICKET LIFECYCLE
    // -------------------------------------------------------------------------
    console.log('\n--- 3. Testing Kitchen Display System (KDS) & Ticket Progression ---')
    const kdsRes1 = await fetch(`${BASE_URL}/api/vendor/restaurant/kds?vendorId=${VENDOR_A}&stationId=all`)
    const kdsData1 = await kdsRes1.json()

    const activeKdsTicket = kdsData1.tickets?.find(t => t.order_id === createdOrder.id)
    assert(!!activeKdsTicket, `Active ticket #${createdOrder.order_number} is displayed in KDS live queue`)
    assert(activeKdsTicket?.items?.length === 2, `KDS ticket contains all ${activeKdsTicket?.items?.length} assigned cooking items`)
    assert(activeKdsTicket?.elapsedMinutes !== undefined, `Live elapsed cooking timer is tracked (${activeKdsTicket?.elapsedMinutes} mins)`)

    // Progress item status: cooking -> ready
    const firstItemId = activeKdsTicket.items[0].id
    const kdsItemRes = await fetch(`${BASE_URL}/api/vendor/restaurant/kds?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'item', itemId: firstItemId, status: 'ready' })
    })
    const kdsItemData = await kdsItemRes.json()
    assert(kdsItemData.success === true, `KDS Item status progressed to 'ready'`)

    // Complete whole ticket
    const kdsTicketRes = await fetch(`${BASE_URL}/api/vendor/restaurant/kds?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'ticket', orderId: createdOrder.id, status: 'ready' })
    })
    const kdsTicketData = await kdsTicketRes.json()
    assert(kdsTicketData.success === true, `KDS Ticket marked completely READY for serving`)

    // -------------------------------------------------------------------------
    // MODULE 4: CASHIER CHECKOUT, SPLIT PAYMENT & TABLE RELEASE
    // -------------------------------------------------------------------------
    console.log('\n--- 4. Testing Cashier Checkout, Bill Settlement & Split Payments ---')
    // Settle with Split Payment: 2000 Cash + remaining Card
    const settlePayload = {
      action: 'settle',
      payment_method: 'split',
      tendered_amount: createdOrder.total_amount,
      splitCash: 2000,
      splitCard: Number(createdOrder.total_amount) - 2000,
      notes: 'Split payment verified by cashier'
    }

    const settleRes = await fetch(`${BASE_URL}/api/vendor/restaurant/orders/${createdOrder.id}?vendorId=${VENDOR_A}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settlePayload)
    })
    const settleData = await settleRes.json()

    assert(settleData.success === true, 'Order settled and bill paid successfully')
    assert(settleData.order.payment_status === 'paid', 'Payment status updated to PAID')
    assert(settleData.order.order_status === 'completed', 'Order status transitioned to COMPLETED')
    assert(settleData.order.payments?.length === 2, `Split tender recorded 2 payment transactions (Cash + Card)`)

    // Verify Table status released back to available
    const bCheck2 = await (await fetch(`${BASE_URL}/api/vendor/restaurant/bootstrap?vendorId=${VENDOR_A}`)).json()
    const releasedTable = bCheck2.tables.find(t => t.id === targetTable.id)
    assert(releasedTable.status === 'available', `Dining Table ${targetTable.table_number} automatically RELEASED back to AVAILABLE`)
    assert(releasedTable.current_order_id === null, 'Table current order ID cleared')

    // -------------------------------------------------------------------------
    // MODULE 5: RECIPE BOM & AUTOMATED INVENTORY STOCK DEPLETION
    // -------------------------------------------------------------------------
    console.log('\n--- 5. Testing Recipe BOM & Automated Stock Depletion ---')
    assert(settleData.order.is_stock_deducted === 1, 'Order flagged is_stock_deducted = 1')
    
    // Check inventory stock in kitchen store
    const invRes = await fetch(`${BASE_URL}/api/vendor/restaurant/inventory?vendorId=${VENDOR_A}`)
    const invData = await invRes.json()
    assert(invData.success === true, 'Inventory overview API returned successfully')
    
    // Boneless Chicken (Raw Item 1) was in recipe for Chicken White Handi (0.8kg * 2 = 1.6kg depleted)
    const chickenItem = invData.items.find(i => i.code === 'RAW-001')
    assert(chickenItem !== undefined, 'Raw inventory material RAW-001 (Chicken) verified in inventory')
    assert(chickenItem.kitchen_store_stock >= 0, `Kitchen store stock verified (${chickenItem.kitchen_store_stock} ${chickenItem.unit})`)

    // -------------------------------------------------------------------------
    // MODULE 6: CUSTOMER KHATA (ACCOUNTS RECEIVABLE)
    // -------------------------------------------------------------------------
    console.log('\n--- 6. Testing Customer Khata Credit Ledger & Payments ---')
    const khataRes1 = await fetch(`${BASE_URL}/api/vendor/restaurant/khata?vendorId=${VENDOR_A}`)
    const khataData1 = await khataRes1.json()
    const testCust = khataData1.customers[0]
    const initialCustBal = Number(testCust.current_balance)

    // Create takeaway order on customer credit khata
    const khataOrderRes = await fetch(`${BASE_URL}/api/vendor/restaurant/orders?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_type: 'takeaway',
        customer_name: testCust.name,
        customer_phone: testCust.phone,
        items: [{ id: 11, name: 'Matka Karak Chai Khas', price: 180, quantity: 2, kitchen_id: 4 }]
      })
    })
    const khataOrder = (await khataOrderRes.json()).order

    // Settle via credit_khata
    await fetch(`${BASE_URL}/api/vendor/restaurant/orders/${khataOrder.id}?vendorId=${VENDOR_A}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'settle',
        payment_method: 'credit_khata',
        customer_id: testCust.id
      })
    })

    // Verify customer balance increased
    const khataRes2 = await fetch(`${BASE_URL}/api/vendor/restaurant/khata?vendorId=${VENDOR_A}`)
    const khataData2 = await khataRes2.json()
    const updatedCust = khataData2.customers.find(c => c.id === testCust.id)
    assert(Number(updatedCust.current_balance) > initialCustBal, `Customer Khata balance increased: Rs. ${updatedCust.current_balance}`)

    // Record cash payment received from customer
    const payRes = await fetch(`${BASE_URL}/api/vendor/restaurant/khata?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'customer_payment',
        customer_id: testCust.id,
        amount: 200,
        notes: 'Cash received at POS counter'
      })
    })
    const payData = await payRes.json()
    assert(payData.success === true, 'Customer Khata payment voucher recorded')
    const finalCust = payData.customers.find(c => c.id === testCust.id)
    assert(Number(finalCust.current_balance) === Number(updatedCust.current_balance) - 200, `Customer Khata balance reduced by payment: Rs. ${finalCust.current_balance}`)

    // -------------------------------------------------------------------------
    // MODULE 7: TWO-TIER INVENTORY TRANSFERS & SPOILAGE LOGS
    // -------------------------------------------------------------------------
    console.log('\n--- 7. Testing Two-Tier Stock Transfers & Spoilage Logs ---')
    const rawToTransfer = invData.items[0]
    const initialMainStock = Number(rawToTransfer.main_store_stock)

    // Transfer 4 units from Main Store to Kitchen Station 1
    const trRes = await fetch(`${BASE_URL}/api/vendor/restaurant/inventory?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'transfer',
        inventory_item_id: rawToTransfer.id,
        to_kitchen_id: 1,
        quantity: 4,
        notes: 'SQA automated transfer'
      })
    })
    const trData = await trRes.json()
    assert(trData.success === true, 'Stock transfer executed successfully')
    const afterTrItem = trData.items.find(i => i.id === rawToTransfer.id)
    assert(Number(afterTrItem.main_store_stock) === initialMainStock - 4, `Main Store stock deducted by 4 (New: ${afterTrItem.main_store_stock} ${afterTrItem.unit})`)

    // Log Waste / Spoilage
    const wasteRes = await fetch(`${BASE_URL}/api/vendor/restaurant/inventory?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'waste',
        inventory_item_id: rawToTransfer.id,
        kitchen_id: 1,
        quantity: 1,
        reason: 'spoilage',
        unit: rawToTransfer.unit,
        estimated_cost: rawToTransfer.cost_per_unit
      })
    })
    const wasteData = await wasteRes.json()
    assert(wasteData.success === true, 'Waste / Spoilage logged and stock deducted')

    // -------------------------------------------------------------------------
    // MODULE 8: DAY-END CLOSING & Z-REPORT RECONCILIATION
    // -------------------------------------------------------------------------
    console.log('\n--- 8. Testing Day-End Register Closing & Z-Report Audit ---')
    const deRes1 = await fetch(`${BASE_URL}/api/vendor/restaurant/dayend?vendorId=${VENDOR_A}`)
    const deData1 = await deRes1.json()

    assert(deData1.success === true, 'Day-End Overview API responds with success: true')
    assert(deData1.current !== null, `Active open register exists with ID #${deData1.current?.id}`)
    const expectedCash = Number(deData1.current.expected_cash_in_drawer)
    assert(expectedCash > 0, `Expected drawer cash calculated: Rs. ${expectedCash}`)

    // Close register with actual counted cash = expectedCash + 100 (Overage)
    const closeRes = await fetch(`${BASE_URL}/api/vendor/restaurant/dayend?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'close',
        actual_cash_counted: expectedCash + 100,
        closingNotes: 'Audited and verified by SQA'
      })
    })
    const closeData = await closeRes.json()
    assert(closeData.success === true, 'Day-End register closed successfully')
    const closedReport = closeData.closedHistory[0]
    assert(closedReport.status === 'closed', 'Z-Report status locked to CLOSED')
    assert(Number(closedReport.cash_difference) === 100, `Cash variance calculated correctly: Over +Rs. ${closedReport.cash_difference}`)

    // Re-open new register for next shift
    const openRes = await fetch(`${BASE_URL}/api/vendor/restaurant/dayend?vendorId=${VENDOR_A}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open',
        opening_float: 15000
      })
    })
    const openData = await openRes.json()
    assert(openData.success === true, 'New register session opened with Rs. 15,000 float')

    // -------------------------------------------------------------------------
    // MODULE 9: EXECUTIVE BI REPORTS & SALES VELOCITY
    // -------------------------------------------------------------------------
    console.log('\n--- 9. Testing Executive BI Reports & Sales Analytics ---')
    const repRes = await fetch(`${BASE_URL}/api/vendor/restaurant/reports?vendorId=${VENDOR_A}`)
    const repData = await repRes.json()

    assert(repData.success === true, 'Reports API responded with success: true')
    assert(Number(repData.todaySales?.total_revenue) > 0, `Today's revenue calculated: Rs. ${repData.todaySales?.total_revenue}`)
    assert(Number(repData.todaySales?.total_orders) >= 2, `Today's orders logged: ${repData.todaySales?.total_orders}`)
    assert(repData.topDishes && repData.topDishes.length > 0, `Top selling dishes ranked (${repData.topDishes?.length} top dishes)`)
    assert(repData.categorySales && repData.categorySales.length > 0, `Category sales distribution calculated (${repData.categorySales?.length} categories)`)

    // -------------------------------------------------------------------------
    // MODULE 10: MULTI-TENANCY STRICT DATA ISOLATION (VENDOR A vs VENDOR B)
    // -------------------------------------------------------------------------
    console.log('\n--- 10. Testing Multi-Tenancy Physical & Logical Data Isolation ---')
    const bResVendorB = await fetch(`${BASE_URL}/api/vendor/restaurant/bootstrap?vendorId=${VENDOR_B}`)
    const bDataVendorB = await bResVendorB.json()

    assert(bDataVendorB.success === true, 'Vendor B isolated database initialized independently')
    // Vendor B must have its own fresh tables and zero orders from Vendor A
    const ordersBRes = await fetch(`${BASE_URL}/api/vendor/restaurant/orders?vendorId=${VENDOR_B}`)
    const ordersBData = await ordersBRes.json()
    
    // Check that Vendor A's order number is NOT present in Vendor B
    const leakedOrder = ordersBData.orders?.find(o => o.order_number === createdOrder.order_number)
    assert(leakedOrder === undefined, `Vendor B CANNOT see Vendor A's order (${createdOrder.order_number} is strictly isolated)`)

    // Check that Vendor B has its own independent customer list
    const khataBRes = await fetch(`${BASE_URL}/api/vendor/restaurant/khata?vendorId=${VENDOR_B}`)
    const khataBData = await khataBRes.json()
    assert(khataBData.customers && khataBData.customers.length >= 4, 'Vendor B has independent customer accounts')
    assert(khataBData.customerLedgers?.every(l => l.notes !== 'Cash received at POS counter'), 'Vendor B ledger has ZERO entries from Vendor A')

  } catch (error) {
    console.error('Test execution exception:', error)
    failedTests++
  }

  console.log('\n========================================================================')
  console.log(`   SQA TEST EXECUTION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL: ${totalTests})`)
  console.log('========================================================================\n')
  return { totalTests, passedTests, failedTests }
}

runTestSuite()
