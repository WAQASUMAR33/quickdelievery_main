'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import CardMedia        from '@mui/material/CardMedia'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl      from '@mui/material/FormControl'
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Paper            from '@mui/material/Paper'
import Select           from '@mui/material/Select'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import ToggleButton     from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AddIcon                  from '@mui/icons-material/Add'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon       from '@mui/icons-material/CancelOutlined'
import GridViewOutlinedIcon     from '@mui/icons-material/GridViewOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import LocalOfferOutlinedIcon   from '@mui/icons-material/LocalOfferOutlined'
import PendingOutlinedIcon      from '@mui/icons-material/PendingOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import TableRowsOutlinedIcon    from '@mui/icons-material/TableRowsOutlined'
import TrendingUpIcon           from '@mui/icons-material/TrendingUp'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'

const BRAND = '#D70F64'
const DROP_MIN_W = 300

const ApprovalChip = ({ status }) => {
  if (status === 'Approved') return <Chip label="Approved" size="small" icon={<CheckCircleOutlinedIcon />} color="success" variant="outlined" sx={{ borderRadius: 0 }} />
  if (status === 'Pending')  return <Chip label="Pending"  size="small" icon={<PendingOutlinedIcon />}      color="warning" variant="outlined" sx={{ borderRadius: 0 }} />
  if (status === 'Rejected') return <Chip label="Rejected" size="small" icon={<CancelOutlinedIcon />}       color="error"   variant="outlined" sx={{ borderRadius: 0 }} />
  return <Chip label={status || '—'} size="small" variant="outlined" sx={{ borderRadius: 0 }} />
}

