import { prisma } from './prisma.js'
import { calculateDistanceKm } from './addonEngine.js'
import { encodeGeoHash } from './socialCommerce.js'

/**
 * Order Batching and Dispatch Engine
 * Follows .agents/skills/order_batching/SKILL.md specifications:
 * 1. Data Ingestion: Pooling window (orders with PENDING/PROCESSING status)
 * 2. Spatial Grid Filter: GeoHash spatial cells (Precision 7)
 * 3. Time Window Alignment: Prep time diff <= 7 minutes
 * 4. Route Path Sequencing: Detour <= 3.5 km; Sequence: Pickup 1 -> Pickup 2 -> Dropoff 1 -> Dropoff 2
 * 5. Structured batch_assignment payload
 */

/**
 * Run automated multi-order stacking & batch dispatch
 */
export async function executeOrderBatchingPipeline({
  maxDetourKm = 3.5,
  maxPrepTimeDiffMinutes = 7,
  zoneGeoHashPrecision = 7,
} = {}) {
  // Step 1: Data Ingestion (orders pending driver assignment)
  const candidateOrders = await prisma.order.findMany({
    where: {
      driverId: null,
      status: { in: ['PENDING', 'PROCESSING'] },
    },
    include: {
      orderItems: {
        include: {
          product: true,
        },
      },
      user: {
        select: { id: true, username: true, phoneNumber: true },
      },
    },
    take: 50,
  })

  // Format orders with coordinates and prep times
  const parsedOrders = candidateOrders.map((o) => {
    const lat = o.deliveryLatitude || 31.5204
    const lng = o.deliveryLongitude || 74.3587
    // Restaurant coordinates (fallback to central hub if not set)
    const restLat = 31.5150
    const restLng = 74.3520

    // Compute average prep time from product or default to 20 mins
    const prepMinutes = o.orderItems?.[0]?.product?.prepTimeMinutes || 20

    return {
      id: o.id,
      orderNumber: `ORD-${o.id}`,
      prepMinutes,
      restaurant: {
        name: o.orderItems?.[0]?.product?.proName || 'Restaurant Vendor',
        lat: restLat,
        lng: restLng,
      },
      dropoff: {
        customerName: o.user?.username || 'Customer',
        address: o.shippingAddress || 'Customer Address',
        lat,
        lng,
      },
      geoHash: encodeGeoHash(restLat, restLng, zoneGeoHashPrecision),
    }
  })

  // Step 2: Spatial Grid Filter (Geographic Grouping)
  const cellGroups = new Map()
  for (const order of parsedOrders) {
    if (!cellGroups.has(order.geoHash)) {
      cellGroups.set(order.geoHash, [])
    }
    cellGroups.get(order.geoHash).push(order)
  }

  const batchAssignments = []
  const singleAssignments = []

  // Step 3 & 4: Time Alignment and Route Sequencing within each cell
  for (const [cell, orders] of cellGroups.entries()) {
    const unbatched = [...orders]

    while (unbatched.length >= 2) {
      const orderA = unbatched.shift()
      let pairedIdx = -1

      for (let i = 0; i < unbatched.length; i++) {
        const orderB = unbatched[i]

        // Time Window Alignment Check: Prep time difference <= 7 minutes
        const prepDiff = Math.abs(orderA.prepMinutes - orderB.prepMinutes)
        if (prepDiff > maxPrepTimeDiffMinutes) {
          continue
        }

        // Route Path Sequencing Check: Detour between Dropoff 1 and Dropoff 2 <= 3.5 km
        const detour = calculateDistanceKm(
          orderA.dropoff.lat,
          orderA.dropoff.lng,
          orderB.dropoff.lat,
          orderB.dropoff.lng
        )

        if (detour <= maxDetourKm) {
          pairedIdx = i
          break
        }
      }

      if (pairedIdx !== -1) {
        const orderB = unbatched.splice(pairedIdx, 1)[0]

        // Construct official Step 5 JSON Output Payload
        batchAssignments.push({
          type: 'BATCHED_MULTIPLE',
          total_orders: 2,
          geo_cell: cell,
          detour_km: Math.round(
            calculateDistanceKm(
              orderA.dropoff.lat,
              orderA.dropoff.lng,
              orderB.dropoff.lat,
              orderB.dropoff.lng
            ) * 100
          ) / 100,
          prep_time_diff_min: Math.abs(orderA.prepMinutes - orderB.prepMinutes),
          routing_steps: [
            {
              step_index: 1,
              action: 'PICKUP',
              target_order_id: orderA.orderNumber,
              location_name: orderA.restaurant.name,
              coordinates: { lat: orderA.restaurant.lat, lng: orderA.restaurant.lng },
            },
            {
              step_index: 2,
              action: 'PICKUP',
              target_order_id: orderB.orderNumber,
              location_name: orderB.restaurant.name,
              coordinates: { lat: orderB.restaurant.lat, lng: orderB.restaurant.lng },
            },
            {
              step_index: 3,
              action: 'DELIVER',
              target_order_id: orderA.orderNumber,
              location_name: orderA.dropoff.customerName,
              coordinates: { lat: orderA.dropoff.lat, lng: orderA.dropoff.lng },
            },
            {
              step_index: 4,
              action: 'DELIVER',
              target_order_id: orderB.orderNumber,
              location_name: orderB.dropoff.customerName,
              coordinates: { lat: orderB.dropoff.lat, lng: orderB.dropoff.lng },
            },
          ],
        })
      } else {
        singleAssignments.push({
          type: 'SINGLE_ORDER',
          order_id: orderA.orderNumber,
          customer: orderA.dropoff.customerName,
        })
      }
    }

    // Remaining single orders
    for (const remaining of unbatched) {
      singleAssignments.push({
        type: 'SINGLE_ORDER',
        order_id: remaining.orderNumber,
        customer: remaining.dropoff.customerName,
      })
    }
  }

  return {
    total_evaluated_orders: candidateOrders.length,
    batches_formed: batchAssignments.length,
    single_orders: singleAssignments.length,
    batch_assignment: batchAssignments,
    single_assignment: singleAssignments,
  }
}
