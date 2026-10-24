/**
 * Comprehensive Country, State, Flag, and International Phone Formatter Engine
 */

export const COUNTRIES = [
  {
    code: 'PK',
    name: 'Pakistan',
    flag: '🇵🇰',
    dialCode: '+92',
    phoneMask: '### #######',
    placeholder: '300 1234567',
    digitsLength: 10,
    states: [
      'Punjab',
      'Sindh',
      'Khyber Pakhtunkhwa',
      'Balochistan',
      'Islamabad Capital Territory',
      'Gilgit-Baltistan',
      'Azad Jammu & Kashmir'
    ]
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    flag: '🇸🇦',
    dialCode: '+966',
    phoneMask: '## ### ####',
    placeholder: '50 123 4567',
    digitsLength: 9,
    states: [
      'Riyadh',
      'Makkah (Mecca)',
      'Eastern Province',
      'Madinah (Medina)',
      'Al-Qassim',
      'Asir',
      'Tabuk',
      'Hail',
      'Northern Borders',
      'Jazan',
      'Najran',
      'Al-Bahah',
      'Al-Jawf'
    ]
  },
  {
    code: 'AE',
    name: 'United Arab Emirates',
    flag: '🇦🇪',
    dialCode: '+971',
    phoneMask: '## ### ####',
    placeholder: '50 123 4567',
    digitsLength: 9,
    states: [
      'Dubai',
      'Abu Dhabi',
      'Sharjah',
      'Ajman',
      'Ras Al Khaimah',
      'Fujairah',
      'Umm Al Quwain'
    ]
  },
  {
    code: 'US',
    name: 'United States',
    flag: '🇺🇸',
    dialCode: '+1',
    phoneMask: '(###) ###-####',
    placeholder: '(555) 123-4567',
    digitsLength: 10,
    states: [
      'California', 'Texas', 'Florida', 'New York', 'Illinois', 'Pennsylvania',
      'Ohio', 'Georgia', 'North Carolina', 'Michigan', 'New Jersey', 'Virginia',
      'Washington', 'Arizona', 'Massachusetts', 'Tennessee', 'Indiana', 'Missouri',
      'Maryland', 'Wisconsin', 'Colorado', 'Minnesota', 'South Carolina', 'Alabama',
      'Louisiana', 'Kentucky', 'Oregon', 'Oklahoma', 'Connecticut', 'Utah', 'Iowa',
      'Nevada', 'Arkansas', 'Mississippi', 'Kansas', 'New Mexico', 'Nebraska', 'Idaho',
      'West Virginia', 'Hawaii', 'New Hampshire', 'Maine', 'Montana', 'Rhode Island',
      'Delaware', 'South Dakota', 'North Dakota', 'Alaska', 'District of Columbia', 'Vermont', 'Wyoming'
    ]
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    flag: '🇬🇧',
    dialCode: '+44',
    phoneMask: '#### ######',
    placeholder: '7911 123456',
    digitsLength: 10,
    states: [
      'England',
      'Scotland',
      'Wales',
      'Northern Ireland'
    ]
  },
  {
    code: 'CA',
    name: 'Canada',
    flag: '🇨🇦',
    dialCode: '+1',
    phoneMask: '(###) ###-####',
    placeholder: '(416) 123-4567',
    digitsLength: 10,
    states: [
      'Ontario', 'Quebec', 'British Columbia', 'Alberta', 'Manitoba',
      'Saskatchewan', 'Nova Scotia', 'New Brunswick', 'Newfoundland and Labrador',
      'Prince Edward Island', 'Northwest Territories', 'Yukon', 'Nunavut'
    ]
  },
  {
    code: 'QA',
    name: 'Qatar',
    flag: '🇶🇦',
    dialCode: '+974',
    phoneMask: '#### ####',
    placeholder: '3312 3456',
    digitsLength: 8,
    states: [
      'Doha', 'Al Rayyan', 'Al Wakrah', 'Al Khor', 'Umm Salal', 'Al Daayen', 'Al Shamal', 'Al Shahaniya'
    ]
  },
  {
    code: 'KW',
    name: 'Kuwait',
    flag: '🇰🇼',
    dialCode: '+965',
    phoneMask: '#### ####',
    placeholder: '9912 3456',
    digitsLength: 8,
    states: [
      'Al Asimah (Capital)', 'Hawalli', 'Farwaniya', 'Ahmadi', 'Jahra', 'Mubarak Al-Kabeer'
    ]
  },
  {
    code: 'BH',
    name: 'Bahrain',
    flag: '🇧🇭',
    dialCode: '+973',
    phoneMask: '#### ####',
    placeholder: '3912 3456',
    digitsLength: 8,
    states: [
      'Capital Governorate', 'Muharraq Governorate', 'Northern Governorate', 'Southern Governorate'
    ]
  },
  {
    code: 'OM',
    name: 'Oman',
    flag: '🇴🇲',
    dialCode: '+968',
    phoneMask: '#### ####',
    placeholder: '9112 3456',
    digitsLength: 8,
    states: [
      'Muscat', 'Dhofar', 'Musandam', 'Al Buraimi', 'Ad Dakhiliyah',
      'Al Batinah North', 'Al Batinah South', 'Ash Sharqiyah North', 'Ash Sharqiyah South',
      'Ad Dhahirah', 'Al Wusta'
    ]
  },
  {
    code: 'TR',
    name: 'Turkey',
    flag: '🇹🇷',
    dialCode: '+90',
    phoneMask: '### ### ## ##',
    placeholder: '532 123 45 67',
    digitsLength: 10,
    states: [
      'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya', 'Gaziantep', 'Sanliurfa', 'Kocaeli'
    ]
  },
  {
    code: 'EG',
    name: 'Egypt',
    flag: '🇪🇬',
    dialCode: '+20',
    phoneMask: '## #### ####',
    placeholder: '10 1234 5678',
    digitsLength: 10,
    states: [
      'Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Mansoura', 'Tanta', 'Asyut', 'Fayoum'
    ]
  },
  {
    code: 'MY',
    name: 'Malaysia',
    flag: '🇲🇾',
    dialCode: '+60',
    phoneMask: '## ### ####',
    placeholder: '12 345 6789',
    digitsLength: 9,
    states: [
      'Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Sabah', 'Sarawak', 'Kedah', 'Pahang', 'Melaka'
    ]
  },
  {
    code: 'SG',
    name: 'Singapore',
    flag: '🇸🇬',
    dialCode: '+65',
    phoneMask: '#### ####',
    placeholder: '9123 4567',
    digitsLength: 8,
    states: [
      'Central Region', 'East Region', 'North Region', 'North-East Region', 'West Region'
    ]
  },
  {
    code: 'AU',
    name: 'Australia',
    flag: '🇦🇺',
    dialCode: '+61',
    phoneMask: '### ### ###',
    placeholder: '412 345 678',
    digitsLength: 9,
    states: [
      'New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'
    ]
  },
  {
    code: 'DE',
    name: 'Germany',
    flag: '🇩🇪',
    dialCode: '+49',
    phoneMask: '#### #######',
    placeholder: '1512 3456789',
    digitsLength: 11,
    states: [
      'Bavaria', 'North Rhine-Westphalia', 'Baden-Württemberg', 'Lower Saxony', 'Hesse', 'Berlin', 'Saxony', 'Hamburg'
    ]
  },
  {
    code: 'FR',
    name: 'France',
    flag: '🇫🇷',
    dialCode: '+33',
    phoneMask: '# ## ## ## ##',
    placeholder: '6 12 34 56 78',
    digitsLength: 9,
    states: [
      'Île-de-France (Paris)', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine', 'Occitanie', 'Provence-Alpes-Côte d\'Azur'
    ]
  },
  {
    code: 'IN',
    name: 'India',
    flag: '🇮🇳',
    dialCode: '+91',
    phoneMask: '##### #####',
    placeholder: '98765 43210',
    digitsLength: 10,
    states: [
      'Maharashtra', 'Delhi', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Rajasthan', 'Kerala', 'Punjab', 'Haryana'
    ]
  },
  {
    code: 'BD',
    name: 'Bangladesh',
    flag: '🇧🇩',
    dialCode: '+880',
    phoneMask: '#### ######',
    placeholder: '1712 345678',
    digitsLength: 10,
    states: [
      'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'
    ]
  }
]

