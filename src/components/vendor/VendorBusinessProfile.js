'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

import Alert           from '@mui/material/Alert'
import Box             from '@mui/material/Box'
import Button          from '@mui/material/Button'
import Card            from '@mui/material/Card'
import CardContent     from '@mui/material/CardContent'
import Chip            from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider         from '@mui/material/Divider'
import Stack           from '@mui/material/Stack'
import TextField       from '@mui/material/TextField'
import Typography      from '@mui/material/Typography'

import BusinessOutlinedIcon      from '@mui/icons-material/BusinessOutlined'
import CheckCircleOutlinedIcon   from '@mui/icons-material/CheckCircleOutlined'
import EmailOutlinedIcon         from '@mui/icons-material/EmailOutlined'
import GpsFixedIcon              from '@mui/icons-material/GpsFixed'
import LocationOnOutlinedIcon    from '@mui/icons-material/LocationOnOutlined'
import MyLocationIcon            from '@mui/icons-material/MyLocation'
import PhoneOutlinedIcon         from '@mui/icons-material/PhoneOutlined'
import SaveOutlinedIcon          from '@mui/icons-material/SaveOutlined'
import StorefrontOutlinedIcon    from '@mui/icons-material/StorefrontOutlined'

const BRAND = '#D70F64'

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
        <Typography variant="caption" color="text.disabled" sx={{ display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
      </Box>
    </Box>
  )
}

