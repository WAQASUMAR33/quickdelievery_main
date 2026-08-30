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

// Icons
import StorefrontIcon from '@mui/icons-material/Storefront'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
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
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'

const BRAND = '#39772A'
const BRAND_DARK = '#2d5e21'
const BRAND_LIGHT = '#eaf4e8'

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
  const cancelledOrders = useMemo(() => orders.filter(o => o.status === 'CANCELLED'), [orders])

  // Total sales revenue from DELIVERED / valid orders
  const totalRevenue = useMemo(() => {
    const deliveredRev = deliveredOrders.reduce((sum, o) => sum + parseFloat(o.totalAmount || 0), 0)
    if (deliveredRev > 0) return deliveredRev
    // Fallback: calculate estimated stock inventory value
    return products.reduce((sum, p) => sum + parseFloat(p.price || 0) * (p.stock || 0), 0)
  }, [deliveredOrders, products])

  const averageOrderValue = useMemo(() => {
    const validOrders = orders.filter(o => o.status !== 'CANCELLED')
    if (!validOrders.length) return 0
    const sum = validOrders.reduce((s, o) => s + parseFloat(o.totalAmount || 0), 0)
    return sum / validOrders.length
  }, [orders])

  const approvalRate = products.length ? Math.round((approvedProducts.length / products.length) * 100) : 0

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {}
    products.forEach(p => {
      const catName = p.category?.name || 'General'
      map[catName] = (map[catName] || 0) + 1
    })
    return Object.entries(map).sort((a, b) => b[1] - a[1])
  }, [products])

  // Top products by price / popularity
  const topProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => parseFloat(b.price || 0) - parseFloat(a.price || 0))
      .slice(0, 5)
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
      case 'DELIVERED': return { color: '#10b981', bg: '#ecfdf5', label: 'Delivered' }
      case 'PROCESSING': return { color: '#3b82f6', bg: '#eff6ff', label: 'In Kitchen' }
      case 'SHIPPED': return { color: '#8b5cf6', bg: '#f5f3ff', label: 'Out for Delivery' }
      case 'PENDING': return { color: '#f59e0b', bg: '#fffbeb', label: 'Needs Action' }
      case 'CANCELLED': return { color: '#ef4444', bg: '#fef2f2', label: 'Cancelled' }
      default: return { color: '#6b7280', bg: '#f3f4f6', label: status }
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400, flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: BRAND }} />
        <Typography variant="body1" color="text.secondary" fontWeight={500}>
          Loading your store dashboard…
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 6 }}>
      {/* ════════════════════════ TOP HERO HEADER ════════════════════════ */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          mb: 3.5,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #183d10 0%, #29571e 60%, #39772a 100%)',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(57, 119, 42, 0.2)',
        }}
      >
        {/* Subtle decorative background circle */}
        <Box
          sx={{
            position: 'absolute',
            right: -40,
            top: -40,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Avatar
              src={businessProfile?.urlLogo || null}
              sx={{
                width: { xs: 56, sm: 68 },
                height: { xs: 56, sm: 68 },
                bgcolor: 'rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                fontSize: 28,
                fontWeight: 700,
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {businessProfile?.businessName?.[0] || userData?.username?.[0] || 'V'}
            </Avatar>

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: -0.5 }}>
                  {businessProfile?.businessName || userData?.username || 'Partner Store'}
                </Typography>
                <Chip
                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: isOpenForOrders ? '#4ade80' : '#f87171' }} />}
                  label={isOpenForOrders ? 'Accepting Orders' : 'Store Offline'}
                  size="small"
                  onClick={() => setIsOpenForOrders(!isOpenForOrders)}
                  sx={{
                    bgcolor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: 11,
                    backdropFilter: 'blur(4px)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                  }}
                />
                {businessProfile?.verificationStatus === 'APPROVED' && (
                  <Chip
                    icon={<CheckCircleOutlinedIcon sx={{ fontSize: '14px !important', color: '#a7f3d0' }} />}
                    label="Verified Partner"
                    size="small"
                    sx={{ bgcolor: 'rgba(16, 185, 129, 0.2)', color: '#a7f3d0', fontWeight: 600, fontSize: 11 }}
                  />
                )}
              </Box>

              <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
                {businessProfile?.city ? `${businessProfile.city} • ` : ''}
                {products.length} catalog items • {orders.length} total orders received
              </Typography>
            </Box>
          </Box>

          {/* Header Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Tooltip title="Refresh dashboard data">
              <IconButton
                onClick={() => fetchData(true)}
                disabled={refreshing}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                }}
              >
                <RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none', '@keyframes spin': { '100%': { transform: 'rotate(360deg)' } } }} />
              </IconButton>
            </Tooltip>

            <Button
              variant="contained"
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => router.push('/vendor/dashboard/products')}
              sx={{
                bgcolor: '#ffffff',
                color: BRAND,
                fontWeight: 700,
                borderRadius: 2,
                px: 2.5,
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                '&:hover': { bgcolor: '#f0fdf4', color: BRAND_DARK },
              }}
            >
              Add New Product
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* ════════════════════════ ATTENTION ALERTS (IF ANY) ════════════════════════ */}
      {(pendingOrders.length > 0 || lowStockProducts.length > 0) && (
        <Box sx={{ mb: 3 }}>
          {pendingOrders.length > 0 && (
            <Alert
              severity="warning"
              icon={<AccessTimeIcon sx={{ color: '#d97706' }} />}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/orders/new')}
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Process Orders ({pendingOrders.length})
                </Button>
              }
              sx={{
                borderRadius: 2,
                mb: 1.5,
                bgcolor: '#fffbeb',
                borderColor: '#fde68a',
                '& .MuiAlert-message': { fontWeight: 600, color: '#92400e' },
              }}
            >
              You have {pendingOrders.length} pending order{pendingOrders.length > 1 ? 's' : ''} requiring confirmation!
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
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                >
                  Manage Stock
                </Button>
              }
              sx={{
                borderRadius: 2,
                bgcolor: '#f0f9ff',
                borderColor: '#bae6fd',
                '& .MuiAlert-message': { fontWeight: 500, color: '#0369a1' },
              }}
            >
              {lowStockProducts.length} item{lowStockProducts.length > 1 ? 's are' : ' is'} running low on inventory (&le; 5 left in stock).
            </Alert>
          )}
        </Box>
      )}

      {/* ════════════════════════ 4 PRIMARY KPI METRIC CARDS ════════════════════════ */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Card 1: Total Sales / Revenue */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: '#ffffff',
              position: 'relative',
              overflow: 'hidden',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#ecfdf5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AttachMoneyIcon sx={{ fontSize: 24 }} />
              </Box>
              <Chip
                label="Sales"
                size="small"
                sx={{ bgcolor: '#ecfdf5', color: '#059669', fontWeight: 700, fontSize: 11, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#111827">
              ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
              Total Delivered Revenue
            </Typography>
          </Card>
        </Grid>

        {/* Card 2: Orders Count */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: '#ffffff',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#eff6ff',
                  color: '#2563eb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Chip
                label={`${orders.length} total`}
                size="small"
                sx={{ bgcolor: '#eff6ff', color: '#2563eb', fontWeight: 700, fontSize: 11, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#111827">
              {orders.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
              Customer Orders ({deliveredOrders.length} Completed)
            </Typography>
          </Card>
        </Grid>

        {/* Card 3: Active Catalog */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: '#ffffff',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#f5f3ff',
                  color: '#7c3aed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Inventory2OutlinedIcon sx={{ fontSize: 22 }} />
              </Box>
              <Chip
                label={`${approvalRate}% Approved`}
                size="small"
                sx={{ bgcolor: '#f5f3ff', color: '#7c3aed', fontWeight: 700, fontSize: 11, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#111827">
              {products.length}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
              Menu Products ({approvedProducts.length} Active)
            </Typography>
          </Card>
        </Grid>

        {/* Card 4: Average Order Value */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              background: '#ffffff',
              transition: 'all 0.25s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#fffbeb',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ReceiptLongIcon sx={{ fontSize: 22 }} />
              </Box>
              <Chip
                label="Avg Ticket"
                size="small"
                sx={{ bgcolor: '#fffbeb', color: '#d97706', fontWeight: 700, fontSize: 11, borderRadius: 1 }}
              />
            </Box>
            <Typography variant="h4" fontWeight={800} color="#111827">
              ${averageOrderValue.toFixed(2)}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mt={0.5}>
              Average Basket Size
            </Typography>
          </Card>
        </Grid>
      </Grid>

      {/* ════════════════════════ MAIN CONTENT SPLIT ════════════════════════ */}
      <Grid container spacing={3.5}>
        {/* ── LEFT COLUMN (8 Cols): Orders Activity & Live Feed ── */}
        <Grid item xs={12} lg={8}>
          {/* Recent Live Orders Card */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3.5 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
                <Box>
                  <Typography variant="h6" fontWeight={700}>Live Orders Feed</Typography>
                  <Typography variant="body2" color="text.secondary">Real-time orders placed at your store</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {/* Status Pills */}
                  {['ALL', 'PENDING', 'PROCESSING', 'DELIVERED'].map((st) => (
                    <Chip
                      key={st}
                      label={st === 'ALL' ? 'All Orders' : st}
                      size="small"
                      onClick={() => setOrderStatusFilter(st)}
                      sx={{
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: 'pointer',
                        bgcolor: orderStatusFilter === st ? BRAND : 'grey.100',
                        color: orderStatusFilter === st ? '#ffffff' : 'text.secondary',
                        '&:hover': { bgcolor: orderStatusFilter === st ? BRAND_DARK : 'grey.200' },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Search Bar for Orders */}
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
                sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              {/* Orders Table */}
              {filteredOrders.length === 0 ? (
                <Box sx={{ py: 6, textAlign: 'center' }}>
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    No orders found
                  </Typography>
                  <Typography variant="body2" color="text.disabled">
                    Incoming customer orders for your store will appear here automatically.
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table size="medium">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>ORDER ID</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>CUSTOMER</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>ITEMS</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>AMOUNT</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>STATUS</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, py: 1.5 }}>ACTION</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredOrders.slice(0, 8).map((order) => {
                        const statusConfig = getStatusColor(order.status)
                        const itemCount = order.orderItems?.length || 0
                        const firstItemName = order.orderItems?.[0]?.product?.proName || 'Store Item'

                        return (
                          <TableRow key={order.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 700, color: BRAND }}>
                              #{order.id}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {order.user?.username || 'Customer'}
                              </Typography>
                              <Typography variant="caption" color="text.disabled">
                                {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                                {firstItemName} {itemCount > 1 ? `+${itemCount - 1} more` : ''}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>
                              ${parseFloat(order.totalAmount || 0).toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusConfig.label}
                                size="small"
                                sx={{
                                  bgcolor: statusConfig.bg,
                                  color: statusConfig.color,
                                  fontWeight: 700,
                                  fontSize: 11,
                                  borderRadius: 1.5,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => router.push(`/vendor/dashboard/orders/new`)}
                                sx={{
                                  borderColor: 'divider',
                                  color: 'text.primary',
                                  borderRadius: 1.5,
                                  textTransform: 'none',
                                  fontWeight: 600,
                                  py: 0.25,
                                  '&:hover': { borderColor: BRAND, color: BRAND },
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

              {filteredOrders.length > 8 && (
                <Box sx={{ mt: 2.5, textAlign: 'center' }}>
                  <Button
                    endIcon={<ArrowForwardIcon />}
                    onClick={() => router.push('/vendor/dashboard/orders/history')}
                    sx={{ textTransform: 'none', fontWeight: 700, color: BRAND }}
                  >
                    View All {orders.length} Orders in History
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Top Selling / Star Products Card */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                  <StarIcon sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={700}>Top Menu Products</Typography>
                </Box>
                <Button
                  size="small"
                  onClick={() => router.push('/vendor/dashboard/products')}
                  sx={{ textTransform: 'none', fontWeight: 600, color: BRAND }}
                >
                  Manage All ({products.length})
                </Button>
              </Box>

              <Divider sx={{ mb: 2 }} />

              {topProducts.length === 0 ? (
                <Typography color="text.disabled" variant="body2" sx={{ py: 3, textAlign: 'center' }}>
                  No products added yet. Click &quot;Add New Product&quot; to build your store menu.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {topProducts.map((p) => (
                    <Grid item xs={12} sm={6} key={p.proId}>
                      <Box
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'grey.50',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.75,
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: '#ffffff', borderColor: BRAND, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
                        }}
                      >
                        <Box
                          sx={{
                            width: 52,
                            height: 52,
                            borderRadius: 1.5,
                            overflow: 'hidden',
                            flexShrink: 0,
                            border: '1px solid',
                            borderColor: 'divider',
                            bgcolor: '#ffffff',
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
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {p.proName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {p.category?.name || 'General'} • Stock: {p.stock || 0}
                          </Typography>
                          <Typography variant="body2" fontWeight={800} color={BRAND} mt={0.25}>
                            ${parseFloat(p.price || 0).toFixed(2)}
                            {parseFloat(p.discount || 0) > 0 && (
                              <Typography component="span" variant="caption" sx={{ color: 'error.main', ml: 1, fontWeight: 700 }}>
                                {p.discount}% OFF
                              </Typography>
                            )}
                          </Typography>
                        </Box>

                        <Chip
                          label={p.approvalStatus}
                          size="small"
                          sx={{
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 1,
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

        {/* ── RIGHT COLUMN (4 Cols): Store Health, Categories & Shortcuts ── */}
        <Grid item xs={12} lg={4}>
          {/* Catalog Approval Status Breakdown */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Catalog Approval Status
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2.5}>
                Admin review progress for your products
              </Typography>

              {[
                { label: 'Approved & Live', count: approvedProducts.length, color: '#10b981', bg: '#ecfdf5' },
                { label: 'Pending Review', count: pendingProducts.length, color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Rejected / Edits Needed', count: rejectedProducts.length, color: '#ef4444', bg: '#fef2f2' },
              ].map(({ label, count, color, bg }) => (
                <Box key={label} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 8, height: 8, bgcolor: color, borderRadius: '50%' }} />
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color={color}>{count}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={products.length ? (count / products.length) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: bg,
                      '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                    }}
                  />
                </Box>
              ))}

              <Divider sx={{ my: 2.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Approval Rate</Typography>
                  <Typography variant="h6" fontWeight={800} color="success.main">{approvalRate}%</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Out of Stock</Typography>
                  <Typography variant="h6" fontWeight={800} color="error.main">{outOfStockProducts.length}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Low Stock (&le;5)</Typography>
                  <Typography variant="h6" fontWeight={800} color="warning.main">{lowStockProducts.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Menu Category Distribution */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Category Distribution
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {categoryBreakdown.length === 0 ? (
                <Typography color="text.disabled" variant="body2">No category data yet.</Typography>
              ) : (
                categoryBreakdown.map(([catName, count]) => (
                  <Box key={catName} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{catName}</Typography>
                      <Typography variant="body2" color="text.secondary">{count} item{count > 1 ? 's' : ''}</Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={products.length ? (count / products.length) * 100 : 0}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        bgcolor: BRAND_LIGHT,
                        '& .MuiLinearProgress-bar': { bgcolor: BRAND, borderRadius: 3 },
                      }}
                    />
                  </Box>
                ))
              )}
            </CardContent>
          </Card>

          {/* Quick Shortcuts & Navigation Card */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                Store Management Shortcuts
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Inventory2OutlinedIcon sx={{ color: BRAND }} />}
                  onClick={() => router.push('/vendor/dashboard/products')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: BRAND_LIGHT, borderColor: BRAND, color: BRAND },
                  }}
                >
                  Manage Product Inventory
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<LocalOfferOutlinedIcon sx={{ color: '#d97706' }} />}
                  onClick={() => router.push('/vendor/dashboard/deals')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: '#fffbeb', borderColor: '#d97706', color: '#d97706' },
                  }}
                >
                  Create Food Deals & Promos
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<StorefrontIcon sx={{ color: '#2563eb' }} />}
                  onClick={() => router.push('/vendor/dashboard/profile')}
                  sx={{
                    justifyContent: 'flex-start',
                    py: 1.25,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: 'divider',
                    color: 'text.primary',
                    '&:hover': { bgcolor: '#eff6ff', borderColor: '#2563eb', color: '#2563eb' },
                  }}
                >
                  Update Store Location & Details
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
