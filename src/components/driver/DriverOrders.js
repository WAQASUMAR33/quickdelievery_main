'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

import Alert              from '@mui/material/Alert'
import Avatar             from '@mui/material/Avatar'
import Box                from '@mui/material/Box'
import Button             from '@mui/material/Button'
import Card               from '@mui/material/Card'
import CardContent        from '@mui/material/CardContent'
import Chip               from '@mui/material/Chip'
import CircularProgress   from '@mui/material/CircularProgress'
import Divider            from '@mui/material/Divider'
import FormControl        from '@mui/material/FormControl'
import InputLabel         from '@mui/material/InputLabel'
import MenuItem           from '@mui/material/MenuItem'
import Pagination         from '@mui/material/Pagination'
import Select             from '@mui/material/Select'
import Typography         from '@mui/material/Typography'

import AccessTimeOutlinedIcon           from '@mui/icons-material/AccessTimeOutlined'
import AttachMoneyOutlinedIcon          from '@mui/icons-material/AttachMoneyOutlined'
import CallOutlinedIcon                 from '@mui/icons-material/CallOutlined'
import CancelOutlinedIcon               from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon          from '@mui/icons-material/CheckCircleOutlined'
import DeliveryDiningOutlinedIcon       from '@mui/icons-material/DeliveryDiningOutlined'
import HourglassEmptyOutlinedIcon       from '@mui/icons-material/HourglassEmptyOutlined'
import Inventory2OutlinedIcon           from '@mui/icons-material/Inventory2Outlined'
import LocalShippingOutlinedIcon        from '@mui/icons-material/LocalShippingOutlined'
import LocationOnOutlinedIcon           from '@mui/icons-material/LocationOnOutlined'
import PersonOutlinedIcon               from '@mui/icons-material/PersonOutlined'
import ReceiptLongOutlinedIcon          from '@mui/icons-material/ReceiptLongOutlined'
import ShoppingBagOutlinedIcon          from '@mui/icons-material/ShoppingBagOutlined'
import StarIcon                         from '@mui/icons-material/Star'
import StorefrontOutlinedIcon           from '@mui/icons-material/StorefrontOutlined'
import TakeoutDiningOutlinedIcon        from '@mui/icons-material/TakeoutDiningOutlined'

const BRAND = '#D70F64'

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',      bg: '#fff3cd', color: '#856404', icon: <HourglassEmptyOutlinedIcon sx={{ fontSize: 16 }} /> },
  PROCESSING: { label: 'Processing',  bg: '#cce5ff', color: '#004085', icon: <Inventory2OutlinedIcon sx={{ fontSize: 16 }} /> },
  SHIPPED:    { label: 'Out for Delivery', bg: '#e2d9f3', color: '#4a1a8d', icon: <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} /> },
  DELIVERED:  { label: 'Delivered',    bg: '#d4edda', color: '#155724', icon: <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} /> },
  CANCELLED:  { label: 'Cancelled',   bg: '#f8d7da', color: '#721c24', icon: <CancelOutlinedIcon sx={{ fontSize: 16 }} /> },
}

const STATUS_FLOW = {
  PENDING:    { next: 'PROCESSING', label: 'Accept Order',          color: '#3b82f6' },
  PROCESSING: { next: 'SHIPPED',   label: 'Picked Up — En Route',  color: '#8b5cf6' },
  SHIPPED:    { next: 'DELIVERED',  label: 'Mark Delivered',        color: '#10b981' },
}

const formatPrice = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(parseFloat(v) || 0)

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f5f5f5', color: '#555' }
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, borderRadius: 0, fontSize: 11, '& .MuiChip-icon': { color: cfg.color } }}
    />
  )
}

/* ── Helper: extract unique vendor(s) from order items ── */
function getVendorsFromOrder(order) {
  const map = new Map()
  for (const item of (order.orderItems || [])) {
    const v = item.product?.vendor
    if (v && !map.has(v.uid)) {
      map.set(v.uid, v)
    }
  }
  return Array.from(map.values())
}

