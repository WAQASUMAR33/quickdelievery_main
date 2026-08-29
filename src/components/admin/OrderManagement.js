'use client'

import { useState, useEffect, useCallback } from 'react'
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
import Grid             from '@mui/material/Grid'
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

import CancelOutlinedIcon       from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon                from '@mui/icons-material/Close'
import EmailOutlinedIcon        from '@mui/icons-material/EmailOutlined'
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import LocationOnOutlinedIcon   from '@mui/icons-material/LocationOnOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import OpenInNewOutlinedIcon    from '@mui/icons-material/OpenInNewOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import SendOutlinedIcon         from '@mui/icons-material/SendOutlined'
import ShoppingBagOutlinedIcon  from '@mui/icons-material/ShoppingBagOutlined'

import { formatPrice, COUNTRY_CURRENCIES, getActiveCountry, setActiveCountry } from '@/lib/currency'

const BRAND      = '#39772A'
const DROP_MIN_W = 300

const STATUS_CONFIG = {
  PENDING:    { label: 'Pending',    bg: '#fff3cd', color: '#856404', icon: <HourglassEmptyOutlinedIcon sx={{ fontSize: 18 }} /> },
  PROCESSING: { label: 'Preparing', bg: '#cce5ff', color: '#004085', icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} /> },
  SHIPPED:    { label: 'Dispatched', bg: '#e2d9f3', color: '#4a1a8d', icon: <LocalShippingOutlinedIcon sx={{ fontSize: 18 }} /> },
  DELIVERED:  { label: 'Delivered',  bg: '#d4edda', color: '#155724', icon: <CheckCircleOutlinedIcon sx={{ fontSize: 18 }} /> },
  CANCELLED:  { label: 'Cancelled',  bg: '#f8d7da', color: '#721c24', icon: <CancelOutlinedIcon sx={{ fontSize: 18 }} /> },
}

function StatusChip({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f5f5f5', color: '#555' }
  return (
    <Chip
      label={cfg.label}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, borderRadius: 0, fontSize: 11 }}
    />
  )
}

const STAT_CARDS = [
  { key: 'totalOrders',      label: 'Total Orders', color: '#3b82f6', icon: <ShoppingBagOutlinedIcon /> },
  { key: 'pendingOrders',    label: 'Pending',      color: '#f59e0b', icon: <HourglassEmptyOutlinedIcon /> },
  { key: 'processingOrders', label: 'Processing',   color: '#3b82f6', icon: <Inventory2OutlinedIcon /> },
  { key: 'shippedOrders',    label: 'Shipped',      color: '#8b5cf6', icon: <LocalShippingOutlinedIcon /> },
  { key: 'deliveredOrders',  label: 'Delivered',    color: '#10b981', icon: <CheckCircleOutlinedIcon /> },
  { key: 'cancelledOrders',  label: 'Cancelled',    color: '#ef4444', icon: <CancelOutlinedIcon /> },
]

