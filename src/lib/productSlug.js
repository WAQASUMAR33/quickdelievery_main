/**
 * Utility functions for SEO-friendly product slugs.
 * Converts names like "Logitech MX Keys S Wireless Keyboard" + id 69
 * into "logitech-mx-keys-s-wireless-keyboard-69"
 * and safely parses both legacy numeric IDs and slugified URLs.
 */

export function slugify(text) {
  if (!text) return 'item'
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\u2012\u2013\u2014\u2015]/g, '-') // Normalize en-dash, em-dash to hyphen
    .replace(/[^\w\s-]/g, '')                    // Remove non-word chars
    .replace(/[\s_-]+/g, '-')                    // Replace spaces & underscores with single dash
    .replace(/^-+|-+$/g, '')                     // Trim leading/trailing dashes
}

export function getProductSlug(product) {
  if (!product) return ''
  // If a number or numeric string was passed directly
  if (typeof product === 'number' || (typeof product === 'string' && /^\d+$/.test(product.trim()))) {
    return product.toString().trim()
  }
  const id = product.proId ?? product.id ?? product.pro_id ?? product.productId
  const name = product.proName || product.name || product.pro_name || product.title || 'product'
  const slug = slugify(name)
  return id ? `${slug}-${id}` : slug
}

export function getProductUrl(product) {
  if (!product) return '/customer'
  return `/product/${getProductSlug(product)}`
}

export function parseProductSlug(param) {
  if (!param) return { id: null, raw: '' }
  const clean = decodeURIComponent(param).trim()
  
  // If purely numeric, e.g. "69"
  if (/^\d+$/.test(clean)) {
    return { id: parseInt(clean, 10), isLegacyId: true, slug: null, raw: clean }
  }

  // If slug has trailing ID, e.g. "logitech-mx-keys-s-69"
  const trailingMatch = clean.match(/-(\d+)$/)
  if (trailingMatch) {
    return { id: parseInt(trailingMatch[1], 10), isLegacyId: false, slug: clean, raw: clean }
  }

  // Pure slug without ID, e.g. "logitech-mx-keys-s"
  return { id: null, isLegacyId: false, slug: clean, raw: clean }
}
