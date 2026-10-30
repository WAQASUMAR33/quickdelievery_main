'use client'

import { useState, useEffect, useCallback } from 'react'
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
import toast from 'react-hot-toast'
import { fileToBase64DataUrl, uploadBase64Image } from '@/lib/imageUpload'

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

const BRAND = '#39772A'

const CATEGORIES = [
  'All Categories',
  'Electronics & Gadgets',
  'Mobile Phones & Tablets',
  'Computers & Laptops',
  'Home Furniture & Decor',
  'Fashion & Clothing',
  'Vehicles, Bikes & Parts',
  'Kitchen & Home Appliances',
  'Books, Sports & Hobbies',
  'Other Items',
]

const CONDITIONS = [
  { id: 'ALL', label: 'All Conditions' },
  { id: 'BRAND_NEW', label: 'Brand New (Sealed)', color: '#16A34A' },
  { id: 'LIKE_NEW', label: 'Like New (Mint)', color: '#0284C7' },
  { id: 'EXCELLENT', label: 'Excellent Condition', color: '#7C3AED' },
  { id: 'GOOD', label: 'Good (Normal Wear)', color: '#EA580C' },
  { id: 'FAIR', label: 'Fair (Functional)', color: '#64748B' },
]

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
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All Categories')
  const [selectedCondition, setSelectedCondition] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState(0) // 0: Browse Marketplace, 1: My Listings & Offers

  // Sell Item Modal
  const [openSellModal, setOpenSellModal] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [sellForm, setSellForm] = useState({
    title: '',
    description: '',
    category: 'Electronics & Gadgets',
    condition: 'LIKE_NEW',
    price: '',
    originalPrice: '',
    minOfferPrice: '',
    images: [],
    city: 'Lahore',
    location: '',
    contactPhone: user?.phoneNumber || '',
  })

  // Make Offer Modal
  const [offerItem, setOfferItem] = useState(null)
  const [offerPrice, setOfferPrice] = useState('')
  const [offerMessage, setOfferMessage] = useState('')
  const [submittingOffer, setSubmittingOffer] = useState(false)

  // User Hub (My Offers & Listings)
  const [myOffersReceived, setMyOffersReceived] = useState([])
  const [myOffersSent, setMyOffersSent] = useState([])
  const [loadingOffers, setLoadingOffers] = useState(false)
  const [counterModalOffer, setCounterModalOffer] = useState(null)
  const [counterPriceInput, setCounterPriceInput] = useState('')

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'All Categories') params.set('category', selectedCategory)
      if (selectedCondition !== 'ALL') params.set('condition', selectedCondition)
      if (searchQuery.trim()) params.set('q', searchQuery.trim())

      const res = await fetch(`/api/second-hand?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.data || [])
      }
    } catch {
      // Non-blocking
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedCondition, searchQuery])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const fetchUserOffers = useCallback(async () => {
    if (!user) return
    try {
      setLoadingOffers(true)
      const [resReceived, resSent] = await Promise.all([
        fetch('/api/second-hand/offers?type=received', { headers: buildAuthHeaders(), credentials: 'include' }),
        fetch('/api/second-hand/offers?type=sent', { headers: buildAuthHeaders(), credentials: 'include' }),
      ])
      const dataReceived = await resReceived.json()
      const dataSent = await resSent.json()
      if (dataReceived.success) setMyOffersReceived(dataReceived.data || [])
      if (dataSent.success) setMyOffersSent(dataSent.data || [])
    } catch {
      // Non-blocking
    } finally {
      setLoadingOffers(false)
    }
  }, [user])

  useEffect(() => {
    if (activeTab === 1) fetchUserOffers()
  }, [activeTab, fetchUserOffers])

  // Handle Image Upload for Sell Form
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const base64 = await fileToBase64DataUrl(file)
      const res = await uploadBase64Image(base64, file.name, 'second-hand')
      if (res.success && res.url) {
        setSellForm(prev => ({ ...prev, images: [...prev.images, res.url] }))
        toast.success('Photo uploaded!')
      } else {
        toast.error(res.error || 'Failed to upload photo')
      }
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  // Submit New 2nd Hand Listing
  const handleCreateListing = async () => {
    if (!sellForm.title.trim() || !sellForm.price) {
      toast.error('Title and asking price are required')
      return
    }

    try {
      setSavingItem(true)
      const res = await fetch('/api/second-hand', {
        method: 'POST',
        headers: buildAuthHeaders(true),
        credentials: 'include',
        body: JSON.stringify(sellForm),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Your second-hand item has been listed successfully!')
        setOpenSellModal(false)
        setSellForm({
          title: '',
          description: '',
          category: 'Electronics & Gadgets',
          condition: 'LIKE_NEW',
          price: '',
          originalPrice: '',
          minOfferPrice: '',
          images: [],
          city: 'Lahore',
          location: '',
          contactPhone: user?.phoneNumber || '',
        })
        fetchItems()
      } else {
        toast.error(data.error || 'Failed to publish listing')
      }
    } catch (err) {
      toast.error('Error listing item: ' + err.message)
    } finally {
      setSavingItem(false)
    }
  }

  // Open Offer Dialog
  const openMakeOfferDialog = (item) => {
    if (!user) {
      toast.error('Please log in to make an offer')
      return
    }
    setOfferItem(item)
    // Suggest 15% discount
    const suggested = Math.round(Number(item.price) * 0.85)
    setOfferPrice(String(suggested))
    setOfferMessage('')
  }

  // Submit Buyer Offer
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
        toast.success('Offer submitted! The seller will be notified.')
        setOfferItem(null)
      } else {
        toast.error(data.error || 'Failed to submit offer')
      }
    } catch (err) {
      toast.error('Error submitting offer: ' + err.message)
    } finally {
      setSubmittingOffer(false)
    }
  }

  // Seller responds to offer (Accept, Reject, Counter)
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
        fetchUserOffers()
      } else {
        toast.error(data.error || 'Action failed')
      }
    } catch (err) {
      toast.error('Error updating offer: ' + err.message)
    }
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* ─── HERO MARKETPLACE HEADER ─── */}
      <Card
        sx={{
          mb: 3.5,
          borderRadius: 3.5,
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #064E3B 100%)',
          color: '#fff',
          p: { xs: 3, sm: 4 },
          boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <div>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <AutorenewIcon sx={{ color: '#34D399', fontSize: 32 }} />
              <Typography variant="h5" fontWeight={900}>
                Martzona Pre-Loved & 2nd Hand Marketplace
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
              Buy and sell directly with fellow customers & verified merchants. Propose offers and negotiate real deals!
            </Typography>
          </div>

          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setOpenSellModal(true)}
            sx={{
              bgcolor: '#10B981',
              color: '#fff',
              fontWeight: 800,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            + Sell Your 2nd Hand Item
          </Button>
        </Box>
      </Card>

      {/* ─── TABS: BROWSE vs MY LISTINGS & OFFERS ─── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 800, textTransform: 'none', fontSize: '0.95rem' },
            '& .Mui-selected': { color: `${BRAND} !important` },
          }}
          TabIndicatorProps={{ style: { backgroundColor: BRAND, height: 3 } }}
        >
          <Tab icon={<StorefrontIcon />} iconPosition="start" label="Browse Used Items" />
          <Tab icon={<HandshakeIcon />} iconPosition="start" label="My Offers & Negotiation Hub" />
        </Tabs>
      </Box>

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 0: BROWSE MARKETPLACE
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 0 && (
        <Box>
          {/* Search & Category Filter Bar */}
          <Card sx={{ p: 2, mb: 3, borderRadius: 2.5, border: '1px solid #E2E8F0' }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search 2nd hand laptops, bikes, furniture..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#94A3B8' }} /></InputAdornment>,
                  }}
                />
              </Grid>

              <Grid item xs={6} sm={4}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6} sm={3}>
                <FormControl fullWidth size="small">
                  <Select
                    value={selectedCondition}
                    onChange={e => setSelectedCondition(e.target.value)}
                  >
                    {CONDITIONS.map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Card>

          {/* Items Grid */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: BRAND }} />
            </Box>
          ) : items.length === 0 ? (
            <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1' }}>
              <LocalOfferIcon sx={{ fontSize: 44, color: '#94A3B8', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} color="#334155">
                No second-hand items found
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Be the first to list a pre-loved item and start receiving offers from buyers!
              </Typography>
              <Button
                variant="contained"
                onClick={() => setOpenSellModal(true)}
                sx={{ bgcolor: BRAND, textTransform: 'none', fontWeight: 700 }}
              >
                + List an Item Now
              </Button>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {items.map((item) => {
                let parsedImages = []
                try {
                  parsedImages = JSON.parse(item.images || '[]')
                } catch {
                  parsedImages = []
                }
                const firstImage = parsedImages[0] || 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500'

                const conditionObj = CONDITIONS.find(c => c.id === item.condition)

                return (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                    <Card
                      sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.09)' },
                      }}
                    >
                      <div>
                        {/* Image & Condition Tag */}
                        <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1.2/1', bgcolor: '#F1F5F9' }}>
                          <img
                            src={firstImage}
                            alt={item.title}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                          <Chip
                            label={conditionObj?.label || item.condition}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 10,
                              left: 10,
                              bgcolor: 'rgba(15,23,42,0.85)',
                              backdropFilter: 'blur(4px)',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                            }}
                          />
                          <Chip
                            label={item.sellerType === 'MERCHANT' ? 'Verified Merchant' : 'Customer Seller'}
                            size="small"
                            sx={{
                              position: 'absolute',
                              bottom: 10,
                              right: 10,
                              bgcolor: item.sellerType === 'MERCHANT' ? '#10B981' : '#3B82F6',
                              color: '#fff',
                              fontWeight: 800,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Box>

                        <CardContent sx={{ p: 2 }}>
                          <Typography variant="subtitle1" fontWeight={800} color="#0F172A" noWrap title={item.title}>
                            {item.title}
                          </Typography>

                          {/* Price & Original Retail */}
                          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, my: 0.8 }}>
                            <Typography variant="h6" fontWeight={900} sx={{ color: BRAND }}>
                              Rs. {Number(item.price).toLocaleString()}
                            </Typography>
                            {item.originalPrice && (
                              <Typography variant="caption" sx={{ textDecoration: 'line-through', color: '#94A3B8' }}>
                                Rs. {Number(item.originalPrice).toLocaleString()}
                              </Typography>
                            )}
                          </Box>

                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, minHeight: 32 }} className="line-clamp-2">
                            {item.description || 'No description provided'}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B' }}>
                            <LocationOnIcon sx={{ fontSize: 14 }} />
                            <Typography variant="caption" noWrap>
                              {item.city} {item.location ? `• ${item.location}` : ''}
                            </Typography>
                          </Box>
                        </CardContent>
                      </div>

                      {/* Action buttons */}
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          startIcon={<LocalOfferIcon />}
                          onClick={() => openMakeOfferDialog(item)}
                          sx={{
                            bgcolor: BRAND,
                            color: '#fff',
                            fontWeight: 800,
                            textTransform: 'none',
                            py: 1,
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(57,119,42,0.25)',
                            '&:hover': { bgcolor: '#2d5e21' },
                          }}
                        >
                          Make an Offer
                        </Button>
                      </Box>
                    </Card>
                  </Grid>
                )
              })}
            </Grid>
          )}
        </Box>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          TAB 1: USER HUB (MY OFFERS RECEIVED & SENT)
      ═══════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3.5}>
            {/* OFFERS RECEIVED ON MY ITEMS */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
                <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ mb: 2 }}>
                  Offers Received on My Items ({myOffersReceived.length})
                </Typography>

                {myOffersReceived.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      No offers received on your items yet.
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {myOffersReceived.map(offer => (
                      <Card key={offer.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800} color="#0F172A" noWrap sx={{ maxWidth: 220 }}>
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

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1 }}>
                          <div>
                            <Typography variant="caption" color="text.secondary">Asking: Rs. {Number(offer.item?.price).toLocaleString()}</Typography>
                            <Typography variant="h6" fontWeight={900} color="#16A34A">
                              Buyer Offer: Rs. {Number(offer.offerPrice).toLocaleString()}
                            </Typography>
                          </div>
                          <Typography variant="caption" color="text.secondary">
                            By {offer.buyer?.name || 'Customer'}
                          </Typography>
                        </Box>

                        {offer.message && (
                          <Typography variant="caption" sx={{ display: 'block', p: 1, bgcolor: '#fff', borderRadius: 1, mb: 1.5 }}>
                            "{offer.message}"
                          </Typography>
                        )}

                        {offer.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOfferAction(offer.id, 'ACCEPT')}
                              sx={{ bgcolor: '#16A34A', color: '#fff', fontWeight: 700, textTransform: 'none', flex: 1, '&:hover': { bgcolor: '#15803d' } }}
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
                              sx={{ borderColor: BRAND, color: BRAND, fontWeight: 700, textTransform: 'none', flex: 1 }}
                            >
                              Counter
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
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#ECFDF5', borderRadius: 1.5 }}>
                            <Typography variant="caption" fontWeight={700} color="#065F46">
                              Buyer Contact: {offer.buyer.phoneNumber}
                            </Typography>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>

            {/* OFFERS I HAVE SENT */}
            <Grid item xs={12} md={6}>
              <Card sx={{ p: 2.5, borderRadius: 3, border: '1px solid #E2E8F0', height: '100%' }}>
                <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ mb: 2 }}>
                  Offers I Have Made ({myOffersSent.length})
                </Typography>

                {myOffersSent.length === 0 ? (
                  <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#F8FAFC', borderRadius: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      You haven't made any offers yet. Browse items and submit an offer!
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {myOffersSent.map(offer => (
                      <Card key={offer.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight={800} color="#0F172A" noWrap sx={{ maxWidth: 220 }}>
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

                        <Box sx={{ my: 1 }}>
                          <Typography variant="body2" fontWeight={800}>
                            My Offer: <span style={{ color: BRAND }}>Rs. {Number(offer.offerPrice).toLocaleString()}</span>
                          </Typography>
                          {offer.counterPrice && (
                            <Typography variant="body2" fontWeight={800} sx={{ color: '#7C3AED', mt: 0.5 }}>
                              Seller Countered: Rs. {Number(offer.counterPrice).toLocaleString()}
                            </Typography>
                          )}
                        </Box>

                        {/* Buyer action on counter-offer */}
                        {offer.status === 'COUNTERED' && (
                          <Box sx={{ display: 'flex', gap: 1, mt: 1.5 }}>
                            <Button
                              variant="contained"
                              size="small"
                              onClick={() => handleOfferAction(offer.id, 'ACCEPT_COUNTER')}
                              sx={{ bgcolor: '#7C3AED', color: '#fff', fontWeight: 700, textTransform: 'none', flex: 1 }}
                            >
                              Accept Counter (Rs. {Number(offer.counterPrice).toLocaleString()})
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => handleOfferAction(offer.id, 'CANCEL')}
                              sx={{ color: '#64748B', textTransform: 'none' }}
                            >
                              Cancel
                            </Button>
                          </Box>
                        )}

                        {offer.status === 'ACCEPTED' && offer.item?.seller?.phoneNumber && (
                          <Box sx={{ mt: 1, p: 1, bgcolor: '#ECFDF5', borderRadius: 1.5 }}>
                            <Typography variant="caption" fontWeight={700} color="#065F46">
                              Seller Phone: {offer.item.seller.phoneNumber}
                            </Typography>
                          </Box>
                        )}
                      </Card>
                    ))}
                  </Stack>
                )}
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* ─── MAKE AN OFFER MODAL ─── */}
      <Dialog open={Boolean(offerItem)} onClose={() => setOfferItem(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>
          Make an Offer to Seller
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                {offerItem?.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Asking Price: <strong>Rs. {Number(offerItem?.price || 0).toLocaleString()}</strong>
              </Typography>
            </Box>

            {/* Quick % Discounts */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                QUICK OFFER DISCOUNTS
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
                      sx={{ fontWeight: 700, fontSize: '0.7rem' }}
                    />
                  )
                })}
              </Stack>
            </Box>

            <TextField
              fullWidth
              label="Your Offer Price (Rs.)"
              type="number"
              value={offerPrice}
              onChange={e => setOfferPrice(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">Rs.</InputAdornment>,
                sx: { fontWeight: 800, fontSize: '1.1rem' },
              }}
            />

            <TextField
              fullWidth
              multiline
              rows={2}
              label="Optional Note to Seller"
              placeholder="e.g. Can pick up today, cash in hand"
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
            sx={{ bgcolor: BRAND, fontWeight: 700, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#2d5e21' } }}
          >
            {submittingOffer ? 'Submitting...' : 'Send Offer to Seller'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── SELL 2ND HAND ITEM MODAL ─── */}
      <Dialog open={openSellModal} onClose={() => setOpenSellModal(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>List a 2nd Hand / Used Item</span>
          <IconButton size="small" onClick={() => setOpenSellModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Photos upload */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="#64748B" sx={{ display: 'block', mb: 1 }}>
                ITEM PHOTOS (UPLOAD AT LEAST ONE PHOTO)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                {sellForm.images.map((img, i) => (
                  <Box key={i} sx={{ width: 72, height: 72, borderRadius: 2, overflow: 'hidden', border: '1px solid #CBD5E1' }}>
                    <img src={img} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </Box>
                ))}
                <Button
                  variant="outlined"
                  component="label"
                  disabled={uploadingImage}
                  startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  sx={{ height: 72, px: 2, borderRadius: 2, textTransform: 'none', borderColor: '#CBD5E1', color: '#475569' }}
                >
                  {uploadingImage ? 'Uploading...' : '+ Add Photo'}
                  <input type="file" accept="image/*" hidden onChange={handleImageUpload} />
                </Button>
              </Box>
            </Box>

            <TextField
              fullWidth
              label="Item Title"
              placeholder="e.g. iPhone 13 Pro 128GB Sierra Blue (PTA Approved)"
              value={sellForm.title}
              onChange={e => setSellForm(prev => ({ ...prev, title: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={sellForm.category}
                    label="Category"
                    onChange={e => setSellForm(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={sellForm.condition}
                    label="Condition"
                    onChange={e => setSellForm(prev => ({ ...prev, condition: e.target.value }))}
                  >
                    {CONDITIONS.filter(c => c.id !== 'ALL').map(c => (
                      <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Asking Price (Rs.)"
                  value={sellForm.price}
                  onChange={e => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Original Retail Price (Optional)"
                  value={sellForm.originalPrice}
                  onChange={e => setSellForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description & Specifications"
              placeholder="Describe flaws, battery health, original accessories included, etc."
              value={sellForm.description}
              onChange={e => setSellForm(prev => ({ ...prev, description: e.target.value }))}
            />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="City"
                  value={sellForm.city}
                  onChange={e => setSellForm(prev => ({ ...prev, city: e.target.value }))}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Area / Neighborhood"
                  placeholder="e.g. DHA Phase 5"
                  value={sellForm.location}
                  onChange={e => setSellForm(prev => ({ ...prev, location: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setOpenSellModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateListing}
            disabled={savingItem}
            sx={{ bgcolor: BRAND, fontWeight: 800, textTransform: 'none', px: 3, '&:hover': { bgcolor: '#2d5e21' } }}
          >
            {savingItem ? 'Publishing...' : 'Publish Listing'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── COUNTER OFFER DIALOG ─── */}
      <Dialog open={Boolean(counterModalOffer)} onClose={() => setCounterModalOffer(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800 }}>Send Counter-Offer</DialogTitle>
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
            sx={{ bgcolor: BRAND, fontWeight: 700, textTransform: 'none', '&:hover': { bgcolor: '#2d5e21' } }}
          >
            Send Counter
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
