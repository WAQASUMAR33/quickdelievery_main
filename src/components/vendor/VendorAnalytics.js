'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authFetch } from '@/lib/apiClient'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Avatar from '@mui/material/Avatar'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import InputAdornment from '@mui/material/InputAdornment'
import Alert from '@mui/material/Alert'
import Stack from '@mui/material/Stack'

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import SearchIcon from '@mui/icons-material/Search'
import RefreshIcon from '@mui/icons-material/Refresh'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AccessTimeIcon from '@mui/icons-material/AccessTime'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import StarIcon from '@mui/icons-material/Star'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import RestaurantIcon from '@mui/icons-material/Restaurant'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined'
import { isRestaurantVendor } from '@/lib/vendorHelpers'

const BRAND = '#D70F64'
const BRAND_DARK = '#C20E5A'
const BRAND_LIGHT = '#FFF0F5'
const BRAND_MUTED = 'rgba(215, 15, 100, 0.08)'

export default function VendorAnalytics({ vendorId }) {
  const router = useRouter()
  const { userData } = useAuth()

  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [businessProfile, setBusinessProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL')
  const [isOpenForOrders, setIsOpenForOrders] = useState(true)

  const activeVendorUid = vendorId || userData?.uid
  const isRestaurant = isRestaurantVendor(userData, businessProfile)

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!activeVendorUid) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)

    try {
      // 1. Fetch products
      const prodRes = await authFetch(`/api/products?type=products&vendorId=${activeVendorUid}`)
      const prodData = await prodRes.json()
      if (prodData.success) {
        setProducts(prodData.data || [])
      }

      // 2. Fetch vendor orders
      const orderRes = await authFetch(`/api/orders?vendorId=${activeVendorUid}&limit=50`)
      const orderData = await orderRes.json()
      if (orderData.success) {
        setOrders(orderData.data || [])
      }

      // 3. Fetch business profile
      if (userData?.email) {
        const profRes = await authFetch(`/api/vendor/profile?email=${encodeURIComponent(userData.email)}`)
        const profData = await profRes.json()
        if (profData.success && profData.data) {
          setBusinessProfile(profData.data)
        }
      }
    } catch (e) {
      console.error('Error loading vendor dashboard data:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeVendorUid, userData?.email])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Computed metrics
  const approvedProducts = useMemo(() => products.filter(p => p.approvalStatus === 'Approved'), [products])
  const pendingProducts = useMemo(() => products.filter(p => p.approvalStatus === 'Pending'), [products])
  const rejectedProducts = useMemo(() => products.filter(p => p.approvalStatus === 'Rejected'), [products])
  const lowStockProducts = useMemo(() => products.filter(p => (p.stock || 0) <= 5 && (p.stock || 0) > 0), [products])
  const outOfStockProducts = useMemo(() => products.filter(p => (p.stock || 0) === 0), [products])

  const pendingOrders = useMemo(() => orders.filter(o => o.status === 'PENDING'), [orders])
  const processingOrders = useMemo(() => orders.filter(o => o.status === 'PROCESSING'), [orders])
  const shippedOrders = useMemo(() => orders.filter(o => o.status === 'SHIPPED'), [orders])
  const deliveredOrders = useMemo(() => orders.filter(o => o.status === 'DELIVERED'), [orders])

  // Today's metrics
  const todayOrders = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return orders.filter(o => o.createdAt && new Date(o.createdAt) >= today)
  }, [orders])

  const todayRevenue = useMemo(() => {
    return todayOrders
      .filter(o => o.status === 'DELIVERED')
      .reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)
  }, [todayOrders])

  // Total sales revenue from DELIVERED orders
  const totalRevenue = useMemo(() => {
    const deliveredRev = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)
    if (deliveredRev > 0) return deliveredRev
    // Fallback if no delivered orders yet: estimate inventory value
    return products.reduce((sum, p) => sum + parseFloat(p.price || 0) * (p.stock || 0), 0)
  }, [deliveredOrders, products])

  const averageOrderValue = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'CANCELLED')
    if (!validOrders.length) return 0
    const sum = validOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)
    return sum / validOrders.length
  }, [orders])

  const approvalRate = products.length ? Math.round((approvedProducts.length / products.length) * 100) : 0

  // Top products by price / popularity
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0))
      .slice(0, 4)
  }, [products])

  // Filtered orders table list
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter
      const searchLower = orderSearch.toLowerCase().trim()
      if (!searchLower) return matchesStatus
      const idMatch = String(o.id).includes(searchLower)
      const trackingMatch = o.trackingNumber?.toLowerCase().includes(searchLower)
      const userMatch = (o.user?.username || o.user?.email || '').toLowerCase().includes(searchLower)
      return matchesStatus && (idMatch || trackingMatch || userMatch)
    })
  }, [orders, orderStatusFilter, orderSearch])

  // Status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'DELIVERED': return { color: '#059669', bg: '#ecfdf5', label: 'Delivered' }
      case 'PROCESSING': return { color: '#2563eb', bg: '#eff6ff', label: 'In Kitchen' }
      case 'SHIPPED': return { color: '#7c3aed', bg: '#f5f3ff', label: 'Out for Delivery' }
      case 'PENDING': return { color: '#d97706', bg: '#fffbeb', label: 'Action Required' }
      case 'CANCELLED': return { color: '#dc2626', bg: '#fef2f2', label: 'Cancelled' }
      default: return { color: '#64748b', bg: '#f8fafc', label: status }
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 450, flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: BRAND }} />
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Loading your store portal…
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 6, maxWidth: 1400, mx: 'auto' }}>
      {/* ════════════════════════ 1. EXECUTIVE STORE HEADER ════════════════════════ */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          borderRadius: '24px',
          bgcolor: '#ffffff',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${BRAND} 0%, #FF2E93 100%)`,
          },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2.5,
          }}
        >
          {/* Left: Store Identity, Avatar & Operational Badges */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar
              src={businessProfile?.urlLogo || null}
              sx={{
                width: 68,
                height: 68,
                borderRadius: '18px',
                bgcolor: BRAND,
                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 900,
                boxShadow: '0 8px 20px rgba(215, 15, 100, 0.28)',
                border: '2px solid #ffffff',
              }}
            >
              {businessProfile?.businessName?.[0] || userData?.username?.[0] || 'V'}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
                  {businessProfile?.businessName || userData?.username || 'Store Partner'}
                </Typography>

                {businessProfile?.verificationStatus === 'APPROVED' ? (
                  <Chip
                    icon={<CheckCircleIcon sx={{ fontSize: '15px !important', color: '#059669' }} />}
                    label="Verified Merchant"
                    size="small"
                    sx={{ bgcolor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', fontWeight: 800, fontSize: 11.5, borderRadius: '8px' }}
                  />
                ) : (
                  <Chip
                    label="Partner Store"
                    size="small"
                    sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 11.5, borderRadius: '8px' }}
                  />
                )}

                {/* Live Store Radar Switch */}
                <Tooltip title="Click to toggle store availability for incoming orders">
                  <Chip
                    icon={
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: isOpenForOrders ? '#10b981' : '#ef4444',
                          boxShadow: isOpenForOrders ? '0 0 10px #10b981' : 'none',
                          animation: isOpenForOrders ? 'pulse 2s infinite' : 'none',
                          '@keyframes pulse': {
                            '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                            '70%': { transform: 'scale(1)', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
                            '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
                          }
                        }}
                      />
                    }
                    label={isOpenForOrders ? 'Taking Orders' : 'Store Paused'}
                    size="small"
                    onClick={() => setIsOpenForOrders(!isOpenForOrders)}
                    sx={{
                      bgcolor: isOpenForOrders ? '#ecfdf5' : '#fef2f2',
                      color: isOpenForOrders ? '#059669' : '#dc2626',
                      border: isOpenForOrders ? '1px solid #a7f3d0' : '1px solid #fecaca',
                      fontWeight: 800,
                      fontSize: 12,
                      cursor: 'pointer',
                      borderRadius: '8px',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isOpenForOrders ? '#d1fae5' : '#fee2e2',
                      },
                    }}
                  />
                </Tooltip>
              </Box>

              <Box sx={{ mt: 0.75, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {businessProfile?.category?.name && (
                  <Chip
                    icon={<FastfoodOutlinedIcon sx={{ fontSize: '14px !important', color: BRAND }} />}
                    label={businessProfile.category.name}
                    size="small"
                    sx={{ bgcolor: BRAND_LIGHT, color: BRAND, fontWeight: 700, fontSize: 11, borderRadius: '6px' }}
                  />
                )}
                {businessProfile?.city && (
                  <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 16, color: '#64748b' }} /> {businessProfile.city}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" fontWeight={500}>
                  • <strong>{products.length}</strong> {isRestaurant ? 'menu items' : 'products'} • <strong>{orders.length}</strong> total orders
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Right: Operational Actions Group */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Tooltip title="Refresh dashboard data">
              <IconButton
                onClick={() => fetchData(true)}
                disabled={refreshing}
                sx={{
                  bgcolor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  color: '#475569',
                  borderRadius: '12px',
                  p: 1.1,
                  '&:hover': { bgcolor: '#f1f5f9', color: '#0f172a' },
                }}
              >
                <RefreshIcon sx={{ fontSize: 20, animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>

            <Button
              variant="outlined"
              startIcon={<LocalOfferOutlinedIcon sx={{ color: BRAND }} />}
              onClick={() => router.push('/vendor/dashboard/deals')}
              sx={{
                borderColor: '#e2e8f0',
                color: '#334155',
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
                py: 0.9,
                fontSize: 13,
                '&:hover': { borderColor: BRAND, bgcolor: BRAND_LIGHT, color: BRAND },
              }}
            >
              Create Promo
            </Button>

            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => router.push('/admin/dashboard/products/add')}
              sx={{
                bgcolor: BRAND,
                background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)`,
                color: '#ffffff',
                fontWeight: 800,
                borderRadius: '12px',
                px: 2.75,
                py: 0.9,
                fontSize: 13,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(215, 15, 100, 0.35)',
                '&:hover': { background: `linear-gradient(135deg, ${BRAND_DARK} 0%, #9e0b48 100%)`, boxShadow: '0 6px 18px rgba(215, 15, 100, 0.45)' },
              }}
            >
              Add New
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* ════════════════════════ ATTENTION ALERTS (IF ANY) ════════════════════════ */}
      {(pendingOrders.length > 0 || lowStockProducts.length > 0) && (
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {pendingOrders.length > 0 && (
            <Alert
              severity="warning"
              icon={<AccessTimeIcon sx={{ color: '#d97706' }} />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/orders/new')}
                  sx={{ fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                >
                  Process ({pendingOrders.length})
                </Button>
              }
              sx={{
                borderRadius: '16px',
                bgcolor: '#fffbeb',
                borderColor: '#fde68a',
                border: '1px solid',
                '& .MuiAlert-message': { fontWeight: 700, color: '#92400e' },
              }}
            >
              Action Required: You have {pendingOrders.length} pending customer order{pendingOrders.length > 1 ? 's' : ''} awaiting {isRestaurant ? 'kitchen' : 'store'} confirmation!
            </Alert>
          )}

          {lowStockProducts.length > 0 && (
            <Alert
              severity="info"
              icon={<WarningAmberIcon sx={{ color: '#0284c7' }} />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/products')}
                  sx={{ fontWeight: 800, textTransform: 'none', borderRadius: '10px' }}
                >
                  Manage Stock
                </Button>
              }
              sx={{
                borderRadius: '16px',
                bgcolor: '#f0f9ff',
                borderColor: '#bae6fd',
                border: '1px solid',
                '& .MuiAlert-message': { fontWeight: 600, color: '#0369a1' },
              }}
            >
              {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's are' : ' is'} running low on inventory (&le; 5 left in stock).
            </Alert>
          )}
        </Box>
      )}

      {/* ════════════════════════ 2. PRIMARY KPI METRICS ROW ════════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Card 1: Delivered Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.75,
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.05)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '14px',
                  bgcolor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AttachMoneyIcon sx={{ fontSize: 26 }} />
              </Box>
              <Chip
                label={todayRevenue > 0 ? `+Rs. ${todayRevenue.toLocaleString()} today` : 'Delivered'}
                size="small"
                sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 800, fontSize: 11, borderRadius: '8px' }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
              PKR {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
              Total Delivered Revenue
            </Typography>
          </Card>
        </Grid>

        {/* Card 2: Total Orders */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.75,
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.05)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '14px',
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBagOutlinedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip
                label={`${orders.length} total`}
                size="small"
                sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 800, fontSize: 11, borderRadius: '8px' }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
              {orders.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
              Orders ({deliveredOrders.length} Completed)
            </Typography>
          </Card>
        </Grid>

        {/* Card 3: Menu Catalog */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.75,
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.05)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '14px',
                  bgcolor: BRAND_LIGHT,
                  color: BRAND,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Inventory2OutlinedIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip
                label={`${approvalRate}% Live`}
                size="small"
                sx={{ bgcolor: BRAND_LIGHT, color: BRAND, fontWeight: 800, fontSize: 11, borderRadius: '8px' }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
              {products.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
              {isRestaurant ? 'Menu Dishes' : 'Products'} ({approvedProducts.length} Active)
            </Typography>
          </Card>
        </Grid>

        {/* Card 4: Average Order Ticket */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.75,
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)',
              transition: 'all 0.2s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.05)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: '14px',
                  bgcolor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptLongIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip
                label="Avg Basket"
                size="small"
                sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 800, fontSize: 11, borderRadius: '8px' }}
              />
            </Box>
            <Typography variant="h4" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.5 }}>
              PKR {averageOrderValue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={600} mt={0.5}>
              Average Ticket Size
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ════════════════════════ 3. BALANCED 2-COLUMN WORKSPACE ════════════════════════ */}
      <Grid container spacing={3}>
        {/* ── LEFT COLUMN (66%): Live Kitchen Queue & Top Dishes ── */}
        <Grid item xs={12} lg={8}>
          {/* Live Kitchen Queue */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '22px', mb: 3, bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                    Live Kitchen Queue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incoming customer tickets &amp; order dispatch
                  </Typography>
                </Box>

                {/* Filter Tabs */}
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                  {[
                    { id: 'ALL', label: 'All', count: orders.length },
                    { id: 'PENDING', label: 'Action Needed', count: pendingOrders.length, alert: pendingOrders.length > 0 },
                    { id: 'PROCESSING', label: 'In Kitchen', count: processingOrders.length },
                    { id: 'DELIVERED', label: 'Completed', count: deliveredOrders.length },
                  ].map((tab) => {
                    const isActive = orderStatusFilter === tab.id
                    return (
                      <Chip
                        key={tab.id}
                        label={`${tab.label} (${tab.count})`}
                        size="small"
                        onClick={() => setOrderStatusFilter(tab.id)}
                        sx={{
                          fontWeight: 800,
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: '10px',
                          px: 0.5,
                          py: 1.8,
                          bgcolor: isActive
                            ? (tab.alert ? '#d97706' : BRAND)
                            : (tab.alert ? '#fef3c7' : '#f1f5f9'),
                          color: isActive
                            ? '#ffffff'
                            : (tab.alert ? '#92400e' : '#475569'),
                          '&:hover': {
                            bgcolor: isActive
                              ? (tab.alert ? '#b45309' : BRAND_DARK)
                              : '#e2e8f0',
                          },
                        }}
                      />
                    )
                  })}
                </Stack>
              </Box>

              {/* Fast Search Input */}
              <TextField
                fullWidth
                size="small"
                placeholder="Search by Order ID, tracking number, or customer name…"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2.5,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    bgcolor: '#f8fafc',
                    borderColor: '#e2e8f0',
                  }
                }}
              />

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: '#f8fafc',
                      color: 'text.disabled',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                    }}
                  >
                    <ShoppingBagOutlinedIcon sx={{ fontSize: 32 }} />
                  </Box>
                  <Typography variant="subtitle1" fontWeight={800} color="#334155">
                    No orders in this queue
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Incoming customer tickets will automatically show up here.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #f1f5f9', borderRadius: '16px', overflow: 'hidden' }}>
                  <Table size="medium">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>ORDER</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>CUSTOMER</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>ITEMS</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>AMOUNT</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>STATUS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: 11.5, py: 1.5, color: '#475569' }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrders.slice(0, 6).map((order) => {
                        const statusConfig = getStatusColor(order.status)
                        const itemCount = order.orderItems?.length || 0
                        const firstItemName = order.orderItems?.[0]?.product?.proName || 'Store Item'

                        return (
                          <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 800, color: BRAND }}>
                              #{order.id}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={700} color="#0f172a">
                                {order.user?.username || 'Customer'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                                {firstItemName} {itemCount > 1 ? `+${itemCount - 1} more` : ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: '#0f172a' }}>
                              Rs. {parseFloat(order.totalAmount || 0).toLocaleString()}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusConfig.label}
                                size="small"
                                sx={{
                                  bgcolor: statusConfig.bg,
                                  color: statusConfig.color,
                                  fontWeight: 800,
                                  fontSize: 11,
                                  borderRadius: '8px',
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => router.push(`/vendor/dashboard/orders/new`)}
                                sx={{
                                  borderColor: '#e2e8f0',
                                  color: '#0f172a',
                                  borderRadius: '8px',
                                  textTransform: 'none',
                                  fontWeight: 700,
                                  px: 1.5,
                                  py: 0.4,
                                  fontSize: 12,
                                  '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: BRAND_LIGHT },
                                }}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {filteredOrders.length > 6 && (
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Button
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/vendor/dashboard/orders/history')}
                    sx={{ textTransform: 'none', fontWeight: 800, color: BRAND }}
                  >
                    View All {orders.length} Orders in History
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Top Menu Products */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '22px', bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <StarIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                    Top Menu Products
                  </Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/products')}
                  sx={{ textTransform: 'none', fontWeight: 800, color: BRAND }}
                >
                  Manage Menu ({products.length})
                </Button>
              </Box>

              {topProducts.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="text.secondary" variant="body2" mb={1.5}>
                    No products added yet. Start building your store menu.
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    startIcon={<AddCircleOutlineIcon />}
                    onClick={() => router.push('/vendor/dashboard/products')}
                    sx={{ bgcolor: BRAND, textTransform: 'none', fontWeight: 700, borderRadius: '10px' }}
                  >
                    Add Product
                  </Button>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {topProducts.map((p) => (
                    <Grid item xs={12} sm={6} key={p.proId}>
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '16px',
                          border: '1px solid #f1f5f9',
                          bgcolor: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          transition: 'all 0.15s ease',
                          '&:hover': { bgcolor: '#ffffff', borderColor: BRAND, boxShadow: '0 6px 18px rgba(0,0,0,0.04)' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '12px',
                            overflow: 'hidden',
                            flexShrink: 0,
                            bgcolor: '#ffffff',
                            border: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {p.proImages?.[0] ? (
                            <img src={p.proImages[0]} alt={p.proName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <RestaurantIcon sx={{ color: 'text.disabled', fontSize: 24 }} />
                          )}
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={800} color="#0f172a" noWrap>
                            {p.proName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {p.category?.name || 'Item'} • Stock: <strong>{p.stock || 0}</strong>
                          </Typography>
                          <Typography variant="body2" fontWeight={900} color={BRAND} mt={0.25}>
                            Rs. {parseFloat(p.price || 0).toLocaleString()}
                            {parseFloat(p.discount || 0) > 0 && (
                              <Typography component="span" variant="caption" sx={{ color: 'error.main', ml: 1, fontWeight: 800 }}>
                                {p.discount}% OFF
                              </Typography>
                            )}
                          </Typography>
                        </Box>

                        <Chip
                          label={p.approvalStatus}
                          size="small"
                          sx={{
                            fontSize: 10.5,
                            fontWeight: 800,
                            borderRadius: '6px',
                            bgcolor: p.approvalStatus === 'Approved' ? '#ecfdf5' : p.approvalStatus === 'Pending' ? '#fffbeb' : '#fef2f2',
                            color: p.approvalStatus === 'Approved' ? '#059669' : p.approvalStatus === 'Pending' ? '#d97706' : '#dc2626',
                          }}
                        />
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── RIGHT COLUMN (34%): Catalog Health, Shortcuts & Store Overview ── */}
        <Grid item xs={12} lg={4}>
          {/* Catalog Approval Status Breakdown */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '22px', mb: 3, bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                Catalog Health &amp; Approval
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Admin review status for menu items
              </Typography>

              {[
                { label: 'Approved & Live', count: approvedProducts.length, color: '#10b981', bg: '#ecfdf5' },
                { label: 'Under Review', count: pendingProducts.length, color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Edits Needed', count: rejectedProducts.length, color: '#ef4444', bg: '#fef2f2' },
              ].map(({ label, count, color, bg }) => (
                <Box key={label} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: color, borderRadius: '50%' }} />
                      <Typography variant="body2" fontWeight={700} color="#334155">{label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={800} color={color}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={products.length ? (count / products.length) * 100 : 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      bgcolor: bg,
                      '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 4 },
                    }}
                  />
                </Box>
              ))}

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">Approval Rate</Typography>
                  <Typography variant="h6" fontWeight={900} color="success.main">{approvalRate}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">Out of Stock</Typography>
                  <Typography variant="h6" fontWeight={900} color="error.main">{outOfStockProducts.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} display="block">Low Stock (&le;5)</Typography>
                  <Typography variant="h6" fontWeight={900} color="warning.main">{lowStockProducts.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Quick Operations 2x2 Grid */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '22px', mb: 3, bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                Store Shortcuts
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Quick access to store operations
              </Typography>

              <Grid container spacing={1.5}>
                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/vendor/dashboard/products')}
                    sx={{
                      flexDirection: 'column',
                      py: 2,
                      px: 1,
                      borderRadius: '16px',
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      bgcolor: '#f8fafc',
                      color: '#0f172a',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: BRAND_LIGHT, borderColor: BRAND, color: BRAND, transform: 'translateY(-2px)' },
                    }}
                  >
                    <Inventory2OutlinedIcon sx={{ color: BRAND, fontSize: 26, mb: 0.75 }} />
                    <Typography variant="caption" fontWeight={800} align="center">
                      Inventory &amp; Menu
                    </Typography>
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/vendor/dashboard/deals')}
                    sx={{
                      flexDirection: 'column',
                      py: 2,
                      px: 1,
                      borderRadius: '16px',
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      bgcolor: '#f8fafc',
                      color: '#0f172a',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#fffbeb', borderColor: '#d97706', color: '#d97706', transform: 'translateY(-2px)' },
                    }}
                  >
                    <LocalOfferOutlinedIcon sx={{ color: '#d97706', fontSize: 26, mb: 0.75 }} />
                    <Typography variant="caption" fontWeight={800} align="center">
                      Deals &amp; Promos
                    </Typography>
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/vendor/dashboard/profile')}
                    sx={{
                      flexDirection: 'column',
                      py: 2,
                      px: 1,
                      borderRadius: '16px',
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      bgcolor: '#f8fafc',
                      color: '#0f172a',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb', color: '#2563eb', transform: 'translateY(-2px)' },
                    }}
                  >
                    <StorefrontIcon sx={{ color: '#2563eb', fontSize: 26, mb: 0.75 }} />
                    <Typography variant="caption" fontWeight={800} align="center">
                      Store Profile
                    </Typography>
                  </Button>
                </Grid>

                <Grid item xs={6}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => router.push('/vendor/dashboard/disputes')}
                    sx={{
                      flexDirection: 'column',
                      py: 2,
                      px: 1,
                      borderRadius: '16px',
                      textTransform: 'none',
                      borderColor: '#e2e8f0',
                      bgcolor: '#f8fafc',
                      color: '#0f172a',
                      transition: 'all 0.15s ease',
                      '&:hover': { bgcolor: '#fef2f2', borderColor: '#dc2626', color: '#dc2626', transform: 'translateY(-2px)' },
                    }}
                  >
                    <ShieldOutlinedIcon sx={{ color: '#dc2626', fontSize: 26, mb: 0.75 }} />
                    <Typography variant="caption" fontWeight={800} align="center">
                      Disputes
                    </Typography>
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Store Details Quick Overview */}
          <Card elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '22px', bgcolor: '#ffffff', boxShadow: '0 2px 12px rgba(0, 0, 0, 0.02)' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={900} color="#0f172a" sx={{ letterSpacing: -0.3 }}>
                  Store Information
                </Typography>
                <Button
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/profile')}
                  sx={{ textTransform: 'none', fontWeight: 800, color: BRAND }}
                >
                  Edit Profile
                </Button>
              </Box>

              <Stack spacing={1.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <StorefrontIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Business Name: <strong style={{ color: '#0f172a' }}>{businessProfile?.businessName || 'Test Vendor'}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <FastfoodOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    Category: <strong style={{ color: '#0f172a' }}>{businessProfile?.category?.name || 'Restaurant'}</strong>
                  </Typography>
                </Box>
                {businessProfile?.city && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      City: <strong style={{ color: '#0f172a' }}>{businessProfile.city}</strong>
                    </Typography>
                  </Box>
                )}
                {userData?.email && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 220 }}>
                      Email: <strong style={{ color: '#0f172a' }}>{userData.email}</strong>
                    </Typography>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
