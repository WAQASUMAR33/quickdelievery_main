import { registerSseSubscriber } from '@/lib/realtime'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * GET /api/realtime/stream
 * Server-Sent Events (SSE) endpoint providing zero-latency push to browser clients
 */
export async function GET(request) {
  const encoder = new TextEncoder()

  let unsubscribe = null
  let heartbeatInterval = null

  const stream = new ReadableStream({
    start(controller) {
      // Register this controller with our central event bus
      unsubscribe = registerSseSubscriber(controller)

      // Send immediate connection confirmation
      const initMessage = `event: connected\ndata: ${JSON.stringify({
        status: 'connected',
        timestamp: Date.now(),
      })}\n\n`
      controller.enqueue(encoder.encode(initMessage))

      // Keep connection alive through NATs/proxies with a ping comment every 15s
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'))
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval)
        }
      }, 15000)
    },
    cancel() {
      if (unsubscribe) unsubscribe()
      if (heartbeatInterval) clearInterval(heartbeatInterval)
    },
  })

  // Handle client disconnect
  request.signal.addEventListener('abort', () => {
    if (unsubscribe) unsubscribe()
    if (heartbeatInterval) clearInterval(heartbeatInterval)
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform, no-store',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disables proxy buffering on NGINX/Amplify
    },
  })
}
