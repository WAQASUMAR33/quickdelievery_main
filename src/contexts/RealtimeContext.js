'use client'

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'

const RealtimeContext = createContext({
  isConnected: false,
  lastEvent: null,
  broadcastClientEvent: () => {},
})

const EVENT_NAME = 'quickdelivery:realtime'
const BROADCAST_CHANNEL_NAME = 'quickdelivery_realtime_channel'

export function RealtimeProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState(null)
  const lastTimestampRef = useRef(Date.now())
  const eventSourceRef = useRef(null)
  const broadcastChannelRef = useRef(null)
  const reconnectTimeoutRef = useRef(null)

  // Dispatch an incoming event to window and state
  const handleIncomingEvent = useCallback((event) => {
    if (!event || !event.type) return

    // Update last event & timestamp
    setLastEvent(event)
    if (event.timestamp) {
      lastTimestampRef.current = Math.max(lastTimestampRef.current, event.timestamp)
    }

    // Broadcast across custom DOM event for all active React hooks
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: event }))
    }
  }, [])

  // Setup BroadcastChannel for cross-tab instant synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
        broadcastChannelRef.current = bc
        bc.onmessage = (msg) => {
          if (msg?.data) {
            handleIncomingEvent(msg.data)
          }
        }
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported or restricted:', e)
    }

    return () => {
      broadcastChannelRef.current?.close()
    }
  }, [handleIncomingEvent])

  // Setup Server-Sent Events (SSE) connection
  useEffect(() => {
    if (typeof window === 'undefined') return

    let isSubscribed = true

    const connectSSE = () => {
      if (!isSubscribed) return

      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }

      try {
        const es = new EventSource('/api/realtime/stream')
        eventSourceRef.current = es

        es.addEventListener('connected', () => {
          if (isSubscribed) setIsConnected(true)
        })

        es.addEventListener('message', (e) => {
          if (!isSubscribed) return
          try {
            const event = JSON.parse(e.data)
            handleIncomingEvent(event)

            // Echo to other tabs via BroadcastChannel
            try {
              broadcastChannelRef.current?.postMessage(event)
            } catch {
              // ignore cross-tab transfer errors
            }
          } catch (err) {
            console.error('Error parsing realtime SSE payload:', err)
          }
        })

        es.onerror = () => {
          if (isSubscribed) {
            setIsConnected(false)
            es.close()
            // Reconnect with 4-second backoff
            if (!reconnectTimeoutRef.current) {
              reconnectTimeoutRef.current = setTimeout(() => {
                reconnectTimeoutRef.current = null
                connectSSE()
              }, 4000)
            }
          }
        }
      } catch (err) {
        console.error('Failed to create EventSource:', err)
        if (isSubscribed) {
          reconnectTimeoutRef.current = setTimeout(connectSSE, 5000)
        }
      }
    }

    connectSSE()

    // Delta-sync catchup when window regains visibility
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        try {
          const res = await fetch(`/api/realtime/sync?since=${lastTimestampRef.current}`)
          const data = await res.json()
          if (data.success && Array.isArray(data.events)) {
            for (const evt of data.events) {
              handleIncomingEvent(evt)
            }
          }
        } catch {
          // ignore delta sync error
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isSubscribed = false
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [handleIncomingEvent])

  // Allow client components to broadcast a local event to other tabs
  const broadcastClientEvent = useCallback(
    (type, payload = {}) => {
      const event = {
        id: `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        type,
        payload,
        timestamp: Date.now(),
      }
      handleIncomingEvent(event)
      try {
        broadcastChannelRef.current?.postMessage(event)
      } catch {
        // ignore
      }
    },
    [handleIncomingEvent]
  )

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEvent, broadcastClientEvent }}>
      {children}
    </RealtimeContext.Provider>
  )
}

/**
 * Custom React hook to listen for specific realtime event types.
 * @param {string|string[]} eventTypes - Event type or array of types (e.g. 'ORDER_UPDATED' or ['ORDER_UPDATED', 'ORDER_CREATED'])
 * @param {Function} callback - Callback function receiving (payload, fullEvent)
 */
export function useRealtimeEvent(eventTypes, callback) {
  const callbackRef = useRef(callback)
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const types = Array.isArray(eventTypes) ? eventTypes : [eventTypes]

    const handleEvent = (customEvent) => {
      const detail = customEvent.detail
      if (!detail || !types.includes(detail.type)) return

      if (callbackRef.current) {
        callbackRef.current(detail.payload, detail)
      }
    }

    window.addEventListener(EVENT_NAME, handleEvent)
    return () => {
      window.removeEventListener(EVENT_NAME, handleEvent)
    }
  }, [eventTypes])
}

export function useRealtime() {
  return useContext(RealtimeContext)
}
