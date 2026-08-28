import { NextResponse } from 'next/server'
import {
  sendPushToToken,
  sendPushToTopic,
  sendOrderStatusPushNotification,
} from '@/lib/firebaseAdmin'

export const dynamic = 'force-dynamic'

/**
 * POST /api/notifications/send
 * Body:
 * - For order status: { orderId, status, customTitle, customBody }
 * - For direct token: { token, title, body, data }
 * - For topic: { topic, title, body, data }
 */
export async function POST(request) {
  try {
    const body = await request.json()
    const { orderId, status, token, topic, title, body: msgBody, data = {}, customTitle, customBody } = body

    // 1. Order Status Notification
    if (orderId && status) {
      const result = await sendOrderStatusPushNotification({
        orderId,
        status,
        customTitle: title || customTitle,
        customBody: msgBody || customBody,
      })
      return NextResponse.json(result)
    }

    // 2. Direct Token Notification
    if (token) {
      if (!title || !msgBody) {
        return NextResponse.json(
          { success: false, error: 'title and body are required for direct token push' },
          { status: 400 }
        )
      }
      const result = await sendPushToToken(token, { title, body: msgBody, data })
      return NextResponse.json(result)
    }

    // 3. Topic Notification
    if (topic) {
      if (!title || !msgBody) {
        return NextResponse.json(
          { success: false, error: 'title and body are required for topic push' },
          { status: 400 }
        )
      }
      const result = await sendPushToTopic(topic, { title, body: msgBody, data })
      return NextResponse.json(result)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Provide either (orderId & status), token, or topic to send notification',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error sending push notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
