/**
 * Helper to determine if a vendor is a Restaurant / Food establishment vs Shop / Retail store.
 */
export function isRestaurantVendor(userData, business) {
  const typeTitle = (
    business?.businessType?.typeTitle ||
    business?.businessType?.name ||
    userData?.businessType?.typeTitle ||
    userData?.businessType?.name ||
    userData?.business?.businessType?.typeTitle ||
    userData?.business?.businessType?.name ||
    userData?.vendorType ||
    ''
  ).toLowerCase().trim()

  const catName = (
    business?.businessCategory?.categoryName ||
    business?.businessCategory?.name ||
    userData?.businessCategory?.categoryName ||
    userData?.businessCategory?.name ||
    userData?.business?.businessCategory?.categoryName ||
    ''
  ).toLowerCase().trim()

  const bizName = (
    business?.businessName ||
    userData?.businessName ||
    userData?.business?.businessName ||
    ''
  ).toLowerCase().trim()

  const vertical = (
    business?.vertical ||
    userData?.vertical ||
    userData?.business?.vertical ||
    ''
  ).toUpperCase().trim()

  if (vertical === 'FOOD') return true
  if (vertical === 'GROCERY' || vertical === 'SHOP' || vertical === 'RETAIL') return false

  // Check if type or category matches restaurant/food keywords
  const foodKeywords = [
    'restaurant',
    'cafe',
    'fast food',
    'bakery',
    'dining',
    'eatery',
    'pizza',
    'burger',
    'food',
    'dhaba',
    'bbq',
    'grill',
    'sweets',
    'bistro',
    'canteen',
    'takeaway',
  ]

  const isFoodType = foodKeywords.some((k) => typeTitle.includes(k))
  const isFoodCat = foodKeywords.some((k) => catName.includes(k))

  if (isFoodType || isFoodCat) return true

  // Default fallback for vendor dashboard if restaurant is the primary platform vendor role or if type contains restaurant
  return false
}
