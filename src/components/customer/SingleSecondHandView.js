'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Tooltip from '@mui/material/Tooltip'
import toast from 'react-hot-toast'

import { useAuth } from '@/contexts/AuthContext'
import CustomerFooter from '@/components/customer/CustomerFooter'

// Icons
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import PhoneIcon from '@mui/icons-material/Phone'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import VerifiedIcon from '@mui/icons-material/Verified'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import SecurityIcon from '@mui/icons-material/Security'
import StorefrontIcon from '@mui/icons-material/Storefront'
import CloseIcon from '@mui/icons-material/Close'
import HandshakeIcon from '@mui/icons-material/Handshake'
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import CheckIcon from '@mui/icons-material/Check'

const THEME = {
  primary: '#4A154B',
  primaryDark: '#2E0836',
  accentGold: '#FDB600',
  emerald: '#10B981',
  olxDark: '#002F34',
  border: '#E2E8F0',
  pageBg: '#F4F5F7',
}

const CONDITIONS_MAP = {
  BRAND_NEW: { label: 'Brand New (Box Sealed)', color: '#10B981', desc: 'Factory sealed or never opened' },
  LIKE_NEW: { label: 'Like New (Mint)', color: '#0284C7', desc: 'Flawless with zero scratches or marks' },
  EXCELLENT: { label: 'Excellent Condition', color: '#8B5CF6', desc: 'Minimal signs of very light use' },
  GOOD: { label: 'Good (Normal Wear)', color: '#F59E0B', desc: 'Fully functional, normal signs of wear' },
  FAIR: { label: 'Fair (Functional)', color: '#64748B', desc: 'Visible cosmetic wear, works 100%' },
}

