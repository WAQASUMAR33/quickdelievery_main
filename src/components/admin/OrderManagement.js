'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

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
import FormControl      from '@mui/material/FormControl'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Pagination       from '@mui/material/Pagination'
import Select           from '@mui/material/Select'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'
import Avatar           from '@mui/material/Avatar'

import AccessTimeIcon             from '@mui/icons-material/AccessTime'
import CancelOutlinedIcon         from '@mui/icons-material/CancelOutlined'
import CheckCircleIcon            from '@mui/icons-material/CheckCircle'
import CheckIcon                  from '@mui/icons-material/Check'
import CloseIcon                  from '@mui/icons-material/Close'
import ContentCopyIcon            from '@mui/icons-material/ContentCopy'
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined'
import GridViewIcon               from '@mui/icons-material/GridView'
import HourglassEmptyIcon         from '@mui/icons-material/HourglassEmpty'
import InventoryIcon              from '@mui/icons-material/Inventory'
import LocalShippingIcon          from '@mui/icons-material/LocalShipping'
import LocationOnOutlinedIcon     from '@mui/icons-material/LocationOnOutlined'
import MapIcon                    from '@mui/icons-material/Map'
import NotificationsActiveIcon    from '@mui/icons-material/NotificationsActive'
import OpenInNewIcon              from '@mui/icons-material/OpenInNew'
import PhoneIcon                  from '@mui/icons-material/Phone'
import PrintIcon                  from '@mui/icons-material/Print'
import RefreshIcon                from '@mui/icons-material/Refresh'
import SearchIcon                 from '@mui/icons-material/Search'
import SendIcon                   from '@mui/icons-material/Send'
import ShoppingBagOutlinedIcon    from '@mui/icons-material/ShoppingBagOutlined'
import TwoWheelerIcon             from '@mui/icons-material/TwoWheeler'
import ViewListIcon               from '@mui/icons-material/ViewList'

import { formatPrice, COUNTRY_CURRENCIES, getActiveCountry, setActiveCountry } from '@/lib/currency'
import { useRealtimeEvent } from '@/contexts/RealtimeContext'

const BRAND = '#39772A'

// Status Design Configurations
const STATUS_CONFIG = {
  PENDING: {
    label: 'Pending Dispatch',
    shortLabel: 'Pending',
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#FDE68A',
    dot: '#F59E0B',
    icon: <HourglassEmptyIcon sx={{ fontSize: 16 }} />
  },
  PROCESSING: {
    label: 'In Preparation',
    shortLabel: 'Preparing',
    bg: '#EFF6FF',
    color: '#1E40AF',
    border: '#BFDBFE',
    dot: '#3B82F6',
    icon: <InventoryIcon sx={{ fontSize: 16 }} />
  },
  SHIPPED: {
    label: 'Out for Delivery',
    shortLabel: 'Dispatched',
    bg: '#F5F3FF',
    color: '#5B21B6',
    border: '#DDD6FE',
    dot: '#8B5CF6',
    icon: <LocalShippingIcon sx={{ fontSize: 16 }} />
  },
  DELIVERED: {
    label: 'Delivered',
    shortLabel: 'Delivered',
    bg: '#ECFDF5',
    color: '#065F46',
    border: '#A7F3D0',
    dot: '#10B981',
    icon: <CheckCircleIcon sx={{ fontSize: 16 }} />
  },
  CANCELLED: {
    label: 'Cancelled',
    shortLabel: 'Cancelled',
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
    dot: '#EF4444',
    icon: <CancelOutlinedIcon sx={{ fontSize: 16 }} />
  },
}

function StatusBadge({ status, pulse = false }) {
  const cfg = STATUS_CONFIG[status] || {
    label: status,
    shortLabel: status,
    bg: '#F3F4F6',
    color: '#374151',
    border: '#E5E7EB',
    dot: '#9CA3AF'
  }

  const isLive = pulse || status === 'PENDING' || status === 'PROCESSING' || status === 'SHIPPED'

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.45,
        borderRadius: '999px',
        bgcolor: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
        fontSize: '0.75rem',
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
      }}
    >
      <Box
        sx={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          bgcolor: cfg.dot,
          position: 'relative',
          ...(isLive && {
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: -2,
              borderRadius: '50%',
              bgcolor: cfg.dot,
              opacity: 0.4,
              animation: 'pulseRing 1.8s cubic-bezier(0.45, 0, 0.55, 1) infinite',
            }
          })
        }}
      />
      <span>{cfg.shortLabel}</span>
    </Box>
  )
}

function formatRelativeTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function getProductImageSrc(product) {
  if (!product) return null
  const proImages = product.proImages
  if (!proImages) return null

  if (Array.isArray(proImages)) {
    for (const img of proImages) {
      if (typeof img === 'string') {
        const trimmed = img.trim()
        if (trimmed.startsWith('http') || trimmed.startsWith('/')) return trimmed
        if (trimmed.startsWith('[') || trimmed.startsWith('"')) {
          try {
            const parsed = JSON.parse(trimmed)
            if (Array.isArray(parsed) && parsed[0]) return parsed[0]
            if (typeof parsed === 'string') return parsed
          } catch {}
        }
      }
    }
  }

  if (typeof proImages === 'string') {
    const trimmed = proImages.trim()
    if (trimmed.startsWith('[') || trimmed.startsWith('{') || trimmed.startsWith('"')) {
      try {
        const parsed = JSON.parse(trimmed)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const first = parsed[0]
          if (typeof first === 'string' && (first.startsWith('http') || first.startsWith('/'))) return first.trim()
        } else if (typeof parsed === 'string' && (parsed.startsWith('http') || parsed.startsWith('/'))) {
          return parsed.trim()
        }
      } catch {}
    } else if (trimmed.startsWith('http') || trimmed.startsWith('/')) {
      return trimmed
    }
  }

  return null
}

