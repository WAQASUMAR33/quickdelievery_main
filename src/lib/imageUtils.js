/**
 * Utility functions for handling product images
 */

/**
 * Normalizes an image URL, automatically converting private S3 bucket URLs to CloudFront CDN
 */
export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''

  // Convert raw S3 URLs pointing to rapidtechpro bucket to CloudFront CDN
  if (
    trimmed.includes('rapidtechpro.s3') ||
    (trimmed.includes('s3.') && trimmed.includes('rapidtechpro'))
  ) {
    try {
      const u = new URL(trimmed)
      let p = u.pathname.replace(/^\/+/, '')
      if (p.startsWith('rapidtechpro/')) {
        p = p.substring('rapidtechpro/'.length)
      }
      return `https://d1nvnelpyr43e7.cloudfront.net/${p}`
    } catch {
      return trimmed
        .replace(/https:\/\/[^/]*s3[^/]*\/rapidtechpro\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
        .replace(/https:\/\/rapidtechpro\.s3[^/]*\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
    }
  }

  return trimmed
}

/**
 * Safely parse product images from JSON string or return array
 * @param {string|array|null} proImages - The proImages field from database
 * @returns {array} - Array of image URLs or empty array
 */
export function parseProductImages(proImages) {
  if (!proImages) return []
  
  try {
    let list = []
    if (Array.isArray(proImages)) {
      list = proImages
    } else if (typeof proImages === 'string') {
      const trimmed = proImages.trim()
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        const parsed = JSON.parse(trimmed)
        list = Array.isArray(parsed) ? parsed : [parsed]
      } else if (trimmed.startsWith('http')) {
        list = [trimmed]
      }
    }
    return list.filter(Boolean).map(normalizeImageUrl)
  } catch (error) {
    if (typeof proImages === 'string' && proImages.startsWith('http')) {
      return [normalizeImageUrl(proImages)]
    }
    console.warn('Error parsing product images:', error)
    return []
  }
}

/**
 * Get the first image from product images
 * @param {string|array|null} proImages - The proImages field from database
 * @returns {string|null} - First image URL or null
 */
export function getFirstProductImage(proImages) {
  const images = parseProductImages(proImages)
  return images.length > 0 ? images[0] : null
}

/**
 * Check if product has images
 * @param {string|array|null} proImages - The proImages field from database
 * @returns {boolean} - True if product has images
 */
export function hasProductImages(proImages) {
  const images = parseProductImages(proImages)
  return images.length > 0
}
