import { getRecentEvents } from '@/lib/realtime'

export const dynamic = 'force-dynamic'

/**
 * GET /api/realtime/sync?since=<timestamp>
 * Fallback delta-sync endpoint for cold starts, reconnection, or polling recovery
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const since = searchParams.get('since') || 0

    const events = getRecentEvents(since)

    return Response.json({
      success: true,
      timestamp: Date.now(),
      events,
    })
  } catch (error) {
    console.error('Error in realtime sync:', error)
    return Response.json({ success: false, error: 'Sync failed' }, { status: 500 })
  }
}