export default function DriverOrders({ historyMode = false }) {
  const { userData } = useAuth()
  const [orders,       setOrders]       = useState([])
  const [loading,      setLoading]      = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage,  setCurrentPage]  = useState(1)
  const [totalPages,   setTotalPages]   = useState(1)
  const [stats,        setStats]        = useState({})
  const [expandedId,   setExpandedId]   = useState(null)
  const [updatingId,   setUpdatingId]   = useState(null)

  /* ── Fetch orders ── */
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: currentPage.toString(), limit: '20' })
      if (historyMode)  params.set('history', 'true')
      if (statusFilter) params.set('status', statusFilter)
      if (userData?.id) params.set('driverId', userData.id)

      const res  = await fetch(`/api/driver/orders?${params}`)
      const json = await res.json()

      if (json.success) {
        setOrders(json.data || [])
        setTotalPages(json.pagination?.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching driver orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage, statusFilter, historyMode])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  /* ── Compute stats ── */
  useEffect(() => {
    const all = orders
    setStats({
      active:    all.filter(o => ['PENDING', 'PROCESSING', 'SHIPPED'].includes(o.status)).length,
      delivered: all.filter(o => o.status === 'DELIVERED').length,
      earnings:  all.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + (parseFloat(o.serviceCharge) || 0), 0),
      onTime:    all.length ? '98.5%' : '—',
    })
  }, [orders])

  /* ── Update status ── */
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId)
      const res  = await fetch('/api/driver/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Order #${orderId} → ${STATUS_CONFIG[newStatus]?.label || newStatus}`)
        fetchOrders()
      } else {
        toast.error(json.error || 'Update failed')
      }
    } catch {
      toast.error('Failed to update order status')
    } finally {
      setUpdatingId(null)
    }
  }

  /* ── Cancel order ── */
  const handleCancelOrder = async (orderId) => {
    try {
      setUpdatingId(orderId)
      const res  = await fetch('/api/driver/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: 'CANCELLED' }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Order #${orderId} cancelled`)
        fetchOrders()
      } else {
        toast.error(json.error || 'Cancel failed')
      }
    } catch {
      toast.error('Failed to cancel order')
    } finally {
      setUpdatingId(null)
    }
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography variant="body2" color="text.secondary" mt={2}>Loading orders…</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ pb: 4 }}>

      {/* ── Delivery Stat Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Active Assignments',  value: stats.active,                       color: '#3b82f6', icon: <DeliveryDiningOutlinedIcon /> },
          { label: 'Delivered Today',     value: stats.delivered,                    color: '#10b981', icon: <CheckCircleOutlinedIcon /> },
          { label: 'Driver Earnings',     value: formatPrice(stats.earnings || 0),   color: BRAND,     icon: <AttachMoneyOutlinedIcon /> },
          { label: 'On-Time Score',       value: stats.onTime,                       color: '#f59e0b', icon: <StarIcon /> },
        ].map(({ label, value, color, icon }) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>
                    {value}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: `${color}15`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filter Bar ── */}
      {!historyMode && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, mb: 3 }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Filter by Status</InputLabel>
              <Select
                value={statusFilter}
                label="Filter by Status"
                onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
                sx={{ borderRadius: 0 }}
              >
                <MenuItem value="">All Active</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="PROCESSING">Processing</MenuItem>
                <MenuItem value="SHIPPED">Out for Delivery</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              Showing <strong>{orders.length}</strong> order{orders.length !== 1 ? 's' : ''}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* ── Empty State ── */}
      {orders.length === 0 && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 6, textAlign: 'center' }}>
          <ShoppingBagOutlinedIcon sx={{ fontSize: 60, color: 'grey.300', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" fontWeight={600}>
            {historyMode ? 'No delivery history yet' : 'No active deliveries'}
          </Typography>
          <Typography variant="body2" color="text.disabled" mt={1}>
            {historyMode ? 'Completed and cancelled deliveries will appear here.' : 'New delivery assignments will appear here when orders come in.'}
          </Typography>
        </Card>
      )}

      {/* ── Order Cards ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <AnimatePresence>
          {orders.map((order) => {
            const vendors  = getVendorsFromOrder(order)
            const customer = order.user
            const items    = order.orderItems || []
            const isExpanded = expandedId === order.id
            const flow     = STATUS_FLOW[order.status]
            const isUpdating = updatingId === order.id

            const subtotal      = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
            const serviceCharge = parseFloat(order.serviceCharge) || 0
            const total         = parseFloat(order.totalAmount) || (subtotal + serviceCharge)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid',
                    borderColor: isExpanded ? BRAND : 'divider',
                    borderRadius: 0,
                    transition: 'border-color 0.2s',
                    overflow: 'visible',
                  }}
                >
                  {/* ── Card Header (always visible) ── */}
                  <Box
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    sx={{
                      p: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'grey.50' },
                      flexWrap: 'wrap',
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: `${BRAND}15`, color: BRAND, width: 44, height: 44, fontWeight: 800, fontSize: 14, borderRadius: 0 }}>
                        #{order.id}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            Order #{order.id}
                          </Typography>
                          <StatusChip status={order.status} />
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                          <AccessTimeOutlinedIcon sx={{ fontSize: 13 }} />
                          {new Date(order.createdAt).toLocaleString()}
                          {' • '}
                          {items.length} item{items.length !== 1 ? 's' : ''}
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" fontWeight={800} color={BRAND}>
                        {formatPrice(total)}
                      </Typography>
                      <Typography variant="caption" color="text.disabled" sx={{ fontSize: 18 }}>
                        {isExpanded ? '▲' : '▼'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* ── Expanded Details ── */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Divider />
                      <Box sx={{ p: 2.5 }}>

                        {/* ── Pickup & Dropoff Row ── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>

                          {/* PICKUP LOCATION */}
                          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#f0fdf4' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <StorefrontOutlinedIcon sx={{ fontSize: 16, color: 'white' }} />
                              </Box>
                              <Typography variant="subtitle2" fontWeight={700} color="#15803d">
                                PICK-UP LOCATION
                              </Typography>
                            </Box>
                            {vendors.length > 0 ? vendors.map((v) => (
                              <Box key={v.uid} sx={{ mb: 1 }}>
                                <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <StorefrontOutlinedIcon sx={{ fontSize: 15, color: '#16a34a' }} />
                                  {v.username || 'Restaurant / Store'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                                  <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
                                  Vendor Location (Contact store for directions)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                                  {v.phoneNumber && (
                                    <Chip
                                      icon={<CallOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                                      label={v.phoneNumber}
                                      size="small"
                                      variant="outlined"
                                      sx={{ borderRadius: 0, fontSize: 11, fontWeight: 600 }}
                                    />
                                  )}
                                  {v.email && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      ✉ {v.email}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            )) : (
                              <Typography variant="body2" color="text.secondary">No vendor info available</Typography>
                            )}
                          </Box>

                          {/* DROP-OFF LOCATION */}
                          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: '#fef2f2' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <LocationOnOutlinedIcon sx={{ fontSize: 16, color: 'white' }} />
                              </Box>
                              <Typography variant="subtitle2" fontWeight={700} color={BRAND}>
                                DROP-OFF LOCATION
                              </Typography>
                            </Box>
                            <Typography variant="body2" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PersonOutlinedIcon sx={{ fontSize: 15, color: BRAND }} />
                              {customer?.username || 'Customer'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                              <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
                              {order.shippingAddress || 'No delivery address provided'}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                              {customer?.phoneNumber && (
                                <Chip
                                  icon={<CallOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                                  label={customer.phoneNumber}
                                  size="small"
                                  variant="outlined"
                                  color="error"
                                  sx={{ borderRadius: 0, fontSize: 11, fontWeight: 600 }}
                                />
                              )}
                              {customer?.email && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  ✉ {customer.email}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* ── Order Items ── */}
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 2 }}>
                            Order Items
                          </Typography>
                          <Box sx={{ border: '1px solid', borderColor: 'divider' }}>
                            {/* Header */}
                            <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 1, p: 1.5, bgcolor: 'grey.100', borderBottom: '1px solid', borderColor: 'divider' }}>
                              <Typography variant="caption" fontWeight={700} color="text.secondary">ITEM</Typography>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="center">QTY</Typography>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="right">UNIT PRICE</Typography>
                              <Typography variant="caption" fontWeight={700} color="text.secondary" textAlign="right">TOTAL</Typography>
                            </Box>
                            {/* Rows */}
                            {items.map((item, idx) => (
                              <Box
                                key={item.id}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns: '2fr 1fr 1fr 1fr',
                                  gap: 1,
                                  p: 1.5,
                                  alignItems: 'center',
                                  borderBottom: idx < items.length - 1 ? '1px solid' : 'none',
                                  borderColor: 'divider',
                                  '&:hover': { bgcolor: 'grey.50' },
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <TakeoutDiningOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                  <Box>
                                    <Typography variant="body2" fontWeight={600} noWrap>
                                      {item.product?.proName || `Product #${item.productId}`}
                                    </Typography>
                                    {item.product?.category?.name && (
                                      <Typography variant="caption" color="text.disabled">
                                        {item.product.category.name}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                                <Typography variant="body2" fontWeight={600} textAlign="center">
                                  ×{item.quantity}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" textAlign="right">
                                  {formatPrice(item.price)}
                                </Typography>
                                <Typography variant="body2" fontWeight={700} textAlign="right">
                                  {formatPrice(parseFloat(item.price) * item.quantity)}
                                </Typography>
                              </Box>
                            ))}
                          </Box>
                        </Box>

                        {/* ── Pricing Breakdown ── */}
                        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 3 }}>
                          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 2 }}>
                              Price Breakdown
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Subtotal ({items.length} items)</Typography>
                                <Typography variant="body2" fontWeight={600}>{formatPrice(subtotal)}</Typography>
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="body2" color="text.secondary">Service / Delivery Fee</Typography>
                                <Typography variant="body2" fontWeight={600} color="#10b981">{formatPrice(serviceCharge)}</Typography>
                              </Box>
                              <Divider sx={{ my: 0.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="subtitle2" fontWeight={800}>Order Total</Typography>
                                <Typography variant="subtitle2" fontWeight={800} color={BRAND}>{formatPrice(total)}</Typography>
                              </Box>
                            </Box>
                          </Box>

                          <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ borderLeft: '4px solid #10b981', pl: 1.5, mb: 2 }}>
                              Payment & Delivery Info
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Payment Method</Typography>
                                <Chip
                                  label={order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Cash on Delivery' : order.paymentMethod || 'COD'}
                                  size="small"
                                  sx={{ borderRadius: 0, fontSize: 11, fontWeight: 700, bgcolor: '#dbeafe', color: '#1e40af' }}
                                />
                              </Box>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" color="text.secondary">Driver Earnings</Typography>
                                <Typography variant="body2" fontWeight={700} color="#10b981">
                                  {formatPrice(serviceCharge)}
                                </Typography>
                              </Box>
                              {order.trackingNumber && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">Tracking #</Typography>
                                  <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                                    {order.trackingNumber}
                                  </Typography>
                                </Box>
                              )}
                              {order.estimatedDelivery && (
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <Typography variant="body2" color="text.secondary">Est. Delivery</Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {new Date(order.estimatedDelivery).toLocaleString()}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        {/* ── Delivery Status Progress ── */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 2 }}>
                            Delivery Progress
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                            {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].map((step, idx, arr) => {
                              const stepOrder = idx
                              const currentStepOrder = arr.indexOf(order.status)
                              const isDone = stepOrder <= currentStepOrder
                              const isCurrent = step === order.status
                              const cfg = STATUS_CONFIG[step]

                              return (
                                <Box key={step} sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                                  <Box sx={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flex: 'none',
                                  }}>
                                    <Box sx={{
                                      width: 32, height: 32, borderRadius: '50%',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      bgcolor: isDone ? cfg.bg : 'grey.200',
                                      color: isDone ? cfg.color : 'grey.400',
                                      border: isCurrent ? `2px solid ${cfg.color}` : 'none',
                                      transition: 'all 0.3s',
                                    }}>
                                      {cfg.icon}
                                    </Box>
                                    <Typography variant="caption" fontWeight={isDone ? 700 : 400} color={isDone ? 'text.primary' : 'text.disabled'} sx={{ fontSize: 10 }}>
                                      {cfg.label}
                                    </Typography>
                                  </Box>
                                  {idx < arr.length - 1 && (
                                    <Box sx={{
                                      flex: 1, height: 3, mx: 0.5, mt: -1.5,
                                      bgcolor: stepOrder < currentStepOrder ? '#10b981' : 'grey.200',
                                      transition: 'background-color 0.3s',
                                    }} />
                                  )}
                                </Box>
                              )
                            })}
                          </Box>
                        </Box>

                        {/* ── Action Buttons ── */}
                        {!historyMode && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleCancelOrder(order.id)}
                              disabled={isUpdating}
                              startIcon={<CancelOutlinedIcon />}
                              sx={{ borderRadius: 0, fontWeight: 700 }}
                            >
                              Decline / Cancel
                            </Button>
                            {flow && (
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => handleStatusUpdate(order.id, flow.next)}
                                disabled={isUpdating}
                                startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <LocalShippingOutlinedIcon />}
                                sx={{
                                  borderRadius: 0,
                                  bgcolor: flow.color,
                                  fontWeight: 700,
                                  '&:hover': { bgcolor: flow.color, filter: 'brightness(0.9)' },
                                }}
                              >
                                {flow.label}
                              </Button>
                            )}
                          </Box>
                        )}
                      </Box>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </Box>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, v) => setCurrentPage(v)}
            shape="rounded"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: 0 },
              '& .Mui-selected': { bgcolor: `${BRAND} !important`, color: 'white' },
            }}
          />
        </Box>
      )}
    </Box>
  )
}