function timeAgo(dateString) {
  if (!dateString) return 'Recently'
  const date = new Date(dateString)
  const seconds = Math.floor((new Date() - date) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days} days ago`
  return `${Math.floor(days / 30)} months ago`
}

function formatMemberSince(dateString) {
  if (!dateString) return 'Member since 2024'
  const date = new Date(dateString)
  return `Member since ${date.toLocaleString('en-US', { month: 'short', year: 'numeric' })}`
}

export default function SingleSecondHandView({ itemId, initialData = null }) {
  const { user } = useAuth()

  const [item, setItem] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [activePhotoIdx, setActivePhotoIdx] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [showPhone, setShowPhone] = useState(false)

  // Offer Dialog State
  const [openOfferModal, setOpenOfferModal] = useState(false)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)

  // Related items
  const [relatedItems, setRelatedItems] = useState([])

  // Fetch Item details if not passed or to refresh
  const fetchItemDetails = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/second-hand/${itemId}`)
      const data = await res.json()
      if (data.success && data.data) {
        setItem(data.data)

        // Suggest 15% discount for offer
        const suggested = Math.round(Number(data.data.price || 0) * 0.85)
        setOfferPrice(String(suggested))

        // Fetch related items from same category
        if (data.data.category) {
          fetch(`/api/second-hand?category=${encodeURIComponent(data.data.category)}&limit=6`)
            .then(r => r.json())
            .then(relData => {
              if (relData.success && relData.data) {
                setRelatedItems(relData.data.filter(it => it.id !== Number(itemId)).slice(0, 4))
              }
            })
            .catch(() => {})
        }
      } else {
        toast.error('Item not found or has been removed')
      }
    } catch (err) {
      toast.error('Failed to load item: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [itemId])

  useEffect(() => {
    if (!initialData) {
      fetchItemDetails()
    } else {
      const suggested = Math.round(Number(initialData.price || 0) * 0.85)
      setOfferPrice(String(suggested))

      if (initialData.category) {
        fetch(`/api/second-hand?category=${encodeURIComponent(initialData.category)}&limit=6`)
          .then(r => r.json())
          .then(relData => {
            if (relData.success && relData.data) {
              setRelatedItems(relData.data.filter(it => it.id !== Number(itemId)).slice(0, 4))
            }
          })
          .catch(() => {})
      }
    }
  }, [itemId, initialData, fetchItemDetails])

  // Parse images
  const images = useMemo(() => {
    if (!item?.images) return ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000']
    try {
      const parsed = typeof item.images === 'string' ? JSON.parse(item.images) : item.images
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000']
    } catch {
      return ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1000']
    }
  }, [item?.images])

  const conditionObj = useMemo(() => {
    return CONDITIONS_MAP[item?.condition] || { label: item?.condition || 'Used', color: '#64748B', desc: 'Pre-owned' }
  }, [item?.condition])

  // Discount calculation
  const orig = Number(item?.originalPrice || 0)
  const curr = Number(item?.price || 0)
  const discountPct = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0

  // WhatsApp Chat Handler
  const openWhatsAppChat = () => {
    const phone = item?.contactPhone || item?.seller?.phoneNumber
    if (!phone) {
      toast.error('Seller phone number not provided')
      return
    }
    const cleanNumber = phone.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Hi! I am interested in your listing "${item.title}" on Martzona for Rs. ${curr.toLocaleString()}. Is it still available? (Link: ${window.location.href})`)
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank')
  }

  // Submit Offer
  const handleSubmitOffer = async () => {
    if (!user) {
      toast.error('Please log in to submit a price offer')
      return
    }
    if (!offerPrice || Number(offerPrice) <= 0) {
      toast.error('Please enter a valid offer price')
      return
    }

    try {
      setSubmittingOffer(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const headers = { 'Content-Type': 'application/json' }
      if (token && token !== 'GUEST_SESSION') headers.Authorization = `Bearer ${token}`

      const res = await fetch('/api/second-hand/offers', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          itemId: item.id,
          offerPrice: Number(offerPrice),
          message: offerMessage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Your offer has been submitted! The seller will review and respond.')
        setOpenOfferModal(false)
      } else {
        toast.error(data.error || 'Failed to submit offer')
      }
    } catch (err) {
      toast.error('Error submitting offer: ' + err.message)
    } finally {
      setSubmittingOffer(false)
    }
  }

  // Share Listing
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: item?.title || 'Martzona 2nd Hand Item',
        text: `Check out "${item?.title}" for Rs. ${curr.toLocaleString()} on Martzona!`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: THEME.pageBg }}>
        <CircularProgress sx={{ color: THEME.primary, mb: 2 }} />
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Loading pre-loved item details...
        </Typography>
      </Box>
    )
  }

  if (!item) {
    return (
      <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: THEME.pageBg, p: 3 }}>
        <Card sx={{ p: 6, textAlign: 'center', maxWidth: 500, borderRadius: 3, border: `1px solid ${THEME.border}` }}>
          <StorefrontIcon sx={{ fontSize: 50, color: '#94A3B8', mb: 2 }} />
          <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ mb: 1 }}>
            Listing Not Available
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This pre-loved item has either been sold or removed by the seller.
          </Typography>
          <Button
            component={Link}
            href="/second-hand"
            variant="contained"
            sx={{ bgcolor: THEME.primary, textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
          >
            Explore Other 2nd Hand Items
          </Button>
        </Card>
      </Box>
    )
  }

  return (
    <Box sx={{ bgcolor: THEME.pageBg, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      {/* ─── TOP HEADER BAR ─── */}
      <Box sx={{ bgcolor: '#FFFFFF', borderBottom: `1px solid ${THEME.border}`, px: { xs: 2, sm: 3, md: 5 }, py: 1.5, position: 'sticky', top: 0, zIndex: 1000, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <Box sx={{ maxWidth: 1350, mx: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo & Back */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              href="/second-hand"
              startIcon={<ArrowBackIcon />}
              sx={{ color: '#0F172A', fontWeight: 700, textTransform: 'none', fontSize: '0.88rem' }}
            >
              Back to Marketplace
            </Button>
            <Divider orientation="vertical" flexItem sx={{ height: 24, alignSelf: 'center', display: { xs: 'none', sm: 'block' } }} />
            <Box component={Link} href="/customer" sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
              <img src="/images/martzona_logo_transparent.png" alt="Martzona" style={{ height: 32, width: 'auto' }} />
            </Box>
          </Box>

          {/* Right Header Actions */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              component={Link}
              href="/second-hand"
              variant="contained"
              sx={{
                bgcolor: THEME.accentGold,
                color: '#1E0424',
                fontWeight: 900,
                textTransform: 'none',
                borderRadius: 2,
                fontSize: '0.85rem',
                px: 2.2,
                '&:hover': { bgcolor: '#e5a500' },
              }}
            >
              + Sell an Item
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ─── MAIN CONTENT CONTAINER ─── */}
      <Box sx={{ flex: 1, maxWidth: 1350, mx: 'auto', width: '100%', px: { xs: 2, sm: 3, md: 4, lg: 5 }, py: 3 }}>

        {/* Breadcrumb Navigation */}
        <Breadcrumbs separator="›" sx={{ mb: 2.5, fontSize: '0.85rem', color: '#64748B' }}>
          <Link href="/customer" style={{ textDecoration: 'none', color: '#64748B' }}>Home</Link>
          <Link href="/second-hand" style={{ textDecoration: 'none', color: '#64748B' }}>2nd Hand Marketplace</Link>
          <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>{item.category}</Typography>
          <Typography color="text.primary" sx={{ fontSize: '0.85rem', fontWeight: 700, maxWidth: 300 }} noWrap>
            {item.title}
          </Typography>
        </Breadcrumbs>

        {/* 2-Column OLX Layout */}
        <Grid container spacing={3}>

          {/* ════════════════════════════════════════════════════════════════
              LEFT COLUMN (65%): GALLERY, HIGHLIGHTS, DETAILS, DESCRIPTION
          ════════════════════════════════════════════════════════════════ */}
          <Grid item xs={12} lg={8}>

            {/* 1. Large OLX Photo Gallery with Thumbnails */}
            <Card sx={{ borderRadius: 3, overflow: 'hidden', border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Box sx={{ position: 'relative', width: '100%', height: { xs: 300, sm: 440, md: 520 }, bgcolor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={images[activePhotoIdx] || images[0]}
                  alt={item.title}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    transition: 'opacity 0.2s ease',
                  }}
                />

                {/* Left / Right Nav Arrows */}
                {images.length > 1 && (
                  <>
                    <IconButton
                      onClick={() => setActivePhotoIdx(prev => (prev === 0 ? images.length - 1 : prev - 1))}
                      sx={{
                        position: 'absolute',
                        left: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.55)',
                        color: '#fff',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                      }}
                    >
                      <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      onClick={() => setActivePhotoIdx(prev => (prev === images.length - 1 ? 0 : prev + 1))}
                      sx={{
                        position: 'absolute',
                        right: 14,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: 'rgba(0,0,0,0.55)',
                        color: '#fff',
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.85)' },
                      }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </>
                )}

                {/* Photo Counter Pill (OLX Style) */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 14,
                    left: 14,
                    bgcolor: 'rgba(0,0,0,0.65)',
                    color: '#fff',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 20,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  📷 {activePhotoIdx + 1} / {images.length}
                </Box>

                {/* Condition Badge on Photo */}
                <Chip
                  label={conditionObj.label}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: 14,
                    left: 14,
                    bgcolor: 'rgba(15,23,42,0.85)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '0.72rem',
                  }}
                />
              </Box>

              {/* Thumbnails Reel */}
              {images.length > 1 && (
                <Box sx={{ p: 2, display: 'flex', gap: 1.5, overflowX: 'auto', bgcolor: '#F8FAFC', borderTop: `1px solid ${THEME.border}` }}>
                  {images.map((img, i) => (
                    <Box
                      key={i}
                      onClick={() => setActivePhotoIdx(i)}
                      sx={{
                        width: 72,
                        height: 72,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '2.5px solid',
                        borderColor: activePhotoIdx === i ? THEME.primary : 'transparent',
                        cursor: 'pointer',
                        flexShrink: 0,
                        bgcolor: '#E2E8F0',
                        opacity: activePhotoIdx === i ? 1 : 0.7,
                        transition: 'all 0.15s ease',
                        '&:hover': { opacity: 1 },
                      }}
                    >
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              )}
            </Card>

            {/* 2. OLX Overview Card (Title, Price, Location, Actions) */}
            <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="h5" fontWeight={900} color="#002F34" sx={{ lineHeight: 1.35, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                  {item.title}
                </Typography>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Share this ad">
                    <IconButton size="small" onClick={handleShare} sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}>
                      <ShareOutlinedIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isFavorited ? 'Remove Favorite' : 'Save to Favorites'}>
                    <IconButton size="small" onClick={() => setIsFavorited(!isFavorited)} sx={{ border: `1px solid ${THEME.border}`, borderRadius: 2 }}>
                      {isFavorited ? (
                        <FavoriteIcon fontSize="small" sx={{ color: '#EF4444' }} />
                      ) : (
                        <FavoriteBorderIcon fontSize="small" sx={{ color: '#64748B' }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Price & Savings */}
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 1.5 }}>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#002F34', letterSpacing: -0.5 }}>
                  Rs {curr.toLocaleString()}
                </Typography>
                {orig > curr && (
                  <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}>
                    Rs {orig.toLocaleString()}
                  </Typography>
                )}
                {discountPct > 0 && (
                  <Chip
                    label={`-${discountPct}% OFF`}
                    size="small"
                    sx={{ bgcolor: THEME.emerald, color: '#fff', fontWeight: 900, fontSize: '0.75rem' }}
                  />
                )}
              </Box>

              {/* Location & Time Ago Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, pt: 1, borderTop: `1px solid ${THEME.border}`, color: '#64748B', fontSize: '0.85rem' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <LocationOnIcon sx={{ fontSize: 18, color: '#94A3B8' }} />
                  <Typography variant="body2" color="#475569" fontWeight={600}>
                    {item.location ? `${item.location}, ` : ''}{item.city}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    {timeAgo(item.createdAt)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <VisibilityOutlinedIcon sx={{ fontSize: 14, color: '#94A3B8' }} />
                    <Typography variant="caption" color="text.secondary">
                      {item.viewsCount || 1} views
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>

            {/* 3. Detailed Specifications Grid (OLX Style) */}
            <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" fontWeight={800} color="#002F34" sx={{ mb: 2 }}>
                Item Details & Specs
              </Typography>

              <Grid container spacing={2}>
                {[
                  { label: 'Category', val: item.category },
                  { label: 'Condition', val: conditionObj.label },
                  { label: 'Price Type', val: item.allowOffers ? 'Negotiable (Offers Accepted)' : 'Fixed Price' },
                  { label: 'City', val: item.city || 'Pakistan' },
                  { label: 'Neighborhood', val: item.location || 'Not Specified' },
                  { label: 'Handover / Delivery', val: 'In-Person Inspection or Martzona Courier' },
                ].map((spec, i) => (
                  <Grid item xs={12} sm={6} key={i}>
                    <Box sx={{ p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #EDF2F7' }}>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                        {spec.label.toUpperCase()}
                      </Typography>
                      <Typography variant="body2" fontWeight={800} color="#1E293B">
                        {spec.val}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Card>

            {/* 4. Full Seller Description */}
            <Card sx={{ p: { xs: 2.5, sm: 3 }, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Typography variant="h6" fontWeight={800} color="#002F34" sx={{ mb: 1.5 }}>
                Description
              </Typography>
              <Typography
                variant="body1"
                color="#334155"
                sx={{
                  whiteSpace: 'pre-line',
                  lineHeight: 1.7,
                  fontSize: '0.95rem',
                }}
              >
                {item.description || 'The seller did not provide additional notes for this listing.'}
              </Typography>
            </Card>

            {/* 5. Safety Tips (OLX Standard) */}
            <Card sx={{ p: 2.5, borderRadius: 3, border: `1px solid #CBD5E1`, bgcolor: '#F8FAFC' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <SecurityIcon sx={{ color: THEME.emerald, fontSize: 22 }} />
                <Typography variant="subtitle2" fontWeight={800} color="#002F34">
                  MARTZONA SAFETY & TRADING TIPS FOR BUYERS
                </Typography>
              </Box>
              <Stack spacing={0.6} sx={{ pl: 3.5 }}>
                <Typography variant="caption" color="#475569">• Meet the seller at a safe, public, and well-lit location.</Typography>
                <Typography variant="caption" color="#475569">• Inspect the item, IMEI/PTA approval, battery health, and physical condition before paying.</Typography>
                <Typography variant="caption" color="#475569">• Never transfer money in advance via Easypaisa or JazzCash to strangers.</Typography>
                <Typography variant="caption" color="#475569">• For long-distance purchases, use Martzona Luggage Drop & Courier with Cash on Delivery.</Typography>
              </Stack>
            </Card>

          </Grid>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT COLUMN (35%): SELLER DETAILS CARD & DIRECT ACTION PANEL
          ════════════════════════════════════════════════════════════════ */}
          <Grid item xs={12} lg={4}>
            <Box sx={{ position: { lg: 'sticky' }, top: 80 }}>

              {/* Price & Immediate Action Card */}
              <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 4px 18px rgba(0,0,0,0.05)' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  ASKING PRICE
                </Typography>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#002F34', my: 0.5 }}>
                  Rs {curr.toLocaleString()}
                </Typography>

                {orig > curr && (
                  <Typography variant="caption" color={THEME.emerald} fontWeight={700} display="block" sx={{ mb: 2 }}>
                    ✓ Buyer saves Rs {(orig - curr).toLocaleString()} ({discountPct}% discount)
                  </Typography>
                )}

                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {/* WhatsApp Action */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<WhatsAppIcon sx={{ fontSize: 22 }} />}
                    onClick={openWhatsAppChat}
                    sx={{
                      bgcolor: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 900,
                      textTransform: 'none',
                      py: 1.3,
                      borderRadius: 2.5,
                      fontSize: '0.98rem',
                      boxShadow: '0 4px 14px rgba(37,211,102,0.3)',
                      '&:hover': { bgcolor: '#20BA56' },
                    }}
                  >
                    Chat on WhatsApp
                  </Button>

                  {/* Make Offer Action */}
                  {item.allowOffers && (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      startIcon={<LocalOfferIcon />}
                      onClick={() => setOpenOfferModal(true)}
                      sx={{
                        bgcolor: THEME.primary,
                        color: '#FFFFFF',
                        fontWeight: 900,
                        textTransform: 'none',
                        py: 1.3,
                        borderRadius: 2.5,
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 14px rgba(74,21,75,0.25)',
                        '&:hover': { bgcolor: THEME.primaryDark },
                      }}
                    >
                      Make an Offer / Bargain
                    </Button>
                  )}

                  {/* Phone Call / Reveal Action */}
                  <Button
                    variant="outlined"
                    fullWidth
                    size="large"
                    startIcon={<PhoneIcon />}
                    onClick={() => setShowPhone(!showPhone)}
                    sx={{
                      borderColor: '#002F34',
                      color: '#002F34',
                      fontWeight: 800,
                      textTransform: 'none',
                      py: 1.2,
                      borderRadius: 2.5,
                      fontSize: '0.92rem',
                      '&:hover': { borderColor: '#002F34', bgcolor: 'rgba(0,47,52,0.05)' },
                    }}
                  >
                    {showPhone
                      ? (item.contactPhone || item.seller?.phoneNumber || 'No phone provided')
                      : 'Show Phone Number'}
                  </Button>
                </Stack>
              </Card>

              {/* OLX-Style Seller Details Card */}
              <Card sx={{ p: 3, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', mb: 2.5, boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#002F34" sx={{ mb: 2, letterSpacing: 0.5 }}>
                  SELLER INFORMATION
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar
                    src={item.seller?.image || undefined}
                    sx={{
                      width: 58,
                      height: 58,
                      bgcolor: THEME.primary,
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      border: `2px solid ${THEME.accentGold}`,
                    }}
                  >
                    {item.seller?.name?.charAt(0) || 'S'}
                  </Avatar>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                      <Typography variant="subtitle1" fontWeight={800} color="#002F34">
                        {item.seller?.name || item.seller?.username || 'Verified Seller'}
                      </Typography>
                      <VerifiedIcon sx={{ fontSize: 17, color: '#0284C7' }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {item.sellerType === 'MERCHANT' ? 'Verified Martzona Merchant' : 'Community Member'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatMemberSince(item.seller?.createdAt)}
                    </Typography>
                  </Box>
                </Box>

                {/* Seller Badges */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#10B981' }} />}
                    label="Phone Verified"
                    size="small"
                    sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: '0.72rem' }}
                  />
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#10B981' }} />}
                    label="Identity Verified"
                    size="small"
                    sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, fontSize: '0.72rem' }}
                  />
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: 14, color: '#0284C7' }} />}
                    label="Fast Responder"
                    size="small"
                    sx={{ bgcolor: '#F0F9FF', color: '#0369A1', fontWeight: 700, fontSize: '0.72rem' }}
                  />
                </Box>

                <Button
                  component={Link}
                  href={`/second-hand?sellerId=${item.sellerId || item.seller?.id}`}
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderColor: '#CBD5E1',
                    color: '#334155',
                    fontWeight: 700,
                    textTransform: 'none',
                    py: 1,
                    borderRadius: 2,
                    fontSize: '0.85rem',
                    '&:hover': { borderColor: THEME.primary, color: THEME.primary },
                  }}
                >
                  View All Ads by this Seller
                </Button>
              </Card>

              {/* Location Card with Map Pin */}
              <Card sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                <Typography variant="subtitle2" fontWeight={800} color="#002F34" sx={{ mb: 1.5 }}>
                  POSTED IN
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1 }}>
                  <LocationOnIcon sx={{ color: '#EF4444', fontSize: 24 }} />
                  <Box>
                    <Typography variant="body2" fontWeight={800} color="#0F172A">
                      {item.location ? `${item.location}, ` : ''}{item.city}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Pakistan
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ height: 110, width: '100%', borderRadius: 2, bgcolor: '#E2E8F0', mt: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #E2E8F0 20%, #CBD5E1 100%)' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    📍 {item.city} Area Map Preview
                  </Typography>
                </Box>
              </Card>

            </Box>
          </Grid>
        </Grid>

        {/* ════════════════════════════════════════════════════════════════
            RELATED PRE-LOVED ITEMS
        ════════════════════════════════════════════════════════════════ */}
        {relatedItems.length > 0 && (
          <Box sx={{ mt: 6, pt: 4, borderTop: `1px solid ${THEME.border}` }}>
            <Typography variant="h5" fontWeight={900} color="#002F34" sx={{ mb: 3 }}>
              Similar Pre-Loved Deals You May Like
            </Typography>

            <Grid container spacing={2.5}>
              {relatedItems.map(rel => {
                let relImages = []
                try {
                  relImages = JSON.parse(rel.images || '[]')
                } catch {
                  relImages = []
                }
                const firstImg = relImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'
                const relCondition = CONDITIONS_MAP[rel.condition]?.label || rel.condition

                return (
                  <Grid item xs={12} sm={6} md={3} key={rel.id}>
                    <Card
                      component={Link}
                      href={`/second-hand/${rel.id}`}
                      target="_blank"
                      sx={{
                        textDecoration: 'none',
                        borderRadius: 2.5,
                        border: `1px solid ${THEME.border}`,
                        overflow: 'hidden',
                        bgcolor: '#FFFFFF',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                        },
                      }}
                    >
                      <Box>
                        <Box sx={{ width: '100%', aspectRatio: '4/3', bgcolor: '#F1F5F9', position: 'relative' }}>
                          <img src={firstImg} alt={rel.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <Chip
                            label={relCondition}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: 'rgba(0,0,0,0.75)',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                              height: 20,
                            }}
                          />
                        </Box>
                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="h6" fontWeight={900} sx={{ color: '#002F34', mb: 0.5 }}>
                            Rs {Number(rel.price).toLocaleString()}
                          </Typography>
                          <Typography variant="body2" color="#0F172A" fontWeight={700} noWrap title={rel.title}>
                            {rel.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                            {rel.city} • {timeAgo(rel.createdAt)}
                          </Typography>
                        </CardContent>
                      </Box>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          </Box>
        )}

      </Box>

      {/* ─── MAKE AN OFFER MODAL ─── */}
      <Dialog
        open={openOfferModal}
        onClose={() => setOpenOfferModal(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Make Offer to Seller</span>
          <IconButton size="small" onClick={() => setOpenOfferModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: `1px solid ${THEME.border}` }}>
              <Typography variant="subtitle2" fontWeight={800} color="#002F34" noWrap>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Asking Price: <strong>Rs {curr.toLocaleString()}</strong>
              </Typography>
            </Box>

            {/* Quick % Discounts */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                QUICK OFFER PERCENTAGES
              </Typography>
              <Stack direction="row" spacing={1}>
                {[-10, -15, -20, -25].map(pct => {
                  const val = Math.round(curr * (1 + pct / 100))
                  return (
                    <Chip
                      key={pct}
                      label={`${pct}% (Rs ${val.toLocaleString()})`}
                      clickable
                      onClick={() => setOfferPrice(String(val))}
                      size="small"
                      sx={{ fontWeight: 700, fontSize: '0.72rem' }}
                    />
                  )
                })}
              </Stack>
            </Box>

            <TextField
              fullWidth
              label="Your Proposed Offer (Rs)"
              type="number"
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs</InputAdornment>,
                sx: { fontWeight: 900, fontSize: '1.2rem', color: THEME.primary },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Optional Note to Seller"
              placeholder="e.g. Can meet in DHA today, cash ready"
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${THEME.border}` }}>
          <Button onClick={() => setOpenOfferModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitOffer}
            disabled={submittingOffer}
            sx={{ bgcolor: THEME.primary, fontWeight: 900, textTransform: 'none', px: 3, '&:hover': { bgcolor: THEME.primaryDark } }}
          >
            {submittingOffer ? 'Submitting...' : 'Send Offer to Seller'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── FOOTER ─── */}
      <CustomerFooter />

    </Box>
  )
}