export const DEFAULT_COUNTRY = COUNTRIES[0] // Pakistan

/**
 * Find country object by ISO code or country name
 */
export function getCountry(identifier) {
  if (!identifier) return DEFAULT_COUNTRY
  const clean = String(identifier).trim().toUpperCase()
  
  const found = COUNTRIES.find(c => 
    c.code.toUpperCase() === clean || 
    c.name.toUpperCase() === clean ||
    c.dialCode === identifier
  )
  return found || DEFAULT_COUNTRY
}

/**
 * Formats a national phone number according to country mask
 * e.g., for PK (3001234567) -> "300 1234567"
 * e.g., for US (5551234567) -> "(555) 123-4567"
 */
export function formatNationalPhone(rawInput, countryCode = 'PK') {
  if (!rawInput) return ''
  const country = getCountry(countryCode)
  
  // Strip non-digits
  let digits = String(rawInput).replace(/\D/g, '')

  // If user included dialCode digits at start, strip them
  const dialDigits = country.dialCode.replace(/\D/g, '')
  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length) {
    digits = digits.slice(dialDigits.length)
  }

  // Strip initial 0 if present (common local dialing prefix)
  if (digits.startsWith('0') && digits.length > 1) {
    digits = digits.slice(1)
  }

  // Truncate to maximum digits for this country + 2 leeway
  const maxLen = (country.digitsLength || 10) + 2
  digits = digits.slice(0, maxLen)

  // Apply format mask
  const mask = country.phoneMask || '### #######'
  let formatted = ''
  let digitIdx = 0

  for (let i = 0; i < mask.length && digitIdx < digits.length; i++) {
    const char = mask[i]
    if (char === '#') {
      formatted += digits[digitIdx]
      digitIdx++
    } else {
      formatted += char
    }
  }

  // If extra digits left beyond mask
  if (digitIdx < digits.length) {
    formatted += ' ' + digits.slice(digitIdx)
  }

  return formatted.trim()
}

