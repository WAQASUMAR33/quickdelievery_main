import { prisma } from '@/lib/prisma'

/**
 * GET /api/orders/[id]/messages
 * Fetches all chat messages for a specific order
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params
    const orderId = parseInt(id, 10)

    if (!orderId || isNaN(orderId)) {
      return Response.json({ success: false, error: 'Valid Order ID is required' }, { status: 400 })
    }

    let db = prisma
    if (!db?.orderMessage) {
      const { PrismaClient } = await import('@prisma/client')
      db = new PrismaClient()
    }

    const messages = await db.orderMessage.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
    })

    return Response.json({ success: true, data: messages })
  } catch (error) {
    console.error('Error fetching order messages:', error)
    return Response.json({ success: false, error: 'Failed to fetch messages' }, { status: 500 })
  }
}

/**
 * POST /api/orders/[id]/messages
 * Sends a message from Customer or Driver
 * Body: { senderId: number, senderRole: 'CUSTOMER' | 'DRIVER', senderName: string, message: string }
 */
export async function POST(request, { params }) {
  try {
    const { id } = await params
    const orderId = parseInt(id, 10)
    const body = await request.json()
    const { senderId, senderRole, senderName, message } = body

    if (!orderId || !senderId || !senderRole || !message?.trim()) {
      return Response.json(
        { success: false, error: 'orderId, senderId, senderRole, and message are required' },
        { status: 400 }
      )
    }

    let db = prisma
    if (!db?.orderMessage) {
      const { PrismaClient } = await import('@prisma/client')
      db = new PrismaClient()
    }

    const newMessage = await db.orderMessage.create({
      data: {
        orderId,
        senderId: parseInt(senderId, 10),
        senderRole,
        senderName: senderName || (senderRole === 'DRIVER' ? 'Your Driver' : 'Customer'),
        message: message.trim(),
        isRead: false,
      },
    })

    return Response.json({ success: true, data: newMessage })
  } catch (error) {
    console.error('Error sending order message:', error)
    return Response.json({ success: false, error: 'Failed to send message' }, { status: 500 })
  }
}
