'use client'

import { useState, useEffect } from 'react'

import Box        from '@mui/material/Box'
import Card       from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip       from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider    from '@mui/material/Divider'
import Grid       from '@mui/material/Grid'
import LinearProgress from '@mui/material/LinearProgress'
import Typography from '@mui/material/Typography'

import AttachMoneyOutlinedIcon     from '@mui/icons-material/AttachMoneyOutlined'
import CheckCircleOutlinedIcon     from '@mui/icons-material/CheckCircleOutlined'
import Inventory2OutlinedIcon      from '@mui/icons-material/Inventory2Outlined'
import PendingOutlinedIcon         from '@mui/icons-material/PendingOutlined'
import CancelOutlinedIcon          from '@mui/icons-material/CancelOutlined'
import TrendingUpOutlinedIcon      from '@mui/icons-material/TrendingUpOutlined'
import LocalOfferOutlinedIcon      from '@mui/icons-material/LocalOfferOutlined'
import StorefrontOutlinedIcon      from '@mui/icons-material/StorefrontOutlined'

const BRAND = '#D70F64'

const StatCard = ({ label, value, icon, color, bg, sub }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, height: '100%' }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ p: 1.25, bgcolor: bg, color, borderRadius: 1.5, display: 'flex' }}>
          {icon}
        </Box>
        {sub !== undefined && (
          <Chip label={sub} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, borderRadius: 1, fontSize: 11 }} />
        )}
      </Box>
      <Typography variant="h4" fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
      <Typography variant="body2" color="text.secondary" mt={0.5}>{label}</Typography>
    </CardContent>
  </Card>
)

export default function VendorAnalytics({ vendorId }) {
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!vendorId) return
    const fetchData = async () => {
      try {
        const res  = await fetch(`/api/products?type=products&vendorId=${vendorId}`)
        const data = await res.json()
        if (data.success) setProducts(data.data || [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    fetchData()
  }, [vendorId])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading analytics…</Typography>
      </Box>
    )
  }

  const approved  = products.filter(p => p.approvalStatus === 'Approved')
  const pending   = products.filter(p => p.approvalStatus === 'Pending')
  const rejected  = products.filter(p => p.approvalStatus === 'Rejected')
  const active    = products.filter(p => p.status === true)
  const discounted = products.filter(p => parseFloat(p.discount || 0) > 0)
  const totalRevenue = products.reduce((s, p) => s + parseFloat(p.price || 0) * (p.stock || 0), 0)
  const approvalRate = products.length ? Math.round((approved.length / products.length) * 100) : 0

  // Top products by price
  const topProducts = [...products]
    .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
    .slice(0, 5)

  // Category breakdown
  const catMap = {}
  products.forEach(p => {
    const name = p.category?.name || 'Uncategorised'
    catMap[name] = (catMap[name] || 0) + 1
  })
  const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <StorefrontOutlinedIcon sx={{ color: BRAND, fontSize: 28 }} />
        <Box>
          <Typography variant="h5" fontWeight={700}>Store Analytics</Typography>
          <Typography variant="body2" color="text.secondary">Performance overview for your products</Typography>
        </Box>
      </Box>

      {/* ── Stat cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard label="Total Products" value={products.length}
            icon={<Inventory2OutlinedIcon />} color="#3b82f6" bg="#eff6ff" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Approved" value={approved.length}
            icon={<CheckCircleOutlinedIcon />} color="#10b981" bg="#f0fdf4"
            sub={`${approvalRate}%`} />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Pending Review" value={pending.length}
            icon={<PendingOutlinedIcon />} color="#f59e0b" bg="#fffbeb" />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard label="Stock Value" value={`$${totalRevenue.toFixed(0)}`}
            icon={<AttachMoneyOutlinedIcon />} color="#8b5cf6" bg="#f5f3ff" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* ── Approval breakdown ── */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, height: '100%' }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Approval Status</Typography>
              <Divider sx={{ mb: 2 }} />

              {[
                { label: 'Approved',  count: approved.length,  color: '#10b981', bg: '#f0fdf4' },
                { label: 'Pending',   count: pending.length,   color: '#f59e0b', bg: '#fffbeb' },
                { label: 'Rejected',  count: rejected.length,  color: '#ef4444', bg: '#fef2f2' },
              ].map(({ label, count, color, bg }) => (
                <Box key={label} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 10, height: 10, bgcolor: color, borderRadius: '50%' }} />
                      <Typography variant="body2" fontWeight={600}>{label}</Typography>
                    </Box>
                    <Typography variant="body2" fontWeight={700} color={color}>{count}</Typography>
                  </Box>
                  <LinearProgress variant="determinate"
                    value={products.length ? (count / products.length) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: bg, '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 } }} />
                </Box>
              ))}

              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Active</Typography>
                  <Typography variant="h6" fontWeight={700} color="success.main">{active.length}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">On Sale</Typography>
                  <Typography variant="h6" fontWeight={700} color={BRAND}>{discounted.length}</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" display="block">Rejected</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">{rejected.length}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Category breakdown ── */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>Products by Category</Typography>
              <Divider sx={{ mb: 2 }} />
              {categories.length === 0 ? (
                <Typography color="text.disabled" variant="body2">No category data available.</Typography>
              ) : categories.map(([name, count]) => (
                <Box key={name} sx={{ mb: 1.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">{count} products</Typography>
                  </Box>
                  <LinearProgress variant="determinate"
                    value={products.length ? (count / products.length) * 100 : 0}
                    sx={{ height: 6, borderRadius: 3, bgcolor: '#fce7f3', '& .MuiLinearProgress-bar': { bgcolor: BRAND, borderRadius: 3 } }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Top products ── */}
        <Grid item xs={12}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpOutlinedIcon sx={{ color: BRAND }} />
                <Typography variant="subtitle1" fontWeight={700}>Top Products by Price</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              {topProducts.length === 0 ? (
                <Typography color="text.disabled" variant="body2">No products yet.</Typography>
              ) : topProducts.map((p, i) => (
                <Box key={p.proId} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5,
                  p: 1.5, bgcolor: i === 0 ? '#fce7f3' : 'grey.50', borderRadius: 1 }}>
                  <Box sx={{ width: 44, height: 44, bgcolor: 'white', borderRadius: 1, overflow: 'hidden', flexShrink: 0, border: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.proImages?.[0]
                      ? <img src={p.proImages[0]} alt={p.proName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: 22 }} />}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={700} noWrap>{p.proName}</Typography>
                    <Typography variant="caption" color="text.secondary">{p.category?.name} • Stock: {p.stock || 0}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="body2" fontWeight={800} color={BRAND}>${parseFloat(p.price).toFixed(2)}</Typography>
                    {parseFloat(p.discount || 0) > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
                        <LocalOfferOutlinedIcon sx={{ fontSize: 12, color: 'error.main' }} />
                        <Typography variant="caption" color="error.main" fontWeight={700}>{p.discount}% off</Typography>
                      </Box>
                    )}
                  </Box>
                  <Chip label={p.approvalStatus} size="small" variant="outlined"
                    color={p.approvalStatus === 'Approved' ? 'success' : p.approvalStatus === 'Pending' ? 'warning' : 'error'}
                    sx={{ borderRadius: 0, fontSize: 10, flexShrink: 0 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}