function ProductImageItem({ src, name, size = 42, sx = {} }) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '8px',
          bgcolor: '#f1f5f9',
          color: '#94a3b8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '1px solid #e2e8f0',
          flexShrink: 0,
          ...sx,
        }}
      >
        <ShoppingBagOutlinedIcon sx={{ fontSize: Math.max(14, Math.round(size * 0.5)) }} />
      </Box>
    )
  }

  return (
    <Box
      component="img"
      src={src}
      alt={name || 'Product'}
      onError={() => setError(true)}
      sx={{
        width: size,
        height: size,
        borderRadius: '8px',
        objectFit: 'cover',
        border: '1px solid #e2e8f0',
        bgcolor: '#f8fafc',
        flexShrink: 0,
        ...sx,
      }}
    />
  )
}

export default function OrderManagement({ defaultStatusFilter = '', vendorId = '' }) {
  const router = useRouter()

  const [orders,          setOrders]          = useState([])
  const [loading,         setLoading]         = useState(true)
  const [refreshing,      setRefreshing]      = useState(false)
  const [searchTerm,      setSearchTerm]      = useState('')
  const [statusFilter,    setStatusFilter]    = useState(defaultStatusFilter)
  const [verticalFilter,  setVerticalFilter]  = useState('')
  const [selectedCountry, setSelectedCountry] = useState(getActiveCountry())
  const [currentPage,     setCurrentPage]     = useState(1)
  const [totalPages,      setTotalPages]      = useState(1)
  const [viewMode,        setViewMode]        = useState('table') // 'table' | 'cards'
  const [copiedId,        setCopiedId]        = useState(null)

  // Status breakdown counts
  const [counts, setCounts] = useState({
    all: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  })

  // Modal & Push state
  const [selectedOrder,   setSelectedOrder]   = useState(null)
  const [showModal,       setShowModal]       = useState(false)
  const [customPushTitle, setCustomPushTitle] = useState('')
  const [customPushBody,  setCustomPushBody]  = useState('')
  const [sendingPush,     setSendingPush]     = useState(false)
  const [updatingStatus,  setUpdatingStatus] = useState(false)

  // Sync currency changes
  useEffect(() => {
    const handler = () => setSelectedCountry(getActiveCountry())
    window.addEventListener('currency_change', handler)
    return () => window.removeEventListener('currency_change', handler)
  }, [])

  // Sync defaultStatusFilter if prop changes
  useEffect(() => {
    setStatusFilter(defaultStatusFilter)
    setCurrentPage(1)
  }, [defaultStatusFilter])

  // Fetch orders from API
  const fetchOrders = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        search: searchTerm.trim(),
        status: statusFilter,
      })
      if (verticalFilter) params.set('vertical', verticalFilter)
      if (vendorId) params.set('vendorId', vendorId)

      const res = await fetch(`/api/orders?${params}`)
      const data = await res.json()

      if (data.success) {
        setOrders(Array.isArray(data.data) ? data.data : [])
        setTotalPages(data.pagination?.pages || 1)
        if (data.counts) {
          setCounts(data.counts)
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [currentPage, searchTerm, statusFilter, verticalFilter, vendorId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Real-time synchronization on order changes
  useRealtimeEvent(['ORDER_CREATED', 'ORDER_UPDATED'], () => {
    fetchOrders()
  })

  // Copy order ID helper
  const handleCopyId = (id, e) => {
    if (e) e.stopPropagation()
    navigator.clipboard?.writeText(id.toString())
    setCopiedId(id)
    toast.success(`Copied #${id} to clipboard!`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Status transitions
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingStatus(true)
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        const label = STATUS_CONFIG[newStatus]?.label || newStatus
        toast.success(`Order #${orderId} marked as ${label} • Push broadcasted! 📲`)
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }))
        }
        fetchOrders()
      } else {
        toast.error(data.error || 'Failed to update order status')
      }
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingStatus(false)
    }
  }

  // Push notification dispatch
  const handleSendCustomPush = async (presetTitle, presetBody) => {
    if (!selectedOrder) return
    const title = (presetTitle || customPushTitle).trim()
    const body = (presetBody || customPushBody).trim()

    if (!title || !body) {
      toast.error('Please enter both title and message for push notification')
      return
    }
    try {
      setSendingPush(true)
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          status: selectedOrder.status,
          title,
          body,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Push notification delivered to mobile app! 🚀')
        setCustomPushTitle('')
        setCustomPushBody('')
      } else {
        toast.error(data.error || 'Failed to send push notification')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to send push notification')
    } finally {
      setSendingPush(false)
    }
  }

  const openModal = (order) => {
    setSelectedOrder(order)
    setCustomPushTitle('')
    setCustomPushBody('')
    setShowModal(true)
  }

  // Quick preset push notification templates
  const PUSH_PRESETS = [
    { title: 'Order Update 🍳', body: 'The kitchen is preparing your delicious order right now!' },
    { title: 'Driver Dispatched 🛵', body: 'Your driver is on the way with your order! Track live in app.' },
    { title: 'Driver Arrived 📍', body: 'Your delivery driver has arrived at your address!' },
    { title: 'Quick Notice 📞', body: 'Our driver tried contacting you. Please check your door or phone.' },
  ]

  // Filter tabs config
  const STATUS_TABS = [
    { id: '',          label: 'All Orders',      count: counts.all,        color: BRAND },
    { id: 'PENDING',    label: 'New / Pending',   count: counts.pending,    color: '#D97706' },
    { id: 'PROCESSING', label: 'In Preparation',  count: counts.processing, color: '#2563EB' },
    { id: 'SHIPPED',    label: 'Dispatched',      count: counts.shipped,    color: '#7C3AED' },
    { id: 'DELIVERED',  label: 'Delivered',       count: counts.delivered,  color: '#16A34A' },
    { id: 'CANCELLED',  label: 'Cancelled',       count: counts.cancelled,  color: '#DC2626' },
  ]

  return (
    <Box sx={{ width: '100%', pb: 6 }}>
      <style>{`
        @keyframes pulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
      `}</style>

      {/* ── Top Header / Command Bar ── */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3.5,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', fontSize: { xs: '1.5rem', sm: '1.85rem' } }}>
              Order Management
            </Typography>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.75,
                px: 1.5,
                py: 0.4,
                borderRadius: '999px',
                bgcolor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10B981',
                  position: 'relative',
                  '&::after': {
                    content: '""',
                    position: 'absolute',
                    inset: -2,
                    borderRadius: '50%',
                    bgcolor: '#10B981',
                    opacity: 0.5,
                    animation: 'pulseRing 1.8s infinite',
                  }
                }}
              />
              Live Realtime Sync
            </Box>
          </Box>
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 0.5, fontSize: '0.875rem' }}>
            Monitor, dispatch, track deliveries, and broadcast customer mobile notifications in real time.
          </Typography>
        </Box>

        {/* Currency & Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 175 }}>
            <Select
              value={selectedCountry}
              onChange={e => {
                const val = e.target.value
                setSelectedCountry(val)
                setActiveCountry(val)
              }}
              sx={{
                borderRadius: '12px',
                bgcolor: '#FFFFFF',
                fontSize: '0.85rem',
                fontWeight: 600,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: BRAND },
              }}
            >
              <MenuItem value="PK">🇵🇰 Pakistan (PKR)</MenuItem>
              <MenuItem value="US">🇺🇸 America (USD)</MenuItem>
              <MenuItem value="AE">🇦🇪 UAE (AED)</MenuItem>
              <MenuItem value="SA">🇸🇦 Saudi Arabia (SAR)</MenuItem>
              <MenuItem value="GB">🇬🇧 UK (GBP)</MenuItem>
              <MenuItem value="CA">🇨🇦 Canada (CAD)</MenuItem>
              <MenuItem value="IN">🇮🇳 India (INR)</MenuItem>
              <MenuItem value="EU">🇪🇺 Europe (EUR)</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="outlined"
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            startIcon={<RefreshIcon sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />}
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: '#374151',
              borderColor: '#E5E7EB',
              bgcolor: '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: '#F9FAFB' },
            }}
          >
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
        </Box>
      </Box>

      {/* ── KPI Stat Summary Cards ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(3, 1fr)', lg: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3.5,
        }}
      >
        {[
          { key: 'all',        label: 'Total Orders',     count: counts.all,        color: '#3B82F6', filterVal: '',           icon: <ShoppingBagOutlinedIcon /> },
          { key: 'pending',    label: 'Pending Dispatch', count: counts.pending,    color: '#F59E0B', filterVal: 'PENDING',    icon: <HourglassEmptyIcon /> },
          { key: 'processing', label: 'In Preparation',   count: counts.processing, color: '#2563EB', filterVal: 'PROCESSING', icon: <InventoryIcon /> },
          { key: 'shipped',    label: 'Out on Road',      count: counts.shipped,    color: '#8B5CF6', filterVal: 'SHIPPED',    icon: <TwoWheelerIcon /> },
          { key: 'delivered',  label: 'Delivered',        count: counts.delivered,  color: '#10B981', filterVal: 'DELIVERED',  icon: <CheckCircleIcon /> },
        ].map((stat) => {
          const isActive = statusFilter === stat.filterVal
          return (
            <Card
              key={stat.key}
              elevation={0}
              onClick={() => {
                setStatusFilter(stat.filterVal)
                setCurrentPage(1)
              }}
              sx={{
                borderRadius: '16px',
                border: '1px solid',
                borderColor: isActive ? stat.color : '#E5E7EB',
                bgcolor: isActive ? `${stat.color}08` : '#FFFFFF',
                boxShadow: isActive ? `0 4px 14px ${stat.color}25` : '0 2px 8px rgba(0,0,0,0.04)',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 18px ${stat.color}20`,
                  borderColor: stat.color,
                },
              }}
            >
              <CardContent sx={{ p: 2.2, '&:last-child': { pb: 2.2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#6B7280',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.7rem',
                      }}
                    >
                      {stat.label}
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: stat.color,
                        mt: 0.5,
                        fontSize: '1.75rem',
                        lineHeight: 1.1,
                      }}
                    >
                      {stat.count}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '12px',
                      bgcolor: `${stat.color}15`,
                      color: stat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )
        })}
      </Box>

      {/* ── Status Tabs / Segmented Control ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          p: 1,
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          mb: 3,
          '&::-webkit-scrollbar': { height: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#E5E7EB', borderRadius: 4 },
        }}
      >
        {STATUS_TABS.map((tab) => {
          const isSelected = statusFilter === tab.id
          return (
            <Button
              key={tab.id}
              onClick={() => {
                setStatusFilter(tab.id)
                setCurrentPage(1)
              }}
              sx={{
                px: 2,
                py: 1,
                borderRadius: '12px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.18s ease-in-out',
                bgcolor: isSelected ? BRAND : 'transparent',
                color: isSelected ? '#FFFFFF' : '#4B5563',
                '&:hover': {
                  bgcolor: isSelected ? '#2E6121' : '#F3F4F6',
                  color: isSelected ? '#FFFFFF' : '#111827',
                },
              }}
            >
              <span>{tab.label}</span>
              <Box
                component="span"
                sx={{
                  ml: 1,
                  px: 1,
                  py: 0.15,
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  bgcolor: isSelected ? 'rgba(255,255,255,0.25)' : '#E5E7EB',
                  color: isSelected ? '#FFFFFF' : '#4B5563',
                }}
              >
                {tab.count}
              </Box>
            </Button>
          )
        })}
      </Box>

      {/* ── Filter Bar: Search, Type, Clear, & View Toggle ── */}
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          p: 2,
          borderRadius: '16px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'stretch', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
          mb: 3,
        }}
      >
        {/* Left Side: Search & Vertical Filter */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', flex: 1 }}>
          <TextField
            size="small"
            placeholder="Search by Order ID, customer, phone, address…"
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value)
              setCurrentPage(1)
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#9CA3AF', fontSize: 20 }} />
                </InputAdornment>
              ),
              endAdornment: searchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => { setSearchTerm(''); setCurrentPage(1); }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              flex: { xs: '1 1 100%', sm: '1 1 320px' },
              maxWidth: { sm: 420 },
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                bgcolor: '#F9FAFB',
                '&:hover': { bgcolor: '#FFFFFF' },
                '& fieldset': { borderColor: '#E5E7EB' },
                '&.Mui-focused fieldset': { borderColor: BRAND },
              },
            }}
          />

          {/* Vertical Toggle Pills */}
          <Box
            sx={{
              display: 'inline-flex',
              p: 0.5,
              borderRadius: '12px',
              bgcolor: '#F3F4F6',
              border: '1px solid #E5E7EB',
            }}
          >
            {[
              { id: '', label: 'All Verticals' },
              { id: 'FOOD', label: '🍽️ Food' },
              { id: 'GROCERY', label: '🏬 Grocery' },
            ].map(v => (
              <Button
                key={v.id}
                size="small"
                onClick={() => {
                  setVerticalFilter(v.id)
                  setCurrentPage(1)
                }}
                sx={{
                  px: 1.5,
                  py: 0.4,
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  bgcolor: verticalFilter === v.id ? '#FFFFFF' : 'transparent',
                  color: verticalFilter === v.id ? '#111827' : '#6B7280',
                  boxShadow: verticalFilter === v.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  '&:hover': { bgcolor: verticalFilter === v.id ? '#FFFFFF' : 'rgba(0,0,0,0.04)' },
                }}
              >
                {v.label}
              </Button>
            ))}
          </Box>

          {(searchTerm || statusFilter || verticalFilter) && (
            <Button
              size="small"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setVerticalFilter('')
                setCurrentPage(1)
              }}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                color: '#EF4444',
                '&:hover': { bgcolor: '#FEE2E2' },
                borderRadius: '8px',
              }}
            >
              Reset Filters
            </Button>
          )}
        </Box>

        {/* Right Side: View Mode & Total Count */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, justifyContent: { xs: 'space-between', md: 'flex-end' } }}>
          <Typography variant="body2" sx={{ color: '#6B7280', fontWeight: 600, fontSize: '0.85rem' }}>
            Showing <strong>{orders.length}</strong> of <strong>{counts.all || orders.length}</strong>
          </Typography>

          {/* View Mode Toggle: Table vs Cards */}
          <Box sx={{ display: 'flex', p: 0.5, bgcolor: '#F3F4F6', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <Tooltip title="Detailed Table View">
              <IconButton
                size="small"
                onClick={() => setViewMode('table')}
                sx={{
                  borderRadius: '8px',
                  bgcolor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? BRAND : '#6B7280',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <ViewListIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Dispatcher Cards View">
              <IconButton
                size="small"
                onClick={() => setViewMode('cards')}
                sx={{
                  borderRadius: '8px',
                  bgcolor: viewMode === 'cards' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'cards' ? BRAND : '#6B7280',
                  boxShadow: viewMode === 'cards' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <GridViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* ── Content View: Table or Cards ── */}
      {loading ? (
        <Box sx={{ textAlign: 'center', py: 12, bgcolor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <CircularProgress size={36} sx={{ color: BRAND }} />
          <Typography variant="body2" sx={{ color: '#6B7280', mt: 2, fontWeight: 600 }}>
            Syncing order repository…
          </Typography>
        </Box>
      ) : orders.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 12,
            px: 3,
            bgcolor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px dashed #D1D5DB',
          }}
        >
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '20px',
              bgcolor: '#F3F4F6',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9CA3AF',
              mb: 2,
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color="#111827">
            No Orders Found
          </Typography>
          <Typography variant="body2" color="#6B7280" mt={0.5} maxWidth={400} mx="auto">
            {searchTerm || statusFilter || verticalFilter
              ? 'No orders matched your active filters. Try resetting the filters or searching with a different term.'
              : 'There are currently no orders in this queue.'}
          </Typography>
          {(searchTerm || statusFilter || verticalFilter) && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setVerticalFilter('')
                setCurrentPage(1)
              }}
              sx={{
                mt: 2.5,
                borderRadius: '10px',
                borderColor: '#D1D5DB',
                color: '#374151',
                textTransform: 'none',
                fontWeight: 700,
              }}
            >
              Clear All Filters
            </Button>
          )}
        </Box>
      ) : viewMode === 'table' ? (
        /* ── TABLE VIEW ── */
        <TableContainer
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
            overflow: 'hidden',
          }}
        >
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Order # / Date
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Type
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Customer Details
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Items Preview
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Amount & Payment
                </TableCell>
                <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Fulfillment Status
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4B5563', py: 1.8 }}>
                  Quick Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {orders.map((order) => {
                const isFood = order.vertical !== 'GROCERY'
                const itemsCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || order.orderItems?.length || 0
                const previewImages = (order.orderItems || [])
                  .map(i => getProductImageSrc(i.product))
                  .filter(Boolean)
                  .slice(0, 3)

                return (
                  <TableRow
                    key={order.id}
                    hover
                    onClick={() => openModal(order)}
                    sx={{
                      cursor: 'pointer',
                      borderBottom: '1px solid #F3F4F6',
                      transition: 'background-color 0.15s ease',
                      '&:hover': { bgcolor: 'rgba(57, 119, 42, 0.03)' },
                    }}
                  >
                    {/* Order ID & Created Date */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 800,
                            color: '#111827',
                            fontSize: '0.9rem',
                            bgcolor: '#F3F4F6',
                            px: 1,
                            py: 0.3,
                            borderRadius: '6px',
                          }}
                        >
                          #{order.id.toString().padStart(6, '0')}
                        </Typography>
                        <Tooltip title={copiedId === order.id ? 'Copied!' : 'Copy Order ID'}>
                          <IconButton
                            size="small"
                            onClick={(e) => handleCopyId(order.id, e)}
                            sx={{ color: copiedId === order.id ? '#10B981' : '#9CA3AF', p: 0.5 }}
                          >
                            {copiedId === order.id ? <CheckIcon sx={{ fontSize: 15 }} /> : <ContentCopyIcon sx={{ fontSize: 15 }} />}
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.75, color: '#6B7280' }}>
                        <AccessTimeIcon sx={{ fontSize: 13 }} />
                        <Typography variant="caption" sx={{ fontWeight: 600 }}>
                          {formatRelativeTime(order.createdAt)} • {new Date(order.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                    </TableCell>

                    {/* Vertical Type */}
                    <TableCell sx={{ py: 2 }}>
                      <Box
                        sx={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.2,
                          py: 0.4,
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          bgcolor: isFood ? '#FEF2F2' : '#F0FDF4',
                          color: isFood ? '#B91C1C' : '#15803D',
                          border: `1px solid ${isFood ? '#FECACA' : '#BBF7D0'}`,
                        }}
                      >
                        <span>{isFood ? '🍽️ Food' : '🏬 Grocery'}</span>
                      </Box>
                    </TableCell>

                    {/* Customer */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Avatar
                          sx={{
                            width: 36,
                            height: 36,
                            bgcolor: BRAND,
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: '#FFFFFF',
                          }}
                        >
                          {(order.user?.username || 'C')[0].toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0, maxWidth: 220 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', noWrap: true }}>
                            {order.user?.username || 'Customer'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', noWrap: true }}>
                            {order.user?.phoneNumber || order.user?.email || 'No contact info'}
                          </Typography>
                          {order.shippingAddress && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, color: '#9CA3AF' }}>
                              <LocationOnOutlinedIcon sx={{ fontSize: 13, flexShrink: 0 }} />
                              <Typography variant="caption" sx={{ noWrap: true, maxWidth: 190, color: '#6B7280' }}>
                                {order.shippingAddress}
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Items Preview */}
                    <TableCell sx={{ py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {previewImages.map((img, idx) => (
                            <Box
                              key={idx}
                              component="img"
                              src={img}
                              alt="item"
                              onError={(e) => { e.currentTarget.style.display = 'none' }}
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '2px solid #FFFFFF',
                                ml: idx > 0 ? -1.2 : 0,
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                bgcolor: '#f8fafc',
                              }}
                            />
                          ))}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#6B7280' }}>
                            {order.orderItems?.[0]?.product?.proName || 'Product'}
                            {(order.orderItems?.length || 0) > 1 && ` +${order.orderItems.length - 1} more`}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Total & Payment */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: BRAND, fontSize: '0.95rem' }}>
                        {formatPrice(order.totalAmount, { country: selectedCountry, address: order.shippingAddress })}
                      </Typography>
                      <Box
                        sx={{
                          display: 'inline-block',
                          mt: 0.5,
                          px: 1,
                          py: 0.2,
                          borderRadius: '6px',
                          bgcolor: '#F3F4F6',
                          color: '#4B5563',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                        }}
                      >
                        {order.paymentMethod || 'Cash On Delivery'}
                      </Box>
                    </TableCell>

                    {/* Fulfillment Status */}
                    <TableCell sx={{ py: 2 }}>
                      <StatusBadge status={order.status} />
                    </TableCell>

                    {/* Quick Action Buttons */}
                    <TableCell align="right" sx={{ py: 2 }} onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                        {/* Status advancement buttons */}
                        {order.status === 'PENDING' && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={updatingStatus}
                            onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              bgcolor: '#2563EB',
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#1D4ED8' },
                            }}
                          >
                            Accept
                          </Button>
                        )}

                        {order.status === 'PROCESSING' && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={updatingStatus}
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                            startIcon={<TwoWheelerIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              bgcolor: '#7C3AED',
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#6D28D9' },
                            }}
                          >
                            Dispatch
                          </Button>
                        )}

                        {order.status === 'SHIPPED' && (
                          <Button
                            size="small"
                            variant="contained"
                            disabled={updatingStatus}
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            startIcon={<CheckCircleIcon sx={{ fontSize: 15 }} />}
                            sx={{
                              borderRadius: '8px',
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              bgcolor: '#16A34A',
                              boxShadow: 'none',
                              '&:hover': { bgcolor: '#15803D' },
                            }}
                          >
                            Complete
                          </Button>
                        )}

                        <Tooltip title="View Order Details & Push Notification Controls">
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => openModal(order)}
                            sx={{
                              borderRadius: '8px',
                              borderColor: '#E5E7EB',
                              color: '#374151',
                              textTransform: 'none',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              minWidth: 'auto',
                              px: 1.25,
                              '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: 'rgba(57, 119, 42, 0.04)' },
                            }}
                          >
                            Manage
                          </Button>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        /* ── VISUAL CARDS GRID VIEW (Dispatcher Board) ── */
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(3, 1fr)' }, gap: 2.5 }}>
          {orders.map((order) => {
            const isFood = order.vertical !== 'GROCERY'
            const itemsCount = order.orderItems?.reduce((sum, item) => sum + item.quantity, 0) || order.orderItems?.length || 0

            return (
              <Card
                key={order.id}
                elevation={0}
                onClick={() => openModal(order)}
                sx={{
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                  bgcolor: '#FFFFFF',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-3px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.07)',
                    borderColor: '#D1D5DB',
                  },
                }}
              >
                <CardContent sx={{ p: 2.5, flex: '1 1 auto', display: 'flex', flexDirection: 'column' }}>
                  {/* Card Header: Order ID & Status */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 800, color: '#111827' }}>
                          #{order.id.toString().padStart(6, '0')}
                        </Typography>
                        <Box
                          sx={{
                            px: 1,
                            py: 0.2,
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            bgcolor: isFood ? '#FEF2F2' : '#F0FDF4',
                            color: isFood ? '#B91C1C' : '#15803D',
                          }}
                        >
                          {isFood ? 'Food' : 'Grocery'}
                        </Box>
                      </Box>
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                        <AccessTimeIcon sx={{ fontSize: 13 }} />
                        {formatRelativeTime(order.createdAt)}
                      </Typography>
                    </Box>
                    <StatusBadge status={order.status} />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Customer Info */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 2 }}>
                    <Avatar sx={{ width: 34, height: 34, bgcolor: BRAND, fontSize: '0.8rem', fontWeight: 700 }}>
                      {(order.user?.username || 'C')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827', noWrap: true }}>
                        {order.user?.username || 'Customer'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block', noWrap: true }}>
                        {order.user?.phoneNumber || order.user?.email || 'No contact'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Delivery Location Snippet */}
                  {order.shippingAddress && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 2, bgcolor: '#F9FAFB', p: 1.2, borderRadius: '8px' }}>
                      <LocationOnOutlinedIcon sx={{ fontSize: 16, color: BRAND, mt: 0.2 }} />
                      <Typography variant="caption" sx={{ color: '#4B5563', lineHeight: 1.3, fontWeight: 500, noWrap: true }}>
                        {order.shippingAddress}
                      </Typography>
                    </Box>
                  )}

                  {/* Items Summary */}
                  <Box sx={{ mb: 2, flex: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.05em' }}>
                      Order Items ({itemsCount})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                      {order.orderItems?.slice(0, 2).map((item, idx) => (
                        <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                            <ProductImageItem
                              src={getProductImageSrc(item.product)}
                              name={item.product?.proName}
                              size={28}
                              sx={{ borderRadius: '6px' }}
                            />
                            <Typography variant="caption" sx={{ color: '#374151', fontWeight: 600, noWrap: true, maxWidth: 170 }}>
                              {item.quantity}x {item.product?.proName || 'Product'}
                            </Typography>
                          </Box>
                          <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>
                            {formatPrice(parseFloat(item.price) * item.quantity, { country: selectedCountry, address: order.shippingAddress })}
                          </Typography>
                        </Box>
                      ))}
                      {(order.orderItems?.length || 0) > 2 && (
                        <Typography variant="caption" sx={{ color: BRAND, fontWeight: 700 }}>
                          +{order.orderItems.length - 2} more item(s)…
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Total & Action Footer */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }} onClick={(e) => e.stopPropagation()}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 600 }}>Total</Typography>
                      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: BRAND, lineHeight: 1.1 }}>
                        {formatPrice(order.totalAmount, { country: selectedCountry, address: order.shippingAddress })}
                      </Typography>
                    </Box>

                    {/* Quick Button */}
                    {order.status === 'PENDING' && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(order.id, 'PROCESSING')}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#2563EB', '&:hover': { bgcolor: '#1D4ED8' } }}
                      >
                        Accept & Prep
                      </Button>
                    )}
                    {order.status === 'PROCESSING' && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(order.id, 'SHIPPED')}
                        startIcon={<TwoWheelerIcon sx={{ fontSize: 16 }} />}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}
                      >
                        Dispatch
                      </Button>
                    )}
                    {order.status === 'SHIPPED' && (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                        startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, bgcolor: '#16A34A', '&:hover': { bgcolor: '#15803D' } }}
                      >
                        Delivered
                      </Button>
                    )}
                    {order.status === 'DELIVERED' && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => openModal(order)}
                        sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700, borderColor: '#D1D5DB', color: '#4B5563' }}
                      >
                        View Details
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            )
          })}
        </Box>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, val) => setCurrentPage(val)}
            shape="rounded"
            size="large"
            sx={{
              '& .MuiPaginationItem-root': {
                borderRadius: '10px',
                fontWeight: 700,
                color: '#4B5563',
              },
              '& .Mui-selected': {
                bgcolor: `${BRAND} !important`,
                color: '#FFFFFF !important',
              },
            }}
          />
        </Box>
      )}

      {/* ── BESPOKE LUXURY ORDER DETAILS MODAL ── */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden',
          },
        }}
      >
        {selectedOrder && (
          <>
            {/* Modal Header */}
            <DialogTitle
              sx={{
                p: 2.5,
                bgcolor: '#FFFFFF',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: '#111827' }}>
                    Order #{selectedOrder.id.toString().padStart(6, '0')}
                  </Typography>
                  <StatusBadge status={selectedOrder.status} />
                  <Chip
                    label={selectedOrder.vertical === 'GROCERY' ? '🏬 Grocery' : '🍽️ Food'}
                    size="small"
                    sx={{
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      bgcolor: selectedOrder.vertical === 'GROCERY' ? '#FCE4EC' : '#E8F5E9',
                      color: selectedOrder.vertical === 'GROCERY' ? '#C2185B' : '#2E7D32',
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ color: '#6B7280', mt: 0.5, display: 'block' }}>
                  Placed on {new Date(selectedOrder.createdAt).toLocaleString()} • Payment: {selectedOrder.paymentMethod || 'Cash On Delivery'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PrintIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    const path = vendorId
                      ? `/vendor/dashboard/orders/${selectedOrder.id}`
                      : `/admin/dashboard/orders/${selectedOrder.id}`
                    router.push(path)
                  }}
                  sx={{
                    borderRadius: '10px',
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: BRAND,
                    borderColor: BRAND,
                    '&:hover': { bgcolor: 'rgba(57, 119, 42, 0.05)', borderColor: BRAND },
                  }}
                >
                  Full Invoice
                </Button>
                <IconButton onClick={() => setShowModal(false)} sx={{ color: '#9CA3AF' }}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent sx={{ p: 3, flex: '1 1 auto', overflowY: 'auto' }}>
              {/* ── Order Fulfillment Stepper Bar ── */}
              <Box
                sx={{
                  p: 2.5,
                  mb: 3,
                  bgcolor: '#F9FAFB',
                  borderRadius: '16px',
                  border: '1px solid #E5E7EB',
                }}
              >
                <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 2 }}>
                  Live Fulfillment Stage
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {[
                    { step: 1, label: 'Placed', statusKey: 'PENDING', icon: <HourglassEmptyIcon sx={{ fontSize: 18 }} /> },
                    { step: 2, label: 'Kitchen / Prep', statusKey: 'PROCESSING', icon: <InventoryIcon sx={{ fontSize: 18 }} /> },
                    { step: 3, label: 'On The Road', statusKey: 'SHIPPED', icon: <TwoWheelerIcon sx={{ fontSize: 18 }} /> },
                    { step: 4, label: 'Delivered', statusKey: 'DELIVERED', icon: <CheckCircleIcon sx={{ fontSize: 18 }} /> },
                  ].map((s, idx, arr) => {
                    const stepOrder = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED']
                    const currentIdx = stepOrder.indexOf(selectedOrder.status)
                    const thisIdx = stepOrder.indexOf(s.statusKey)
                    const isDone = currentIdx >= thisIdx && selectedOrder.status !== 'CANCELLED'
                    const isCurrent = currentIdx === thisIdx

                    return (
                      <Box key={s.step} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative', zIndex: 1 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            bgcolor: isDone ? BRAND : '#E5E7EB',
                            color: isDone ? '#FFFFFF' : '#9CA3AF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: isCurrent ? `0 0 0 4px ${BRAND}25` : 'none',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {s.icon}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            mt: 1,
                            fontWeight: isCurrent ? 800 : 600,
                            color: isCurrent ? '#111827' : '#6B7280',
                            fontSize: '0.75rem',
                          }}
                        >
                          {s.label}
                        </Typography>
                      </Box>
                    )
                  })}
                </Box>
              </Box>

              {/* ── Customer & Destination Grid ── */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                {/* Customer Details */}
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E5E7EB', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Customer Profile
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1.5 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: BRAND, fontWeight: 800 }}>
                      {(selectedOrder.user?.username || 'C')[0].toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827' }}>
                        {selectedOrder.user?.username || 'Guest Customer'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                        {selectedOrder.user?.email || 'No email attached'}
                      </Typography>
                    </Box>
                  </Box>

                  {selectedOrder.user?.phoneNumber && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        href={`tel:${selectedOrder.user.phoneNumber}`}
                        startIcon={<PhoneIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderColor: '#E5E7EB',
                          color: '#374151',
                        }}
                      >
                        Call ({selectedOrder.user.phoneNumber})
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* Shipping Destination */}
                <Box sx={{ p: 2.5, borderRadius: '16px', border: '1px solid #E5E7EB', bgcolor: '#FFFFFF' }}>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Delivery Destination
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 1.5 }}>
                    <LocationOnOutlinedIcon sx={{ color: BRAND, fontSize: 20, mt: 0.2 }} />
                    <Typography variant="body2" sx={{ color: '#374151', fontWeight: 500, lineHeight: 1.5 }}>
                      {selectedOrder.shippingAddress || 'Customer pickup / No address provided'}
                    </Typography>
                  </Box>

                  {selectedOrder.shippingAddress && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        target="_blank"
                        rel="noopener noreferrer"
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedOrder.shippingAddress)}`}
                        startIcon={<MapIcon sx={{ fontSize: 15 }} />}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          borderColor: '#E5E7EB',
                          color: BRAND,
                        }}
                      >
                        View in Google Maps
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>

              {/* ── Order Items Breakdown ── */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#111827', mb: 1.5 }}>
                  Itemized Order Breakdown ({selectedOrder.orderItems?.length || 0})
                </Typography>

                <TableContainer sx={{ borderRadius: '14px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#4B5563' }}>Product</TableCell>
                        <TableCell sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#4B5563' }}>Category</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#4B5563' }}>Qty</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#4B5563' }}>Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, fontSize: '0.75rem', color: '#4B5563' }}>Subtotal</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.orderItems?.map((item, idx) => {
                        let variation = null
                        if (item.variationJson) {
                          try {
                            variation = JSON.parse(item.variationJson)
                          } catch {
                            // ignore parse error
                          }
                        }

                        return (
                          <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <ProductImageItem
                                  src={getProductImageSrc(item.product)}
                                  name={item.product?.proName}
                                  size={44}
                                  sx={{ borderRadius: '10px' }}
                                />
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#111827' }}>
                                    {item.product?.proName || 'Unknown Product'}
                                  </Typography>
                                  {variation && (
                                    <Box
                                      sx={{
                                        display: 'inline-block',
                                        mt: 0.3,
                                        px: 0.8,
                                        py: 0.1,
                                        borderRadius: '4px',
                                        bgcolor: '#FEF3C7',
                                        color: '#92400E',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                      }}
                                    >
                                      Variant: {variation.name || variation.title || 'Selected'}
                                    </Box>
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                {item.product?.category?.name || '—'}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                {item.quantity}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ color: '#4B5563' }}>
                                {formatPrice(item.price, { country: selectedCountry, address: selectedOrder.shippingAddress })}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" sx={{ fontWeight: 800, color: BRAND }}>
                                {formatPrice(parseFloat(item.price) * item.quantity, { country: selectedCountry, address: selectedOrder.shippingAddress })}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {/* ── Push Notification & Mobile Broadcast Control Center ── */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  mb: 3,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveIcon sx={{ color: BRAND, fontSize: 22 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#166534' }}>
                      Flutter Mobile App Broadcast Center
                    </Typography>
                  </Box>
                  <Chip
                    label="Mobile Push Active 📲"
                    size="small"
                    sx={{ bgcolor: '#DCFCE7', color: '#15803D', fontWeight: 800, fontSize: '0.72rem' }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: '#374151', fontSize: '0.85rem', mb: 2 }}>
                  Broadcast instant push updates to the customer&apos;s mobile device and driver tracking screen:
                </Typography>

                {/* Quick Preset Buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  {PUSH_PRESETS.map((p, i) => (
                    <Button
                      key={i}
                      size="small"
                      variant="outlined"
                      disabled={sendingPush}
                      onClick={() => handleSendCustomPush(p.title, p.body)}
                      sx={{
                        borderRadius: '999px',
                        textTransform: 'none',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        bgcolor: '#FFFFFF',
                        borderColor: '#BBF7D0',
                        color: '#166534',
                        '&:hover': { bgcolor: '#DCFCE7', borderColor: BRAND },
                      }}
                    >
                      {p.title}
                    </Button>
                  ))}
                </Box>

                {/* Custom Message Inputs */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr auto' }, gap: 1.5, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Push Title (e.g. Order Update)"
                    value={customPushTitle}
                    onChange={e => setCustomPushTitle(e.target.value)}
                    sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Message to customer's mobile app…"
                    value={customPushBody}
                    onChange={e => setCustomPushBody(e.target.value)}
                    sx={{ bgcolor: '#FFFFFF', '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                  <Button
                    variant="contained"
                    disabled={sendingPush}
                    onClick={() => handleSendCustomPush()}
                    startIcon={sendingPush ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      borderRadius: '10px',
                      textTransform: 'none',
                      fontWeight: 800,
                      bgcolor: BRAND,
                      height: 40,
                      px: 2.5,
                      boxShadow: 'none',
                      '&:hover': { bgcolor: '#2E6121' },
                    }}
                  >
                    {sendingPush ? 'Sending…' : 'Broadcast'}
                  </Button>
                </Box>
              </Box>

              {/* ── Status Change Action Controls ── */}
              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '16px',
                  bgcolor: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  justifyContent: 'space-between',
                  alignItems: { xs: 'stretch', sm: 'center' },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="caption" sx={{ color: '#9CA3AF', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Quick Status Advancement
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    <Button
                      variant={selectedOrder.status === 'PROCESSING' ? 'contained' : 'outlined'}
                      size="small"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: selectedOrder.status === 'PROCESSING' ? '#2563EB' : 'transparent',
                        borderColor: '#2563EB',
                        color: selectedOrder.status === 'PROCESSING' ? '#FFFFFF' : '#2563EB',
                        '&:hover': { bgcolor: '#1D4ED8', color: '#FFFFFF' },
                      }}
                    >
                      🍳 Mark Preparing
                    </Button>

                    <Button
                      variant={selectedOrder.status === 'SHIPPED' ? 'contained' : 'outlined'}
                      size="small"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: selectedOrder.status === 'SHIPPED' ? '#7C3AED' : 'transparent',
                        borderColor: '#7C3AED',
                        color: selectedOrder.status === 'SHIPPED' ? '#FFFFFF' : '#7C3AED',
                        '&:hover': { bgcolor: '#6D28D9', color: '#FFFFFF' },
                      }}
                    >
                      🛵 Mark Dispatched
                    </Button>

                    <Button
                      variant={selectedOrder.status === 'DELIVERED' ? 'contained' : 'outlined'}
                      size="small"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: selectedOrder.status === 'DELIVERED' ? '#16A34A' : 'transparent',
                        borderColor: '#16A34A',
                        color: selectedOrder.status === 'DELIVERED' ? '#FFFFFF' : '#16A34A',
                        '&:hover': { bgcolor: '#15803D', color: '#FFFFFF' },
                      }}
                    >
                      ✅ Mark Delivered
                    </Button>

                    <Button
                      variant={selectedOrder.status === 'CANCELLED' ? 'contained' : 'outlined'}
                      size="small"
                      color="error"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                      sx={{
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                      }}
                    >
                      ❌ Cancel
                    </Button>
                  </Box>
                </Box>

                {/* Grand Total Highlight */}
                <Box
                  sx={{
                    px: 3,
                    py: 1.5,
                    borderRadius: '12px',
                    bgcolor: '#FFFFFF',
                    border: `1.5px solid ${BRAND}`,
                    textAlign: { xs: 'left', sm: 'right' },
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total Payable
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: BRAND, mt: 0.25 }}>
                    {formatPrice(selectedOrder.totalAmount, { country: selectedCountry, address: selectedOrder.shippingAddress })}
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  )
}