export default function OrderManagement({ defaultStatusFilter = '', vendorId = '' }) {
  const router = useRouter()

  const [orders,        setOrders]        = useState([])
  const [loading,       setLoading]       = useState(true)
  const [searchTerm,    setSearchTerm]    = useState('')
  const [statusFilter,  setStatusFilter]  = useState(defaultStatusFilter)
  const [verticalFilter, setVerticalFilter] = useState('')
  const [selectedCountry, setSelectedCountry] = useState(getActiveCountry())
  const [currentPage,   setCurrentPage]   = useState(1)
  const [totalPages,    setTotalPages]    = useState(1)
  const [stats,         setStats]         = useState({})
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal,     setShowModal]     = useState(false)

  useEffect(() => {
    const handler = () => setSelectedCountry(getActiveCountry())
    window.addEventListener('currency_change', handler)
    return () => window.removeEventListener('currency_change', handler)
  }, [])

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page:   currentPage.toString(),
        limit:  '10',
        search: searchTerm,
        status: statusFilter,
      })
      if (verticalFilter) params.set('vertical', verticalFilter)
      if (vendorId) params.set('vendorId', vendorId)
      const res  = await fetch(`/api/orders?${params}`)
      const data = await res.json()
      if (data.success) {
        setOrders(Array.isArray(data.data) ? data.data : [])
        setTotalPages(data.pagination?.pages || 1)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, statusFilter, verticalFilter, vendorId])


  useEffect(() => { fetchOrders() }, [fetchOrders])

  useEffect(() => {
    if (!orders.length) return
    setStats({
      totalOrders:      orders.length,
      pendingOrders:    orders.filter(o => o.status === 'PENDING').length,
      processingOrders: orders.filter(o => o.status === 'PROCESSING').length,
      shippedOrders:    orders.filter(o => o.status === 'SHIPPED').length,
      deliveredOrders:  orders.filter(o => o.status === 'DELIVERED').length,
      cancelledOrders:  orders.filter(o => o.status === 'CANCELLED').length,
    })
  }, [orders])

  const handleViewDetails = (order) => {
    openModal(order)
  }

  const [customPushTitle, setCustomPushTitle] = useState('')
  const [customPushBody, setCustomPushBody]   = useState('')
  const [sendingPush, setSendingPush]         = useState(false)
  const [updatingStatus, setUpdatingStatus]   = useState(false)

  const openModal = (order) => {
    setSelectedOrder(order)
    setCustomPushTitle('')
    setCustomPushBody('')
    setShowModal(true)
  }

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
        toast.success(`Order #${orderId} marked as ${label} & Push Notification sent to Flutter app! 📲`)
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

  const handleSendCustomPush = async () => {
    if (!selectedOrder) return
    if (!customPushTitle.trim() || !customPushBody.trim()) {
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
          title: customPushTitle.trim(),
          body: customPushBody.trim(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Push notification broadcasted to Flutter app! 🚀')
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

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter(defaultStatusFilter)
    setCurrentPage(1)
  }

  return (
    <Box>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Order Management</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Manage and track all customer orders
        </Typography>
      </Box>

      {/* ── Stats Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${STAT_CARDS.length}, 1fr)` }, gap: 2.5, mb: 3 }}>
        {STAT_CARDS.map(({ key, label, color, icon }) => (
          <Card key={key} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h5" fontWeight={800} sx={{ color, mt: 0.5 }}>
                    {stats[key] || 0}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: `${color}18`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search orders, customers…"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Order Type</InputLabel>
          <Select
            value={verticalFilter}
            label="Order Type"
            onChange={e => { setVerticalFilter(e.target.value); setCurrentPage(1) }}
            sx={{ borderRadius: 0 }}
          >
            <MenuItem value="">All (Food & Grocery)</MenuItem>
            <MenuItem value="FOOD">🍽️ Food Orders</MenuItem>
            <MenuItem value="GROCERY">🏬 Grocery Orders</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
          <InputLabel>Order Status</InputLabel>
          <Select
            value={statusFilter}
            label="Order Status"
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }}
            sx={{ borderRadius: 0 }}
          >
            <MenuItem value="">All Statuses</MenuItem>
            <MenuItem value="PENDING">Pending</MenuItem>
            <MenuItem value="PROCESSING">Processing</MenuItem>
            <MenuItem value="SHIPPED">Shipped</MenuItem>
            <MenuItem value="DELIVERED">Delivered</MenuItem>
            <MenuItem value="CANCELLED">Cancelled</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel>Country / Currency</InputLabel>
          <Select
            value={selectedCountry}
            label="Country / Currency"
            onChange={e => {
              const val = e.target.value
              setSelectedCountry(val)
              setActiveCountry(val)
            }}
            sx={{ borderRadius: 0 }}
          >
            <MenuItem value="PK">🇵🇰 Pakistan (Rs. PKR)</MenuItem>
            <MenuItem value="US">🇺🇸 America ($ USD)</MenuItem>
            <MenuItem value="AE">🇦🇪 UAE (AED)</MenuItem>
            <MenuItem value="SA">🇸🇦 Saudi Arabia (SAR)</MenuItem>
            <MenuItem value="GB">🇬🇧 UK (£ GBP)</MenuItem>
            <MenuItem value="CA">🇨🇦 Canada (CA$ CAD)</MenuItem>
            <MenuItem value="IN">🇮🇳 India (₹ INR)</MenuItem>
            <MenuItem value="EU">🇪🇺 Europe (€ EUR)</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" size="small" onClick={clearFilters}
          sx={{ borderRadius: 0, color: 'text.secondary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
          Clear Filters
        </Button>

        <Chip
          label={`${orders.length} orders`}
          size="small"
          sx={{ bgcolor: '#D8E9D6', color: BRAND, fontWeight: 700, borderRadius: 0 }}
        />
      </Box>

      {/* ── Orders Table ── */}
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['Order ID', 'Type', 'Customer', 'Email', 'Items', 'Total', 'Status', 'Date', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>


          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={28} sx={{ color: BRAND }} />
                  <Typography variant="body2" color="text.secondary" mt={1}>Loading orders…</Typography>
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', py: 8 }}>
                  <ShoppingBagOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No orders found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  onClick={() => openModal(order)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'rgba(57, 119, 42, 0.04)' } }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                      #{order.id.toString().padStart(6, '0')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={order.vertical === 'GROCERY' ? '🏬 Grocery' : '🍽️ Food'}
                      size="small"
                      sx={{
                        borderRadius: 1,
                        fontSize: 11,
                        fontWeight: 600,
                        bgcolor: order.vertical === 'GROCERY' ? '#FCE4EC' : '#E8F5E9',
                        color: order.vertical === 'GROCERY' ? '#C2185B' : '#2E7D32'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{order.user?.username || 'N/A'}</Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <EmailOutlinedIcon sx={{ fontSize: 13 }} />
                      <Typography variant="caption">{order.user?.email || '—'}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{order.orderItems?.length || 0} item(s)</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600} sx={{ color: BRAND }}>
                      {formatPrice(order.totalAmount, { country: selectedCountry, address: order.shippingAddress })}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={order.status} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <Tooltip title="Manage Order Details">
                        <IconButton size="small" onClick={() => openModal(order)} sx={{ color: BRAND }}>
                          <OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>

                      {/* Quick Status update buttons for Admin & Vendor */}
                      {order.status === 'PENDING' && (
                        <>
                          <Tooltip title="Mark Preparing">
                            <IconButton size="small" disabled={updatingStatus} onClick={() => handleUpdateStatus(order.id, 'PROCESSING')} sx={{ color: '#004085' }}>
                              <Inventory2OutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Cancel Order">
                            <IconButton size="small" disabled={updatingStatus} onClick={() => handleUpdateStatus(order.id, 'CANCELLED')} sx={{ color: 'error.main' }}>
                              <CancelOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}

                      {order.status === 'PROCESSING' && (
                        <Tooltip title="Mark Dispatched">
                          <IconButton size="small" disabled={updatingStatus} onClick={() => handleUpdateStatus(order.id, 'SHIPPED')} sx={{ color: '#4a1a8d' }}>
                            <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}

                      {order.status === 'SHIPPED' && (
                        <Tooltip title="Mark Delivered">
                          <IconButton size="small" disabled={updatingStatus} onClick={() => handleUpdateStatus(order.id, 'DELIVERED')} sx={{ color: '#155724' }}>
                            <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, val) => setCurrentPage(val)}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: 0 },
              '& .Mui-selected': { bgcolor: BRAND, color: 'white', '&:hover': { bgcolor: '#b00d52' } },
            }}
          />
        </Box>
      )}

      {/* ── Order Detail Dialog ── */}
      <Dialog
        open={showModal}
        onClose={() => setShowModal(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, height: '90vh', display: 'flex', flexDirection: 'column' } }}
      >
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Order Details</Typography>
                <Typography variant="caption" color="text.secondary">
                  #{selectedOrder.id.toString().padStart(6, '0')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<OpenInNewOutlinedIcon sx={{ fontSize: 16 }} />}
                  onClick={() => {
                    const path = vendorId 
                      ? `/vendor/dashboard/orders/${selectedOrder.id}` 
                      : `/admin/dashboard/orders/${selectedOrder.id}`
                    router.push(path)
                  }}
                  sx={{ borderRadius: 0, textTransform: 'none', color: BRAND, borderColor: BRAND }}
                >
                  Full Invoice
                </Button>
                <IconButton size="small" onClick={() => setShowModal(false)}><CloseIcon /></IconButton>
              </Box>
            </DialogTitle>
            <Divider />

            <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0 }}>
              {/* Order meta grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                {[
                  { label: 'Order ID',       value: `#${selectedOrder.id.toString().padStart(6, '0')}` },
                  { label: 'Status',         value: <StatusChip status={selectedOrder.status} /> },
                  { label: 'Date',           value: new Date(selectedOrder.createdAt).toLocaleString() },
                  { label: 'Payment',        value: selectedOrder.paymentMethod || 'Cash On Delivery' },
                  { label: 'Total Amount',   value: <Typography variant="body2" fontWeight={700} sx={{ color: BRAND }}>{formatPrice(selectedOrder.totalAmount, { country: selectedCountry, address: selectedOrder.shippingAddress })}</Typography> },
                  { label: 'Items',          value: `${selectedOrder.orderItems?.length || 0} item(s)` },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ p: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
                    <Box mt={0.5}>
                      {typeof value === 'string'
                        ? <Typography variant="body2" fontWeight={600}>{value}</Typography>
                        : value}
                    </Box>
                  </Box>
                ))}
              </Box>

              {/* Customer info */}
              <Box sx={{ mb: 3, p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5} textTransform="uppercase" letterSpacing={0.5} color="text.secondary">
                  Customer Information
                </Typography>
                <Typography variant="body2" fontWeight={600}>{selectedOrder.user?.username || 'N/A'}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                  <EmailOutlinedIcon sx={{ fontSize: 14 }} />
                  <Typography variant="body2">{selectedOrder.user?.email || 'N/A'}</Typography>
                </Box>
                {selectedOrder.shippingAddress && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 14, mt: 0.25 }} />
                    <Typography variant="body2">{selectedOrder.shippingAddress}</Typography>
                  </Box>
                )}
              </Box>

              {/* Order items */}
              <Typography variant="subtitle2" fontWeight={700} mb={1.5} textTransform="uppercase" letterSpacing={0.5} color="text.secondary">
                Order Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Product', 'Category', 'Qty', 'Unit Price', 'Subtotal'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', py: 1.5 }}>
                        {h}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedOrder.orderItems?.map((item, i) => (
                    <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {item.product?.proImages?.[0] && (
                            <Box
                              component="img"
                              src={item.product.proImages[0]}
                              alt={item.product.proName}
                              sx={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid', borderColor: 'divider' }}
                            />
                          )}
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{item.product?.proName || 'Unknown'}</Typography>
                            {item.variationJson && (
                              <Typography variant="caption" sx={{ color: BRAND, fontWeight: 600, display: 'block' }}>
                                Var: {JSON.parse(item.variationJson).name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{item.product?.category?.name || '—'}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="body2">{item.quantity}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{formatPrice(item.price, { country: selectedCountry, address: selectedOrder.shippingAddress })}</Typography></TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatPrice(parseFloat(item.price) * item.quantity, { country: selectedCountry, address: selectedOrder.shippingAddress })}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Push Notification & Status Update Controls */}
              <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NotificationsActiveOutlinedIcon sx={{ color: BRAND, fontSize: 22 }} />
                    <Typography variant="subtitle2" fontWeight={800} color="#166534">
                      Order Status & Push Notification (Flutter Mobile App)
                    </Typography>
                  </Box>
                  <Chip
                    label="Push Enabled 📲"
                    size="small"
                    sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 11 }}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Updating the status below will automatically broadcast a push notification to the customer's Flutter app and subscribed topic:
                </Typography>

                {/* Quick Status Buttons */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2.5 }}>
                  <Button
                    variant={selectedOrder.status === 'PROCESSING' ? 'contained' : 'outlined'}
                    size="small"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                    sx={{
                      borderRadius: 0,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: selectedOrder.status === 'PROCESSING' ? '#004085' : 'transparent',
                      borderColor: '#004085',
                      color: selectedOrder.status === 'PROCESSING' ? '#fff' : '#004085',
                      '&:hover': { bgcolor: '#004085', color: '#fff' },
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
                      borderRadius: 0,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: selectedOrder.status === 'SHIPPED' ? '#4a1a8d' : 'transparent',
                      borderColor: '#4a1a8d',
                      color: selectedOrder.status === 'SHIPPED' ? '#fff' : '#4a1a8d',
                      '&:hover': { bgcolor: '#4a1a8d', color: '#fff' },
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
                      borderRadius: 0,
                      textTransform: 'none',
                      fontWeight: 700,
                      bgcolor: selectedOrder.status === 'DELIVERED' ? '#155724' : 'transparent',
                      borderColor: '#155724',
                      color: selectedOrder.status === 'DELIVERED' ? '#fff' : '#155724',
                      '&:hover': { bgcolor: '#155724', color: '#fff' },
                    }}
                  >
                    🎉 Mark Delivered
                  </Button>

                  <Button
                    variant={selectedOrder.status === 'CANCELLED' ? 'contained' : 'outlined'}
                    size="small"
                    color="error"
                    disabled={updatingStatus}
                    onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                    sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
                  >
                    ❌ Cancel Order
                  </Button>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Custom Push Broadcast Form */}
                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5} display="block" mb={1}>
                  Send Custom Push Notification to Customer:
                </Typography>

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 2fr auto' }, gap: 1.5, alignItems: 'center' }}>
                  <TextField
                    size="small"
                    placeholder="Title (e.g. Order Update)"
                    value={customPushTitle}
                    onChange={e => setCustomPushTitle(e.target.value)}
                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Message (e.g. Driver is waiting outside!)"
                    value={customPushBody}
                    onChange={e => setCustomPushBody(e.target.value)}
                    sx={{ bgcolor: '#fff', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                  <Button
                    variant="contained"
                    size="small"
                    disabled={sendingPush}
                    onClick={handleSendCustomPush}
                    startIcon={sendingPush ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon sx={{ fontSize: 16 }} />}
                    sx={{
                      bgcolor: BRAND,
                      '&:hover': { bgcolor: '#2e6121' },
                      borderRadius: 0,
                      textTransform: 'none',
                      whiteSpace: 'nowrap',
                      height: 40,
                      fontWeight: 700,
                    }}
                  >
                    {sendingPush ? 'Sending...' : 'Send Push'}
                  </Button>
                </Box>
              </Box>

              {/* Total row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                
                {/* Action Buttons in Modal */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {selectedOrder.status === 'PENDING' && (
                    <>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'PROCESSING')}
                        sx={{ bgcolor: '#004085', '&:hover': { bgcolor: '#002752' }, borderRadius: 0, textTransform: 'none', boxShadow: 'none' }}
                      >
                        Accept & Prepare
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        disabled={updatingStatus}
                        onClick={() => handleUpdateStatus(selectedOrder.id, 'CANCELLED')}
                        sx={{ borderRadius: 0, textTransform: 'none' }}
                      >
                        Reject Order
                      </Button>
                    </>
                  )}
                  {selectedOrder.status === 'PROCESSING' && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'SHIPPED')}
                      sx={{ bgcolor: '#4a1a8d', '&:hover': { bgcolor: '#320f63' }, borderRadius: 0, textTransform: 'none', boxShadow: 'none' }}
                    >
                      🛵 Mark Dispatched
                    </Button>
                  )}
                  {selectedOrder.status === 'SHIPPED' && (
                    <Button
                      variant="contained"
                      size="small"
                      disabled={updatingStatus}
                      onClick={() => handleUpdateStatus(selectedOrder.id, 'DELIVERED')}
                      sx={{ bgcolor: '#155724', '&:hover': { bgcolor: '#0b3514' }, borderRadius: 0, textTransform: 'none', boxShadow: 'none' }}
                    >
                      🎉 Mark Delivered
                    </Button>
                  )}
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: `${BRAND}10`, border: '1px solid', borderColor: `${BRAND}30` }}>
                  <Typography variant="subtitle2" fontWeight={700}>Total Amount:</Typography>
                  <Typography variant="h6" fontWeight={800} sx={{ color: BRAND }}>
                    {formatPrice(selectedOrder.totalAmount, { country: selectedCountry, address: selectedOrder.shippingAddress })}
                  </Typography>
                </Box>
              </Box>            </DialogContent>
          </>
        )}
      </Dialog>

    </Box>
  )
}
