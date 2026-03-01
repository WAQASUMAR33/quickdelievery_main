'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api'
import toast from 'react-hot-toast'

import Alert            from '@mui/material/Alert'
import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import InputAdornment   from '@mui/material/InputAdornment'
import Stack            from '@mui/material/Stack'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'

import BusinessOutlinedIcon    from '@mui/icons-material/BusinessOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import EmailOutlinedIcon       from '@mui/icons-material/EmailOutlined'
import GpsFixedIcon            from '@mui/icons-material/GpsFixed'
import LocationOnOutlinedIcon  from '@mui/icons-material/LocationOnOutlined'
import MyLocationIcon          from '@mui/icons-material/MyLocation'
import PhoneOutlinedIcon       from '@mui/icons-material/PhoneOutlined'
import SaveOutlinedIcon        from '@mui/icons-material/SaveOutlined'
import SearchIcon              from '@mui/icons-material/Search'
import StorefrontOutlinedIcon  from '@mui/icons-material/StorefrontOutlined'

const BRAND        = '#D70F64'
const MAP_LIBRARIES = ['places']
const MAP_CONTAINER = { width: '100%', height: '380px' }
const DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 } // Islamabad

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    '&:hover fieldset':       { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& label.Mui-focused': { color: BRAND },
}

function InfoRow({ icon, label, value }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, py: 1 }}>
      <Box sx={{ color: BRAND, mt: 0.25, flexShrink: 0 }}>{icon}</Box>
      <Box>
        <Typography variant="caption" color="text.disabled"
          sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
      </Box>
    </Box>
  )
}

