'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/apiClient'

import { useTheme }     from '@mui/material/styles'
import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog           from '@mui/material/Dialog'
import DialogActions    from '@mui/material/DialogActions'
import DialogContent    from '@mui/material/DialogContent'
import DialogTitle      from '@mui/material/DialogTitle'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Pagination       from '@mui/material/Pagination'
import Select           from '@mui/material/Select'
import Switch           from '@mui/material/Switch'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AddOutlinedIcon          from '@mui/icons-material/AddOutlined'
import CancelOutlinedIcon       from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CloseOutlinedIcon        from '@mui/icons-material/CloseOutlined'
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import RefreshOutlinedIcon      from '@mui/icons-material/RefreshOutlined'
import SaveOutlinedIcon         from '@mui/icons-material/SaveOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import StarOutlineIcon          from '@mui/icons-material/StarOutline'
import VerifiedOutlinedIcon     from '@mui/icons-material/VerifiedOutlined'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'
import LaunchOutlinedIcon       from '@mui/icons-material/LaunchOutlined'
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined'
import LocalOfferOutlinedIcon   from '@mui/icons-material/LocalOfferOutlined'
import CategoryOutlinedIcon     from '@mui/icons-material/CategoryOutlined'
import RestaurantOutlinedIcon   from '@mui/icons-material/RestaurantOutlined'
import LocalPharmacyOutlinedIcon from '@mui/icons-material/LocalPharmacyOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined'
import TuneOutlinedIcon         from '@mui/icons-material/TuneOutlined'
import StraightenOutlinedIcon   from '@mui/icons-material/StraightenOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import HistoryOutlinedIcon      from '@mui/icons-material/HistoryOutlined'
import CheckOutlinedIcon        from '@mui/icons-material/CheckOutlined'

const BRAND      = '#39772A'
const DROP_MIN_W = 300
const tf         = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

const TH = ({ children }) => (
  <TableCell sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
    {children}
  </TableCell>
)

function ApprovalChip({ status }) {
  const map = {
    Approved: { color: 'success', label: 'Approved' },
    Pending:  { color: 'warning', label: 'Pending' },
    Rejected: { color: 'error',   label: 'Rejected' },
  }
  const cfg = map[status] || { color: 'default', label: status || 'Unknown' }
  return <Chip label={cfg.label} color={cfg.color} size="small" variant="outlined" sx={{ borderRadius: 0, fontSize: 11 }} />
}

const formatPrice = (price) =>
  `Rs. ${Number(price || 0).toLocaleString()}`

