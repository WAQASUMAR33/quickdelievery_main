'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleMap, useJsApiLoader, Marker, StandaloneSearchBox } from '@react-google-maps/api'
import toast from 'react-hot-toast'

import Alert            from '@mui/material/Alert'
import Avatar           from '@mui/material/Avatar'
import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog           from '@mui/material/Dialog'
import DialogContent    from '@mui/material/DialogContent'
import DialogTitle      from '@mui/material/DialogTitle'
import Divider          from '@mui/material/Divider'
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import Stack            from '@mui/material/Stack'
import Tab              from '@mui/material/Tab'
import Tabs             from '@mui/material/Tabs'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import BadgeOutlinedIcon          from '@mui/icons-material/BadgeOutlined'
import BusinessOutlinedIcon       from '@mui/icons-material/BusinessOutlined'
import CheckCircleOutlinedIcon    from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon                  from '@mui/icons-material/Close'
import CollectionsOutlinedIcon    from '@mui/icons-material/CollectionsOutlined'
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined'
import GpsFixedIcon               from '@mui/icons-material/GpsFixed'
import LocationOnOutlinedIcon     from '@mui/icons-material/LocationOnOutlined'
import MyLocationIcon             from '@mui/icons-material/MyLocation'
import PhoneOutlinedIcon          from '@mui/icons-material/PhoneOutlined'
import SaveOutlinedIcon           from '@mui/icons-material/SaveOutlined'
import SearchIcon                 from '@mui/icons-material/Search'
import StorefrontOutlinedIcon     from '@mui/icons-material/StorefrontOutlined'
import VisibilityOutlinedIcon     from '@mui/icons-material/VisibilityOutlined'

const BRAND         = '#39772A'
const BRAND_DARK    = '#2E5F22'
const MAP_LIBRARIES = ['places']
const MAP_CONTAINER = { width: '100%', height: '380px' }
const DEFAULT_CENTER = { lat: 33.6844, lng: 73.0479 } // Islamabad

const tf = {
  size: 'small',
  sx: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      '&:hover fieldset':       { borderColor: BRAND },
      '&.Mui-focused fieldset': { borderColor: BRAND },
    },
    '& label.Mui-focused': { color: BRAND },
  },
}

const tfReadOnly = {
  size: 'small',
  sx: {
    '& .MuiOutlinedInput-root': {
      borderRadius: 0,
      bgcolor: '#f8fafc',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
      '&.Mui-focused fieldset': { borderColor: '#94a3b8' },
    },
    '& .MuiInputBase-input': {
      cursor: 'default',
      color: '#334155',
      fontWeight: 500,
    },
    '& label': { color: '#64748b' },
    '& label.Mui-focused': { color: '#64748b' },
  },
}