export default function VendorBusinessProfile() {
  const { userData } = useAuth()

  const [business,       setBusiness]       = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [locating,       setLocating]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [locationError,  setLocationError]  = useState('')

  // Marker / map state
  const [markerPos,  setMarkerPos]  = useState(null)          // { lat, lng }
  const [mapCenter,  setMapCenter]  = useState(DEFAULT_CENTER)
  const searchBoxRef = useRef(null)
  const mapRef       = useRef(null)

  // Load Google Maps JS SDK
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: MAP_LIBRARIES,
  })

  // Fetch business profile
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userData?.email) return
      try {
        const res  = await fetch(`/api/vendor/profile?email=${encodeURIComponent(userData.email)}`)
        const data = await res.json()
        if (data.success && data.data) {
          setBusiness(data.data)
          if (data.data.latitude && data.data.longitude) {
            const pos = { lat: data.data.latitude, lng: data.data.longitude }
            setMarkerPos(pos)
            setMapCenter(pos)
          }
        }
      } catch (e) {
        console.error('Error fetching business profile:', e)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [userData?.email])

  // Click on map → place marker
  const handleMapClick = useCallback((e) => {
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    setLocationError('')
  }, [])

  // Drag marker to fine-tune
  const handleMarkerDragEnd = useCallback((e) => {
    setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [])

  // Search box → pan + place marker
  const handleSearchPlacesChanged = () => {
    const places = searchBoxRef.current?.getPlaces()
    if (!places || places.length === 0) return
    const place = places[0]
    if (!place.geometry) return
    const pos = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
    }
    setMarkerPos(pos)
    setMapCenter(pos)
    if (mapRef.current) {
      if (place.geometry.viewport) {
        mapRef.current.fitBounds(place.geometry.viewport)
      } else {
        mapRef.current.panTo(pos)
        mapRef.current.setZoom(16)
      }
    }
  }

  // GPS button → detect & pan
  const handleGetLiveLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setMarkerPos(loc)
        setMapCenter(loc)
        if (mapRef.current) { mapRef.current.panTo(loc); mapRef.current.setZoom(17) }
        setLocating(false)
        toast.success('Live location detected!')
      },
      (err) => {
        setLocating(false)
        const msgs = {
          [err.PERMISSION_DENIED]:    'Location permission denied. Allow access in browser settings.',
          [err.POSITION_UNAVAILABLE]: 'Location information unavailable.',
          [err.TIMEOUT]:              'Location request timed out.',
        }
        setLocationError(msgs[err.code] || 'Unknown error fetching location.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Save coordinates
  const handleSaveLocation = async () => {
    if (!markerPos) { toast.error('Please pin a location on the map first.'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/vendor/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: userData.email, latitude: markerPos.lat, longitude: markerPos.lng }),
      })
      const data = await res.json()
      if (data.success) {
        setBusiness(prev => ({ ...prev, latitude: markerPos.lat, longitude: markerPos.lng }))
        toast.success('Business location saved!')
      } else {
        toast.error(data.error || 'Failed to save location.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  /* ─── Loading / Error states ─── */
  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading business profile…</Typography>
      </Box>
    )
  }

  if (!business) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 0 }}>
        No business profile found for <strong>{userData?.email}</strong>. Please complete your business registration first.
      </Alert>
    )
  }

  if (loadError) {
    return (
      <Alert severity="error" sx={{ borderRadius: 0 }}>
        Failed to load Google Maps. Check your <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in .env.
      </Alert>
    )
  }

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 3 }}>

      {/* ── Left: Business Info ── */}
      <Stack spacing={3}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <StorefrontOutlinedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>Business Info</Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                label={business.verificationStatus}
                sx={{
                  borderRadius: 0, fontWeight: 700, fontSize: 11,
                  bgcolor: business.verificationStatus === 'APPROVED' ? '#e8f5e9'
                         : business.verificationStatus === 'REJECTED' ? '#ffebee' : '#fff8e1',
                  color:   business.verificationStatus === 'APPROVED' ? '#2e7d32'
                         : business.verificationStatus === 'REJECTED' ? '#c62828' : '#e65100',
                }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <InfoRow icon={<BusinessOutlinedIcon    fontSize="small" />} label="Business"  value={business.businessName} />
            <InfoRow icon={<StorefrontOutlinedIcon  fontSize="small" />} label="Type"      value={business.businessType?.typeTitle} />
            <InfoRow icon={<EmailOutlinedIcon       fontSize="small" />} label="Email"     value={business.email} />
            <InfoRow icon={<PhoneOutlinedIcon       fontSize="small" />} label="Phone"     value={business.phoneNumber1} />
            <InfoRow
              icon={<LocationOnOutlinedIcon fontSize="small" />}
              label="Address"
              value={[business.buildingPlaceName, business.streetAddress, business.city, business.state, business.postalCode].filter(Boolean).join(', ')}
            />
          </CardContent>
        </Card>

        {/* Saved coordinates */}
        {business.latitude && business.longitude && (
          <Alert icon={<CheckCircleOutlinedIcon />} severity="success" sx={{ borderRadius: 0 }}>
            <Typography variant="body2" fontWeight={600}>Location saved</Typography>
            <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
              {Number(business.latitude).toFixed(6)},&nbsp;{Number(business.longitude).toFixed(6)}
            </Typography>
          </Alert>
        )}

        {/* Current pin coords */}
        {markerPos && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
                Pinned Location
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <TextField
                  label="Latitude" size="small" fullWidth
                  value={markerPos.lat.toFixed(7)}
                  inputProps={{ readOnly: true }}
                  sx={fieldSx}
                />
                <TextField
                  label="Longitude" size="small" fullWidth
                  value={markerPos.lng.toFixed(7)}
                  inputProps={{ readOnly: true }}
                  sx={fieldSx}
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <Stack spacing={1.5}>
          <Button
            fullWidth variant="contained" size="large"
            onClick={handleGetLiveLocation}
            disabled={locating || !isLoaded}
            startIcon={locating ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
            sx={{
              bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
              borderRadius: 0, textTransform: 'none', fontWeight: 700, py: 1.4,
              boxShadow: `0 4px 14px ${BRAND}44`,
            }}
          >
            {locating ? 'Detecting…' : 'Use My GPS Location'}
          </Button>

          <Button
            fullWidth variant="outlined" size="large"
            onClick={handleSaveLocation}
            disabled={saving || !markerPos}
            startIcon={saving ? <CircularProgress size={18} /> : <SaveOutlinedIcon />}
            sx={{
              borderColor: BRAND, color: BRAND,
              '&:hover': { borderColor: '#C20D5A', color: '#C20D5A', bgcolor: `${BRAND}08` },
              borderRadius: 0, textTransform: 'none', fontWeight: 700, py: 1.4,
            }}
          >
            {saving ? 'Saving…' : 'Save Location'}
          </Button>
        </Stack>

        {locationError && (
          <Alert severity="error" sx={{ borderRadius: 0 }}>{locationError}</Alert>
        )}
      </Stack>

      {/* ── Right: Google Map ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
          <GpsFixedIcon sx={{ fontSize: 18, color: BRAND }} />
          <Typography variant="body2" fontWeight={700}>Pin Your Business Location</Typography>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.disabled">
            Click on the map or drag the pin to adjust
          </Typography>
        </Box>

        {/* Search box */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
          {isLoaded ? (
            <StandaloneSearchBox
              onLoad={ref => (searchBoxRef.current = ref)}
              onPlacesChanged={handleSearchPlacesChanged}
            >
              <TextField
                fullWidth size="small"
                placeholder="Search for your business address…"
                sx={{
                  bgcolor: 'background.paper',
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 0,
                    '&:hover fieldset':       { borderColor: BRAND },
                    '&.Mui-focused fieldset': { borderColor: BRAND },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />
            </StandaloneSearchBox>
          ) : (
            <TextField
              fullWidth size="small"
              placeholder="Loading map…"
              disabled
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
            />
          )}
        </Box>

        {/* Map */}
        {!isLoaded ? (
          <Box sx={{ ...MAP_CONTAINER, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100', flexDirection: 'column', gap: 2 }}>
            <CircularProgress sx={{ color: BRAND }} />
            <Typography variant="body2" color="text.secondary">Loading Google Maps…</Typography>
          </Box>
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER}
            center={mapCenter}
            zoom={markerPos ? 16 : 12}
            onClick={handleMapClick}
            onLoad={map => (mapRef.current = map)}
            options={{
              streetViewControl: false,
              mapTypeControl:    true,
              fullscreenControl: true,
              zoomControl:       true,
              styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {markerPos && (
              <Marker
                position={markerPos}
                draggable
                onDragEnd={handleMarkerDragEnd}
                title="Your business location — drag to adjust"
              />
            )}
          </GoogleMap>
        )}

        {/* Footer hint */}
        <Box sx={{ px: 2.5, py: 1, bgcolor: 'grey.50', borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            💡 Click anywhere on the map to place a pin · Drag the pin to fine-tune · Use search to find your address
          </Typography>
        </Box>
      </Card>

    </Box>
  )
}
