import { getApps, initializeApp, cert, getApp } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { prisma } from '@/lib/prisma'

function formatPrivateKey(key) {
  if (!key) return undefined
  return key.replace(/\\n/g, '\n')
}

function initFirebaseAdmin() {
  try {
    if (getApps().length > 0) {
      return getApp()
    }

    const projectId =
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      'quickdelievery-a86be'
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY)

    if (clientEmail && privateKey) {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      })
    } else {
      return initializeApp({
        projectId,
      })
    }
  } catch (error) {
    console.error('⚠️ [FirebaseAdmin] Init note:', error.message)
    return null
  }
}

// Lazy/safe initialization
export function getFirebaseAdminMessaging() {
  try {
    initFirebaseAdmin()
    return getMessaging()
  } catch (error) {
    console.error('⚠️ [FirebaseAdmin] getMessaging error:', error.message)
    return null
  }
}

/**
 * Send push notification to a single FCM device token
 */
export async function sendPushToToken(token, { title, body, data = {}, imageUrl = null }) {
  if (!token) return { success: false, error: 'No token provided' }
  try {
    const messaging = getFirebaseAdminMessaging()
    if (!messaging) {
      return { success: false, error: 'Firebase messaging not initialized' }
    }

    const message = {
      token,
      notification: {
        title,
        body,
        ...(imageUrl ? { imageUrl } : {}),
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'orders_channel',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }

    const response = await messaging.send(message)
    console.log(`✅ [FCM] Notification sent to token ${token.slice(0, 10)}...:`, response)
    return { success: true, messageId: response }
  } catch (error) {
    console.error('❌ [FCM] Error sending push to token:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send push notification to a topic (e.g. topic "order_123" or "user_5")
 */
export async function sendPushToTopic(topic, { title, body, data = {} }) {
  if (!topic) return { success: false, error: 'No topic provided' }
  try {
    const messaging = getFirebaseAdminMessaging()
    if (!messaging) {
      return { success: false, error: 'Firebase messaging not initialized' }
    }

    const cleanTopic = topic.replace(/[^a-zA-Z0-9-_.~%]+/g, '_')
    const message = {
      topic: cleanTopic,
      notification: {
        title,
        body,
      },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v ?? '')])
      ),
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'orders_channel',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    }

    const response = await messaging.send(message)
    console.log(`✅ [FCM] Notification sent to topic "${cleanTopic}":`, response)
    return { success: true, messageId: response }
  } catch (error) {
    console.error(`❌ [FCM] Error sending push to topic "${topic}":`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Helper to build user-friendly status copy
 */
export function getStatusNotificationCopy(status, orderId) {
  const s = String(status || '').toUpperCase()
  switch (s) {
    case 'PROCESSING':
      return {
        title: '🍳 Order is Preparing',
        body: `Your order #${orderId} is currently being prepared!`,
      }
    case 'SHIPPED':
      return {
        title: '🛵 Order Dispatched',
        body: `Your order #${orderId} has been picked up and is on the way!`,
      }
    case 'DELIVERED':
      return {
        title: '🎉 Order Delivered',
        body: `Your order #${orderId} has been successfully delivered. Enjoy!`,
      }
    case 'CANCELLED':
      return {
        title: '❌ Order Cancelled',
        body: `Your order #${orderId} has been cancelled.`,
      }
    case 'PENDING':
      return {
        title: '⏳ Order Received',
        body: `Your order #${orderId} has been received and is waiting confirmation.`,
      }
    default:
      return {
        title: `Order Status: ${status}`,
        body: `Your order #${orderId} status is now ${status}.`,
      }
  }
}

/**
 * Send automated push notifications when an order status changes
 */
export async function sendOrderStatusPushNotification({ orderId, status, customTitle, customBody }) {
  try {
    if (!orderId) return { success: false, error: 'orderId is required' }

    // Fetch order with user info
    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId, 10) },
      include: {
        user: {
          select: {
            id: true,
            uid: true,
            username: true,
          },
        },
      },
    })

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    // Lookup user's direct FCM Token from database
    let directFcmToken = null
    if (order.userId) {
      try {
        const rows = await prisma.$queryRawUnsafe(
          'SELECT `fcm_token` FROM `users` WHERE `id` = ? LIMIT 1',
          order.userId
        )
        if (rows && rows.length > 0 && rows[0].fcm_token) {
          directFcmToken = rows[0].fcm_token
        }
      } catch (dbErr) {
        console.warn('⚠️ [FCM] Could not query fcm_token from db:', dbErr.message)
      }
    }

    const defaultCopy = getStatusNotificationCopy(status, order.id)
    const title = customTitle || defaultCopy.title
    const body = customBody || defaultCopy.body

    const notificationData = {
      orderId: String(order.id),
      status: String(status || order.status),
      vertical: String(order.vertical || 'FOOD'),
      type: 'ORDER_STATUS_UPDATE',
      click_action: 'FLUTTER_NOTIFICATION_CLICK',
    }

    const results = []

    // 1. Send to User direct FCM Token if saved in database
    if (directFcmToken) {
      const userRes = await sendPushToToken(directFcmToken, {
        title,
        body,
        data: notificationData,
      })
      results.push({ target: 'user_device_token', ...userRes })
    }

    // 2. Send to order-specific topic: order_<id>
    const orderTopicRes = await sendPushToTopic(`order_${order.id}`, {
      title,
      body,
      data: notificationData,
    })
    results.push({ target: `topic_order_${order.id}`, ...orderTopicRes })

    // 3. Send to user-specific topic: user_<userId>
    if (order.userId) {
      const userTopicRes = await sendPushToTopic(`user_${order.userId}`, {
        title,
        body,
        data: notificationData,
      })
      results.push({ target: `topic_user_${order.userId}`, ...userTopicRes })
    }

    return {
      success: true,
      title,
      body,
      results,
    }
  } catch (error) {
    console.error('❌ [FCM] sendOrderStatusPushNotification error:', error)
    return { success: false, error: error.message }
  }
}