const ProductManagement = () => {
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const brandText = isDark ? '#4ade80' : BRAND
  const [products, setProducts]           = useState([])
  const [categories, setCategories]       = useState([])
  const [vendors, setVendors]             = useState([])
  const [loading, setLoading]             = useState(true)
  const [searchTerm, setSearchTerm]       = useState('')
  const [verticalFilter, setVerticalFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [vendorFilter, setVendorFilter]   = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [sortBy, setSortBy]               = useState('newest')
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: '',
    confirmColor: 'primary',
    onConfirm: null,
  })
  const [currentPage, setCurrentPage]     = useState(1)
  const [totalPages, setTotalPages]       = useState(1)
  const [stats, setStats]                 = useState({})
  const [editingProduct, setEditingProduct] = useState(null)
  const [showModal, setShowModal]         = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm,
        vertical: verticalFilter,
        categoryId: categoryFilter,
        vendorId: vendorFilter,
        status: statusFilter,
        approvalStatus: approvalFilter,
        sortBy,
      })

      const response = await authFetch(`/api/admin/products?${params}`)
      const data = await response.json()
      if (data.success) {
        setProducts(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setStats({
          totalProducts:    data.stats?.totalProducts    || 0,
          approvedProducts: data.stats?.approvedProducts || 0,
          pendingProducts:  data.stats?.pendingProducts  || 0,
          rejectedProducts: data.stats?.rejectedProducts || 0,
          activeProducts:   data.stats?.activeProducts   || 0,
        })
      } else {
        setProducts([])
        setTotalPages(1)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products?type=categories')
      const data = await response.json()
      if (data.success) setCategories(data.data)
    } catch (error) { console.error(error) }
  }

  const fetchVendors = async () => {
    try {
      const response = await authFetch('/api/users?role=VENDOR')
      const data = await response.json()
      if (data.success) setVendors(data.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchVendors()
  }, [currentPage, searchTerm, verticalFilter, categoryFilter, vendorFilter, statusFilter, approvalFilter, sortBy])


  const handleEdit = (product) => {
    setEditingProduct(product)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setShowModal(true)
  }

  const handleClose = () => {
    setShowModal(false)
    setEditingProduct(null)
  }

  const promptDeleteProduct = (product) => {
    setConfirmModal({
      open: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.proName || 'this product'}"? This action is permanent and cannot be undone.`,
      confirmText: 'Delete Product',
      confirmColor: 'error',
      onConfirm: () => executeDelete(product.proId),
    })
  }

  const executeDelete = async (productId) => {
    try {
      const response = await authFetch(`/api/admin/products?proId=${productId}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        toast.success('Product deleted')
        fetchProducts()
      } else {
        toast.error('Failed to delete product')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to delete product')
    }
  }

  const handleSave = async (productData) => {
    try {
      const response = await authFetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proId: editingProduct?.proId,
          approvalStatus: productData.approvalStatus,
          status: productData.status,
        }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success('Product status updated')
        handleClose()
        fetchProducts()
      } else {
        toast.error('Failed to save product status')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to save product status')
    }
  }

  const handleToggleStatus = async (productId, currentStatus) => {
    try {
      const response = await authFetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proId: productId, status: !currentStatus }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(`Product ${!currentStatus ? 'Activated' : 'Deactivated'}`)
        fetchProducts()
      } else {
        toast.error(data.error || 'Failed to update product status')
      }
    } catch {
      toast.error('Failed to update product status')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setVerticalFilter('')
    setCategoryFilter('')
    setVendorFilter('')
    setStatusFilter('')
    setApprovalFilter('')
    setCurrentPage(1)
  }


  const STAT_CARDS = [
    { label: 'Total Products',   value: stats.totalProducts    || 0, color: '#3b82f6', icon: <Inventory2OutlinedIcon /> },
    { label: 'Approved',         value: stats.approvedProducts || 0, color: '#10b981', icon: <VerifiedOutlinedIcon /> },
    { label: 'Pending',          value: stats.pendingProducts  || 0, color: '#f59e0b', icon: <PendingActionsOutlinedIcon /> },
    { label: 'Rejected',         value: stats.rejectedProducts || 0, color: '#ef4444', icon: <CancelOutlinedIcon /> },
    { label: 'Active',           value: stats.activeProducts   || 0, color: '#8b5cf6', icon: <StarOutlineIcon /> },
  ]

  return (
    <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Product Management</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage product approval status and active state
          </Typography>
        </Box>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: `repeat(${STAT_CARDS.length}, 1fr)` }, gap: 2.5, mb: 3 }}>
        {STAT_CARDS.map(({ label, value, color, icon }) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>{value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, bgcolor: `${color}18`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Filters */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>

            <TextField
              size="small"
              placeholder="Search by Name or SKU…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
              sx={{ minWidth: DROP_MIN_W, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
            />

            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Vertical</InputLabel>
              <Select value={verticalFilter} label="Vertical" onChange={e => { setVerticalFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Types (Food & Grocery)</em></MenuItem>
                <MenuItem value="FOOD">🍽️ Food / Meals</MenuItem>
                <MenuItem value="GROCERY">🏬 Grocery / Marts</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={e => { setCategoryFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Categories</em></MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>


            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Vendor</InputLabel>
              <Select value={vendorFilter} label="Vendor" onChange={e => { setVendorFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Vendors</em></MenuItem>
                {vendors.map(v => <MenuItem key={v.uid || v.id} value={v.uid || v.id}>{v.businessName || v.username}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Status</em></MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Approval</InputLabel>
              <Select value={approvalFilter} label="Approval" onChange={e => { setApprovalFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Approval</em></MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Rejected">Rejected</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              startIcon={<RefreshOutlinedIcon />}
              onClick={clearFilters}
              sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
            >
              Clear
            </Button>

          </Box>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={32} sx={{ color: BRAND }} />
            <Typography variant="body2" color="text.secondary">Loading products…</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TH>Product</TH>
                    <TH>Type</TH>
                    <TH>Category</TH>
                    <TH>Vendor</TH>
                    <TH>Price</TH>
                    <TH>Status</TH>
                    <TH>Approval</TH>
                    <TH>Actions</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No products found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : products.map((product) => (
                    <TableRow key={product.proId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 40, height: 40, borderRadius: 1, overflow: 'hidden', flexShrink: 0, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {product.proImages?.length > 0 ? (
                              <img src={product.proImages[0]} alt={product.proName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <Inventory2OutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{product.proName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {product.packageWeight ? `${product.packageWeight} • ` : ''}SKU: {product.sku || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.vertical === 'GROCERY' ? '🏬 Grocery' : '🍽️ Food'}
                          size="small"
                          sx={{
                            borderRadius: 1,
                            fontSize: 11,
                            fontWeight: 600,
                            bgcolor: product.vertical === 'GROCERY' ? (isDark ? 'rgba(236,72,153,0.18)' : '#FCE4EC') : (isDark ? 'rgba(34,197,94,0.18)' : '#E8F5E9'),
                            color: product.vertical === 'GROCERY' ? (isDark ? '#f472b6' : '#C2185B') : (isDark ? '#4ade80' : '#2E7D32')
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{product.category?.name || 'N/A'}</Typography>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">{product.vendor?.businessName || product.vendor?.username || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.secondary">{product.vendor?.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{formatPrice(product.price)}</Typography>
                        {product.salePrice && (
                          <Typography variant="caption" color="success.main">{formatPrice(product.salePrice)}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={product.status ? 'Active' : 'Inactive'}
                          color={product.status ? 'success' : 'default'}
                          size="small"
                          variant="outlined"
                          sx={{ borderRadius: 0, fontSize: 11 }}
                        />
                      </TableCell>
                      <TableCell>
                        <ApprovalChip status={product.approvalStatus} />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Tooltip title="View Details & Approval Status">
                            <IconButton size="small" onClick={() => handleEdit(product)} sx={{ color: brandText }}>
                              <VisibilityOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title={product.status ? 'Deactivate Product' : 'Activate Product'}>
                            <Switch
                              size="small"
                              checked={!!product.status}
                              onChange={() => handleToggleStatus(product.proId, product.status)}
                              sx={{
                                '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND }
                              }}
                            />
                          </Tooltip>

                          <Tooltip title="Delete Product">
                            <IconButton size="small" onClick={() => promptDeleteProduct(product)} sx={{ color: 'error.main' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <>
                <Divider />
                <Box sx={{ px: 2.5, py: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Page {currentPage} of {totalPages}
                  </Typography>
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={(_, v) => setCurrentPage(v)}
                    size="small"
                    sx={{
                      '& .MuiPaginationItem-root': { borderRadius: 0 },
                      '& .Mui-selected': { bgcolor: `${BRAND} !important`, color: 'white' },
                    }}
                  />
                </Box>
              </>
            )}
          </>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmModal.open}
        onClose={() => setConfirmModal({ ...confirmModal, open: false })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {confirmModal.title}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            {confirmModal.message}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => setConfirmModal({ ...confirmModal, open: false })}
            sx={{ borderRadius: 0, color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color={confirmModal.confirmColor}
            size="small"
            onClick={() => {
              const action = confirmModal.onConfirm
              setConfirmModal({ ...confirmModal, open: false })
              if (action) action()
            }}
            sx={{ borderRadius: 0, fontWeight: 700 }}
          >
            {confirmModal.confirmText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add / Edit Dialog */}
      <Dialog
        open={showModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, height: '92vh', display: 'flex', flexDirection: 'column' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: 1.5, px: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ letterSpacing: -0.2 }}>
              Product Details & Approval Status
            </Typography>
            {editingProduct?.proId && (
              <Chip
                label={`ID: #${editingProduct.proId}`}
                size="small"
                sx={{ fontWeight: 800, fontSize: 11, bgcolor: 'grey.100', color: 'text.secondary', borderRadius: 0 }}
              />
            )}
            {editingProduct?.vertical && (
              <Chip
                label={editingProduct.vertical}
                size="small"
                color={editingProduct.vertical === 'FOOD' ? 'warning' : 'primary'}
                variant="outlined"
                sx={{ fontWeight: 700, fontSize: 10, borderRadius: 0, height: 22 }}
              />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {editingProduct?.proId && (
              <>
                <Button
                  component="a"
                  href={`/admin/dashboard/products/${editingProduct.proId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  startIcon={<LaunchOutlinedIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 0, borderColor: 'divider', color: 'text.secondary' }}
                >
                  Full Editor
                </Button>
                <Button
                  component="a"
                  href={`/product/${editingProduct.proId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  variant="outlined"
                  startIcon={<StorefrontOutlinedIcon fontSize="small" />}
                  sx={{ textTransform: 'none', fontWeight: 600, fontSize: 12, borderRadius: 0, borderColor: 'divider', color: 'text.secondary' }}
                >
                  Storefront View
                </Button>
              </>
            )}
            <IconButton size="small" onClick={handleClose}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0, p: { xs: 2, sm: 3 } }}>
          <ProductForm
            product={editingProduct}
            categories={categories}
            vendors={vendors}
            onSave={handleSave}
            onCancel={handleClose}
          />
        </DialogContent>
      </Dialog>

    </Box>
  )
}

// Detailed Section Card Helper
function DetailSection({ icon, title, subtitle, count, children }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          {icon}
          <Typography variant="subtitle2" fontWeight={700} color="text.primary">
            {title}
          </Typography>
          {count !== undefined && (
            <Chip label={count} size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: 'grey.200', borderRadius: 0 }} />
          )}
        </Box>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {children}
      </CardContent>
    </Card>
  )
}

