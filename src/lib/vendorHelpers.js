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
    business?.category?.name ||
    business?.category?.categoryName ||
    userData?.category?.name ||
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

  if (vertical === 'GROCERY' || vertical === 'SHOP' || vertical === 'RETAIL' || vertical === 'STORE') return false

  // Check if type, category, or business name matches shop/retail keywords first
  const shopKeywords = [
    'shop',
    'shops',
    'store',
    'mart',
    'supermarket',
    'grocery',
    'groceries',
    'retail',
    'pharmacy',
    'electronics',
    'clothing',
    'fashion',
    'boutique',
    'general store',
    'hardware',
    'bookstore',
    'stationery',
    'mobile',
  ]

  const isShopType = shopKeywords.some((k) => typeTitle.includes(k))
  const isShopCat = shopKeywords.some((k) => catName.includes(k))
  const isShopName = shopKeywords.some((k) => bizName.includes(k))

  if (isShopType || isShopCat) return false

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
    'kitchen',
  ]

  const isFoodType = foodKeywords.some((k) => typeTitle.includes(k))
  const isFoodCat = foodKeywords.some((k) => catName.includes(k))

  if (isFoodType || isFoodCat) return true
  if (isShopName) return false

  if (vertical === 'FOOD') return true

  return false
}
