'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import { GOOGLE_MAPS_SCRIPT_ID, GOOGLE_MAPS_LIBRARIES, GOOGLE_MAPS_API_KEY } from '@/lib/googleMaps'
import { getCountry } from '@/lib/countryData'
import toast from 'react-hot-toast'

import { useTheme } from '@mui/material/styles'
import Alert from '@mui/material/Alert'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LaunchIcon from '@mui/icons-material/Launch'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import MapOutlinedIcon from '@mui/icons-material/MapOutlined'
import MyLocationIcon from '@mui/icons-material/MyLocation'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import ZoomOutIcon from '@mui/icons-material/ZoomOut'

const BRAND = '#39772A'
const BRAND_DARK = '#4ade80'
const DEFAULT_CENTER = { lat: 31.5204, lng: 74.3587 } // Lahore, Pakistan

const DARK_MAP_STYLES = [
  { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#475569' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f172a' }] },
]

function parseImageList(raw) {
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter(Boolean)
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return []
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.filter(Boolean)
      if (typeof parsed === 'string') return [parsed]
    } catch {
      return trimmed.split(',').map((s) => s.trim()).filter(Boolean)
    }
  }
  return []
}

function formatDateTime(dt) {
  if (!dt) return '—'
  try {
    return new Date(dt).toLocaleDateString('en-PK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return '—'
  }
}

function SectionCard({ icon, title, subtitle, action, children, sx = {} }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = isDark ? BRAND_DARK : BRAND

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2.5,
        bgcolor: 'background.paper',
        height: '100%',
        overflow: 'hidden',
        ...sx,
      }}
    >
      <Box
        sx={{
          px: 2.75,
          py: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(248,250,252,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 1.5,
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: isDark ? 'rgba(74,222,128,0.14)' : 'rgba(57,119,42,0.1)',
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary" lineHeight={1.25}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        {action && <Box>{action}</Box>}
      </Box>
      <CardContent sx={{ p: 2.75, '&:last-child': { pb: 2.75 } }}>{children}</CardContent>
    </Card>
  )
}

function InfoField({ label, value, mono = false, copyable = false, fullWidth = false, badge = null }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'

  const handleCopy = () => {
    if (!value || value === '—') return
    navigator.clipboard?.writeText(String(value))
    toast.success(`${label} copied`)
  }

  return (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: isDark ? 'rgba(255,255,255,0.025)' : '#f8fafc',
        height: '100%',
        gridColumn: fullWidth ? '1 / -1' : 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={0.5}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={700}
          sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}
        >
          {label}
        </Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          {badge}
          {copyable && value && value !== '—' && (
            <Tooltip title={`Copy ${label}`}>
              <IconButton size="small" onClick={handleCopy} sx={{ p: 0.25, color: 'text.secondary' }}>
                <ContentCopyIcon sx={{ fontSize: 13 }} />
              </IconButton>
            </Tooltip>
          )}
        </Stack>
      </Stack>
      <Typography
        variant="body2"
        fontWeight={700}
        color={value && value !== '—' ? 'text.primary' : 'text.disabled'}
        sx={{
          fontFamily: mono ? 'monospace' : 'inherit',
          wordBreak: 'break-word',
          lineHeight: 1.45,
        }}
      >
        {value || '—'}
      </Typography>
    </Box>
  )
}

function DocumentPreviewCard({ title, subtitle, imageUrl, badgeLabel, onOpenLightbox }) {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const [imgError, setImgError] = useState(false)
  const hasImage = Boolean(imageUrl && !imgError)

  return (
    <Card
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: hasImage ? 'divider' : isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.45)',
        borderRadius: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
        '&:hover': hasImage
          ? {
              borderColor: isDark ? BRAND_DARK : BRAND,
              boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(15,23,42,0.08)',
            }
          : {},
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.4,
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={800} noWrap>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {subtitle}
            </Typography>
          )}
        </Box>
        <Chip
          size="small"
          label={hasImage ? badgeLabel || 'Uploaded' : 'Not Uploaded'}
          sx={{
            height: 22,
            fontSize: '0.68rem',
            fontWeight: 800,
            bgcolor: hasImage
              ? isDark
                ? 'rgba(34,197,94,0.18)'
                : '#dcfce7'
              : isDark
              ? 'rgba(245,158,11,0.18)'
              : '#fef3c7',
            color: hasImage ? (isDark ? '#4ade80' : '#15803d') : isDark ? '#fbbf24' : '#b45309',
          }}
        />
      </Box>

      <Box
        onClick={() => hasImage && onOpenLightbox()}
        sx={{
          height: 200,
          bgcolor: isDark ? '#0b1120' : '#f1f5f9',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          cursor: hasImage ? 'pointer' : 'default',
        }}
      >
        {hasImage ? (
          <>
            <Box
              component="img"
              src={imageUrl}
              alt={title}
              onError={() => setImgError(true)}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                p: 1,
                transition: 'transform 0.25s ease',
                '&:hover': { transform: 'scale(1.04)' },
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                display: 'flex',
                gap: 0.75,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Tooltip title="Inspect Full Screen">
                <IconButton
                  size="small"
                  onClick={onOpenLightbox}
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.8)',
                    color: '#fff',
                    '&:hover': { bgcolor: BRAND },
                  }}
                >
                  <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Open Original File">
                <IconButton
                  size="small"
                  component="a"
                  href={imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: 'rgba(15,23,42,0.8)',
                    color: '#fff',
                    '&:hover': { bgcolor: '#2563eb' },
                  }}
                >
                  <OpenInNewIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            </Box>
          </>
        ) : (
          <Stack alignItems="center" spacing={1} sx={{ p: 2, textAlign: 'center' }}>
            <CollectionsOutlinedIcon sx={{ fontSize: 38, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              No document or image uploaded
            </Typography>
          </Stack>
        )}
      </Box>
    </Card>
  )
}

