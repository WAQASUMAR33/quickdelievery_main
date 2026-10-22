/**
 * Central Realtime Event Bus for QuickDelivery
 * Zero-cost, native SSE (Server-Sent Events) + Delta Sync
 * Allows any server mutation to instantly push updates to all connected browser clients.
 */

// In-memory ring buffer of recent events to support delta sync and reconnection
const MAX_EVENT_HISTORY = 100
const eventHistory = globalThis.__quickDeliveryRealtimeHistory || []
globalThis.__quickDeliveryRealtimeHistory = eventHistory

// Set of active SSE stream controllers
const sseSubscribers = globalThis.__quickDeliverySseSubscribers || new Set()
globalThis.__quickDeliverySseSubscribers = sseSubscribers

/**
 * Broadcast an event to all connected clients
 * @param {string} type - Event type (e.g. 'ORDER_UPDATED', 'NEW_MESSAGE', 'DRIVER_LOCATION', 'PRODUCT_UPDATED')
 * @param {object} payload - Event data
 */
export function broadcastRealtimeEvent(type, payload = {}) {
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    timestamp: Date.now(),
  }

  // Store in circular buffer
  eventHistory.push(event)
  if (eventHistory.length > MAX_EVENT_HISTORY) {
    eventHistory.shift()
  }

  // Broadcast to all active SSE subscribers
  const encoder = new TextEncoder()
  const payloadString = `event: message\ndata: ${JSON.stringify(event)}\n\n`
  const encodedData = encoder.encode(payloadString)

  const deadControllers = []
  for (const controller of sseSubscribers) {
    try {
      controller.enqueue(encodedData)
    } catch {
      deadControllers.push(controller)
    }
  }

  // Clean up any closed connections
  for (const dead of deadControllers) {
    sseSubscribers.delete(dead)
  }

  return event
}

/**
 * Register an active SSE subscriber controller
 */
export function registerSseSubscriber(controller) {
  sseSubscribers.add(controller)
  return () => {
    sseSubscribers.delete(controller)
  }
}

/**
 * Get recent events since a timestamp (used for delta sync / recovery)
 */
export function getRecentEvents(sinceTimestamp = 0) {
  const since = parseInt(sinceTimestamp, 10) || 0
  return eventHistory.filter((e) => e.timestamp > since)
}
