import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    // Get all users (for admin/vendor management)
    const users = await prisma.users.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    return Response.json({ 
      success: true, 
      data: users 
    })
  } catch (error) {
    console.error('Database error:', error)
    return Response.json({ error: 'Database error' }, { status: 500 })
  }
}
