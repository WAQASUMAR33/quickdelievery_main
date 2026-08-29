'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import Paper            from '@mui/material/Paper'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import Typography       from '@mui/material/Typography'

import ArrowBackIcon              from '@mui/icons-material/ArrowBack'
import CalendarTodayOutlinedIcon  from '@mui/icons-material/CalendarTodayOutlined'
import CreditCardOutlinedIcon     from '@mui/icons-material/CreditCardOutlined'
import EmailOutlinedIcon          from '@mui/icons-material/EmailOutlined'
import LocationOnOutlinedIcon     from '@mui/icons-material/LocationOnOutlined'
import PhoneOutlinedIcon          from '@mui/icons-material/PhoneOutlined'
import PrintOutlinedIcon          from '@mui/icons-material/PrintOutlined'
import ReceiptLongOutlinedIcon    from '@mui/icons-material/ReceiptLongOutlined'

import { formatPrice } from '@/lib/currency'

const BRAND = '#39772A'

const STATUS_STYLES = {
  PENDING:    { bg: '#fff3cd', color: '#856404' },
  PROCESSING: { bg: '#cce5ff', color: '#004085' },
  SHIPPED:    { bg: '#e2d9f3', color: '#4a1a8d' },
  DELIVERED:  { bg: '#d4edda', color: '#155724' },
  CANCELLED:  { bg: '#f8d7da', color: '#721c24' },
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

export default function VendorOrderDetailsPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const { user, userData, loading: authLoading } = useAuth()
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['VENDOR', 'ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) router.push(access.redirectTo)
    }
  }, [user, userData, authLoading, router])

  useEffect(() => {
    if (!id) return
    const fetchOrder = async () => {
      try {
        const res  = await fetch(`/api/orders/${id}`)
        const data = await res.json()
        if (data.success) setOrder(data.data)
      } catch (err) {
        console.error('Error fetching order:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [id])

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading order…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  if (!order) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
          <ReceiptLongOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
          <Typography variant="h5" fontWeight={700}>Order Not Found</Typography>
          <Button variant="contained" onClick={() => router.back()}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e6121' }, borderRadius: 0 }}>
            Go Back
          </Button>
        </Box>
      </DashboardLayout>
    )
  }

  const sc = STATUS_STYLES[order.status] || { bg: '#f5f5f5', color: '#555' }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* ── Navigation ── */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => router.back()}
            sx={{ color: 'text.secondary', textTransform: 'none', borderRadius: 0 }}>
            Back to Orders
          </Button>
          <Button variant="outlined" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}
            sx={{ borderRadius: 0, textTransform: 'none', color: BRAND, borderColor: BRAND, '&:hover': { borderColor: BRAND, bgcolor: `${BRAND}10` } }}>
            Print Invoice
          </Button>
        </Box>

        {/* ── Invoice Paper ── */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 4, bgcolor: 'background.paper' }}>

          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" fontWeight={800} sx={{ color: BRAND, letterSpacing: -0.5 }}>
                QUICK DELIVERY
              </Typography>
              <Typography variant="caption" color="text.secondary">Fast & Fresh Delivery System</Typography>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="h6" fontWeight={700}>INVOICE</Typography>
              <Typography variant="body2" color="text.secondary" fontFamily="monospace">
                #{order.id.toString().padStart(6, '0')}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Chip label={order.status} size="small"
                  sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, borderRadius: 0, fontSize: 11 }} />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }} />

          {/* Info grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
            {/* Customer Details */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Billed To
              </Typography>
              <Typography variant="body1" fontWeight={700} mt={0.5}>
                {order.user?.username || 'Customer'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                <EmailOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2">{order.user?.email || '—'}</Typography>
              </Box>
              {order.user?.phoneNumber && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                  <PhoneOutlinedIcon sx={{ fontSize: 14 }} />
                  <Typography variant="body2">{order.user.phoneNumber}</Typography>
                </Box>
              )}
            </Box>

            {/* Shipping Address */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Delivery Address
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                <LocationOnOutlinedIcon sx={{ fontSize: 14, mt: 0.25 }} />
                <Typography variant="body2">
                  {order.shippingAddress || 'No address provided'}
                </Typography>
              </Box>
            </Box>

            {/* Order Meta */}
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Order Info
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2">Date: {formatDate(order.createdAt)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, color: 'text.secondary' }}>
                <CreditCardOutlinedIcon sx={{ fontSize: 14 }} />
                <Typography variant="body2">Payment: {order.paymentMethod || 'Cash On Delivery'}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Items Table */}
          <Box sx={{ mb: 4 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Product', 'Category', 'Qty', 'Unit Price', 'Total'].map((h, i) => (
                    <TableCell key={h} align={i >= 2 ? 'right' : 'left'}
                      sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {order.orderItems?.map((item, i) => (
                  <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{item.product?.proName || 'Unknown Product'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{item.product?.category?.name || '—'}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{item.quantity}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatPrice(item.price, { address: order.shippingAddress })}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {formatPrice(parseFloat(item.price) * item.quantity, { address: order.shippingAddress })}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Totals */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box sx={{ width: { xs: '100%', md: '35%' } }}>
              {[
                { label: 'Subtotal', value: formatPrice(parseFloat(order.totalAmount), { address: order.shippingAddress }) },
                { label: 'Tax (0%)', value: formatPrice(0, { address: order.shippingAddress }) },
                { label: 'Shipping', value: 'Free' },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{label}</Typography>
                  <Typography variant="body2">{value}</Typography>
                </Box>
              ))}
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight={700}>Total</Typography>
                <Typography variant="h6" fontWeight={800} sx={{ color: BRAND }}>
                  {formatPrice(parseFloat(order.totalAmount), { address: order.shippingAddress })}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer */}
          <Box sx={{ mt: 5, pt: 3, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">Thank you for your business!</Typography>
            <Typography variant="caption" color="text.disabled">
              Quick Delivery Platform &bull; Customer Support &bull; orders@quickdelivery.com
            </Typography>
          </Box>

        </Paper>
      </Box>
    </DashboardLayout>
  )
}