function SectionHeading({ icon, title, subtitle }) {
  return (
    <Box sx={{ mb: 2.5, display: 'flex', alignItems: 'center', gap: 1.25 }}>
      <Box sx={{ p: 0.75, bgcolor: '#D8E9D6', color: BRAND, display: 'flex' }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle1" fontWeight={700} color="#111827">
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  )
}

function ImageCard({ title, subtitle, imageUrl, onPreview }) {
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(imageUrl && !imgError)

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        {hasImage && (
          <IconButton size="small" onClick={() => onPreview(imageUrl, title)} sx={{ color: BRAND }}>
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Box
        sx={{
          height: 180,
          bgcolor: 'grey.100',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: hasImage ? 'pointer' : 'default',
        }}
        onClick={() => hasImage && onPreview(imageUrl, title)}
      >
        {hasImage ? (
          <Box
            component="img"
            src={imageUrl}
            alt={title}
            onError={() => setImgError(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              bgcolor: '#0f1724',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'scale(1.02)' },
            }}
          />
        ) : (
          <Stack alignItems="center" spacing={0.5} sx={{ p: 2, textAlign: 'center' }}>
            <CollectionsOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              No document/image uploaded
            </Typography>
          </Stack>
        )}
      </Box>
    </Card>
  )
}

export default function VendorBusinessProfile({ isAdminView = false, vendorData = null }) {
  const { userData } = useAuth()
  const activeEmail = isAdminView ? vendorData?.email : userData?.email

  const [business,       setBusiness]       = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [locating,       setLocating]       = useState(false)
  const [saving,         setSaving]         = useState(false)
  const [locationError,  setLocationError]  = useState('')
  const [activeTab,      setActiveTab]      = useState(0)

  // Lightbox preview state
  const [previewImage, setPreviewImage] = useState({ open: false, url: '', title: '' })

  // Marker / map state
  const [markerPos,  setMarkerPos]  = useState(null)
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
      if (!activeEmail) return
      try {
        setLoadingProfile(true)
        const res  = await fetch(`/api/vendor/profile?email=${encodeURIComponent(activeEmail)}`)
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
  }, [activeEmail])

  // Parse gallery images
  const restaurantImages = (() => {
    if (!business?.urlRestaurantImages) return []
    try {
      if (typeof business.urlRestaurantImages === 'string') {
        const parsed = JSON.parse(business.urlRestaurantImages)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // split by comma if string
      return business.urlRestaurantImages.split(',').map(s => s.trim()).filter(Boolean)
    }
    return Array.isArray(business.urlRestaurantImages) ? business.urlRestaurantImages : []
  })()

  // Map handlers
  const handleMapClick = useCallback((e) => {
    if (isAdminView) return
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() }
    setMarkerPos(pos)
    setLocationError('')
  }, [isAdminView])

  const handleMarkerDragEnd = useCallback((e) => {
    if (isAdminView) return
    setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })
  }, [isAdminView])

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
        toast.success('Live GPS coordinates pinned!')
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

  const handleSaveLocation = async () => {
    if (!markerPos) { toast.error('Please pin a location on the map first.'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/vendor/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: activeEmail, latitude: markerPos.lat, longitude: markerPos.lng }),
      })
      const data = await res.json()
      if (data.success) {
        setBusiness(prev => ({ ...prev, latitude: markerPos.lat, longitude: markerPos.lng }))
        toast.success('Business location saved successfully!')
      } else {
        toast.error(data.error || 'Failed to save location.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenPreview = (url, title) => {
    if (!url) return
    setPreviewImage({ open: true, url, title })
  }

  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 12, flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary" fontWeight={500}>Loading vendor business profile…</Typography>
      </Box>
    )
  }

  if (!business) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 0 }}>
        No business profile found for <strong>{activeEmail}</strong>. Please complete your vendor registration.
      </Alert>
    )
  }

  const statusConfig = {
    APPROVED: { label: 'Verified & Approved', bg: '#dcfce7', color: '#15803d' },
    PENDING:  { label: 'Pending Review',      bg: '#fef9c3', color: '#854d0e' },
    REJECTED: { label: 'Application Rejected', bg: '#fee2e2', color: '#b91c1c' },
  }[business.verificationStatus] || { label: business.verificationStatus, bg: '#f3f4f6', color: '#374151' }

  return (
    <Box sx={{ pb: 6 }}>

      {/* ── Top Cover Banner & Header ── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, mb: 3, overflow: 'hidden' }}>
        {/* Cover Photo */}
        <Box
          sx={{
            height: { xs: 140, sm: 200 },
            bgcolor: '#0f1724',
            backgroundImage: business.urlCoverPhoto ? `url(${business.urlCoverPhoto})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          {business.urlCoverPhoto && (
            <IconButton
              size="small"
              onClick={() => handleOpenPreview(business.urlCoverPhoto, 'Cover Photo')}
              sx={{ position: 'absolute', top: 12, right: 12, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
            >
              <VisibilityOutlinedIcon fontSize="small" />
            </IconButton>
          )}
        </Box>

        {/* Business Header Bar */}
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#ffffff' }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              {/* Logo Avatar */}
              <Avatar
                src={business.urlLogo}
                onClick={() => business.urlLogo && handleOpenPreview(business.urlLogo, 'Business Logo')}
                sx={{
                  width: { xs: 64, sm: 80 },
                  height: { xs: 64, sm: 80 },
                  bgcolor: BRAND,
                  fontSize: { xs: 24, sm: 32 },
                  fontWeight: 800,
                  border: '3px solid white',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                  mt: { xs: -5, sm: -6 },
                  cursor: business.urlLogo ? 'pointer' : 'default',
                }}
              >
                {(business.businessName || 'V').charAt(0).toUpperCase()}
              </Avatar>

              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={800} color="#111827">
                    {business.businessName}
                  </Typography>
                  <Chip
                    label={statusConfig.label}
                    size="small"
                    sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700, borderRadius: 0, fontSize: 11 }}
                  />
                  {(business.category?.name || business.vertical) && (
                    <Chip
                      label={business.category?.name || business.vertical}
                      size="small"
                      sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600, borderRadius: 0, fontSize: 11 }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 16 }} /> {business.email}
                  </Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 16 }} /> {business.phoneNumber1}
                  </Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 16 }} /> {business.city}, {business.state}
                  </Box>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Navigation Tabs */}
        <Divider />
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            bgcolor: 'grey.50',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 700, fontSize: 14, minHeight: 48, borderRadius: 0 },
            '& .Mui-selected': { color: `${BRAND} !important` },
            '& .MuiTabs-indicator': { bgcolor: BRAND, height: 3 },
          }}
        >
          <Tab icon={<StorefrontOutlinedIcon fontSize="small" />} iconPosition="start" label="Store Details" />
          <Tab icon={<BadgeOutlinedIcon fontSize="small" />} iconPosition="start" label="Owner & Payout" />
          <Tab icon={<CollectionsOutlinedIcon fontSize="small" />} iconPosition="start" label={`Documents & Photos (${2 + (business.urlLogo ? 1 : 0) + (business.urlCoverPhoto ? 1 : 0) + restaurantImages.length})`} />
          <Tab icon={<GpsFixedIcon fontSize="small" />} iconPosition="start" label="Storefront GPS Location" />
        </Tabs>
      </Card>

      {/* ════════════════════════ TAB 0: STORE DETAILS ════════════════════════ */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
              <SectionHeading
                icon={<BusinessOutlinedIcon fontSize="small" />}
                title="Business Information"
                subtitle="Registered legal & commercial profile"
              />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField {...tfReadOnly} fullWidth label="Business Name" value={business.businessName || ''} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    {...tfReadOnly}
                    fullWidth
                    label="Category"
                    value={business.category?.name || business.vertical || '—'}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tfReadOnly} fullWidth label="NTN Number" value={business.ntnNo || 'Not provided'} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tfReadOnly} fullWidth label="Primary Phone" value={business.phoneNumber1 || ''} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tfReadOnly} fullWidth label="Secondary Phone" value={business.phoneNumber2 || 'None'} InputProps={{ readOnly: true }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tfReadOnly} fullWidth label="Business Email" value={business.email || ''} InputProps={{ readOnly: true }} />
                </Grid>
              </Grid>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
              <SectionHeading
                icon={<LocationOnOutlinedIcon fontSize="small" />}
                title="Address & Premises"
                subtitle="Physical store and billing location"
              />
              <Stack spacing={2}>
                <TextField {...tfReadOnly} fullWidth label="Street Address" value={business.streetAddress || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="Building / Market Name" value={business.buildingPlaceName || '—'} InputProps={{ readOnly: true }} />
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="Shop / House #" value={business.houseNumber || '—'} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="Postal Code" value={business.postalCode || '—'} InputProps={{ readOnly: true }} />
                  </Grid>
                </Grid>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="City" value={business.city || '—'} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="State / Province" value={business.state || '—'} InputProps={{ readOnly: true }} />
                  </Grid>
                </Grid>
                <TextField {...tfReadOnly} fullWidth label="Billing Address" value={business.billingAddress || ''} InputProps={{ readOnly: true }} />
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════════ TAB 1: OWNER & PAYOUT ════════════════════════ */}
      {activeTab === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
              <SectionHeading
                icon={<BadgeOutlinedIcon fontSize="small" />}
                title="Proprietor / Owner Profile"
                subtitle="Identity details as per National ID Card"
              />
              <Stack spacing={2}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="First Name" value={business.firstName || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField {...tfReadOnly} fullWidth label="Last Name" value={business.lastName || ''} InputProps={{ readOnly: true }} />
                  </Grid>
                </Grid>
                <TextField {...tfReadOnly} fullWidth label="Owner CNIC Number" value={business.cnicNo || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="Contact Phone" value={business.phoneNumber1 || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="Registered Email" value={business.email || ''} InputProps={{ readOnly: true }} />
              </Stack>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
              <SectionHeading
                icon={<AccountBalanceOutlinedIcon fontSize="small" />}
                title="Bank Account & Payout Information"
                subtitle="Bank details for automated vendor order settlements"
              />
              <Stack spacing={2}>
                <TextField {...tfReadOnly} fullWidth label="Bank Name" value={business.bankName || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="Account Title" value={business.bankAccountTitle || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="IBAN / Account Number" value={business.bankIbanNo || ''} InputProps={{ readOnly: true }} />
                <TextField {...tfReadOnly} fullWidth label="Billing Address" value={business.billingAddress || ''} InputProps={{ readOnly: true }} />
              </Stack>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* ════════════════════════ TAB 2: DOCUMENTS & PHOTOS ════════════════════════ */}
      {activeTab === 2 && (
        <Stack spacing={3}>
          {/* Identity Documents */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
            <SectionHeading
              icon={<BadgeOutlinedIcon fontSize="small" />}
              title="Identity & Verification Documents"
              subtitle="CNIC Front, CNIC Back and Branding Assets"
            />
            <Grid container spacing={2.5}>
              <Grid item xs={12} sm={6} md={3}>
                <ImageCard
                  title="CNIC Front Side"
                  subtitle="National Identity Card"
                  imageUrl={business.urlCnicFront}
                  onPreview={handleOpenPreview}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ImageCard
                  title="CNIC Back Side"
                  subtitle="National Identity Card"
                  imageUrl={business.urlCnicBack}
                  onPreview={handleOpenPreview}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ImageCard
                  title="Business Logo"
                  subtitle="Store Avatar Icon"
                  imageUrl={business.urlLogo}
                  onPreview={handleOpenPreview}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <ImageCard
                  title="Cover Photo"
                  subtitle="Storefront Banner"
                  imageUrl={business.urlCoverPhoto}
                  onPreview={handleOpenPreview}
                />
              </Grid>
            </Grid>
          </Card>

          {/* Gallery / Restaurant Storefront Photos */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
            <SectionHeading
              icon={<CollectionsOutlinedIcon fontSize="small" />}
              title="Storefront & Premises Gallery Photos"
              subtitle="Photos of your store, menu, and facilities"
            />
            {restaurantImages.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center', bgcolor: 'grey.50', border: '1px dashed', borderColor: 'divider' }}>
                <CollectionsOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  No additional restaurant/storefront gallery photos uploaded yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {restaurantImages.map((url, idx) => (
                  <Grid item xs={6} sm={4} md={3} key={idx}>
                    <ImageCard
                      title={`Gallery Photo #${idx + 1}`}
                      imageUrl={url}
                      onPreview={handleOpenPreview}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Card>
        </Stack>
      )}

      {/* ════════════════════════ TAB 3: GPS LOCATION ════════════════════════ */}
      {activeTab === 3 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '380px 1fr' }, gap: 3 }}>
          {/* Left Panel */}
          <Stack spacing={2.5}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
              <SectionHeading
                icon={<LocationOnOutlinedIcon fontSize="small" />}
                title="Storefront Coordinates"
                subtitle="Exact delivery & pickup geolocation"
              />

              {business.latitude && business.longitude ? (
                <Alert icon={<CheckCircleOutlinedIcon />} severity="success" sx={{ borderRadius: 0, mb: 2 }}>
                  <Typography variant="body2" fontWeight={600}>Location currently active</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {Number(business.latitude).toFixed(6)}, {Number(business.longitude).toFixed(6)}
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="warning" sx={{ borderRadius: 0, mb: 2 }}>
                  Store location has not been pinned on the map yet.
                </Alert>
              )}

              {markerPos && (
                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Selected Pin Coordinates
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <TextField {...tf} fullWidth label="Latitude" value={markerPos.lat.toFixed(7)} InputProps={{ readOnly: true }} />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField {...tf} fullWidth label="Longitude" value={markerPos.lng.toFixed(7)} InputProps={{ readOnly: true }} />
                    </Grid>
                  </Grid>
                </Stack>
              )}

              {!isAdminView && (
                <Stack spacing={1.5}>
                  <Button
                    fullWidth variant="contained" size="large"
                    onClick={handleGetLiveLocation}
                    disabled={locating || !isLoaded}
                    startIcon={locating ? <CircularProgress size={18} color="inherit" /> : <MyLocationIcon />}
                    sx={{
                      bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK },
                      borderRadius: 0, textTransform: 'none', fontWeight: 700, py: 1.2,
                    }}
                  >
                    {locating ? 'Detecting GPS…' : 'Pin My Live GPS Location'}
                  </Button>

                  <Button
                    fullWidth variant="outlined" size="large"
                    onClick={handleSaveLocation}
                    disabled={saving || !markerPos}
                    startIcon={saving ? <CircularProgress size={18} /> : <SaveOutlinedIcon />}
                    sx={{
                      borderColor: BRAND, color: BRAND,
                      '&:hover': { borderColor: BRAND_DARK, color: BRAND_DARK, bgcolor: `${BRAND}08` },
                      borderRadius: 0, textTransform: 'none', fontWeight: 700, py: 1.2,
                    }}
                  >
                    {saving ? 'Saving Location…' : 'Save Location Pin'}
                  </Button>
                </Stack>
              )}

              {locationError && (
                <Alert severity="error" sx={{ borderRadius: 0, mt: 2 }}>{locationError}</Alert>
              )}
            </Card>
          </Stack>

          {/* Right Map */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
              <GpsFixedIcon sx={{ fontSize: 18, color: BRAND }} />
              <Typography variant="body2" fontWeight={700}>Interactive Map Pinning</Typography>
              <Box sx={{ flex: 1 }} />
              <Typography variant="caption" color="text.disabled">
                Click map or drag the pin
              </Typography>
            </Box>

            {!isAdminView && (
              <Box sx={{ px: 2, py: 1.5, borderBottom: 1, borderColor: 'divider', bgcolor: '#ffffff' }}>
                {isLoaded ? (
                  <StandaloneSearchBox
                    onLoad={ref => (searchBoxRef.current = ref)}
                    onPlacesChanged={handleSearchPlacesChanged}
                  >
                    <TextField
                      fullWidth size="small"
                      placeholder="Search for address or market place…"
                      sx={tf.sx}
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
                  <TextField fullWidth size="small" placeholder="Loading search..." disabled sx={tf.sx} />
                )}
              </Box>
            )}

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
                    draggable={!isAdminView}
                    onDragEnd={handleMarkerDragEnd}
                    title={isAdminView ? 'Business Location' : 'Your store location — drag to adjust'}
                  />
                )}
              </GoogleMap>
            )}
          </Card>
        </Box>
      )}

      {/* ── High-Resolution Image Lightbox Dialog ── */}
      <Dialog
        open={previewImage.open}
        onClose={() => setPreviewImage({ open: false, url: '', title: '' })}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, bgcolor: '#0f1724', color: 'white' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700} color="white">
            {previewImage.title || 'Document Preview'}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setPreviewImage({ open: false, url: '', title: '' })}
            sx={{ color: 'white' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, maxHeight: '80vh' }}>
          {previewImage.url && (
            <Box
              component="img"
              src={previewImage.url}
              alt={previewImage.title}
              sx={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain' }}
            />
          )}
        </DialogContent>
      </Dialog>

    </Box>
  )
}
