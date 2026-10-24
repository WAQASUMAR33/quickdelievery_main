/**
 * Check if the authenticated user is a Vendor whose business category is "RESTAURANT"
 * Evaluates businessCategory.categoryTitle, category.name, businessType, and vertical.
 */
export function isRestaurantVendor(userData) {
  if (!userData) return false
  // Must have role VENDOR
  if (userData.role !== 'VENDOR') return false

  const candidates = [
    userData?.business?.businessCategory?.categoryTitle,
    userData?.business?.category?.name,
    userData?.business?.businessType?.typeTitle,
    userData?.businessCategory,
    userData?.category,
    userData?.business?.vertical,
    userData?.vertical,
    userData?.businessName,
    userData?.storeName,
  ].filter(Boolean).map(s => String(s).toUpperCase())

  // Matches if category is RESTAURANT, or vertical is FOOD/DINING
  return candidates.some(c => 
    c.includes('RESTAURANT') || 
    c.includes('FOOD') || 
    c.includes('CAFE') || 
    c.includes('DINING') ||
    c.includes('CHAI') ||
    c.includes('GRILL')
  )
}