export default function ProductManagementPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterApproval, setFilterApproval] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [viewMode, setViewMode] = useState('table')

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'VENDOR'])
      if (!access.hasAccess) { router.push(access.redirectTo); return }
      fetchProducts()
    }
  }, [user, userData, loading, router])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?type=products')
      const data = await res.json()
      if (data.success) setProducts(data.data || [])
    } catch (e) { console.error(e) }
    finally { setLoadingProducts(false) }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading…</Typography>
      </Box>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'VENDOR'])
  if (!access.hasAccess) return null

  const filtered = products.filter(p => {
    const matchSearch = p.proName?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchApproval = filterApproval === 'all' || p.approvalStatus === filterApproval
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && p.status) ||
      (filterStatus === 'inactive' && !p.status)
    return matchSearch && matchApproval && matchStatus
  })

  // Stats
  const stats = [
    { label: 'Total Products',  value: products.length,                                           icon: <Inventory2OutlinedIcon />, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Approved',        value: products.filter(p => p.approvalStatus === 'Approved').length, icon: <CheckCircleOutlinedIcon />, color: '#10b981', bg: '#f0fdf4' },
    { label: 'Pending',         value: products.filter(p => p.approvalStatus === 'Pending').length,  icon: <PendingOutlinedIcon />,    color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Total Value',     value: `$${products.reduce((s, p) => s + parseFloat(p.price || 0) * (p.stock || 0), 0).toFixed(0)}`, icon: <TrendingUpIcon />, color: '#8b5cf6', bg: '#f5f3ff' },
  ]

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Product Management</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Manage your product inventory
            </Typography>
          </Box>
          <Button component={Link} href="/admin/dashboard/products/add" variant="contained" startIcon={<AddIcon />}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, px: 3 }}>
            Add Product
          </Button>
        </Box>

        {/* ── Stats ── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {stats.map((s, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" display="block">{s.label}</Typography>
                      <Typography variant="h5" fontWeight={700} color={s.color}>{s.value}</Typography>
                    </Box>
                    <Box sx={{ p: 1, bgcolor: s.bg, color: s.color, borderRadius: 1, display: 'flex' }}>
                      {s.icon}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* ── Filters ── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', mb: 3, p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flex: 1 }}>
            {/* Search */}
            <TextField size="small" placeholder="Search products…"
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: DROP_MIN_W, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />

            {/* Approval filter */}
            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Approval Status</InputLabel>
              <Select value={filterApproval} label="Approval Status"
                onChange={e => setFilterApproval(e.target.value)} sx={{ borderRadius: 0 }}>
                <MenuItem value="all">All Approval</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            {/* Status filter */}
            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status"
                onChange={e => setFilterStatus(e.target.value)} sx={{ borderRadius: 0 }}>
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* View toggle */}
          <ToggleButtonGroup value={viewMode} exclusive size="small"
            onChange={(_, v) => v && setViewMode(v)}
            sx={{ '& .MuiToggleButton-root': { borderRadius: 0 } }}>
            <ToggleButton value="grid"><Tooltip title="Grid"><GridViewOutlinedIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="table"><Tooltip title="Table"><TableRowsOutlinedIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* ── Count row ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <Chip label={`${filtered.length} products`} size="small" sx={{ bgcolor: '#fce7f3', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
          {searchQuery && <Chip label={`"${searchQuery}"`} size="small" variant="outlined" onDelete={() => setSearchQuery('')} sx={{ borderRadius: 0 }} />}
          {filterApproval !== 'all' && <Chip label={filterApproval} size="small" variant="outlined" onDelete={() => setFilterApproval('all')} sx={{ borderRadius: 0 }} />}
          {filterStatus !== 'all' && <Chip label={filterStatus} size="small" variant="outlined" onDelete={() => setFilterStatus('all')} sx={{ borderRadius: 0 }} />}
        </Box>

        {/* ── Content ── */}
        {loadingProducts ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
            <CircularProgress size={28} sx={{ color: BRAND }} />
            <Typography color="text.secondary">Loading products…</Typography>
          </Box>

        ) : filtered.length === 0 ? (
          <Box sx={{ border: '1px solid', borderColor: 'divider', textAlign: 'center', py: 10, bgcolor: 'background.paper' }}>
            <Inventory2OutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>No Products Found</Typography>
            <Typography variant="body2" color="text.disabled" mb={3}>
              {searchQuery ? 'No products match your search.' : 'Get started by adding your first product.'}
            </Typography>
            {!searchQuery && (
              <Button component={Link} href="/admin/dashboard/products/add" variant="contained"
                sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
                Add Your First Product
              </Button>
            )}
          </Box>

        ) : viewMode === 'grid' ? (
          /* ── Grid View ── */
          <Grid container spacing={2}>
            {filtered.map(product => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={product.proId}>
                <Card elevation={0} sx={{
                  border: '1px solid', borderColor: 'divider', borderRadius: 0, height: '100%',
                  transition: 'box-shadow 0.2s, border-color 0.2s',
                  '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', borderColor: BRAND },
                }}>
                  {/* Image */}
                  <Box sx={{ position: 'relative', aspectRatio: '1', bgcolor: 'grey.100', overflow: 'hidden' }}>
                    {product.proImages?.length > 0 ? (
                      <CardMedia component="img" image={product.proImages[0]} alt={product.proName}
                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                      </Box>
                    )}
                    {/* Status badge */}
                    <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                      <Chip label={product.status ? 'Active' : 'Inactive'} size="small"
                        color={product.status ? 'success' : 'default'}
                        sx={{ borderRadius: 0, fontWeight: 600, fontSize: 10 }} />
                    </Box>
                    {/* Discount badge */}
                    {product.discount > 0 && (
                      <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                        <Chip icon={<LocalOfferOutlinedIcon />} label={`-${product.discount}%`} size="small"
                          sx={{ borderRadius: 0, bgcolor: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 10 }} />
                      </Box>
                    )}
                  </Box>

                  {/* Info */}
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>{product.proName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ mb: 1 }}>
                      {product.description || 'No description'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={700} color={BRAND} lineHeight={1}>
                          ${parseFloat(product.price || 0).toFixed(2)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">Stock: {product.stock || 0}</Typography>
                      </Box>
                      <ApprovalChip status={product.approvalStatus} />
                    </Box>

                    {/* Category */}
                    {product.category?.name && (
                      <Chip label={product.category.name} size="small" variant="outlined"
                        sx={{ borderRadius: 0, fontSize: 10, mb: 1.5 }} />
                    )}

                    {/* Actions */}
                    <Box sx={{ display: 'flex', gap: 1, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Button component={Link} href={`/admin/dashboard/products/${product.proId}`}
                        size="small" variant="outlined" startIcon={<VisibilityOutlinedIcon />} fullWidth
                        sx={{ borderRadius: 0, fontSize: 11 }}>View</Button>
                      <Button size="small" variant="outlined" color="info" fullWidth
                        sx={{ borderRadius: 0, fontSize: 11 }}>Edit</Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

        ) : (
          /* ── Table View ── */
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Image', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Approval', 'Actions'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(product => (
                  <TableRow key={product.proId} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ width: 56 }}>
                      <Box sx={{ width: 44, height: 44, bgcolor: 'grey.100', borderRadius: 0.5, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {product.proImages?.length > 0
                          ? <img src={product.proImages[0]} alt={product.proName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <Inventory2OutlinedIcon sx={{ color: 'text.disabled', fontSize: 20 }} />
                        }
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2" fontWeight={600} noWrap>{product.proName}</Typography>
                      <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{product.category?.name || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{product.subCategory?.subCatName}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color={BRAND}>${parseFloat(product.price || 0).toFixed(2)}</Typography>
                      {product.discount > 0 && <Typography variant="caption" color="error">-{product.discount}%</Typography>}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{product.stock || 0}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.status ? 'Active' : 'Inactive'} size="small"
                        color={product.status ? 'success' : 'default'} variant="outlined" sx={{ borderRadius: 0 }} />
                    </TableCell>
                    <TableCell>
                      <ApprovalChip status={product.approvalStatus} />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View">
                        <IconButton component={Link} href={`/admin/dashboard/products/${product.proId}`}
                          size="small" sx={{ color: 'primary.main' }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

      </Box>
    </DashboardLayout>
  )
}