export default function AdminVendorDetailView({ vendorId }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = isDark ? BRAND_DARK : BRAND

  const initialTab = Number(searchParams.get('tab') || 0)
  const [activeTab, setActiveTab] = useState(Number.isFinite(initialTab) ? initialTab : 0)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [vendor, setVendor] = useState(null)
  const [business, setBusiness] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [stats, setStats] = useState(null)

  // Admin action states
  const [verifyingBusiness, setVerifyingBusiness] = useState(false)
  const [togglingEmail, setTogglingEmail] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)

  // Map & Geolocation states
  const [mapAuthError, setMapAuthError] = useState(false)
  const [editPinMode, setEditPinMode] = useState(false)
  const [markerPos, setMarkerPos] = useState(null)
  const [geocodingAddress, setGeocodingAddress] = useState(false)
  const [savingPin, setSavingPin] = useState(false)
  const mapRef = useRef(null)

  // Lightbox Gallery modal state
  const [lightbox, setLightbox] = useState({ open: false, index: 0, zoom: 1 })

  const { isLoaded: mapsLoaded, loadError } = useJsApiLoader({
    id: GOOGLE_MAPS_SCRIPT_ID,
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  })

  useEffect(() => {
    const prev = window.gm_authFailure
    window.gm_authFailure = () => setMapAuthError(true)
    return () => {
      window.gm_authFailure = prev
    }
  }, [])

  const fetchVendorDetails = useCallback(async (isSilent = false) => {
    if (!vendorId) return
    if (isSilent) setRefreshing(true)
    else setLoading(true)

    try {
      const res = await fetch(`/api/admin/vendors/${encodeURIComponent(vendorId)}`)
      const json = await res.json()
      if (json.success && json.data) {
        setVendor(json.data.vendor)
        setBusiness(json.data.business)
        setProducts(json.data.products || [])
        setCategories(json.data.categories || [])
        setStats(json.data.stats || null)

        if (json.data.business?.latitude != null && json.data.business?.longitude != null) {
          setMarkerPos({
            lat: Number(json.data.business.latitude),
            lng: Number(json.data.business.longitude),
          })
        } else {
          setMarkerPos(null)
        }
      } else {
        toast.error(json.error || 'Vendor not found')
      }
    } catch (err) {
      console.error('Error loading vendor details:', err)
      toast.error('Failed to load vendor details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [vendorId])

  useEffect(() => {
    fetchVendorDetails()
  }, [fetchVendorDetails])

  // Parse all vendor & business documents + gallery photos into a unified list for Lightbox navigation
  const restaurantImages = useMemo(
    () => parseImageList(business?.urlRestaurantImages),
    [business?.urlRestaurantImages]
  )

  const allMediaItems = useMemo(() => {
    const items = []
    if (business?.urlCnicFront) {
      items.push({ title: 'CNIC Front Side', subtitle: 'Owner National Identity Card', url: business.urlCnicFront })
    }
    if (business?.urlCnicBack) {
      items.push({ title: 'CNIC Back Side', subtitle: 'Owner National Identity Card', url: business.urlCnicBack })
    }
    if (business?.urlLogo) {
      items.push({ title: 'Business Logo', subtitle: 'Official Brand Avatar', url: business.urlLogo })
    }
    if (business?.urlCoverPhoto) {
      items.push({ title: 'Storefront Cover Photo', subtitle: 'Storefront Banner', url: business.urlCoverPhoto })
    }
    if (vendor?.image && vendor.image !== business?.urlLogo) {
      items.push({ title: 'Vendor Account Photo', subtitle: 'User Profile Avatar', url: vendor.image })
    }
    restaurantImages.forEach((url, idx) => {
      items.push({
        title: `Storefront / Gallery Photo #${idx + 1}`,
        subtitle: business?.businessName || vendor?.username || 'Premises Gallery',
        url,
      })
    })
    return items
  }, [business, vendor, restaurantImages])

  const openMediaByUrl = (url, fallbackTitle = 'Document Preview') => {
    if (!url) return
    const idx = allMediaItems.findIndex((m) => m.url === url)
    if (idx >= 0) {
      setLightbox({ open: true, index: idx, zoom: 1 })
    } else {
      allMediaItems.push({ title: fallbackTitle, subtitle: '', url })
      setLightbox({ open: true, index: allMediaItems.length - 1, zoom: 1 })
    }
  }

  // Full formatted street address for display & geocoding
  const formattedAddress = useMemo(() => {
    if (!business) return ''
    return [
      business.houseNumber ? `Shop/House ${business.houseNumber}` : null,
      business.buildingPlaceName,
      business.streetAddress,
      business.city,
      business.state,
      business.postalCode,
      business.country || 'Pakistan',
    ]
      .filter(Boolean)
      .join(', ')
  }, [business])

  // Auto-geocode vendor's registered street address if no coordinates were saved yet
  const handleLocateFromAddress = useCallback(async (silent = false) => {
    if (!business) return
    const query = [business.streetAddress, business.city, business.state, business.country || 'Pakistan']
      .filter(Boolean)
      .join(', ')
    if (!query) {
      if (!silent) toast.error('No street or city address available to locate')
      return
    }
    setGeocodingAddress(true)
    try {
      const res = await fetch(`/api/geocode?address=${encodeURIComponent(query)}&country=PK`)
      const data = await res.json()
      if (data.success && data.latitude && data.longitude) {
        const pos = { lat: Number(data.latitude), lng: Number(data.longitude) }
        setMarkerPos(pos)
        if (mapRef.current) {
          mapRef.current.panTo(pos)
          mapRef.current.setZoom(15)
        }
        if (!silent) {
          toast.success('Located storefront address on map! Click "Save GPS Pin" to store permanently.')
        }
      } else if (!silent) {
        toast.error('Could not resolve coordinates from address')
      }
    } catch {
      if (!silent) toast.error('Failed to geocode address')
    } finally {
      setGeocodingAddress(false)
    }
  }, [business])

  // Automatically preview approximate map location from address when business has no saved lat/lng
  useEffect(() => {
    if (business && business.latitude == null && business.longitude == null && !markerPos) {
      handleLocateFromAddress(true)
    }
  }, [business, markerPos, handleLocateFromAddress])

  // Save updated GPS pin to Business profile
  const handleSaveBusinessPin = async () => {
    if (!business?.id || !markerPos) return
    setSavingPin(true)
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: business.id,
          latitude: markerPos.lat,
          longitude: markerPos.lng,
        }),
      })
      const json = await res.json()
      if (json.success) {
        setBusiness(json.data)
        setEditPinMode(false)
        toast.success('Vendor GPS location saved!')
      } else {
        toast.error(json.error || 'Failed to save coordinates')
      }
    } catch {
      toast.error('Network error while saving coordinates')
    } finally {
      setSavingPin(false)
    }
  }

  // Approve / Reject / Reset Business Verification Status
  const handleVerifyBusiness = async (nextStatus) => {
    if (!business?.id) return
    setVerifyingBusiness(true)
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, verificationStatus: nextStatus }),
      })
      const json = await res.json()
      if (json.success) {
        setBusiness(json.data)
        toast.success(
          nextStatus === 'APPROVED'
            ? 'Vendor Business Approved!'
            : nextStatus === 'REJECTED'
            ? 'Vendor Business Rejected'
            : 'Business status reset to Pending'
        )
      } else {
        toast.error(json.error || 'Failed to update status')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setVerifyingBusiness(false)
    }
  }

  // Assign Root Storefront Category
  const handleCategoryChange = async (newCatId) => {
    if (!business?.id) return
    setSavingCategory(true)
    try {
      const res = await fetch('/api/admin/businesses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: business.id, categoryId: newCatId || null }),
      })
      const json = await res.json()
      if (json.success) {
        setBusiness(json.data)
        toast.success('Storefront root category updated')
      } else {
        toast.error(json.error || 'Failed to update category')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSavingCategory(false)
    }
  }

  // Toggle Vendor User Email Verification
  const handleToggleEmailVerification = async () => {
    if (!vendor?.uid) return
    setTogglingEmail(true)
    try {
      const nextVal = !vendor.emailVerification
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: vendor.uid, emailVerification: nextVal }),
      })
      const json = await res.json()
      if (json.success) {
        setVendor((prev) => ({ ...prev, emailVerification: nextVal }))
        toast.success(nextVal ? 'Vendor account email verified' : 'Email verification revoked')
      } else {
        toast.error(json.error || 'Failed to update account verification')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setTogglingEmail(false)
    }
  }

  const osmEmbedUrl = useMemo(() => {
    const center = markerPos || DEFAULT_CENTER
    const minLat = center.lat - 0.012
    const maxLat = center.lat + 0.012
    const minLng = center.lng - 0.012
    const maxLng = center.lng + 0.012
    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${center.lat}%2C${center.lng}`
  }, [markerPos])

  if (loading) {
    return (
      <Box sx={{ minHeight: '65vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: accent }} />
        <Typography color="text.secondary" fontWeight={600}>
          Loading complete vendor & business profile…
        </Typography>
      </Box>
    )
  }

  if (!vendor && !business) {
    return (
      <Box sx={{ py: 10, textAlign: 'center' }}>
        <StorefrontOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={800} gutterBottom>
          Vendor Not Found
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          The requested vendor record could not be located.
        </Typography>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/dashboard/vendors')}
          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2d5e21' }, textTransform: 'none', fontWeight: 700 }}
        >
          Back to Vendors
        </Button>
      </Box>
    )
  }

  const kycStatusConfig = {
    APPROVED: { label: 'KYC Approved', bg: '#dcfce7', color: '#15803d', darkBg: 'rgba(34,197,94,0.2)', darkColor: '#4ade80' },
    PENDING: { label: 'KYC Pending Review', bg: '#fef3c7', color: '#b45309', darkBg: 'rgba(245,158,11,0.2)', darkColor: '#fbbf24' },
    REJECTED: { label: 'KYC Rejected', bg: '#fee2e2', color: '#b91c1c', darkBg: 'rgba(239,68,68,0.2)', darkColor: '#f87171' },
  }[business?.verificationStatus] || {
    label: 'No Business Profile Submitted',
    bg: '#f1f5f9',
    color: '#475569',
    darkBg: 'rgba(148,163,184,0.16)',
    darkColor: '#cbd5e1',
  }

  const hasSavedCoords = business?.latitude != null && business?.longitude != null
  const countryInfo = getCountry(business?.country || 'Pakistan')

  // Reusable Map Section Renderer
  const renderMapSection = (mapHeight = 400) => (
    <SectionCard
      icon={<MapOutlinedIcon />}
      title="Storefront Map Location & GPS Coordinates"
      subtitle="Exact physical store pickup & delivery dispatch location"
      action={
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {business && (
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={editPinMode}
                  onChange={(e) => setEditPinMode(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" fontWeight={700}>
                  Adjust Pin
                </Typography>
              }
              sx={{ mr: 0.5 }}
            />
          )}
          {business && (
            <Button
              size="small"
              variant="outlined"
              startIcon={geocodingAddress ? <CircularProgress size={14} /> : <MyLocationIcon fontSize="small" />}
              onClick={() => handleLocateFromAddress(false)}
              disabled={geocodingAddress}
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
            >
              Locate from Address
            </Button>
          )}
          {markerPos && (
            <Button
              size="small"
              variant="outlined"
              endIcon={<LaunchIcon fontSize="small" />}
              component="a"
              href={`https://www.google.com/maps?q=${markerPos.lat},${markerPos.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 1.5 }}
            >
              Open in Google Maps
            </Button>
          )}
        </Stack>
      }
    >
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {hasSavedCoords ? (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={800}>
                  Verified Storefront GPS Pin Active
                </Typography>
                <Typography variant="caption" sx={{ fontFamily: 'monospace', display: 'block', mt: 0.3 }}>
                  {Number(business.latitude).toFixed(6)}, {Number(business.longitude).toFixed(6)}
                </Typography>
              </Alert>
            ) : markerPos ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="body2" fontWeight={800}>
                  Approximate Address Location Shown
                </Typography>
                <Typography variant="caption" display="block" mt={0.3}>
                  Vendor has not saved exact GPS coordinates yet. Showing map pin resolved from their street/city address.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="warning" sx={{ borderRadius: 2 }}>
                No GPS coordinates pinned yet for this vendor.
              </Alert>
            )}

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <InfoField
                label="Saved Latitude"
                value={business?.latitude != null ? Number(business.latitude).toFixed(6) : 'Not saved'}
                mono
                copyable={business?.latitude != null}
              />
              <InfoField
                label="Saved Longitude"
                value={business?.longitude != null ? Number(business.longitude).toFixed(6) : 'Not saved'}
                mono
                copyable={business?.longitude != null}
              />
            </Box>

            {formattedAddress && (
              <InfoField label="Registered Storefront Address" value={formattedAddress} copyable fullWidth />
            )}

            {business && markerPos && (editPinMode || !hasSavedCoords) && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleSaveBusinessPin}
                disabled={savingPin}
                startIcon={savingPin ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
                sx={{
                  bgcolor: BRAND,
                  '&:hover': { bgcolor: '#2d5e21' },
                  textTransform: 'none',
                  fontWeight: 800,
                  borderRadius: 2,
                  py: 1.1,
                }}
              >
                {savingPin
                  ? 'Saving GPS Coordinates…'
                  : `Save Pin (${markerPos.lat.toFixed(5)}, ${markerPos.lng.toFixed(5)})`}
              </Button>
            )}
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Box
            sx={{
              width: '100%',
              height: mapHeight,
              borderRadius: 2.5,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              position: 'relative',
              bgcolor: isDark ? '#0f172a' : '#f1f5f9',
            }}
          >
            {mapsLoaded && !mapAuthError && !loadError ? (
              <GoogleMap
                onLoad={(m) => (mapRef.current = m)}
                mapContainerStyle={{ width: '100%', height: '100%' }}
                center={markerPos || DEFAULT_CENTER}
                zoom={markerPos ? 15 : 11}
                onClick={(e) => {
                  if (!editPinMode) return
                  setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })
                }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: true,
                  fullscreenControl: true,
                  zoomControl: true,
                  styles: isDark ? DARK_MAP_STYLES : undefined,
                }}
              >
                {markerPos && (
                  <Marker
                    position={markerPos}
                    draggable={editPinMode}
                    onDragEnd={(e) => setMarkerPos({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
                    title={business?.businessName || vendor?.username || 'Vendor Storefront'}
                  />
                )}
              </GoogleMap>
            ) : (
              <iframe
                title="Vendor Storefront Map"
                src={osmEmbedUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
              />
            )}

            {editPinMode && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  px: 1.5,
                  py: 0.6,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(15,23,42,0.88)',
                  color: '#4ade80',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                }}
              >
                Pin Edit Mode Active: Click map or drag marker to reposition
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </SectionCard>
  )

  // Reusable Documents & Gallery Renderer
  const renderDocumentsAndGallery = () => (
    <Stack spacing={3}>
      <SectionCard
        icon={<BadgeOutlinedIcon />}
        title="Official KYC Documents & Brand Identity Assets"
        subtitle="Click any document or image to inspect in full-screen high resolution"
      >
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <DocumentPreviewCard
              title="CNIC Front Side"
              subtitle={business?.cnicNo ? `CNIC: ${business.cnicNo}` : 'Owner National ID (Front)'}
              imageUrl={business?.urlCnicFront}
              badgeLabel="KYC Doc"
              onOpenLightbox={() => openMediaByUrl(business?.urlCnicFront, 'CNIC Front Side')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DocumentPreviewCard
              title="CNIC Back Side"
              subtitle={business?.cnicNo ? `CNIC: ${business.cnicNo}` : 'Owner National ID (Back)'}
              imageUrl={business?.urlCnicBack}
              badgeLabel="KYC Doc"
              onOpenLightbox={() => openMediaByUrl(business?.urlCnicBack, 'CNIC Back Side')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DocumentPreviewCard
              title="Business Logo"
              subtitle="Official Storefront Avatar"
              imageUrl={business?.urlLogo || vendor?.image}
              badgeLabel="Brand Logo"
              onOpenLightbox={() => openMediaByUrl(business?.urlLogo || vendor?.image, 'Business Logo')}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DocumentPreviewCard
              title="Storefront Cover Banner"
              subtitle="Storefront Header Image"
              imageUrl={business?.urlCoverPhoto}
              badgeLabel="Banner"
              onOpenLightbox={() => openMediaByUrl(business?.urlCoverPhoto, 'Storefront Cover Banner')}
            />
          </Grid>
        </Grid>
      </SectionCard>

      <SectionCard
        icon={<CollectionsOutlinedIcon />}
        title={`Storefront, Menu & Facility Gallery Photos (${restaurantImages.length})`}
        subtitle="Uploaded photos of physical storefront, kitchen, interior, or merchandise"
      >
        {restaurantImages.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: 'center',
              borderRadius: 2,
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc',
            }}
          >
            <CollectionsOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              No additional storefront or gallery photos have been uploaded by this vendor yet.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {restaurantImages.map((imgUrl, idx) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={`${imgUrl}-${idx}`}>
                <DocumentPreviewCard
                  title={`Gallery Photo #${idx + 1}`}
                  subtitle={business?.businessName || 'Storefront Premises'}
                  imageUrl={imgUrl}
                  badgeLabel={`#${idx + 1}`}
                  onOpenLightbox={() => openMediaByUrl(imgUrl, `Gallery Photo #${idx + 1}`)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </SectionCard>
    </Stack>
  )

  const currentMedia = allMediaItems[lightbox.index] || null

  return (
    <Box sx={{ pb: 6 }}>
      {/* ── Top Navigation & Breadcrumb Bar ── */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        mb={2.5}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ArrowBackIcon />}
            onClick={() => router.push('/admin/dashboard/vendors')}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              borderColor: 'divider',
              color: 'text.primary',
            }}
          >
            Back to Vendors
          </Button>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', md: 'block' } }}>
            Vendors &nbsp;/&nbsp;{' '}
            <Box component="span" sx={{ color: 'text.primary', fontWeight: 700 }}>
              {business?.businessName || vendor?.username}
            </Box>
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1.25} alignItems="center">
          <Button
            variant="outlined"
            size="small"
            startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
            onClick={() => fetchVendorDetails(true)}
            disabled={refreshing}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: 'divider', color: 'text.secondary' }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<PrintOutlinedIcon />}
            onClick={() => window.print()}
            sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, borderColor: 'divider', color: 'text.secondary' }}
          >
            Print Profile
          </Button>
        </Stack>
      </Stack>

      {/* ── Executive Hero Banner & Vendor Identity Header ── */}
      <Card
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          overflow: 'hidden',
          mb: 3,
          bgcolor: 'background.paper',
        }}
      >
        {/* Cover Photo Banner */}
        <Box
          sx={{
            height: { xs: 150, sm: 210 },
            background: business?.urlCoverPhoto
              ? `linear-gradient(180deg, rgba(15,23,42,0.18) 0%, rgba(15,23,42,0.75) 100%), url(${business.urlCoverPhoto}) center/cover no-repeat`
              : 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #14532d 100%)',
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            p: 2,
          }}
        >
          {business?.urlCoverPhoto && (
            <Button
              size="small"
              startIcon={<VisibilityOutlinedIcon fontSize="small" />}
              onClick={() => openMediaByUrl(business.urlCoverPhoto, 'Storefront Cover Photo')}
              sx={{
                bgcolor: 'rgba(15,23,42,0.75)',
                color: '#fff',
                backdropFilter: 'blur(6px)',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': { bgcolor: 'rgba(15,23,42,0.92)' },
              }}
            >
              View Cover Banner
            </Button>
          )}
        </Box>

        {/* Identity & Admin Controls Bar */}
        <Box sx={{ px: { xs: 2.5, sm: 3.5 }, pb: 3, pt: 1 }}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            alignItems={{ xs: 'flex-start', lg: 'flex-end' }}
            justifyContent="space-between"
            spacing={2.5}
          >
            {/* Avatar + Name + Badges */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Avatar
                src={business?.urlLogo || vendor?.image}
                onClick={() =>
                  (business?.urlLogo || vendor?.image) &&
                  openMediaByUrl(business?.urlLogo || vendor?.image, 'Business Logo')
                }
                sx={{
                  width: { xs: 78, sm: 96 },
                  height: { xs: 78, sm: 96 },
                  mt: { xs: -6, sm: -7 },
                  bgcolor: BRAND,
                  color: '#fff',
                  fontSize: 34,
                  fontWeight: 900,
                  border: '4px solid',
                  borderColor: 'background.paper',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
                  cursor: business?.urlLogo || vendor?.image ? 'pointer' : 'default',
                }}
              >
                {(business?.businessName || vendor?.username || 'V').charAt(0).toUpperCase()}
              </Avatar>

              <Box sx={{ pt: { sm: 0.5 } }}>
                <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ mb: 0.75 }}>
                  <Typography variant="h5" fontWeight={900} color="text.primary">
                    {business?.businessName || vendor?.username}
                  </Typography>
                  <Chip
                    size="small"
                    label={kycStatusConfig.label}
                    sx={{
                      bgcolor: isDark ? kycStatusConfig.darkBg : kycStatusConfig.bg,
                      color: isDark ? kycStatusConfig.darkColor : kycStatusConfig.color,
                      fontWeight: 800,
                      fontSize: '0.73rem',
                    }}
                  />
                  {vendor && (
                    <Chip
                      size="small"
                      icon={
                        vendor.emailVerification ? (
                          <VerifiedUserOutlinedIcon sx={{ fontSize: '14px !important' }} />
                        ) : (
                          <HourglassEmptyIcon sx={{ fontSize: '14px !important' }} />
                        )
                      }
                      label={vendor.emailVerification ? 'Email Verified' : 'Email Unverified'}
                      sx={{
                        bgcolor: vendor.emailVerification
                          ? isDark
                            ? 'rgba(34,197,94,0.16)'
                            : '#dcfce7'
                          : isDark
                          ? 'rgba(245,158,11,0.16)'
                          : '#fef9c3',
                        color: vendor.emailVerification
                          ? isDark
                            ? '#4ade80'
                            : '#16a34a'
                          : isDark
                          ? '#fbbf24'
                          : '#854d0e',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                        '& .MuiChip-icon': { color: 'inherit' },
                      }}
                    />
                  )}
                  {business?.businessCategory?.categoryTitle && (
                    <Chip
                      size="small"
                      label={`${business.businessCategory.categoryTitle}${
                        business.businessType?.typeTitle ? ` • ${business.businessType.typeTitle}` : ''
                      }`}
                      sx={{
                        bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#eff6ff',
                        color: isDark ? '#60a5fa' : '#1d4ed8',
                        fontWeight: 700,
                        fontSize: '0.72rem',
                      }}
                    />
                  )}
                </Stack>

                <Stack direction="row" spacing={2.25} flexWrap="wrap" useFlexGap sx={{ color: 'text.secondary' }}>
                  {(business?.email || vendor?.email) && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <EmailOutlinedIcon sx={{ fontSize: 15 }} />
                      <Typography variant="body2" fontWeight={600}>
                        {business?.email || vendor?.email}
                      </Typography>
                    </Stack>
                  )}
                  {(business?.phoneNumber1 || vendor?.phoneNumber) && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
                      <Typography variant="body2" fontWeight={600}>
                        {business?.phoneNumber1 || vendor?.phoneNumber}
                      </Typography>
                    </Stack>
                  )}
                  {business?.city && (
                    <Stack direction="row" spacing={0.6} alignItems="center">
                      <LocationOnOutlinedIcon sx={{ fontSize: 15 }} />
                      <Typography variant="body2" fontWeight={600}>
                        {countryInfo.flag} {business.city}, {business.state}
                      </Typography>
                    </Stack>
                  )}
                  <Stack direction="row" spacing={0.6} alignItems="center">
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
                    <Typography variant="body2" fontWeight={500}>
                      Joined {formatDateTime(business?.createdAt || vendor?.createdAt)}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Stack>

            {/* Admin Quick Actions & Approval Controls */}
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
              {business && (
                <FormControl size="small" sx={{ minWidth: 190 }}>
                  <InputLabel>Storefront Root Category</InputLabel>
                  <Select
                    label="Storefront Root Category"
                    value={business.categoryId || ''}
                    disabled={savingCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    sx={{ borderRadius: 2, fontWeight: 700 }}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.vertical})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {vendor && (
                <Button
                  size="small"
                  variant="outlined"
                  disabled={togglingEmail}
                  onClick={handleToggleEmailVerification}
                  startIcon={vendor.emailVerification ? <BlockOutlinedIcon /> : <VerifiedUserOutlinedIcon />}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 2,
                    py: 0.9,
                    borderColor: vendor.emailVerification ? 'warning.main' : 'success.main',
                    color: vendor.emailVerification ? 'warning.main' : 'success.main',
                  }}
                >
                  {vendor.emailVerification ? 'Revoke Email' : 'Verify Email'}
                </Button>
              )}

              {business && business.verificationStatus !== 'APPROVED' && (
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  disabled={verifyingBusiness}
                  onClick={() => handleVerifyBusiness('APPROVED')}
                  startIcon={<CheckCircleOutlineIcon />}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, py: 0.9, px: 2 }}
                >
                  Approve Business
                </Button>
              )}

              {business && business.verificationStatus !== 'REJECTED' && (
                <Button
                  size="small"
                  variant="contained"
                  color="error"
                  disabled={verifyingBusiness}
                  onClick={() => handleVerifyBusiness('REJECTED')}
                  startIcon={<BlockOutlinedIcon />}
                  sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, py: 0.9, px: 2 }}
                >
                  Reject Business
                </Button>
              )}

              {business && business.verificationStatus !== 'PENDING' && (
                <Tooltip title="Reset KYC status back to Pending Review">
                  <IconButton
                    size="small"
                    disabled={verifyingBusiness}
                    onClick={() => handleVerifyBusiness('PENDING')}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
                  >
                    <RestartAltIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Stack>
          </Stack>
        </Box>

        {/* Section Tabs */}
        <Divider />
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.015)' : '#f8fafc',
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 800, fontSize: 13.5, minHeight: 50 },
            '& .Mui-selected': { color: `${accent} !important` },
            '& .MuiTabs-indicator': { bgcolor: accent, height: 3 },
          }}
        >
          <Tab icon={<StorefrontOutlinedIcon fontSize="small" />} iconPosition="start" label="Complete Profile Overview" />
          <Tab icon={<GpsFixedIcon fontSize="small" />} iconPosition="start" label="Map Location & Premises" />
          <Tab
            icon={<CollectionsOutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`Documents & Images (${allMediaItems.length})`}
          />
          <Tab
            icon={<Inventory2OutlinedIcon fontSize="small" />}
            iconPosition="start"
            label={`Products & Catalog (${products.length})`}
          />
        </Tabs>
      </Card>

      {/* ── KPI Summary Row ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: 'Business KYC Status',
            value: business ? business.verificationStatus : 'NOT SUBMITTED',
            sub: business?.cnicNo ? `CNIC: ${business.cnicNo}` : 'Awaiting merchant registration',
            color:
              business?.verificationStatus === 'APPROVED'
                ? '#16a34a'
                : business?.verificationStatus === 'REJECTED'
                ? '#dc2626'
                : '#d97706',
          },
          {
            label: 'Documents & Media',
            value: `${allMediaItems.length} Files`,
            sub: `${[business?.urlCnicFront, business?.urlCnicBack].filter(Boolean).length}/2 CNIC • ${restaurantImages.length} Gallery`,
            color: '#2563eb',
          },
          {
            label: 'GPS Map Status',
            value: hasSavedCoords ? 'Pinned' : markerPos ? 'Auto-Located' : 'Unpinned',
            sub: hasSavedCoords
              ? `${Number(business.latitude).toFixed(4)}, ${Number(business.longitude).toFixed(4)}`
              : business?.city || 'No coordinates saved',
            color: hasSavedCoords ? '#059669' : '#7c3aed',
          },
          {
            label: 'Vendor Products',
            value: stats?.totalProducts ?? 0,
            sub: `${stats?.approvedProducts ?? 0} approved • ${stats?.pendingProducts ?? 0} pending`,
            color: '#9333ea',
          },
          {
            label: 'Stock / Gross Sales',
            value: `Rs. ${Number(stats?.stockValue || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })}`,
            sub: `${stats?.totalOrders ?? 0} orders • Rs. ${Number(stats?.grossSales || 0).toLocaleString('en-PK', { maximumFractionDigits: 0 })} sales`,
            color: accent,
          },
        ].map((kpi) => (
          <Paper
            key={kpi.label}
            variant="outlined"
            sx={{
              p: 2,
              borderRadius: 2.5,
              borderTop: `3px solid ${kpi.color}`,
              bgcolor: 'background.paper',
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={700}
              sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}
            >
              {kpi.label}
            </Typography>
            <Typography variant="h6" fontWeight={900} sx={{ color: kpi.color, my: 0.4 }} noWrap>
              {kpi.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" noWrap>
              {kpi.sub}
            </Typography>
          </Paper>
        ))}
      </Box>

      {/* Notice when vendor user has not submitted business registration form yet */}
      {!business && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Merchant Business Registration Not Submitted Yet
          </Typography>
          <Typography variant="body2">
            This vendor account (<strong>{vendor?.email}</strong>) exists in the platform users table, but the vendor has not yet submitted their Business Profile & KYC Registration form. Account details and catalog items are shown below.
          </Typography>
        </Alert>
      )}

      {/* ══════════════════════════ TAB 0: COMPLETE PROFILE OVERVIEW ══════════════════════════ */}
      {activeTab === 0 && (
        <Stack spacing={3}>
          {/* Row 1: Business Legal Info + Owner & Account Info */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <SectionCard
                icon={<BusinessOutlinedIcon />}
                title="Business & Commercial Registration"
                subtitle="Legal storefront classification, tax registration & platform vertical"
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                  <InfoField label="Business / Storefront Name" value={business?.businessName} copyable fullWidth />
                  <InfoField
                    label="Business Category"
                    value={business?.businessCategory?.categoryTitle}
                  />
                  <InfoField
                    label="Business Type / Cuisine"
                    value={business?.businessType?.typeTitle}
                  />
                  <InfoField
                    label="Storefront Root Category"
                    value={business?.category?.name || 'Unassigned'}
                  />
                  <InfoField label="Platform Vertical" value={business?.vertical || vendor?.type || 'FOOD'} />
                  <InfoField label="NTN (Tax Number)" value={business?.ntnNo || 'Not provided'} mono copyable />
                  <InfoField label="Business Record ID" value={business?.id ? `#${business.id}` : '—'} mono />
                  <InfoField label="Business Registered" value={formatDateTime(business?.createdAt)} />
                  <InfoField label="Last Profile Update" value={formatDateTime(business?.updatedAt)} />
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SectionCard
                icon={<PersonOutlineIcon />}
                title="Proprietor Identity & Platform Account"
                subtitle="Owner National ID (CNIC), contact numbers & login account credentials"
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                  <InfoField label="Owner First Name" value={business?.firstName} />
                  <InfoField label="Owner Last Name" value={business?.lastName} />
                  <InfoField label="Owner CNIC Number" value={business?.cnicNo} mono copyable />
                  <InfoField label="Account Username" value={vendor?.username} copyable />
                  <InfoField label="Primary Phone" value={business?.phoneNumber1 || vendor?.phoneNumber} copyable />
                  <InfoField label="Secondary Phone" value={business?.phoneNumber2 || 'None'} copyable={!!business?.phoneNumber2} />
                  <InfoField label="Registered Email" value={business?.email || vendor?.email} copyable fullWidth />
                  <InfoField label="Platform Vendor UID" value={vendor?.uid} mono copyable fullWidth />
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          {/* Row 2: Physical Address + Bank & Settlement */}
          <Grid container spacing={3}>
            <Grid item xs={12} lg={6}>
              <SectionCard
                icon={<LocationOnOutlinedIcon />}
                title="Physical Storefront & Billing Address"
                subtitle="Registered street premises, market building & postal details"
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                  <InfoField label="Street Address" value={business?.streetAddress} copyable fullWidth />
                  <InfoField label="Building / Market / Plaza" value={business?.buildingPlaceName} />
                  <InfoField label="Shop / House Number" value={business?.houseNumber} />
                  <InfoField label="City" value={business?.city} />
                  <InfoField label="State / Province" value={business?.state} />
                  <InfoField label="Postal / ZIP Code" value={business?.postalCode} mono />
                  <InfoField
                    label="Country"
                    value={business ? `${countryInfo.flag} ${business.country || 'Pakistan'}` : '—'}
                  />
                  <InfoField label="Official Billing Address" value={business?.billingAddress} copyable fullWidth />
                </Box>
              </SectionCard>
            </Grid>

            <Grid item xs={12} lg={6}>
              <SectionCard
                icon={<AccountBalanceOutlinedIcon />}
                title="Financial Settlement & Bank Payout Account"
                subtitle="Verified bank IBAN & settlement wallet for vendor payouts"
              >
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.75 }}>
                  <InfoField label="Bank Name" value={business?.bankName} copyable />
                  <InfoField label="Account Holder Title" value={business?.bankAccountTitle} copyable />
                  <InfoField label="IBAN / Account Number" value={business?.bankIbanNo} mono copyable fullWidth />
                  <InfoField label="Billing Address" value={business?.billingAddress} fullWidth />
                  <InfoField
                    label="Platform Wallet Balance"
                    value={
                      vendor?.wallet
                        ? `${vendor.wallet.currency} ${vendor.wallet.balance.toLocaleString()}`
                        : 'Rs. 0'
                    }
                  />
                  <InfoField
                    label="Escrow / Pending Clearance"
                    value={
                      vendor?.wallet
                        ? `${vendor.wallet.currency} ${vendor.wallet.escrowBalance.toLocaleString()}`
                        : 'Rs. 0'
                    }
                  />
                </Box>
              </SectionCard>
            </Grid>
          </Grid>

          {/* Row 3: Interactive Map Location */}
          {renderMapSection(400)}

          {/* Row 4 & 5: All Documents, Brand Images & Gallery Photos */}
          {renderDocumentsAndGallery()}
        </Stack>
      )}

      {/* ══════════════════════════ TAB 1: MAP LOCATION & PREMISES ══════════════════════════ */}
      {activeTab === 1 && renderMapSection(520)}

      {/* ══════════════════════════ TAB 2: DOCUMENTS & IMAGES ══════════════════════════ */}
      {activeTab === 2 && renderDocumentsAndGallery()}

      {/* ══════════════════════════ TAB 3: VENDOR PRODUCTS & CATALOG ══════════════════════════ */}
      {activeTab === 3 && (
        <SectionCard
          icon={<Inventory2OutlinedIcon />}
          title={`Vendor Product Catalog (${products.length})`}
          subtitle="All products created and listed under this vendor account"
        >
          {products.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" fontWeight={700} color="text.secondary">
                No products listed by this vendor yet
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                    {['Product', 'SKU', 'Category', 'Price', 'Stock', 'Approval', 'Added'].map((h) => (
                      <TableCell
                        key={h}
                        sx={{ fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', py: 1.5 }}
                      >
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((prod) => {
                    const imgs = parseImageList(prod.proImages)
                    const thumb = imgs[0] || null
                    return (
                      <TableRow key={prod.proId} hover>
                        <TableCell sx={{ py: 1.25 }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Avatar
                              variant="rounded"
                              src={thumb}
                              sx={{ width: 42, height: 42, bgcolor: 'action.hover', fontSize: 14, fontWeight: 700 }}
                            >
                              {prod.proName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight={700}>
                                {prod.proName}
                              </Typography>
                              {prod.brandName && (
                                <Typography variant="caption" color="text.secondary">
                                  {prod.brandName}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{prod.sku}</TableCell>
                        <TableCell>
                          <Typography variant="body2">{prod.category?.name || '—'}</Typography>
                          {prod.subCategory?.subCatName && (
                            <Typography variant="caption" color="text.secondary">
                              {prod.subCategory.subCatName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>
                          Rs. {Number(prod.salePrice ?? prod.price).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={`${prod.stock} in stock`}
                            sx={{
                              fontWeight: 700,
                              fontSize: '0.7rem',
                              bgcolor: prod.stock > 0 ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)',
                              color: prod.stock > 0 ? (isDark ? '#4ade80' : '#15803d') : '#ef4444',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={prod.approvalStatus}
                            sx={{
                              fontWeight: 800,
                              fontSize: '0.7rem',
                              bgcolor:
                                prod.approvalStatus === 'Approved'
                                  ? 'rgba(34,197,94,0.16)'
                                  : prod.approvalStatus === 'Rejected'
                                  ? 'rgba(239,68,68,0.16)'
                                  : 'rgba(245,158,11,0.16)',
                              color:
                                prod.approvalStatus === 'Approved'
                                  ? isDark
                                    ? '#4ade80'
                                    : '#15803d'
                                  : prod.approvalStatus === 'Rejected'
                                  ? '#ef4444'
                                  : '#d97706',
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {formatDateTime(prod.createdAt)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </SectionCard>
      )}

      {/* ── Full-Screen High-Res Lightbox Carousel for Documents & Gallery Images ── */}
      <Dialog
        open={lightbox.open && Boolean(currentMedia)}
        onClose={() => setLightbox({ open: false, index: 0, zoom: 1 })}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0b1120',
            color: '#fff',
            borderRadius: 3,
            overflow: 'hidden',
            border: '1px solid rgba(255,255,255,0.12)',
          },
        }}
      >
        {currentMedia && (
          <>
            <Box
              sx={{
                px: 2.5,
                py: 1.5,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box>
                <Typography variant="subtitle1" fontWeight={800} color="#fff">
                  {currentMedia.title}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)' }}>
                  {currentMedia.subtitle} • {lightbox.index + 1} of {allMediaItems.length}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Zoom Out">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setLightbox((prev) => ({ ...prev, zoom: Math.max(0.5, Number((prev.zoom - 0.25).toFixed(2))) }))
                    }
                    sx={{ color: '#fff' }}
                  >
                    <ZoomOutIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Typography variant="caption" fontWeight={700} sx={{ minWidth: 42, textAlign: 'center' }}>
                  {Math.round(lightbox.zoom * 100)}%
                </Typography>
                <Tooltip title="Zoom In">
                  <IconButton
                    size="small"
                    onClick={() =>
                      setLightbox((prev) => ({ ...prev, zoom: Math.min(3, Number((prev.zoom + 0.25).toFixed(2))) }))
                    }
                    sx={{ color: '#fff' }}
                  >
                    <ZoomInIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Button
                  size="small"
                  variant="outlined"
                  endIcon={<OpenInNewIcon fontSize="small" />}
                  component="a"
                  href={currentMedia.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: '#fff',
                    borderColor: 'rgba(255,255,255,0.25)',
                    textTransform: 'none',
                    fontWeight: 700,
                    borderRadius: 1.5,
                  }}
                >
                  Open Original
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setLightbox({ open: false, index: 0, zoom: 1 })}
                  sx={{ color: '#fff' }}
                >
                  <CloseIcon />
                </IconButton>
              </Stack>
            </Box>

            <DialogContent
              sx={{
                p: 0,
                height: '75vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'auto',
                bgcolor: '#060a13',
              }}
            >
              {allMediaItems.length > 1 && (
                <IconButton
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      index: (prev.index - 1 + allMediaItems.length) % allMediaItems.length,
                      zoom: 1,
                    }))
                  }
                  sx={{
                    position: 'fixed',
                    left: { xs: 16, md: 48 },
                    zIndex: 10,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    '&:hover': { bgcolor: BRAND },
                  }}
                >
                  <ArrowBackIosNewIcon fontSize="small" />
                </IconButton>
              )}

              <Box
                component="img"
                src={currentMedia.url}
                alt={currentMedia.title}
                sx={{
                  maxWidth: '92%',
                  maxHeight: '90%',
                  objectFit: 'contain',
                  transform: `scale(${lightbox.zoom})`,
                  transition: 'transform 0.2s ease',
                }}
              />

              {allMediaItems.length > 1 && (
                <IconButton
                  onClick={() =>
                    setLightbox((prev) => ({
                      ...prev,
                      index: (prev.index + 1) % allMediaItems.length,
                      zoom: 1,
                    }))
                  }
                  sx={{
                    position: 'fixed',
                    right: { xs: 16, md: 48 },
                    zIndex: 10,
                    bgcolor: 'rgba(255,255,255,0.12)',
                    color: '#fff',
                    '&:hover': { bgcolor: BRAND },
                  }}
                >
                  <ArrowForwardIosIcon fontSize="small" />
                </IconButton>
              )}
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}

