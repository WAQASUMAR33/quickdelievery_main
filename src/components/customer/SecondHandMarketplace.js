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
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Avatar from '@mui/material/Avatar'
import Switch from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
import LinearProgress from '@mui/material/LinearProgress'
import Tooltip from '@mui/material/Tooltip'
import Badge from '@mui/material/Badge'
import toast from 'react-hot-toast'

import { fileToBase64DataUrl, uploadBase64Image } from '@/lib/imageUpload'

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront'
import LocalOfferIcon from '@mui/icons-material/LocalOffer'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SearchIcon from '@mui/icons-material/Search'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import VerifiedIcon from '@mui/icons-material/Verified'
import PhoneIcon from '@mui/icons-material/Phone'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import CloseIcon from '@mui/icons-material/Close'
import HandshakeIcon from '@mui/icons-material/Handshake'
import AutorenewIcon from '@mui/icons-material/Autorenew'
import WhatsAppIcon from '@mui/icons-material/WhatsApp'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import StarIcon from '@mui/icons-material/Star'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import FilterListIcon from '@mui/icons-material/FilterList'
import SortIcon from '@mui/icons-material/Sort'
import CheckIcon from '@mui/icons-material/Check'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import GridViewIcon from '@mui/icons-material/GridView'
import ViewListIcon from '@mui/icons-material/ViewList'
import SecurityIcon from '@mui/icons-material/Security'
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder'
import FavoriteIcon from '@mui/icons-material/Favorite'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'

// Martzona Palette
const THEME = {
  primary: '#4A154B',
  primaryDark: '#2E0836',
  primaryLight: '#732274',
  accentGold: '#FDB600',
  emerald: '#10B981',
  emeraldDark: '#059669',
  cardBg: '#FFFFFF',
  pageBg: '#F8FAFC',
  border: '#E2E8F0',
  borderHover: '#CBD5E1',
}

const CATEGORIES = [
  { id: 'All Categories', label: 'All Categories', icon: '🛍️' },
  { id: 'Mobile Phones & Tablets', label: 'Mobiles & Tablets', icon: '📱' },
  { id: 'Computers & Laptops', label: 'Laptops & Computers', icon: '💻' },
  { id: 'Electronics & Gadgets', label: 'Electronics & Tech', icon: '🎧' },
  { id: 'Vehicles, Bikes & Parts', label: 'Vehicles & Bikes', icon: '🚗' },
  { id: 'Home Furniture & Decor', label: 'Furniture & Decor', icon: '🛋️' },
  { id: 'Kitchen & Home Appliances', label: 'Appliances', icon: '🍳' },
  { id: 'Fashion & Clothing', label: 'Fashion & Apparel', icon: '👗' },
  { id: 'Books, Sports & Hobbies', label: 'Sports, Books & Hobby', icon: '📚' },
  { id: 'Baby & Kids Items', label: 'Baby & Kids', icon: '👶' },
  { id: 'Other Items', label: 'Other Pre-Loved', icon: '📦' },
]

const CONDITIONS = [
  { id: 'ALL', label: 'All Conditions', color: '#64748B', desc: 'Any condition' },
  { id: 'BRAND_NEW', label: 'Brand New (Box Sealed)', color: '#10B981', desc: 'Factory sealed or never used' },
  { id: 'LIKE_NEW', label: 'Like New (Mint)', color: '#0284C7', desc: 'Flawless with zero scratches' },
  { id: 'EXCELLENT', label: 'Excellent Condition', color: '#8B5CF6', desc: 'Minimal signs of light use' },
  { id: 'GOOD', label: 'Good (Normal Wear)', color: '#F59E0B', desc: 'Fully functional, normal signs of use' },
  { id: 'FAIR', label: 'Fair (Functional)', color: '#64748B', desc: 'Visible cosmetic wear, works 100%' },
]

const MAJOR_CITIES = [
  'All Pakistan',
  'Lahore',
  'Karachi',
  'Islamabad',
  'Rawalpindi',
  'Faisalabad',
  'Multan',
  'Gujranwala',
  'Sialkot',
  'Peshawar',
  'Quetta',
  'Mandi Bahauddin',
  'Sargodha',
  'Bahawalpur',
  'Gujrat',
]

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under Rs. 10k', min: '0', max: '10000' },
  { label: 'Rs. 10k - 50k', min: '10000', max: '50000' },
  { label: 'Rs. 50k - 100k', min: '50000', max: '100000' },
  { label: 'Above Rs. 100k', min: '100000', max: '' },
]

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

function buildAuthHeaders(includeJson = false) {
  const headers = includeJson ? { 'Content-Type': 'application/json' } : {}
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    if (token && token !== 'GUEST_SESSION') {
      headers.Authorization = `Bearer ${token}`
    }
  }
  return headers
}

