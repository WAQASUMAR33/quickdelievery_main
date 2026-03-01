import { authenticateRequest } from '@/lib/auth-server'

export async function GET(request) {
  try {
    const user = await authenticateRequest(request)
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    return Response.json({
      success: true,
      user: userWithoutPassword
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 401 })
  }
}