/**
 * Builds full international phone number: "+92 300 1234567"
 */
export function buildFullPhoneNumber(nationalNumber, countryCode = 'PK') {
  if (!nationalNumber) return ''
  const country = getCountry(countryCode)
  const cleanFormatted = formatNationalPhone(nationalNumber, countryCode)
  if (!cleanFormatted) return ''
  return `${country.dialCode} ${cleanFormatted}`
}

/**
 * Parses an existing full or national phone number string,
 * detecting the country code and stripping dial code into national number.
 */
export function parsePhoneAndCountry(phoneString, defaultCountryCode = 'PK') {
  if (!phoneString) return { country: getCountry(defaultCountryCode), nationalNumber: '' }

  const trimmed = String(phoneString).trim()
  
  // Check if string starts with any known dialCode
  for (const c of COUNTRIES) {
    if (trimmed.startsWith(c.dialCode)) {
      const nationalRaw = trimmed.slice(c.dialCode.length).trim()
      return {
        country: c,
        nationalNumber: formatNationalPhone(nationalRaw, c.code)
      }
    }
  }

  return {
    country: getCountry(defaultCountryCode),
    nationalNumber: formatNationalPhone(trimmed, defaultCountryCode)
  }
}

/**
 * Returns high-resolution national flag image URL from FlagCDN
 * Guarantees visual flag rendering on Windows, Mac, Linux, and all browsers
 */
export function getCountryFlagUrl(code) {
  if (!code || typeof code !== 'string') return ''
  return `https://flagcdn.com/w40/${code.trim().toLowerCase()}.png`
}
