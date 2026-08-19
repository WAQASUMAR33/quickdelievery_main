'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { authFetch } from '@/lib/apiClient'

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
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)

const ProductManagement = () => {
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
                            bgcolor: product.vertical === 'GROCERY' ? '#FCE4EC' : '#E8F5E9',
                            color: product.vertical === 'GROCERY' ? '#C2185B' : '#2E7D32'
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
                            <IconButton size="small" onClick={() => handleEdit(product)} sx={{ color: BRAND }}>
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
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0, height: '90vh', display: 'flex', flexDirection: 'column' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight={700}>
            Product Details & Approval Status (Read-Only)
          </Typography>
          <IconButton size="small" onClick={handleClose}>
            <CloseOutlinedIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0, p: 3 }}>
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

const ProductForm = ({ product, categories, vendors, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    proName:        product?.proName        || '',
    description:    product?.description    || '',
    price:          product?.price          || '',
    salePrice:      product?.salePrice      || '',
    sku:            product?.sku            || '',
    barcode:        product?.barcode        || '',
    stock:          product?.stock          || '',
    catId:          product?.catId          || '',
    subCatId:       product?.subCatId       || '',
    vendorId:       product?.vendorId       || '',
    proImages:      product?.proImages      || [],
    status:         product?.status !== undefined ? product.status : true,
    approvalStatus: product?.approvalStatus || 'Pending',
  })

  const set = (key, val) => setFormData(prev => ({ ...prev, [key]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files)
    const urls  = files.map(f => URL.createObjectURL(f))
    set('proImages', [...formData.proImages, ...urls])
  }

  const removeImage = (index) => {
    set('proImages', formData.proImages.filter((_, i) => i !== index))
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
        <TextField size="small" label="Product Name" disabled value={formData.proName} {...tf} />
        <TextField size="small" label="SKU" disabled value={formData.sku} {...tf} />
        <TextField size="small" label="Price" disabled value={formData.price} {...tf} />
        <TextField size="small" label="Sale Price" disabled value={formData.salePrice} {...tf} />

        <TextField size="small" label="Category" disabled value={categories.find(c => c.id === formData.catId)?.name || 'N/A'} {...tf} />
        <TextField size="small" label="Vendor" disabled value={product?.vendor?.businessName || product?.vendor?.username || product?.vendorId || 'N/A'} {...tf} />

        <TextField size="small" label="Stock" disabled value={formData.stock} {...tf} />
        <TextField size="small" label="Barcode" disabled value={formData.barcode} {...tf} />
      </Box>

      <TextField size="small" label="Description" disabled multiline rows={4} value={formData.description} {...tf} fullWidth />

      {/* Images */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
          Product Images (Read-Only)
        </Typography>
        {formData.proImages.length > 0 ? (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {formData.proImages.map((img, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <img src={img} alt={`Product ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4, border: '1px solid #e5e7eb' }} />
              </Box>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', mt: 1 }}>No images provided</Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <FormControlLabel
          control={<Switch checked={formData.status} onChange={e => set('status', e.target.checked)} sx={{ '& .MuiSwitch-thumb': { borderRadius: 0 }, '& .MuiSwitch-track': { borderRadius: 0 } }} />}
          label={<Typography variant="body2">Active Status</Typography>}
        />

        <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
          <InputLabel>Approval Status</InputLabel>
          <Select value={formData.approvalStatus} label="Approval Status" onChange={e => set('approvalStatus', e.target.value)} sx={{ borderRadius: 0 }}>
            <MenuItem value="Pending">Pending</MenuItem>
            <MenuItem value="Approved">Approved</MenuItem>
            <MenuItem value="Rejected">Rejected</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5, pt: 1 }}>
        <Button
          type="submit"
          variant="contained"
          startIcon={<SaveOutlinedIcon />}
          sx={{ flex: 1, bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b00d52' } }}
        >
          Update Product Status
        </Button>
        <Button
          type="button"
          variant="outlined"
          onClick={onCancel}
          sx={{ flex: 1, borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
        >
          Cancel
        </Button>
      </Box>

    </Box>
  )
}

export default ProductManagement