// Styled Read-Only Field Helper
function ReadOnlyField({ label, value, helper, mono = false, color, fullWidth = true }) {
  const displayVal = (value !== undefined && value !== null && value !== '') ? String(value) : '—'
  return (
    <TextField
      size="small"
      label={label}
      value={displayVal}
      helperText={helper}
      fullWidth={fullWidth}
      InputProps={{
        readOnly: true,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 0,
          bgcolor: 'grey.50',
          fontFamily: mono ? 'monospace' : 'inherit',
          color: color || 'text.primary',
          fontWeight: 600,
        },
        '& .MuiInputLabel-root': {
          fontWeight: 600,
          color: 'text.secondary',
        },
      }}
    />
  )
}

const ProductForm = ({ product, categories, vendors, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    status:         product?.status !== undefined ? product.status : true,
    approvalStatus: product?.approvalStatus || 'Pending',
  })
  const [activeImagePreview, setActiveImagePreview] = useState(null)

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...product,
      status: formData.status,
      approvalStatus: formData.approvalStatus,
    })
  }

  // Safe image array
  const rawImages = product?.proImages || []
  const images = Array.isArray(rawImages)
    ? rawImages
    : (typeof rawImages === 'string' ? [rawImages] : [])

  // Safe key features
  const rawFeatures = product?.keyFeatures || []
  const keyFeatures = Array.isArray(rawFeatures)
    ? rawFeatures
    : (typeof rawFeatures === 'string' ? [rawFeatures] : [])

  // Modifiers
  const modifiers = product?.modifiers || (typeof product?.modifiersJson === 'string' ? (() => {
    try { return JSON.parse(product.modifiersJson) } catch { return null }
  })() : null)

  // Dietary badges & Allergens
  const dietaryBadges = product?.dietaryBadges
    ? product.dietaryBadges.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const allergens = product?.allergens
    ? product.allergens.split(',').map(s => s.trim()).filter(Boolean)
    : []

  // Safe category names
  const categoryName = product?.category?.name || categories.find(c => c.id === product?.catId)?.name || 'N/A'
  const subCategoryName = product?.subCategory?.subCatName || product?.subCatId || 'N/A'
  const productCategoryName = product?.productCategory?.name || 'N/A'

  // Safe vendor info
  const vendorName = product?.vendor?.businessName || product?.vendor?.username || product?.vendorId || 'N/A'
  const vendorEmail = product?.vendor?.email || 'N/A'
  const vendorPhone = product?.vendor?.phone || product?.vendor?.phoneNumber || 'N/A'
  const vendorCity = product?.vendor?.city || product?.vendor?.state ? [product?.vendor?.city, product?.vendor?.state].filter(Boolean).join(', ') : 'N/A'

  // Format helper
  const currency = product?.currency || 'USD'
  const formatMoney = (val) => (val !== undefined && val !== null && val !== '') ? `${currency} ${Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
  const formatDate = (val) => val ? new Date(val).toLocaleString() : '—'

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

      {/* ─── 0. TOP SUMMARY BANNER ─── */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, bgcolor: 'grey.50' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {product?.proName || 'Untitled Product'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                SKU: <strong style={{ color: '#0F172A' }}>{product?.sku || 'N/A'}</strong>
                {product?.barcode && <> &bull; Barcode: <strong>{product.barcode}</strong></>}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              <Chip
                label={formData.status ? 'Status: Active' : 'Status: Inactive'}
                color={formData.status ? 'success' : 'default'}
                size="small"
                variant="outlined"
                sx={{ borderRadius: 0, fontWeight: 700 }}
              />
              <ApprovalChip status={formData.approvalStatus} />
              <Chip
                label={`Vertical: ${product?.vertical || 'FOOD'}`}
                size="small"
                sx={{ borderRadius: 0, bgcolor: 'primary.50', color: 'primary.main', fontWeight: 700 }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* ─── 1. CORE IDENTIFICATION & TAXONOMY ─── */}
      <DetailSection
        icon={<CategoryOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="1. Core Identifiers & Taxonomy"
        subtitle="Department, category classification, barcodes, and vital taxonomy"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <ReadOnlyField label="Product Name" value={product?.proName} />
          <ReadOnlyField label="SKU (Stock Keeping Unit)" value={product?.sku} mono />
          <ReadOnlyField label="Barcode (UPC / EAN / GTIN)" value={product?.barcode} mono />

          <ReadOnlyField label="Department / Vertical" value={product?.vertical || 'FOOD'} />
          <ReadOnlyField label="Main Category" value={categoryName} />
          <ReadOnlyField label="Subcategory" value={subCategoryName} />

          <ReadOnlyField label="Product Category" value={productCategoryName} />
          <ReadOnlyField label="Product Type / Subtype" value={product?.productType || 'Standard Retail Item'} />
          <ReadOnlyField label="Condition" value={product?.conditionType || 'New'} />
        </Box>
      </DetailSection>

      {/* ─── 2. PRICING, MARGINS & INVENTORY ─── */}
      <DetailSection
        icon={<LocalOfferOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="2. Pricing, Margins & Inventory"
        subtitle="Wholesale cost, retail pricing, discounts, stock count, and sale schedule"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          <ReadOnlyField label="Currency" value={currency} />
          <ReadOnlyField label="Retail Selling Price" value={formatMoney(product?.price)} color="primary.main" />
          <ReadOnlyField label="Vendor Cost (Wholesale)" value={formatMoney(product?.cost)} />
          <ReadOnlyField label="Sale Price" value={product?.salePrice ? formatMoney(product?.salePrice) : 'No Sale Price'} color="success.main" />

          <ReadOnlyField label="Discount Rate" value={product?.discount ? `${product.discount}%` : '0%'} />
          <ReadOnlyField label="Current Stock" value={product?.stock ?? 0} />
          <ReadOnlyField label="Total Order Units (Qnty)" value={product?.qnty ?? 0} />
          <ReadOnlyField
            label="Sale Schedule"
            value={product?.saleStartDate || product?.saleEndDate ? `${product.saleStartDate ? new Date(product.saleStartDate).toLocaleDateString() : '—'} to ${product.saleEndDate ? new Date(product.saleEndDate).toLocaleDateString() : '—'}` : 'Not on timed sale'}
          />
        </Box>
      </DetailSection>

      {/* ─── 3. BRAND & SPECIFICATIONS ─── */}
      <DetailSection
        icon={<StraightenOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="3. Brand & Physical Specifications"
        subtitle="Brand names, manufacturer, dimensions, color, size, and warranty"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 2 }}>
          <ReadOnlyField label="Brand Name" value={product?.brandName || 'Unbranded / Store House Brand'} />
          <ReadOnlyField label="Manufacturer / Producer" value={product?.manufacturer} />
          <ReadOnlyField label="Model Number" value={product?.modelNumber} mono />
          <ReadOnlyField label="Warranty Terms" value={product?.warranty} />

          <ReadOnlyField label="Color" value={product?.color} />
          <ReadOnlyField label="Size / Portion" value={product?.size || product?.sizeName} />
          <ReadOnlyField label="Package Weight" value={product?.packageWeight} />
          <ReadOnlyField label="Product Dimensions (L x W x H)" value={product?.productDimensions} />
        </Box>
      </DetailSection>

      {/* ─── 4. DESCRIPTION & KEY HIGHLIGHTS ─── */}
      <DetailSection
        icon={<InfoOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="4. Description & Key Features"
        subtitle="Narrative description copy and bulleted highlights"
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            size="small"
            label="Full Product Description"
            multiline
            rows={4}
            value={product?.description || 'No detailed description provided.'}
            fullWidth
            InputProps={{ readOnly: true }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 0,
                bgcolor: 'grey.50',
                lineHeight: 1.6,
              },
              '& .MuiInputLabel-root': { fontWeight: 600 },
            }}
          />

          {keyFeatures.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" letterSpacing={0.5}>
                Key Features / Bullet Points ({keyFeatures.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                {keyFeatures.map((feat, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                    <CheckOutlinedIcon fontSize="small" sx={{ color: BRAND, mt: 0.2 }} />
                    <Typography variant="body2" color="text.primary">
                      {feat}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DetailSection>

      {/* ─── 5. FOOD, RESTAURANT & DIETARY COMPLIANCE (If Applicable) ─── */}
      {(product?.vertical === 'FOOD' || dietaryBadges.length > 0 || allergens.length > 0 || product?.ingredients || product?.prepTimeMinutes) && (
        <DetailSection
          icon={<RestaurantOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
          title="5. Food, Dining & Dietary Attributes"
          subtitle="Kitchen preparation time, ingredient breakdown, allergens, and dietary certifications"
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <ReadOnlyField
                label="Kitchen Preparation Time"
                value={product?.prepTimeMinutes ? `${product.prepTimeMinutes} minutes` : '20 minutes (Standard)'}
              />
              <Box sx={{ p: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={0.75}>
                  Dietary Badges
                </Typography>
                {dietaryBadges.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {dietaryBadges.map((badge, i) => (
                      <Chip key={i} label={badge} size="small" color="success" variant="outlined" sx={{ borderRadius: 0, fontWeight: 700, fontSize: 11 }} />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.disabled">No dietary badges declared</Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ p: 1.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase" display="block" mb={0.75}>
                Allergen Warnings
              </Typography>
              {allergens.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {allergens.map((alg, i) => (
                    <Chip key={i} label={`Contains: ${alg}`} size="small" color="error" variant="outlined" sx={{ borderRadius: 0, fontWeight: 700, fontSize: 11 }} />
                  ))}
                </Box>
              ) : (
                <Typography variant="caption" color="text.disabled">No allergen warnings declared</Typography>
              )}
            </Box>

            {product?.ingredients && (
              <TextField
                size="small"
                label="Complete Ingredients Listing"
                multiline
                rows={2}
                value={product.ingredients}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: 'grey.50' },
                  '& .MuiInputLabel-root': { fontWeight: 600 },
                }}
              />
            )}
          </Box>
        </DetailSection>
      )}

      {/* ─── 6. PHARMACY & HEALTHCARE ATTRIBUTES (If Applicable) ─── */}
      {(product?.vertical === 'PHARMACY' || product?.isPrescriptionRequired || product?.dosageForm || product?.activeIngredients) && (
        <DetailSection
          icon={<LocalPharmacyOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
          title="6. Pharmacy & Healthcare Compliance"
          subtitle="Prescription status, dosage form, and active pharmaceutical ingredients"
        >
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
            <ReadOnlyField
              label="Prescription Required"
              value={product?.isPrescriptionRequired ? '⚠️ Yes (Doctor Prescription Required)' : 'No (Over-The-Counter)'}
              color={product?.isPrescriptionRequired ? 'error.main' : 'success.main'}
            />
            <ReadOnlyField label="Dosage Form" value={product?.dosageForm || 'N/A'} />
            <ReadOnlyField label="Active Pharmaceutical Ingredients" value={product?.activeIngredients || 'N/A'} />
          </Box>
        </DetailSection>
      )}

      {/* ─── 7. SKU VARIANTS & CUSTOMIZATIONS (If Applicable) ─── */}
      {(product?.skuVariants?.length > 0 || product?.variations || modifiers) && (
        <DetailSection
          icon={<TuneOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
          title="7. Variants & Add-on Modifiers"
          subtitle="Inventory variants, sizes/colors, and restaurant add-on modifier groups"
        >
          {product?.skuVariants?.length > 0 ? (
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider' }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TH>Variant Title</TH>
                    <TH>SKU</TH>
                    <TH>Barcode</TH>
                    <TH>Price</TH>
                    <TH>Stock</TH>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {product.skuVariants.map((v, i) => (
                    <TableRow key={i}>
                      <TableCell><Typography variant="body2" fontWeight={600}>{v.title || v.name || `Variant ${i + 1}`}</Typography></TableCell>
                      <TableCell><Typography variant="caption" sx={{ fontFamily: 'monospace' }}>{v.sku || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="caption">{v.barcode || '—'}</Typography></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{formatMoney(v.price)}</Typography></TableCell>
                      <TableCell><Typography variant="body2">{v.stock ?? '—'}</Typography></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Variations JSON: {typeof product?.variations === 'string' ? product.variations : JSON.stringify(product?.variations)}
            </Typography>
          )}
        </DetailSection>
      )}

      {/* ─── 8. PRODUCT IMAGES GALLERY ─── */}
      <DetailSection
        icon={<PhotoLibraryOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="8. Product Media Assets"
        subtitle="All high-resolution gallery and showcase images"
        count={images.length}
      >
        {images.length > 0 ? (
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(6, 1fr)' }, gap: 1.5 }}>
              {images.map((img, i) => (
                <Box
                  key={i}
                  onClick={() => setActiveImagePreview(img)}
                  sx={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: 0,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'grey.100',
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.9, borderColor: BRAND },
                  }}
                >
                  <img src={img} alt={`Product ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {i === 0 && (
                    <Chip
                      label="Primary"
                      size="small"
                      sx={{
                        position: 'absolute',
                        bottom: 4,
                        left: 4,
                        height: 18,
                        fontSize: 9,
                        fontWeight: 800,
                        bgcolor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        borderRadius: 0,
                      }}
                    />
                  )}
                </Box>
              ))}
            </Box>

            {/* Active Preview Modal Dialog */}
            {activeImagePreview && (
              <Dialog open={!!activeImagePreview} onClose={() => setActiveImagePreview(null)} maxWidth="md">
                <Box sx={{ position: 'relative', bgcolor: '#000', p: 1 }}>
                  <IconButton
                    size="small"
                    onClick={() => setActiveImagePreview(null)}
                    sx={{ position: 'absolute', top: 8, right: 8, color: '#fff', bgcolor: 'rgba(0,0,0,0.5)' }}
                  >
                    <CloseOutlinedIcon fontSize="small" />
                  </IconButton>
                  <img src={activeImagePreview} alt="Full resolution preview" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', display: 'block', margin: '0 auto' }} />
                </Box>
              </Dialog>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
            No images uploaded for this product
          </Typography>
        )}
      </DetailSection>

      {/* ─── 9. VENDOR & STORE INFORMATION ─── */}
      <DetailSection
        icon={<PersonOutlineOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="9. Merchant & Store Information"
        subtitle="Vendor store identity, contact info, and business location"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
          <ReadOnlyField label="Store / Business Name" value={vendorName} />
          <ReadOnlyField label="Vendor Username" value={product?.vendor?.username} />
          <ReadOnlyField label="Vendor Email" value={vendorEmail} />

          <ReadOnlyField label="Vendor Phone" value={vendorPhone} />
          <ReadOnlyField label="Store Location (City/State)" value={vendorCity} />
          <ReadOnlyField label="Vendor User ID" value={product?.vendorId || product?.vendor?.uid} mono />
        </Box>
      </DetailSection>

      {/* ─── 10. SYSTEM AUDIT METADATA ─── */}
      <DetailSection
        icon={<HistoryOutlinedIcon fontSize="small" sx={{ color: BRAND }} />}
        title="10. System Audit & Timestamps"
        subtitle="System registration date, last modification timestamp, and catalog approver"
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
          <ReadOnlyField label="Product Creation Date" value={formatDate(product?.createdAt)} />
          <ReadOnlyField label="Last Updated Date" value={formatDate(product?.updatedAt)} />
          <ReadOnlyField label="Approver / Created By" value={product?.approver?.username || product?.approveById || product?.createdById || 'Self-Registered by Merchant'} />
        </Box>
      </DetailSection>

      {/* ─── 11. APPROVAL & STATUS CONTROLS ─── */}
      <Card elevation={0} sx={{ border: '2px solid', borderColor: BRAND, borderRadius: 0, bgcolor: 'rgba(57, 119, 42, 0.04)' }}>
        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
          <Typography variant="subtitle2" fontWeight={800} color="text.primary" sx={{ mb: 1.5 }}>
            Approval Status & Live Visibility Controls
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={formData.status}
                  onChange={e => set('status', e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND },
                    '& .MuiSwitch-thumb': { borderRadius: 0 },
                    '& .MuiSwitch-track': { borderRadius: 0 },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={700}>
                    {formData.status ? 'Product is Active' : 'Product is Inactive'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formData.status ? 'Visible on marketplace customer catalog' : 'Hidden from customer store search'}
                  </Typography>
                </Box>
              }
            />

            <FormControl size="small" sx={{ minWidth: 260 }}>
              <InputLabel>Approval Status</InputLabel>
              <Select
                value={formData.approvalStatus}
                label="Approval Status"
                onChange={e => set('approvalStatus', e.target.value)}
                sx={{ borderRadius: 0, bgcolor: 'background.paper', fontWeight: 700 }}
              >
                <MenuItem value="Pending">⏳ Pending Approval</MenuItem>
                <MenuItem value="Approved">✅ Approved (Ready for Sale)</MenuItem>
                <MenuItem value="Rejected">❌ Rejected (Needs Vendor Revision)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            <Button
              type="submit"
              variant="contained"
              startIcon={<SaveOutlinedIcon />}
              sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 3, py: 1.25, '&:hover': { bgcolor: '#2e6121' } }}
            >
              Update Product Status
            </Button>
            {product?.proId && (
              <Button
                component="a"
                href={`/admin/dashboard/products/${product.proId}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="outlined"
                startIcon={<LaunchOutlinedIcon />}
                sx={{ flex: { xs: '1 1 100%', sm: '1 1 auto' }, borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
              >
                Edit Full Product Page
              </Button>
            )}
            <Button
              type="button"
              variant="outlined"
              onClick={onCancel}
              sx={{ flex: { xs: '1 1 100%', sm: '0 0 auto' }, borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary', px: 3 }}
            >
              Close
            </Button>
          </Box>
        </CardContent>
      </Card>

    </Box>
  )
}

export default ProductManagement
