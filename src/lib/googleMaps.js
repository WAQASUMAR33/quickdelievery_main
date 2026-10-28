// Centralized Google Maps configuration for @react-google-maps/api
// Eliminates the fatal error: "Loader must not be called again with different options."
// All components calling useJsApiLoader MUST share these exact same parameters.

export const GOOGLE_MAPS_SCRIPT_ID = 'google-map-script'
export const GOOGLE_MAPS_LIBRARIES = ['places']
export const GOOGLE_MAPS_API_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_GEOCODING_API_KEY ||
  ''
