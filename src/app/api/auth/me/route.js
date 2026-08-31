import { authenticateRequest } from '@/lib/auth-server'
import { prisma } from '@/lib/prisma'

export async function GET(request) {
  try {
    const user = await authenticateRequest(request)
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = user

    let urlLogo = null
    let businessName = null
    let business = null

    if (user.email) {
      const biz = await prisma.business.findUnique({
        where: { email: user.email },
        include: {
          businessType: true,
          businessCategory: true,
        },
      })
      if (biz) {
        urlLogo = biz.urlLogo || null
        businessName = biz.businessName || null
        business = biz
      }
    }

    return Response.json({
      success: true,
      user: {
        ...userWithoutPassword,
        urlLogo,
        avatarUrl: urlLogo || null,
        photoURL: urlLogo || null,
        businessName: businessName || null,
        business,
        businessType: business?.businessType || null,
        businessCategory: business?.businessCategory || null,
      }
    })
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 401 })
  }
}

