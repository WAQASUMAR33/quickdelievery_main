/**
 * Quick Delivery Multi-Country Currency Utility
 */

export const COUNTRY_CURRENCIES = {
  PK: {
    code: 'PK',
    name: 'Pakistan',
    currency: 'PKR',
    symbol: 'Rs. ',
    symbolPrefix: true,
    decimals: 0, // Pakistan commonly formats whole rupees without decimals or with 2 decimals
    flag: '🇵🇰',
  },
  US: {
    code: 'US',
    name: 'United States',
    currency: 'USD',
    symbol: '$',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇺🇸',
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    currency: 'GBP',
    symbol: '£',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇬🇧',
  },
  AE: {
    code: 'AE',
    name: 'United Arab Emirates',
    currency: 'AED',
    symbol: 'AED ',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇦🇪',
  },
  SA: {
    code: 'SA',
    name: 'Saudi Arabia',
    currency: 'SAR',
    symbol: 'SAR ',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇸🇦',
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    currency: 'CAD',
    symbol: 'CA$',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇨🇦',
  },
  IN: {
    code: 'IN',
    name: 'India',
    currency: 'INR',
    symbol: '₹',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇮🇳',
  },
  EU: {
    code: 'EU',
    name: 'Eurozone',
    currency: 'EUR',
    symbol: '€',
    symbolPrefix: true,
    decimals: 2,
    flag: '🇪🇺',
  },
}

export const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_COUNTRY || 'PK'

/**
 * Detect country code from shipping address or text
 */
export function detectCountryFromAddress(address) {
  if (!address || typeof address !== 'string') return null
  const addr = address.toLowerCase()

  // Pakistan detection
  if (
    addr.includes('pakistan') ||
    addr.includes('lahore') ||
    addr.includes('karachi') ||
    addr.includes('islamabad') ||
    addr.includes('rawalpindi') ||
    addr.includes('faisalabad') ||
    addr.includes('multan') ||
    addr.includes('peshawar') ||
    addr.includes('punjab') ||
    addr.includes('sindh') ||
    addr.includes('kpk') ||
    addr.includes('balochistan') ||
    addr.includes('pk')
  ) {
    return 'PK'
  }

  // USA detection
  if (
    addr.includes('united states') ||
    addr.includes('usa') ||
    addr.includes('america') ||
    addr.includes('california') ||
    addr.includes('new york') ||
    addr.includes('texas') ||
    addr.includes('florida') ||
    addr.includes('us')
  ) {
    return 'US'
  }

  // UAE detection
  if (addr.includes('uae') || addr.includes('dubai') || addr.includes('abu dhabi') || addr.includes('sharjah') || addr.includes('emirates')) {
    return 'AE'
  }

  // Saudi detection
  if (addr.includes('saudi') || addr.includes('riyadh') || addr.includes('jeddah') || addr.includes('dammam') || addr.includes('ksa')) {
    return 'SA'
  }

  // UK detection
  if (addr.includes('united kingdom') || addr.includes('uk') || addr.includes('london') || addr.includes('manchester') || addr.includes('birmingham')) {
    return 'GB'
  }

  // Canada detection
  if (addr.includes('canada') || addr.includes('toronto') || addr.includes('vancouver') || addr.includes('ontario')) {
    return 'CA'
  }

  // India detection
  if (addr.includes('india') || addr.includes('delhi') || addr.includes('mumbai') || addr.includes('bangalore')) {
    return 'IN'
  }

  return null
}

/**
 * Get active country selection from localStorage or default
 */
export function getActiveCountry() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('quickdelivery_country')
    if (saved && COUNTRY_CURRENCIES[saved.toUpperCase()]) {
      return saved.toUpperCase()
    }
  }
  return DEFAULT_COUNTRY
}

/**
 * Set active country selection in localStorage
 */
export function setActiveCountry(countryCode) {
  if (typeof window !== 'undefined' && countryCode) {
    const upper = countryCode.toUpperCase()
    if (COUNTRY_CURRENCIES[upper]) {
      localStorage.setItem('quickdelivery_country', upper)
      window.dispatchEvent(new Event('currency_change'))
    }
  }
}

/**
 * Main formatPrice function
 * @param {number|string} amount
 * @param {Object|string} [options] - Country code or { country, address, showDecimals }
 * @returns {string} Formatted price string (e.g. "Rs. 1,500" or "$15.00")
 */
export function formatPrice(amount, options = {}) {
  const num = parseFloat(amount) || 0

  let countryCode = null

  if (typeof options === 'string') {
    countryCode = options
  } else if (options && typeof options === 'object') {
    if (options.address) {
      countryCode = detectCountryFromAddress(options.address)
    }
    if (!countryCode && options.country) {
      countryCode = options.country
    }
  }

  if (!countryCode) {
    countryCode = getActiveCountry()
  }

  const config = COUNTRY_CURRENCIES[countryCode?.toUpperCase()] || COUNTRY_CURRENCIES.PK

  const decimals = options.showDecimals !== undefined 
    ? (options.showDecimals ? 2 : 0) 
    : (config.code === 'PK' ? (num % 1 === 0 ? 0 : 2) : config.decimals)

  const formattedNum = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return `${config.symbol}${formattedNum}`
}

export default formatPrice
