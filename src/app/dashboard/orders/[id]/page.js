'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'

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

const BRAND = '#D70F64'

const STATUS_STYLES = {
  PENDING:    { bg: '#fff3cd', color: '#856404' },
  PROCESSING: { bg: '#cce5ff', color: '#004085' },
  SHIPPED:    { bg: '#e2d9f3', color: '#4a1a8d' },
  DELIVERED:  { bg: '#d4edda', color: '#155724' },
  CANCELLED:  { bg: '#f8d7da', color: '#721c24' },
}

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

const formatPrice = (price) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price || 0)

export default function OrderDetailsPage() {
  const { id }   = useParams()
  const router   = useRouter()
  const [order,   setOrder]   = useState(null)
  const [loading, setLoading] = useState(true)

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

  if (loading) {
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
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
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
            sx={{ color: 'text.secondary', '&:hover': { bgcolor: 'grey.100' }, borderRadius: 0 }}>
            Back to Orders
          </Button>
          <Button variant="contained" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
            Print Invoice
          </Button>
        </Box>

        {/* ── Invoice Paper ── */}
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, maxWidth: 900, mx: 'auto', overflow: 'hidden' }}>

          {/* Header band */}
          <Box sx={{ bgcolor: BRAND, px: 4, py: 4, color: 'white' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="h4" fontWeight={800} letterSpacing={3}>INVOICE</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>
                  #{order.id.toString().padStart(6, '0')}
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight={700}>Quick Delivery</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>123 Delivery Street</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>City, State, ZIP</Typography>
              </Box>
            </Box>
          </Box>

          {/* Body */}
          <Box sx={{ p: 4 }}>

            {/* Bill To + Order Meta */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, mb: 4 }}>

              {/* Bill To */}
              <Box>
                <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.5 }}>
                  Bill To
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} mt={0.5}>{order.user?.username || 'N/A'}</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, color: 'text.secondary' }}>
                  <EmailOutlinedIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{order.user?.email || 'N/A'}</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, color: 'text.secondary' }}>
                  <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
                  <Typography variant="body2">{order.user?.phoneNumber || 'N/A'}</Typography>
                </Box>
                {order.shippingAddress && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mt: 0.5, color: 'text.secondary' }}>
                    <LocationOnOutlinedIcon sx={{ fontSize: 15, mt: 0.25 }} />
                    <Typography variant="body2">{order.shippingAddress}</Typography>
                  </Box>
                )}
              </Box>

              {/* Order Meta */}
              <Box>
                {[
                  { icon: <CalendarTodayOutlinedIcon sx={{ fontSize: 14 }} />, label: 'Order Date',      value: formatDate(order.createdAt) },
                  { icon: null,                                                 label: 'Order Status',    value: <Chip label={order.status} size="small" sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, borderRadius: 0, fontSize: 11 }} /> },
                  { icon: <CreditCardOutlinedIcon sx={{ fontSize: 14 }} />,    label: 'Payment Method', value: order.paymentMethod || 'Cash On Delivery' },
                ].map(({ icon, label, value }) => (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'text.secondary' }}>
                      {icon}
                      <Typography variant="body2">{label}</Typography>
                    </Box>
                    {typeof value === 'string'
                      ? <Typography variant="body2" fontWeight={600}>{value}</Typography>
                      : value}
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Items Table */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ letterSpacing: 1.5, display: 'block', mb: 1.5 }}>
                Order Items
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.50' }}>
                    {['Item Description', 'Category', 'Qty', 'Unit Price', 'Total'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: 'text.secondary', py: 1.5 }}>
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
                      <TableCell>
                        <Typography variant="body2">{item.quantity}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatPrice(parseFloat(item.price))}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {formatPrice(parseFloat(item.price) * item.quantity)}
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
                  { label: 'Subtotal', value: formatPrice(parseFloat(order.totalAmount)) },
                  { label: 'Tax (0%)', value: '$0.00' },
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
                    {formatPrice(parseFloat(order.totalAmount))}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box sx={{ mt: 5, pt: 3, borderTop: '1px dashed', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Thank you for your business!</Typography>
              <Typography variant="caption" color="text.disabled">
                For questions, contact support@quickdelivery.com
              </Typography>
            </Box>

          </Box>
        </Paper>

      </Box>
    </DashboardLayout>
  )
}
