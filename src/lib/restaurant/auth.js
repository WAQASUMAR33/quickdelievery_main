import { getAuthUser } from '@/lib/auth-server'

export async function resolveVendorContext(request) {
  let vendorId = 'default_vendor'
  let user = null

  try {
    user = await getAuthUser(request)
    if (user) {
      vendorId = user.uid || user.email || `vendor_${user.id}`
    }
  } catch (err) {
    console.error('Failed to resolve auth user:', err)
  }

  // Fallback support for header or dev query parameter
  const headerVendor = request.headers?.get ? request.headers.get('x-vendor-id') : null
  if (!user && headerVendor) {
    vendorId = headerVendor
  }

  const url = new URL(request.url)
  const queryVendor = url.searchParams.get('vendorId')
  if (!user && !headerVendor && queryVendor) {
    vendorId = queryVendor
  }

  return { vendorId, user }
}
