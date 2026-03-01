/**
 * Utility functions for handling product images
 */

/**
 * Safely parse product images from JSON string or return array
 * @param {string|array|null} proImages - The proImages field from database
 * @returns {array} - Array of image URLs or empty array
 */
export function parseProductImages(proImages) {
  if (!proImages) return []
  
  try {
    // If it's already an array, return it
    if (Array.isArray(proImages)) {
      return proImages
    }
    
    // If it's a string, try to parse it as JSON
    if (typeof proImages === 'string') {
      const parsed = JSON.parse(proImages)
      return Array.isArray(parsed) ? parsed : []
    }
    
    return []
  } catch (error) {
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