export default function VendorBusinessProfile() {
  const { userData } = useAuth()

  const [business,        setBusiness]        = useState(null)
  const [loadingProfile,  setLoadingProfile]  = useState(true)
  const [locating,        setLocating]        = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [lat,             setLat]             = useState('')
  const [lng,             setLng]             = useState('')
  const [locationError,   setLocationError]   = useState('')

  // Fetch business profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userData?.email) return
      try {
        const res  = await fetch(`/api/vendor/profile?email=${encodeURIComponent(userData.email)}`)
        const data = await res.json()
        if (data.success && data.data) {
          setBusiness(data.data)
          if (data.data.latitude)  setLat(String(data.data.latitude))
          if (data.data.longitude) setLng(String(data.data.longitude))
        }
      } catch (e) {
        console.error('Error fetching business profile:', e)
      } finally {
        setLoadingProfile(false)
      }
    }
    fetchProfile()
  }, [userData?.email])

  // Get live GPS location from browser
  const handleGetLiveLocation = () => {
    setLocationError('')
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(7))
        setLng(pos.coords.longitude.toFixed(7))
        setLocating(false)
        toast.success('Live location captured!')
      },
      (err) => {
        setLocating(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please allow access in your browser settings.')
            break
          case err.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.')
            break
          case err.TIMEOUT:
            setLocationError('Location request timed out.')
            break
          default:
            setLocationError('An unknown error occurred while fetching location.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  // Save coordinates to DB
  const handleSaveLocation = async () => {
    if (!lat || !lng) { toast.error('Please capture or enter coordinates first.'); return }
    const parsedLat = parseFloat(lat)
    const parsedLng = parseFloat(lng)
    if (isNaN(parsedLat) || parsedLat < -90  || parsedLat > 90)  { toast.error('Latitude must be between -90 and 90.');    return }
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) { toast.error('Longitude must be between -180 and 180.'); return }

    setSaving(true)
    try {
      const res  = await fetch('/api/vendor/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: userData.email, latitude: parsedLat, longitude: parsedLng }),
      })
      const data = await res.json()
      if (data.success) {
        setBusiness(prev => ({ ...prev, latitude: parsedLat, longitude: parsedLng }))
        toast.success('Business location saved successfully!')
      } else {
        toast.error(data.error || 'Failed to save location.')
      }
    } catch (e) {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const mapUrl = lat && lng
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(lng) - 0.01},${parseFloat(lat) - 0.01},${parseFloat(lng) + 0.01},${parseFloat(lat) + 0.01}&layer=mapnik&marker=${lat},${lng}`
    : null

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

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3 }}>

      {/* ── Left: Business Info ── */}
      <Stack spacing={3}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <StorefrontOutlinedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>Business Information</Typography>
              <Box sx={{ flex: 1 }} />
              <Chip
                size="small"
                label={business.verificationStatus}
                sx={{
                  bgcolor: business.verificationStatus === 'APPROVED' ? '#e8f5e9' : business.verificationStatus === 'REJECTED' ? '#ffebee' : '#fff8e1',
                  color:   business.verificationStatus === 'APPROVED' ? '#2e7d32' : business.verificationStatus === 'REJECTED' ? '#c62828' : '#e65100',
                  fontWeight: 700, fontSize: 11, borderRadius: 0,
                }}
              />
            </Box>
            <Divider sx={{ mb: 2 }} />

            <InfoRow icon={<BusinessOutlinedIcon fontSize="small" />}    label="Business Name"  value={business.businessName} />
            <InfoRow icon={<StorefrontOutlinedIcon fontSize="small" />}  label="Business Type"  value={business.businessType?.typeTitle} />
            <InfoRow icon={<EmailOutlinedIcon fontSize="small" />}       label="Email"          value={business.email} />
            <InfoRow icon={<PhoneOutlinedIcon fontSize="small" />}       label="Phone"          value={business.phoneNumber1} />
            <InfoRow
              icon={<LocationOnOutlinedIcon fontSize="small" />}
              label="Address"
              value={[business.buildingPlaceName, business.streetAddress, business.city, business.state, business.postalCode].filter(Boolean).join(', ')}
            />
          </CardContent>
        </Card>

        {/* Current coordinates chip */}
        {business.latitude && business.longitude && (
          <Alert
            icon={<CheckCircleOutlinedIcon />}
            severity="success"
            sx={{ borderRadius: 0, '& .MuiAlert-icon': { color: '#2e7d32' } }}
          >
            <Typography variant="body2" fontWeight={600}>Location saved</Typography>
            <Typography variant="caption">
              {Number(business.latitude).toFixed(6)}, {Number(business.longitude).toFixed(6)}
            </Typography>
          </Alert>
        )}
      </Stack>

      {/* ── Right: Live Location ── */}
      <Stack spacing={3}>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <GpsFixedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>Live Location</Typography>
            </Box>
            <Divider sx={{ mb: 3 }} />

            {/* GPS Button */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              onClick={handleGetLiveLocation}
              disabled={locating}
              startIcon={locating ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
              sx={{
                bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' },
                borderRadius: 0, textTransform: 'none', fontWeight: 700,
                fontSize: '1rem', py: 1.5, mb: 2,
                boxShadow: `0 4px 14px ${BRAND}44`,
              }}
            >
              {locating ? 'Detecting location…' : 'Get Live Location'}
            </Button>

            {locationError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 0 }}>{locationError}</Alert>
            )}

            {/* Manual coordinate entry */}
            <Typography variant="caption" color="text.disabled" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1.5 }}>
              Or enter coordinates manually
            </Typography>

            <Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
              <TextField
                label="Latitude" size="small" fullWidth
                value={lat}
                onChange={e => setLat(e.target.value)}
                placeholder="e.g. 33.6844"
                type="number"
                inputProps={{ step: 'any', min: -90, max: 90 }}
                sx={fieldSx}
              />
              <TextField
                label="Longitude" size="small" fullWidth
                value={lng}
                onChange={e => setLng(e.target.value)}
                placeholder="e.g. 73.0479"
                type="number"
                inputProps={{ step: 'any', min: -180, max: 180 }}
                sx={fieldSx}
              />
            </Stack>

            {/* Save button */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleSaveLocation}
              disabled={saving || !lat || !lng}
              startIcon={saving ? <CircularProgress size={18} /> : <SaveOutlinedIcon />}
              sx={{
                borderColor: BRAND, color: BRAND,
                '&:hover': { borderColor: '#C20D5A', color: '#C20D5A', bgcolor: `${BRAND}08` },
                borderRadius: 0, textTransform: 'none', fontWeight: 700, fontSize: '0.95rem', py: 1.25,
              }}
            >
              {saving ? 'Saving…' : 'Save Location'}
            </Button>
          </CardContent>
        </Card>

        {/* Map preview */}
        {mapUrl && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
              <LocationOnOutlinedIcon sx={{ fontSize: 18, color: BRAND }} />
              <Typography variant="body2" fontWeight={600}>Map Preview</Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.disabled">
                {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
              </Typography>
            </Box>
            <Box
              component="iframe"
              src={mapUrl}
              sx={{ width: '100%', height: 280, border: 'none', display: 'block' }}
              title="Business location map"
              loading="lazy"
            />
          </Card>
        )}
      </Stack>

    </Box>
  )
}