export default function SecondHandMarketplace({ user }) {
  // Navigation & View
  const [activeTab, setActiveTab] = useState(0) // 0: Browse Marketplace, 1: My Hub (Listings & Offers)
  const [hubSubTab, setHubSubTab] = useState(0) // 0: Offers Received, 1: Offers Sent, 2: My Listings
  const [viewMode, setViewMode] = useState('list') // 'list' (default OLX list view) or 'grid'

  // Items State
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedCondition, setSelectedCondition] = useState('ALL')
  const [selectedCity, setSelectedCity] = useState('All Pakistan')
  const [selectedPricePreset, setSelectedPricePreset] = useState('All Prices')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'price_low', 'price_high', 'popular'

  // Quick View / Full Details Dialog
  const [selectedDetailItem, setSelectedDetailItem] = useState(null)
  const [detailPhotoIndex, setDetailPhotoIndex] = useState(0)

  // Make Offer Dialog
  const [offerItem, setOfferItem] = useState(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)

  // Sell / Edit Item Dialog
  const [openSellModal, setOpenSellModal] = useState(false)
  const [editingItemId, setEditingItemId] = useState(null)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [savingItem, setSavingItem] = useState(false)
  const [sellForm, setSellForm] = useState({
    title: '',
    description: '',
    category: 'Mobile Phones & Tablets',
    condition: 'LIKE_NEW',
    price: '',
    originalPrice: '',
    minOfferPrice: '',
    images: [],
    city: 'Lahore',
    location: '',
    contactPhone: user?.phoneNumber || '',
    allowOffers: true,
  })

  // User Hub States
  const [myOffersReceived, setMyOffersReceived] = useState([])
  const [myOffersSent, setMyOffersSent] = useState([])
  const [myListings, setMyListings] = useState([])
  const [loadingHub, setLoadingHub] = useState(false)

  // Counter Modal
  const [counterModalOffer, setCounterModalOffer] = useState(null)
  const [counterPriceInput, setCounterPriceInput] = useState('')

  // ──────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory)
      if (selectedCondition !== 'ALL') params.set('condition', selectedCondition)
      if (selectedCity !== 'All Pakistan') params.set('city', selectedCity)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())
      if (sortBy) params.set('sort', sortBy)

      const preset = PRICE_PRESETS.find(p => p.label === selectedPricePreset)
      if (preset?.min) params.set('minPrice', preset.min)
      if (preset?.max) params.set('maxPrice', preset.max)

      params.set('limit', '50')

      const res = await fetch(`/api/second-hand?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
        setTotalCount(data.meta?.total || (data.data || []).length)
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedCondition, selectedCity, selectedPricePreset, searchQuery, sortBy])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const fetchHubData = useCallback(async () => {
    if (!user) return
    try {
      setLoadingHub(true)
      const [resRec, resSent, resListings] = await Promise.all([
        fetch('/api/second-hand/offers?type=received', { headers: buildAuthHeaders(), credentials: 'include' }),
        fetch('/api/second-hand/offers?type=sent', { headers: buildAuthHeaders(), credentials: 'include' }),
        user.id ? fetch(`/api/second-hand?sellerId=${user.id}&status=ALL`) : Promise.resolve({ json: () => ({ success: true, data: [] }) }),
      ])
      const dataRec = await resRec.json()
      const dataSent = await resSent.json()
      const dataListings = await resListings.json()

      if (dataRec.success) setMyOffersReceived(dataRec.data || [])
      if (dataSent.success) setMyOffersSent(dataSent.data || [])
      if (dataListings.success) setMyListings(dataListings.data || [])
    } catch {
      // Non-blocking
    } finally {
      setLoadingHub(false)
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 1) {
      fetchHubData()
    }
  }, [activeTab, fetchHubData])

  // ──────────────────────────────────────────────────────────────────────────
  // MULTI-IMAGE UPLOADING & MANAGEMENT
  // ──────────────────────────────────────────────────────────────────────────

  const handleMultiImageUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const remainingSlots = 8 - sellForm.images.length
    if (remainingSlots <= 0) {
      toast.error('Maximum 8 photos allowed per item')
      return
    }

    const filesToUpload = files.slice(0, remainingSlots)

    try {
      setUploadingImages(true)
      setUploadProgress(10)

      const uploadedUrls = []
      let completed = 0

      for (const file of filesToUpload) {
        try {
          const base64 = await fileToBase64DataUrl(file)
          const res = await uploadBase64Image(base64, file.name, 'second-hand')
          if (res.success && res.url) {
            uploadedUrls.push(res.url)
          }
        } catch (singleErr) {
          console.error('Failed single image:', singleErr)
        }
        completed += 1
        setUploadProgress(Math.round((completed / filesToUpload.length) * 100))
      }

      if (uploadedUrls.length > 0) {
        setSellForm(prev => ({
          ...prev,
          images: [...prev.images, ...uploadedUrls],
        }))
        toast.success(`Uploaded ${uploadedUrls.length} photo(s) successfully!`)
      } else {
        toast.error('Could not upload selected photos')
      }
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }

  const handleSetCoverPhoto = (index) => {
    if (index === 0) return
    setSellForm(prev => {
      const copy = [...prev.images]
      const [selected] = copy.splice(index, 1)
      copy.unshift(selected)
      return { ...prev, images: copy }
    })
    toast.success('Cover photo updated!')
  }

  const handleRemoveImage = (index) => {
    setSellForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }))
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CREATE / UPDATE LISTING
  // ──────────────────────────────────────────────────────────────────────────

  const handleOpenCreateModal = () => {
    if (!user) {
      toast.error('Please sign in to list an item for sale')
      return
    }
    setEditingItemId(null)
    setSellForm({
      title: '',
      description: '',
      category: 'Mobile Phones & Tablets',
      condition: 'LIKE_NEW',
      price: '',
      originalPrice: '',
      minOfferPrice: '',
      images: [],
      city: 'Lahore',
      location: '',
      contactPhone: user?.phoneNumber || '',
      allowOffers: true,
    })
    setOpenSellModal(true)
  }

  const handleOpenEditModal = (item) => {
    setEditingItemId(item.id)
    let parsedImages = []
    try {
      parsedImages = JSON.parse(item.images || '[]')
    } catch {
      parsedImages = []
    }

    setSellForm({
      title: item.title || '',
      description: item.description || '',
      category: item.category || 'Mobile Phones & Tablets',
      condition: item.condition || 'LIKE_NEW',
      price: item.price ? String(item.price) : '',
      originalPrice: item.originalPrice ? String(item.originalPrice) : '',
      minOfferPrice: item.minOfferPrice ? String(item.minOfferPrice) : '',
      images: parsedImages,
      city: item.city || 'Lahore',
      location: item.location || '',
      contactPhone: item.contactPhone || user?.phoneNumber || '',
      allowOffers: item.allowOffers !== false,
    })
    setOpenSellModal(true)
  }

  const handleSaveListing = async () => {
    if (!sellForm.title.trim()) {
      toast.error('Please enter a clear descriptive item title')
      return
    }
    if (!sellForm.price || Number(sellForm.price) <= 0) {
      toast.error('Please enter a valid asking price (Rs.)')
      return
    }
    if (!sellForm.images.length) {
      toast.error('Please upload at least 1 photo of the item')
      return
    }

    try {
      setSavingItem(true)
      const url = editingItemId ? `/api/second-hand/${editingItemId}` : '/api/second-hand'
      const method = editingItemId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: buildAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(sellForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingItemId ? 'Listing updated successfully!' : 'Your pre-loved item is now live!')
        setOpenSellModal(false)
        fetchItems()
        if (activeTab === 1) fetchHubData()
      } else {
        toast.error(data.error || 'Failed to save listing')
      }
    } catch (err) {
      toast.error('Error saving item: ' + err.message)
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteListing = async (itemId) => {
    if (!confirm('Are you sure you want to permanently delete this listing?')) return
    try {
      const res = await fetch(`/api/second-hand/${itemId}`, {
        method: 'DELETE',
        headers: buildAuthHeaders(true),
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Listing removed')
        fetchItems()
        fetchHubData()
      } else {
        toast.error(data.error || 'Failed to delete listing')
      }
    } catch (err) {
      toast.error('Delete failed: ' + err.message)
    }
  }

  const handleToggleListingStatus = async (item, newStatus) => {
    try {
      const res = await fetch(`/api/second-hand/${item.id}`, {
        method: 'PUT',
        headers: buildAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Item status marked as ${newStatus}`)
        fetchItems()
        fetchHubData()
      }
    } catch (err) {
      toast.error('Status update failed')
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // OFFER / NEGOTIATION HANDLERS
  // ──────────────────────────────────────────────────────────────────────────

  const openMakeOfferDialog = (item) => {
    if (!user) {
      toast.error('Please log in to submit a price offer')
      return
    }
    setOfferItem(item)
    // Default suggest 15% discount
    const suggested = Math.round(Number(item.price) * 0.85)
    setOfferPrice(String(suggested))
    setOfferMessage('')
  }

  const handleSubmitOffer = async () => {
    if (!offerPrice || Number(offerPrice) <= 0) {
      toast.error('Please enter your offer price')
      return
    }

    try {
      setSubmittingOffer(true)
      const res = await fetch('/api/second-hand/offers', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({
          itemId: offerItem.id,
          offerPrice: Number(offerPrice),
          message: offerMessage,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Your offer has been submitted! The seller will be notified.')
        setOfferItem(null)
        if (selectedDetailItem?.id === offerItem.id) {
          setSelectedDetailItem(null)
        }
      } else {
        toast.error(data.error || 'Failed to submit offer')
      }
    } catch (err) {
      toast.error('Error submitting offer: ' + err.message)
    } finally {
      setSubmittingOffer(false)
    }
  }

  const handleOfferAction = async (offerId, action, extra = {}) => {
    try {
      const res = await fetch(`/api/second-hand/offers/${offerId}`, {
        method: 'PATCH',
        headers: buildAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ action, ...extra }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message || 'Offer updated')
        setCounterModalOffer(null)
        fetchHubData()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (err) {
      toast.error('Error updating offer: ' + err.message)
    }
  }

  // Quick WhatsApp Launcher
  const openWhatsAppChat = (phoneNumber, itemTitle, itemPrice) => {
    if (!phoneNumber) {
      toast.error('Seller phone number not provided')
      return
    }
    const cleanNumber = phoneNumber.replace(/[^0-9]/g, '')
    const msg = encodeURIComponent(`Hi! I am interested in your item "${itemTitle}" listed on Martzona Marketplace for Rs. ${Number(itemPrice).toLocaleString()}. Is it still available?`)
    window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank')
  }

  // Compute live saving % for sellForm
  const liveDiscountPct = useMemo(() => {
    if (!sellForm.originalPrice || !sellForm.price) return 0
    const orig = Number(sellForm.originalPrice)
    const curr = Number(sellForm.price)
    if (orig <= curr || orig <= 0) return 0
    return Math.round(((orig - curr) / orig) * 100)
  }, [sellForm.originalPrice, sellForm.price])

  // Count unread / pending offers
  const pendingReceivedCount = useMemo(() => {
    return myOffersReceived.filter(o => o.status === 'PENDING').length
  }, [myOffersReceived])

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1.5, sm: 3, md: 4, lg: 5, xl: 6 }, py: { xs: 2, sm: 3 } }}>

      {/* ═══════════════════════════════════════════════════════════════════════════
          1. HERO HEADER: NEO-MARKETPLACE WITH FULL FLUID WIDTH & VIBRANT BADGES
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Card
        sx={{
          width: '100%',
          mb: 3.5,
          borderRadius: 4,
          background: 'linear-gradient(135deg, #1A0022 0%, #3B0943 45%, #183B2B 100%)',
          color: '#fff',
          p: { xs: 3, sm: 4, md: 4.5 },
          boxShadow: '0 12px 40px rgba(74,21,75,0.18)',
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        {/* Ambient Glows */}
        <Box sx={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(253,182,0,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <Box sx={{ position: 'absolute', bottom: -50, left: '25%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', md: 'center' }, flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          <Box sx={{ maxWidth: 750 }}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.5, borderRadius: 20, bgcolor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', mb: 1.5 }}>
              <AutorenewIcon sx={{ color: '#34D399', fontSize: 18 }} />
              <Typography variant="caption" sx={{ color: '#F1F5F9', fontWeight: 800, letterSpacing: 0.5 }}>
                CIRCULAR ECONOMY • SMART 2ND HAND DEALS
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5, fontSize: { xs: '1.65rem', sm: '2.1rem', md: '2.4rem' }, mb: 1 }}>
              Martzona Pre-Loved & 2nd Hand Marketplace
            </Typography>

            <Typography variant="body1" sx={{ color: '#CBD5E1', fontSize: { xs: '0.9rem', md: '1rem' }, lineHeight: 1.5, mb: 2.5 }}>
              Buy & sell authentic pre-owned smartphones, tech gadgets, laptops, vehicles, and furniture directly with fellow Pakistani customers. Submit instant price offers, counter, and finalize deals via WhatsApp!
            </Typography>

            {/* Marketplace Highlights */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
              {[
                { label: '0% Platform Fee', icon: <CheckCircleIcon sx={{ fontSize: 15, color: '#34D399' }} /> },
                { label: 'Live Bidding & Counter Offers', icon: <HandshakeIcon sx={{ fontSize: 15, color: THEME.accentGold }} /> },
                { label: 'Direct WhatsApp Contact', icon: <WhatsAppIcon sx={{ fontSize: 15, color: '#25D366' }} /> },
                { label: '100% Peer-to-Peer Verified', icon: <VerifiedIcon sx={{ fontSize: 15, color: '#38BDF8' }} /> },
              ].map((b, i) => (
                <Chip
                  key={i}
                  icon={b.icon}
                  label={b.label}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    border: '1px solid rgba(255,255,255,0.12)',
                    backdropFilter: 'blur(6px)',
                  }}
                />
              ))}
            </Box>
          </Box>

          {/* Action CTAs */}
          <Stack direction={{ xs: 'row', sm: 'row' }} spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' }, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddCircleOutlineIcon />}
              onClick={handleOpenCreateModal}
              sx={{
                bgcolor: THEME.accentGold,
                color: '#1E0424',
                fontWeight: 900,
                textTransform: 'none',
                px: 3.5,
                py: 1.4,
                borderRadius: 2.5,
                fontSize: '0.95rem',
                boxShadow: '0 8px 24px rgba(253,182,0,0.35)',
                '&:hover': { bgcolor: '#e5a500' },
              }}
            >
              + Sell Your Item
            </Button>

            <Badge badgeContent={pendingReceivedCount} color="error" overlap="circular">
              <Button
                variant="outlined"
                size="large"
                startIcon={<HandshakeIcon />}
                onClick={() => {
                  setActiveTab(1)
                  setHubSubTab(0)
                }}
                sx={{
                  borderColor: 'rgba(255,255,255,0.35)',
                  color: '#fff',
                  fontWeight: 800,
                  textTransform: 'none',
                  px: 2.5,
                  py: 1.4,
                  borderRadius: 2.5,
                  bgcolor: 'rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                  '&:hover': { borderColor: '#fff', bgcolor: 'rgba(255,255,255,0.15)' },
                }}
              >
                Negotiation Hub
              </Button>
            </Badge>
          </Stack>
        </Box>
      </Card>

      {/* ═══════════════════════════════════════════════════════════════════════════
          2. TOP TABS: BROWSE MARKETPLACE vs MY NEGOTIATION HUB
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Box sx={{ borderBottom: 1, borderColor: THEME.border, mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '1rem', minHeight: 48, px: 3 },
            '& .Mui-selected': { color: `${THEME.primary} !important` },
          }}
          TabIndicatorProps={{ style: { backgroundColor: THEME.primary, height: 3.5, borderRadius: '3px 3px 0 0' } }}
        >
          <Tab
            icon={<StorefrontIcon />}
            iconPosition="start"
            label={`Browse 2nd Hand Goods (${totalCount || items.length})`}
          />
          <Tab
            icon={
              <Badge badgeContent={pendingReceivedCount} color="error">
                <HandshakeIcon />
              </Badge>
            }
            iconPosition="start"
            label="My Listings & Offers Hub"
          />
        </Tabs>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 0: BROWSE USED ITEMS (FULL WIDTH, RICH FILTERS, INTERACTIVE CARDS)
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <Box sx={{ width: '100%' }}>

          {/* Category Quick Pills Ribbon (Horizontal Scroll) */}
          <Box
            sx={{
              display: 'flex',
              gap: 1.2,
              overflowX: 'auto',
              pb: 1.5,
              mb: 2.5,
              '::-webkit-scrollbar': { height: 4 },
              '::-webkit-scrollbar-thumb': { bgcolor: '#CBD5E1', borderRadius: 4 },
            }}
          >
            {CATEGORIES.map(cat => {
              const isSelected = selectedCategory === cat.id
              return (
                <Chip
                  key={cat.id}
                  clickable
                  onClick={() => setSelectedCategory(cat.id)}
                  label={`${cat.icon} ${cat.label}`}
                  sx={{
                    px: 1.2,
                    py: 2.2,
                    borderRadius: 20,
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.82rem',
                    bgcolor: isSelected ? THEME.primary : '#FFFFFF',
                    color: isSelected ? '#FFFFFF' : '#334155',
                    border: '1px solid',
                    borderColor: isSelected ? THEME.primary : THEME.border,
                    boxShadow: isSelected ? '0 4px 14px rgba(74,21,75,0.2)' : 'none',
                    transition: 'all 0.18s ease',
                    '&:hover': {
                      bgcolor: isSelected ? THEME.primaryDark : '#F1F5F9',
                    },
                  }}
                />
              )
            })}
          </Box>

          {/* Interactive Filters & Controls Toolbar */}
          <Card
            sx={{
              p: { xs: 2, sm: 2.5 },
              mb: 3,
              borderRadius: 3,
              border: `1px solid ${THEME.border}`,
              boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
              bgcolor: '#FFFFFF',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              {/* Search Field */}
              <Grid item xs={12} md={4} lg={4}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search smartphones, bikes, laptops, sofa..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#94A3B8', fontSize: 20 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery ? (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setSearchQuery('')}>
                          <CloseIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              </Grid>

              {/* City Selector */}
              <Grid item xs={6} sm={4} md={2.5} lg={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>City / Region</InputLabel>
                  <Select
                    value={selectedCity}
                    label="City / Region"
                    onChange={e => setSelectedCity(e.target.value)}
                  >
                    {MAJOR_CITIES.map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Condition Filter */}
              <Grid item xs={6} sm={4} md={2.5} lg={2.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Item Condition</InputLabel>
                  <Select
                    value={selectedCondition}
                    label="Item Condition"
                    onChange={e => setSelectedCondition(e.target.value)}
                  >
                    {CONDITIONS.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Price Preset Filter */}
              <Grid item xs={6} sm={4} md={1.5} lg={1.5}>
                <FormControl fullWidth size="small">
                  <InputLabel>Budget</InputLabel>
                  <Select
                    value={selectedPricePreset}
                    label="Budget"
                    onChange={e => setSelectedPricePreset(e.target.value)}
                  >
                    {PRICE_PRESETS.map(p => (
                      <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Sort Order & View Switch */}
              <Grid item xs={6} sm={12} md={1.5} lg={1.5} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 105, flex: 1 }}>
                  <Select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    displayEmpty
                  >
                    <MenuItem value="newest">✨ Newest</MenuItem>
                    <MenuItem value="price_low">💰 Low Price</MenuItem>
                    <MenuItem value="price_high">💎 High Price</MenuItem>
                    <MenuItem value="popular">🔥 Most Viewed</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', bgcolor: '#F1F5F9', borderRadius: 1.5, p: 0.3, border: '1px solid #E2E8F0' }}>
                  <Tooltip title="OLX List View">
                    <Button
                      size="small"
                      onClick={() => setViewMode('list')}
                      startIcon={<ViewListIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        bgcolor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                        color: viewMode === 'list' ? THEME.primary : '#64748B',
                        fontWeight: viewMode === 'list' ? 800 : 600,
                        fontSize: '0.75rem',
                        py: 0.4,
                        px: 1,
                        minWidth: 0,
                        borderRadius: 1,
                        boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 0,
                        textTransform: 'none',
                      }}
                    >
                      List
                    </Button>
                  </Tooltip>
                  <Tooltip title="OLX Grid View">
                    <Button
                      size="small"
                      onClick={() => setViewMode('grid')}
                      startIcon={<GridViewIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        bgcolor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                        color: viewMode === 'grid' ? THEME.primary : '#64748B',
                        fontWeight: viewMode === 'grid' ? 800 : 600,
                        fontSize: '0.75rem',
                        py: 0.4,
                        px: 1,
                        minWidth: 0,
                        borderRadius: 1,
                        boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 0,
                        textTransform: 'none',
                      }}
                    >
                      Grid
                    </Button>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
          </Card>

          {/* Active Filter Indicators */}
          {(selectedCategory !== 'All Categories' || selectedCondition !== 'ALL' || selectedCity !== 'All Pakistan' || selectedPricePreset !== 'All Prices' || searchQuery) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2.5, flexWrap: 'wrap' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B' }}>ACTIVE FILTERS:</Typography>
              {selectedCategory !== 'All Categories' && (
                <Chip size="small" label={`Category: ${selectedCategory}`} onDelete={() => setSelectedCategory('All Categories')} />
              )}
              {selectedCondition !== 'ALL' && (
                <Chip size="small" label={`Condition: ${selectedCondition}`} onDelete={() => setSelectedCondition('ALL')} />
              )}
              {selectedCity !== 'All Pakistan' && (
                <Chip size="small" label={`City: ${selectedCity}`} onDelete={() => setSelectedCity('All Pakistan')} />
              )}
              {selectedPricePreset !== 'All Prices' && (
                <Chip size="small" label={`Price: ${selectedPricePreset}`} onDelete={() => setSelectedPricePreset('All Prices')} />
              )}
              {searchQuery && (
                <Chip size="small" label={`"${searchQuery}"`} onDelete={() => setSearchQuery('')} />
              )}
              <Button
                size="small"
                onClick={() => {
                  setSelectedCategory('All Categories')
                  setSelectedCondition('ALL')
                  setSelectedCity('All Pakistan')
                  setSelectedPricePreset('All Prices')
                  setSearchQuery('')
                }}
                sx={{ textTransform: 'none', fontSize: '0.75rem', color: THEME.primary, fontWeight: 700 }}
              >
                Reset All Filters
              </Button>
            </Box>
          )}

          {/* ───────────────────────────────────────────────────────────
              ITEMS GRID / LISTING RESULTS
          ─────────────────────────────────────────────────────────── */}
          {loading ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 12 }}>
              <CircularProgress sx={{ color: THEME.primary, mb: 2 }} />
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                Scanning verified pre-loved marketplace items...
              </Typography>
            </Box>
          ) : items.length === 0 ? (
            <Card sx={{ p: 8, textAlign: 'center', borderRadius: 4, border: '2px dashed #CBD5E1', bgcolor: '#F8FAFC' }}>
              <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(74,21,75,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <StorefrontIcon sx={{ fontSize: 40, color: THEME.primary }} />
              </Box>
              <Typography variant="h5" fontWeight={800} color="#1E293B" sx={{ mb: 1 }}>
                No second-hand items matched your filters
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
                Try adjusting your search terms, changing the city to All Pakistan, or be the first in your city to list an item!
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenCreateModal}
                sx={{ bgcolor: THEME.primary, color: '#fff', fontWeight: 800, textTransform: 'none', px: 3.5, py: 1.2, borderRadius: 2 }}
              >
                + List Your 2nd Hand Item Now
              </Button>
            </Card>
          ) : viewMode === 'list' ? (
            /* ═════════════════════════════════════════════════════════════════════════
               OLX ITEMS LIST VIEW (AUTHENTIC HORIZONTAL CARD LIST)
            ═════════════════════════════════════════════════════════════════════════ */
            <Stack spacing={2} sx={{ width: '100%', maxWidth: 1100, mx: 'auto' }}>
              {items.map(item => {
                let parsedImages = []
                try {
                  parsedImages = JSON.parse(item.images || '[]')
                } catch {
                  parsedImages = []
                }
                const firstImage = parsedImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'
                const conditionObj = CONDITIONS.find(c => c.id === item.condition)

                // Calculate savings
                const orig = Number(item.originalPrice || 0)
                const curr = Number(item.price || 0)
                const discountPct = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0

                return (
                  <Card
                    key={item.id}
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', sm: 'row' },
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                      bgcolor: '#FFFFFF',
                      transition: 'all 0.18s ease-in-out',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      '&:hover': {
                        boxShadow: '0 6px 20px rgba(0,47,52,0.12)',
                        borderColor: '#94A3B8',
                      },
                    }}
                  >
                    {/* Left Thumbnail (OLX standard 240px wide on desktop) */}
                    <Box
                      component={Link}
                      href={`/second-hand/${item.id}`}
                      target="_blank"
                      sx={{
                        position: 'relative',
                        width: { xs: '100%', sm: 240, md: 260 },
                        minWidth: { sm: 240, md: 260 },
                        height: { xs: 200, sm: 175 },
                        bgcolor: '#F8FAFC',
                        flexShrink: 0,
                        overflow: 'hidden',
                        display: 'block',
                      }}
                    >
                      <img
                        src={firstImage}
                        alt={item.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Featured Ribbon / Condition Badge */}
                      {item.sellerType === 'MERCHANT' ? (
                        <Chip
                          label="FEATURED"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: '#FDB600',
                            color: '#002F34',
                            fontWeight: 900,
                            fontSize: '0.62rem',
                            height: 20,
                            borderRadius: '3px',
                          }}
                        />
                      ) : (
                        <Chip
                          label={conditionObj?.label || item.condition}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: 'rgba(0,47,52,0.85)',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            fontSize: '0.62rem',
                            height: 20,
                            borderRadius: '3px',
                            backdropFilter: 'blur(4px)',
                          }}
                        />
                      )}

                      {/* Photo Count */}
                      {parsedImages.length > 1 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: 8,
                            bgcolor: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            px: 1,
                            py: 0.2,
                            borderRadius: '3px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                          }}
                        >
                          📷 {parsedImages.length}
                        </Box>
                      )}

                      {/* Discount % */}
                      {discountPct > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: 8,
                            right: 8,
                            bgcolor: '#10B981',
                            color: '#fff',
                            px: 0.8,
                            py: 0.2,
                            borderRadius: '3px',
                            fontSize: '0.65rem',
                            fontWeight: 900,
                          }}
                        >
                          -{discountPct}%
                        </Box>
                      )}
                    </Box>

                    {/* Right Content Area */}
                    <Box
                      sx={{
                        flex: 1,
                        p: { xs: 2, sm: 2.2 },
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Box
                        component={Link}
                        href={`/second-hand/${item.id}`}
                        target="_blank"
                        sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                      >
                        {/* Price & Original Strikethrough */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                          <Typography
                            variant="h5"
                            sx={{
                              fontWeight: 900,
                              color: '#002F34',
                              fontSize: { xs: '1.25rem', sm: '1.35rem' },
                              letterSpacing: -0.3,
                            }}
                          >
                            Rs {Number(item.price).toLocaleString()}
                          </Typography>
                          {orig > curr && (
                            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}>
                              Rs {orig.toLocaleString()}
                            </Typography>
                          )}
                        </Box>

                        {/* Title */}
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#002F34',
                            fontWeight: 600,
                            fontSize: '1rem',
                            lineHeight: 1.35,
                            mb: 0.6,
                            '&:hover': { color: THEME.primary },
                          }}
                        >
                          {item.title}
                        </Typography>

                        {/* Category & Condition */}
                        <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mb: 0.8, fontSize: '0.8rem' }}>
                          {item.category} • {conditionObj?.label} {item.sellerType === 'MERCHANT' ? '• Verified Merchant' : ''}
                        </Typography>

                        {/* Description Snippet */}
                        {item.description && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#64748B',
                              fontSize: '0.82rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical',
                              mb: 1,
                            }}
                          >
                            {item.description}
                          </Typography>
                        )}
                      </Box>

                      {/* Footer: Location & Time Ago on left, Actions on right */}
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: 1,
                          pt: 1,
                          borderTop: '1px solid #F1F5F9',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: '#64748B', fontSize: '0.78rem' }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                            📍 {item.location ? `${item.location}, ` : ''}{item.city}
                          </Typography>
                          <span>•</span>
                          <Typography variant="caption" sx={{ color: '#64748B' }}>
                            {timeAgo(item.createdAt)}
                          </Typography>
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            component={Link}
                            href={`/second-hand/${item.id}`}
                            target="_blank"
                            size="small"
                            variant="outlined"
                            endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              borderColor: '#CBD5E1',
                              color: '#002F34',
                              fontWeight: 800,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              px: 1.8,
                              py: 0.5,
                              borderRadius: '4px',
                              '&:hover': { borderColor: '#002F34', bgcolor: 'rgba(0,47,52,0.04)' },
                            }}
                          >
                            Details
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<WhatsAppIcon sx={{ fontSize: 15 }} />}
                            onClick={() => openWhatsAppChat(item.contactPhone || item.seller?.phoneNumber, item.title, item.price)}
                            sx={{
                              bgcolor: '#25D366',
                              color: '#fff',
                              fontWeight: 800,
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              px: 1.8,
                              py: 0.5,
                              borderRadius: '4px',
                              '&:hover': { bgcolor: '#20BA56' },
                            }}
                          >
                            Chat
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                )
              })}
            </Stack>
          ) : (
            /* ═════════════════════════════════════════════════════════════════════════
               OLX COMPACT GRID VIEW (CONSTRAINED CARD WIDTH: 260px - 310px)
            ═════════════════════════════════════════════════════════════════════════ */
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 300px))',
                gap: 2.5,
                justifyContent: 'start',
              }}
            >
              {items.map(item => {
                let parsedImages = []
                try {
                  parsedImages = JSON.parse(item.images || '[]')
                } catch {
                  parsedImages = []
                }
                const firstImage = parsedImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'
                const conditionObj = CONDITIONS.find(c => c.id === item.condition)

                // Calculate savings
                const orig = Number(item.originalPrice || 0)
                const curr = Number(item.price || 0)
                const discountPct = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0

                return (
                  <Card
                    key={item.id}
                    sx={{
                      borderRadius: '4px',
                      border: '1px solid #E2E8F0',
                      overflow: 'hidden',
                      bgcolor: '#FFFFFF',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.18s ease-in-out',
                      position: 'relative',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      '&:hover': {
                        boxShadow: '0 8px 24px rgba(0,47,52,0.12)',
                        borderColor: '#94A3B8',
                      },
                    }}
                  >
                    {/* Top Clickable Area Linking to Dedicated Item Page in New Tab */}
                    <Box
                      component={Link}
                      href={`/second-hand/${item.id}`}
                      target="_blank"
                      sx={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                    >
                      {/* Image Container (OLX 4:3 Ratio) */}
                      <Box
                        sx={{
                          position: 'relative',
                          width: '100%',
                          aspectRatio: '4/3',
                          bgcolor: '#F8FAFC',
                          overflow: 'hidden',
                          borderBottom: '1px solid #F1F5F9',
                        }}
                      >
                        <img
                          src={firstImage}
                          alt={item.title}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.25s ease',
                          }}
                        />

                        {/* Featured Ribbon (OLX Signature) */}
                        {item.sellerType === 'MERCHANT' ? (
                          <Chip
                            label="FEATURED"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: '#FDB600',
                              color: '#002F34',
                              fontWeight: 900,
                              fontSize: '0.62rem',
                              height: 20,
                              borderRadius: '3px',
                            }}
                          />
                        ) : (
                          <Chip
                            label={conditionObj?.label || item.condition}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: 'rgba(0,47,52,0.85)',
                              color: '#FFFFFF',
                              fontWeight: 800,
                              fontSize: '0.62rem',
                              height: 20,
                              borderRadius: '3px',
                              backdropFilter: 'blur(4px)',
                            }}
                          />
                        )}

                        {/* Photo Count Pill (OLX bottom-left: 📷 3) */}
                        {parsedImages.length > 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              left: 8,
                              bgcolor: 'rgba(0,0,0,0.65)',
                              color: '#fff',
                              px: 1,
                              py: 0.2,
                              borderRadius: '3px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            📷 {parsedImages.length}
                          </Box>
                        )}

                        {/* Savings % Tag */}
                        {discountPct > 0 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: '#10B981',
                              color: '#fff',
                              px: 0.8,
                              py: 0.2,
                              borderRadius: '3px',
                              fontSize: '0.65rem',
                              fontWeight: 900,
                            }}
                          >
                            -{discountPct}%
                          </Box>
                        )}
                      </Box>

                      {/* OLX Card Body */}
                      <CardContent sx={{ p: '12px 14px 8px 14px' }}>
                        {/* Price (OLX bold prominent typography) */}
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.6 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 900,
                              color: '#002F34',
                              fontSize: '1.18rem',
                              letterSpacing: -0.2,
                              lineHeight: 1.2,
                            }}
                          >
                            Rs {Number(item.price).toLocaleString()}
                          </Typography>
                          {orig > curr && (
                            <Typography
                              variant="caption"
                              sx={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}
                            >
                              Rs {orig.toLocaleString()}
                            </Typography>
                          )}
                        </Box>

                        {/* Title (OLX 2-line title) */}
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#002F34',
                            fontWeight: 500,
                            fontSize: '0.88rem',
                            lineHeight: 1.35,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            minHeight: 38,
                            mb: 1.2,
                          }}
                          title={item.title}
                        >
                          {item.title}
                        </Typography>

                        {/* Category & Condition indicator */}
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#64748B',
                            fontSize: '0.72rem',
                            display: 'block',
                            mb: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.category} • {conditionObj?.label}
                        </Typography>

                        {/* OLX Classic Footer: Location on Left, Time on Right */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: '#64748B',
                            fontSize: '0.72rem',
                            pt: 1,
                            borderTop: '1px solid #F1F5F9',
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: '0.72rem',
                              color: '#64748B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '65%',
                            }}
                          >
                            {item.location ? `${item.location}, ` : ''}{item.city}
                          </Typography>

                          <Typography variant="caption" sx={{ fontSize: '0.72rem', color: '#64748B', whiteSpace: 'nowrap' }}>
                            {timeAgo(item.createdAt)}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Box>

                    {/* Quick Action Buttons (OLX View Ad & WhatsApp Chat) */}
                    <Box sx={{ px: 1.5, pb: 1.5, pt: 0 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Button
                            component={Link}
                            href={`/second-hand/${item.id}`}
                            target="_blank"
                            variant="outlined"
                            fullWidth
                            size="small"
                            endIcon={<OpenInNewIcon sx={{ fontSize: 13 }} />}
                            sx={{
                              borderColor: '#CBD5E1',
                              color: '#002F34',
                              fontWeight: 800,
                              textTransform: 'none',
                              py: 0.6,
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              '&:hover': { borderColor: '#002F34', bgcolor: 'rgba(0,47,52,0.04)' },
                            }}
                          >
                            Details
                          </Button>
                        </Grid>
                        <Grid item xs={6}>
                          <Button
                            variant="contained"
                            fullWidth
                            size="small"
                            startIcon={<WhatsAppIcon sx={{ fontSize: 14 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              openWhatsAppChat(item.contactPhone || item.seller?.phoneNumber, item.title, item.price);
                            }}
                            sx={{
                              bgcolor: '#25D366',
                              color: '#fff',
                              fontWeight: 800,
                              textTransform: 'none',
                              py: 0.6,
                              borderRadius: '4px',
                              fontSize: '0.74rem',
                              '&:hover': { bgcolor: '#20BA56' },
                            }}
                          >
                            Chat
                          </Button>
                        </Grid>
                      </Grid>
                    </Box>
                  </Card>
                )
              })}
            </Box>
          )}
          )}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 1: USER HUB (MY LISTINGS, OFFERS RECEIVED & OFFERS SENT)
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <Box sx={{ width: '100%' }}>
          {/* Subtabs for Hub */}
          <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
            <Button
              variant={hubSubTab === 0 ? 'contained' : 'outlined'}
              onClick={() => setHubSubTab(0)}
              startIcon={<LocalOfferIcon />}
              sx={{
                bgcolor: hubSubTab === 0 ? THEME.primary : 'transparent',
                color: hubSubTab === 0 ? '#fff' : '#334155',
                borderColor: hubSubTab === 0 ? THEME.primary : THEME.border,
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Offers Received on My Items ({myOffersReceived.length})
            </Button>

            <Button
              variant={hubSubTab === 1 ? 'contained' : 'outlined'}
              onClick={() => setHubSubTab(1)}
              startIcon={<HandshakeIcon />}
              sx={{
                bgcolor: hubSubTab === 1 ? THEME.primary : 'transparent',
                color: hubSubTab === 1 ? '#fff' : '#334155',
                borderColor: hubSubTab === 1 ? THEME.primary : THEME.border,
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
              }}
            >
              Offers I Sent to Sellers ({myOffersSent.length})
            </Button>

            <Button
              variant={hubSubTab === 2 ? 'contained' : 'outlined'}
              onClick={() => setHubSubTab(2)}
              startIcon={<StorefrontIcon />}
              sx={{
                bgcolor: hubSubTab === 2 ? THEME.primary : 'transparent',
                color: hubSubTab === 2 ? '#fff' : '#334155',
                borderColor: hubSubTab === 2 ? THEME.primary : THEME.border,
                fontWeight: 800,
                textTransform: 'none',
                borderRadius: 2,
                px: 2.5,
              }}
            >
              My Listed Items ({myListings.length})
            </Button>
          </Box>

          {loadingHub ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: THEME.primary }} />
            </Box>
          ) : (
            <>
              {/* SUBTAB 0: OFFERS RECEIVED */}
              {hubSubTab === 0 && (
                <Box>
                  {myOffersReceived.length === 0 ? (
                    <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px dashed ${THEME.border}` }}>
                      <LocalOfferIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1 }} />
                      <Typography variant="h6" fontWeight={700} color="#334155">
                        No buyer offers received yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        List more items or adjust your asking prices to attract offers!
                      </Typography>
                    </Card>
                  ) : (
                    <Grid container spacing={2.5}>
                      {myOffersReceived.map(offer => (
                        <Grid item xs={12} md={6} lg={4} key={offer.id}>
                          <Card sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography variant="subtitle1" fontWeight={800} color="#0F172A" noWrap sx={{ maxWidth: '65%' }}>
                                {offer.item?.title}
                              </Typography>
                              <Chip
                                label={offer.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: offer.status === 'ACCEPTED' ? '#DCFCE7' : offer.status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                                  color: offer.status === 'ACCEPTED' ? '#166534' : offer.status === 'REJECTED' ? '#991B1B' : '#92400E',
                                }}
                              />
                            </Box>

                            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Original Asking Price:</Typography>
                                <Typography variant="caption" fontWeight={700}>Rs. {Number(offer.item?.price || 0).toLocaleString()}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <Typography variant="body2" fontWeight={800} color="#0F172A">Buyer's Offer:</Typography>
                                <Typography variant="h6" fontWeight={900} sx={{ color: THEME.emerald }}>
                                  Rs. {Number(offer.offerPrice).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                              From buyer: <strong>{offer.buyer?.name || 'Customer'}</strong>
                            </Typography>

                            {offer.message && (
                              <Typography variant="body2" sx={{ p: 1.5, bgcolor: '#F1F5F9', borderRadius: 1.5, mb: 2, fontSize: '0.85rem' }}>
                                "{offer.message}"
                              </Typography>
                            )}

                            {offer.status === 'PENDING' && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleOfferAction(offer.id, 'ACCEPT')}
                                  sx={{ bgcolor: THEME.emerald, color: '#fff', fontWeight: 800, textTransform: 'none', flex: 1, '&:hover': { bgcolor: THEME.emeraldDark } }}
                                >
                                  Accept Deal
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => {
                                    setCounterModalOffer(offer)
                                    setCounterPriceInput(String(Math.round((Number(offer.item?.price) + Number(offer.offerPrice)) / 2)))
                                  }}
                                  sx={{ borderColor: THEME.primary, color: THEME.primary, fontWeight: 800, textTransform: 'none', flex: 1 }}
                                >
                                  Counter Offer
                                </Button>
                                <Button
                                  variant="text"
                                  size="small"
                                  onClick={() => handleOfferAction(offer.id, 'REJECT')}
                                  sx={{ color: '#EF4444', textTransform: 'none' }}
                                >
                                  Decline
                                </Button>
                              </Box>
                            )}

                            {offer.status === 'ACCEPTED' && offer.buyer?.phoneNumber && (
                              <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="caption" color="#065F46" fontWeight={700}>Deal Accepted! Buyer Contact:</Typography>
                                  <Typography variant="body2" fontWeight={800} color="#065F46">{offer.buyer.phoneNumber}</Typography>
                                </Box>
                                <Button
                                  size="small"
                                  startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                  onClick={() => openWhatsAppChat(offer.buyer.phoneNumber, offer.item?.title, offer.offerPrice)}
                                  sx={{ color: '#065F46', textTransform: 'none', fontWeight: 800 }}
                                >
                                  WhatsApp
                                </Button>
                              </Box>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* SUBTAB 1: OFFERS SENT */}
              {hubSubTab === 1 && (
                <Box>
                  {myOffersSent.length === 0 ? (
                    <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px dashed ${THEME.border}` }}>
                      <HandshakeIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1 }} />
                      <Typography variant="h6" fontWeight={700} color="#334155">
                        You haven't submitted any offers yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Browse items in the marketplace and submit an offer to negotiate a great deal!
                      </Typography>
                    </Card>
                  ) : (
                    <Grid container spacing={2.5}>
                      {myOffersSent.map(offer => (
                        <Grid item xs={12} md={6} lg={4} key={offer.id}>
                          <Card sx={{ p: 2.5, borderRadius: 3, border: `1px solid ${THEME.border}`, bgcolor: '#FFFFFF', boxShadow: '0 4px 14px rgba(0,0,0,0.03)' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                              <Typography variant="subtitle1" fontWeight={800} color="#0F172A" noWrap sx={{ maxWidth: '65%' }}>
                                {offer.item?.title}
                              </Typography>
                              <Chip
                                label={offer.status}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: offer.status === 'ACCEPTED' ? '#DCFCE7' : offer.status === 'COUNTERED' ? '#EDE9FE' : '#FEF3C7',
                                  color: offer.status === 'ACCEPTED' ? '#166534' : offer.status === 'COUNTERED' ? '#6D28D9' : '#92400E',
                                }}
                              />
                            </Box>

                            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">Asking Price:</Typography>
                                <Typography variant="caption" fontWeight={700}>Rs. {Number(offer.item?.price || 0).toLocaleString()}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <Typography variant="body2" fontWeight={800} color="#0F172A">My Offer:</Typography>
                                <Typography variant="h6" fontWeight={900} sx={{ color: THEME.primary }}>
                                  Rs. {Number(offer.offerPrice).toLocaleString()}
                                </Typography>
                              </Box>
                              {offer.counterPrice && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mt: 1, pt: 1, borderTop: '1px dashed #CBD5E1' }}>
                                  <Typography variant="body2" fontWeight={800} color="#7C3AED">Seller's Counter:</Typography>
                                  <Typography variant="h6" fontWeight={900} color="#7C3AED">
                                    Rs. {Number(offer.counterPrice).toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
                            </Box>

                            {offer.status === 'COUNTERED' && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleOfferAction(offer.id, 'ACCEPT_COUNTER')}
                                  sx={{ bgcolor: '#7C3AED', color: '#fff', fontWeight: 800, textTransform: 'none', flex: 1 }}
                                >
                                  Accept Counter (Rs. {Number(offer.counterPrice).toLocaleString()})
                                </Button>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleOfferAction(offer.id, 'CANCEL')}
                                  sx={{ color: '#64748B', borderColor: '#CBD5E1', textTransform: 'none' }}
                                >
                                  Decline
                                </Button>
                              </Box>
                            )}

                            {offer.status === 'ACCEPTED' && offer.item?.seller?.phoneNumber && (
                              <Box sx={{ p: 1.5, bgcolor: '#ECFDF5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="caption" color="#065F46" fontWeight={700}>Seller Contact:</Typography>
                                  <Typography variant="body2" fontWeight={800} color="#065F46">{offer.item.seller.phoneNumber}</Typography>
                                </Box>
                                <Button
                                  size="small"
                                  startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                                  onClick={() => openWhatsAppChat(offer.item.seller.phoneNumber, offer.item?.title, offer.offerPrice)}
                                  sx={{ color: '#065F46', textTransform: 'none', fontWeight: 800 }}
                                >
                                  WhatsApp
                                </Button>
                              </Box>
                            )}
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
              )}

              {/* SUBTAB 2: MY LISTED ITEMS */}
              {hubSubTab === 2 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
                    <Typography variant="h6" fontWeight={800} color="#0F172A">
                      My Pre-Loved Listings ({myListings.length})
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleOpenCreateModal}
                      sx={{ bgcolor: THEME.primary, color: '#fff', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                    >
                      + Add New Listing
                    </Button>
                  </Box>

                  {myListings.length === 0 ? (
                    <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: `1px dashed ${THEME.border}` }}>
                      <StorefrontIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1 }} />
                      <Typography variant="h6" fontWeight={700} color="#334155">
                        You have not listed any items for sale yet
                      </Typography>
                      <Button
                        variant="contained"
                        onClick={handleOpenCreateModal}
                        sx={{ mt: 2, bgcolor: THEME.primary, color: '#fff', fontWeight: 800, textTransform: 'none' }}
                      >
                        + Create Your First Listing
                      </Button>
                    </Card>
                  ) : (
                    <Grid container spacing={2.5}>
                      {myListings.map(item => {
                        let parsedImages = []
                        try {
                          parsedImages = JSON.parse(item.images || '[]')
                        } catch {
                          parsedImages = []
                        }
                        const firstImage = parsedImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600'
                        const isSold = item.status === 'SOLD'

                        return (
                          <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                            <Card sx={{ borderRadius: 3, border: `1px solid ${THEME.border}`, overflow: 'hidden', bgcolor: '#FFFFFF' }}>
                              <Box sx={{ position: 'relative', width: '100%', aspectRatio: '16/9', bgcolor: '#F1F5F9' }}>
                                <img src={firstImage} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <Chip
                                  label={item.status}
                                  size="small"
                                  sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    bgcolor: isSold ? '#EF4444' : '#10B981',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: '0.68rem',
                                  }}
                                />
                              </Box>

                              <CardContent sx={{ p: 2 }}>
                                <Typography variant="subtitle1" fontWeight={800} noWrap title={item.title}>
                                  {item.title}
                                </Typography>
                                <Typography variant="h6" fontWeight={900} sx={{ color: THEME.primary, my: 0.5 }}>
                                  Rs. {Number(item.price).toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {parsedImages.length} photo(s) • {item.viewsCount || 0} views • {item._count?.offers || 0} offer(s)
                                </Typography>

                                <Divider sx={{ my: 1.5 }} />

                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => handleToggleListingStatus(item, isSold ? 'AVAILABLE' : 'SOLD')}
                                    sx={{ flex: 1, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', borderColor: isSold ? '#10B981' : '#EF4444', color: isSold ? '#10B981' : '#EF4444' }}
                                  >
                                    {isSold ? 'Mark Available' : 'Mark Sold'}
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleOpenEditModal(item)}
                                    sx={{ border: '1px solid #CBD5E1', borderRadius: 1.5 }}
                                  >
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDeleteListing(item.id)}
                                    sx={{ border: '1px solid #FCA5A5', color: '#EF4444', borderRadius: 1.5 }}
                                  >
                                    <DeleteOutlineIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        )
                      })}
                    </Grid>
                  )}
                </Box>
              )}
            </>
          )}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          3. FULL ITEM QUICK VIEW / DETAILS MODAL
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        {selectedDetailItem && (() => {
          let parsedImages = []
          try {
            parsedImages = JSON.parse(selectedDetailItem.images || '[]')
          } catch {
            parsedImages = []
          }
          if (!parsedImages.length) {
            parsedImages = ['https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800']
          }
          const currentImg = parsedImages[detailPhotoIndex] || parsedImages[0]
          const conditionObj = CONDITIONS.find(c => c.id === selectedDetailItem.condition)

          const orig = Number(selectedDetailItem.originalPrice || 0)
          const curr = Number(selectedDetailItem.price || 0)
          const discountPct = orig > curr ? Math.round(((orig - curr) / orig) * 100) : 0

          return (
            <Box>
              <DialogTitle sx={{ p: 2.5, pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip
                    label={conditionObj?.label || selectedDetailItem.condition}
                    size="small"
                    sx={{ bgcolor: THEME.primary, color: '#fff', fontWeight: 800, fontSize: '0.72rem' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Posted in {selectedDetailItem.category}
                  </Typography>
                </Box>
                <IconButton onClick={() => setSelectedDetailItem(null)}><CloseIcon /></IconButton>
              </DialogTitle>

              <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Grid container spacing={3}>
                  {/* Photo Gallery Column */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ position: 'relative', width: '100%', aspectRatio: '4/3', borderRadius: 3, overflow: 'hidden', bgcolor: '#F1F5F9', mb: 1.5 }}>
                      <img src={currentImg} alt={selectedDetailItem.title} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />

                      {parsedImages.length > 1 && (
                        <>
                          <IconButton
                            size="small"
                            onClick={() => setDetailPhotoIndex(prev => (prev === 0 ? parsedImages.length - 1 : prev - 1))}
                            sx={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                          >
                            <ArrowBackIosNewIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDetailPhotoIndex(prev => (prev === parsedImages.length - 1 ? 0 : prev + 1))}
                            sx={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}
                          >
                            <ArrowForwardIosIcon fontSize="small" />
                          </IconButton>
                        </>
                      )}
                    </Box>

                    {/* Thumbnail Strip */}
                    {parsedImages.length > 1 && (
                      <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
                        {parsedImages.map((img, idx) => (
                          <Box
                            key={idx}
                            onClick={() => setDetailPhotoIndex(idx)}
                            sx={{
                              width: 58,
                              height: 58,
                              borderRadius: 2,
                              overflow: 'hidden',
                              border: '2px solid',
                              borderColor: detailPhotoIndex === idx ? THEME.primary : 'transparent',
                              cursor: 'pointer',
                              flexShrink: 0,
                            }}
                          >
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Safety Tips Banner */}
                    <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: `1px solid ${THEME.border}`, mt: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#0F172A', mb: 0.5 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: THEME.emerald }} />
                        <Typography variant="caption" fontWeight={800}>SAFE PEER-TO-PEER TRADING</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                        Inspect the item thoroughly before finalizing cash payment. Meet in well-lit public spots, or request delivery via Martzona Luggage Drop Courier!
                      </Typography>
                    </Box>
                  </Grid>

                  {/* Details & Actions Column */}
                  <Grid item xs={12} md={6}>
                    <Typography variant="h5" fontWeight={900} color="#0F172A" sx={{ mb: 1, lineHeight: 1.3 }}>
                      {selectedDetailItem.title}
                    </Typography>

                    {/* Price & Savings */}
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1.5, my: 1.5 }}>
                      <Typography variant="h4" fontWeight={900} sx={{ color: THEME.primary }}>
                        Rs. {Number(selectedDetailItem.price).toLocaleString()}
                      </Typography>
                      {orig > curr && (
                        <Typography variant="body1" sx={{ textDecoration: 'line-through', color: '#94A3B8', fontWeight: 600 }}>
                          Rs. {orig.toLocaleString()}
                        </Typography>
                      )}
                      {discountPct > 0 && (
                        <Chip label={`SAVE ${discountPct}%`} size="small" sx={{ bgcolor: THEME.emerald, color: '#fff', fontWeight: 900 }} />
                      )}
                    </Box>

                    {/* Location & View Stats */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#64748B', mb: 2.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationOnIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        <Typography variant="body2">
                          {selectedDetailItem.city} {selectedDetailItem.location ? `• ${selectedDetailItem.location}` : ''}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <VisibilityOutlinedIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                        <Typography variant="body2">{selectedDetailItem.viewsCount || 1} views</Typography>
                      </Box>
                    </Box>

                    {/* Seller Card */}
                    <Card sx={{ p: 2, borderRadius: 2.5, border: `1px solid ${THEME.border}`, bgcolor: '#F8FAFC', mb: 2.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ bgcolor: THEME.primary, fontWeight: 800 }}>
                            {selectedDetailItem.seller?.name?.charAt(0) || 'S'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                              {selectedDetailItem.seller?.name || 'Verified Seller'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedDetailItem.sellerType === 'MERCHANT' ? 'Verified Martzona Partner' : 'Community Member'}
                            </Typography>
                          </Box>
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
                          onClick={() => openWhatsAppChat(selectedDetailItem.contactPhone || selectedDetailItem.seller?.phoneNumber, selectedDetailItem.title, selectedDetailItem.price)}
                          sx={{ borderColor: '#CBD5E1', color: '#166534', fontWeight: 800, textTransform: 'none', borderRadius: 2 }}
                        >
                          WhatsApp
                        </Button>
                      </Box>
                    </Card>

                    {/* Description */}
                    <Typography variant="subtitle2" fontWeight={800} color="#334155" sx={{ mb: 0.5 }}>
                      ITEM DESCRIPTION & SPECIFICATIONS:
                    </Typography>
                    <Typography variant="body2" color="#475569" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6, mb: 3 }}>
                      {selectedDetailItem.description || 'No detailed specifications provided.'}
                    </Typography>

                    {/* Action Buttons */}
                    <Stack spacing={1.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        startIcon={<LocalOfferIcon />}
                        onClick={() => openMakeOfferDialog(selectedDetailItem)}
                        sx={{
                          bgcolor: THEME.primary,
                          color: '#fff',
                          fontWeight: 800,
                          textTransform: 'none',
                          py: 1.3,
                          borderRadius: 2.5,
                          fontSize: '0.95rem',
                          '&:hover': { bgcolor: THEME.primaryDark },
                        }}
                      >
                        Make a Counter Offer to Seller
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
              </DialogContent>
            </Box>
          )
        })()}
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════
          4. MAKE AN OFFER MODAL (WITH QUICK DISCOUNTS & LIVE CALCULATION)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(offerItem)}
        onClose={() => setOfferItem(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Propose Your Offer to Seller</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#F8FAFC', border: `1px solid ${THEME.border}` }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                {offerItem?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Seller's Asking Price: <strong>Rs. {Number(offerItem?.price || 0).toLocaleString()}</strong>
              </Typography>
            </Box>

            {/* Quick % Discounts */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                QUICK PERCENTAGE OFFERS
              </Typography>
              <Stack direction="row" spacing={1}>
                {[-10, -15, -20, -25].map(pct => {
                  const val = Math.round(Number(offerItem?.price || 0) * (1 + pct / 100))
                  return (
                    <Chip
                      key={pct}
                      label={`${pct}% (Rs. ${val.toLocaleString()})`}
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
              label="Your Proposed Offer (Rs.)"
              type="number"
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                sx: { fontWeight: 800, fontSize: '1.2rem', color: THEME.primary },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Message to Seller (Optional)"
              placeholder="e.g. Can pick up today with cash in hand, or meet at DHA phase 5."
              value={offerMessage}
              onChange={e => setOfferMessage(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOfferItem(null)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmitOffer}
            disabled={submittingOffer}
            sx={{ bgcolor: THEME.primary, fontWeight: 800, textTransform: 'none', px: 3, '&:hover': { bgcolor: THEME.primaryDark } }}
          >
            {submittingOffer ? 'Sending...' : 'Send Offer to Seller'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════
          5. SELL / EDIT 2ND HAND ITEM MODAL (WITH MULTI-IMAGE UPLOADING & ALL DATA)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={openSellModal}
        onClose={() => setOpenSellModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <span>{editingItemId ? 'Edit 2nd Hand Listing' : 'List a 2nd Hand / Pre-Loved Item'}</span>
          <IconButton onClick={() => setOpenSellModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 2 }}>
          <Stack spacing={3}>

            {/* Multi-Photo Upload & Preview Grid */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#1E293B">
                  ITEM PHOTOS ({sellForm.images.length}/8 UPLOADED) *
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  First photo is the primary cover image
                </Typography>
              </Box>

              {uploadingImages && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} sx={{ height: 6, borderRadius: 3, bgcolor: '#E2E8F0', '& .MuiLinearProgress-bar': { bgcolor: THEME.primary } }} />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Uploading photos ({uploadProgress}%)...
                  </Typography>
                </Box>
              )}

              {/* Photo Grid Preview */}
              <Grid container spacing={1.5} alignItems="center">
                {sellForm.images.map((img, index) => (
                  <Grid item xs={6} sm={4} md={3} key={index}>
                    <Card sx={{ position: 'relative', borderRadius: 2.5, overflow: 'hidden', border: index === 0 ? `2px solid ${THEME.accentGold}` : `1px solid ${THEME.border}` }}>
                      <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1/1', bgcolor: '#F1F5F9' }}>
                        <img src={img} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />

                        {index === 0 && (
                          <Chip
                            label="★ COVER"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              bgcolor: THEME.accentGold,
                              color: '#1E0424',
                              fontWeight: 900,
                              fontSize: '0.62rem',
                              height: 20,
                            }}
                          />
                        )}

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.6)', color: '#fff', '&:hover': { bgcolor: '#EF4444' } }}
                        >
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>

                        {index !== 0 && (
                          <Button
                            size="small"
                            onClick={() => handleSetCoverPhoto(index)}
                            sx={{
                              position: 'absolute',
                              bottom: 6,
                              left: '50%',
                              transform: 'translateX(-50%)',
                              bgcolor: 'rgba(0,0,0,0.7)',
                              color: '#fff',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              textTransform: 'none',
                              px: 1,
                              py: 0.2,
                              borderRadius: 1,
                              '&:hover': { bgcolor: THEME.primary },
                            }}
                          >
                            Set Cover
                          </Button>
                        )}
                      </Box>
                    </Card>
                  </Grid>
                ))}

                {sellForm.images.length < 8 && (
                  <Grid item xs={6} sm={4} md={3}>
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={uploadingImages}
                      sx={{
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: 2.5,
                        border: '2px dashed #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        textTransform: 'none',
                        color: '#64748B',
                        '&:hover': { borderColor: THEME.primary, bgcolor: 'rgba(74,21,75,0.03)' },
                      }}
                    >
                      <CloudUploadIcon sx={{ fontSize: 28, color: THEME.primary }} />
                      <Typography variant="caption" fontWeight={700}>
                        + Add Photos
                      </Typography>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleMultiImageUpload}
                      />
                    </Button>
                  </Grid>
                )}
              </Grid>
            </Box>

            {/* Title */}
            <TextField
              fullWidth
              label="Item Title *"
              placeholder="e.g. iPhone 14 Pro Max 256GB Deep Purple (Box + Original Cable)"
              value={sellForm.title}
              onChange={e => setSellForm(prev => ({ ...prev, title: e.target.value }))}
            />

            {/* Category & Condition */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category *</InputLabel>
                  <Select
                    value={sellForm.category}
                    label="Category *"
                    onChange={e => setSellForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.filter(c => c.id !== 'All Categories').map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.icon} {c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Item Condition *</InputLabel>
                  <Select
                    value={sellForm.condition}
                    label="Item Condition *"
                    onChange={e => setSellForm(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    {CONDITIONS.filter(c => c.id !== 'ALL').map(c => (
                      <MenuItem key={c.id} value={c.id}>
                        {c.label} ({c.desc})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Pricing Section with Live Savings calculation */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Asking Price (Rs.) *"
                  placeholder="e.g. 185000"
                  value={sellForm.price}
                  onChange={e => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Original Retail Price (Optional)"
                  placeholder="e.g. 250000"
                  value={sellForm.originalPrice}
                  onChange={e => setSellForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                  helperText={liveDiscountPct > 0 ? `Shows buyers a ${liveDiscountPct}% discount!` : 'Helps buyers see savings'}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Minimum Offer Price (Optional)"
                  placeholder="e.g. 170000"
                  value={sellForm.minOfferPrice}
                  onChange={e => setSellForm(prev => ({ ...prev, minOfferPrice: e.target.value }))}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                  helperText="Lowest amount you would accept"
                />
              </Grid>
            </Grid>

            {/* Description */}
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Item Description & Specifications *"
              placeholder="Describe flaws, battery health, scratches, original box/accessories included, warranty status, reason for selling..."
              value={sellForm.description}
              onChange={e => setSellForm(prev => ({ ...prev, description: e.target.value }))}
            />

            {/* Location & Contact */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>City *</InputLabel>
                  <Select
                    value={sellForm.city}
                    label="City *"
                    onChange={e => setSellForm(prev => ({ ...prev, city: e.target.value }))}
                  >
                    {MAJOR_CITIES.filter(c => c !== 'All Pakistan').map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="Area / Neighborhood"
                  placeholder="e.g. DHA Phase 5 / Gulberg"
                  value={sellForm.location}
                  onChange={e => setSellForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  label="WhatsApp / Phone Contact"
                  placeholder="e.g. 03001234567"
                  value={sellForm.contactPhone}
                  onChange={e => setSellForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                />
              </Grid>
            </Grid>

            {/* Allow Offers Toggle */}
            <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2.5, border: `1px solid ${THEME.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                  Allow Buyers to Submit Price Offers & Bids
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Buyers can negotiate or counter-offer. You can accept, counter, or decline anytime.
                </Typography>
              </Box>
              <Switch
                checked={sellForm.allowOffers}
                onChange={e => setSellForm(prev => ({ ...prev, allowOffers: e.target.checked }))}
                color="secondary"
              />
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, borderTop: `1px solid ${THEME.border}` }}>
          <Button onClick={() => setOpenSellModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveListing}
            disabled={savingItem || uploadingImages}
            sx={{
              bgcolor: THEME.primary,
              fontWeight: 800,
              textTransform: 'none',
              px: 4,
              py: 1.2,
              borderRadius: 2,
              '&:hover': { bgcolor: THEME.primaryDark },
            }}
          >
            {savingItem ? 'Saving Listing...' : editingItemId ? 'Update Listing' : 'Publish Listing'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ═══════════════════════════════════════════════════════════════════════════
          6. COUNTER OFFER DIALOG
      ═══════════════════════════════════════════════════════════════════════════ */}
      <Dialog
        open={Boolean(counterModalOffer)}
        onClose={() => setCounterModalOffer(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Propose Counter-Offer</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Buyer proposed: <strong>Rs. {Number(counterModalOffer?.offerPrice || 0).toLocaleString()}</strong>
            </Typography>
            <TextField
              fullWidth
              type="number"
              label="Your Counter Price (Rs.)"
              value={counterPriceInput}
              onChange={e => setCounterPriceInput(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setCounterModalOffer(null)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleOfferAction(counterModalOffer.id, 'COUNTER', { counterPrice: Number(counterPriceInput) })}
            sx={{ bgcolor: THEME.primary, fontWeight: 800, textTransform: 'none', '&:hover': { bgcolor: THEME.primaryDark } }}
          >
            Send Counter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
