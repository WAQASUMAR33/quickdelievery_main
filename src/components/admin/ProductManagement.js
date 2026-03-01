'use client'

import { useState, useEffect } from 'react'
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

const BRAND      = '#D70F64'
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
  const [categoryFilter, setCategoryFilter] = useState('')
  const [vendorFilter, setVendorFilter]   = useState('')
  const [statusFilter, setStatusFilter]   = useState('')
  const [approvalFilter, setApprovalFilter] = useState('')
  const [sortBy, setSortBy]               = useState('newest')
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
        categoryId: categoryFilter,
        vendorId: vendorFilter,
        status: statusFilter,
        approvalStatus: approvalFilter,
        sortBy,
      })
      const response = await fetch(`/api/products?type=products&${params}`)
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
      }
    } catch (error) {
      console.error('Error fetching products:', error)
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
      const response = await fetch('/api/users?role=VENDOR')
      const data = await response.json()
      if (data.success) setVendors(data.data)
    } catch (error) { console.error(error) }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchVendors()
  }, [currentPage, searchTerm, categoryFilter, vendorFilter, statusFilter, approvalFilter, sortBy])

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

  const handleDelete = async (productId) => {
    if (!confirm('Are you sure you want to delete this product?')) return
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`, { method: 'DELETE' })
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
      const response = await fetch('/api/admin/products', {
        method: editingProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingProduct?.id, ...productData }),
      })
      const data = await response.json()
      if (data.success) {
        toast.success(editingProduct ? 'Product updated' : 'Product created')
        handleClose()
        fetchProducts()
      } else {
        toast.error('Failed to save product')
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to save product')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setCategoryFilter('')
    setVendorFilter('')
    setStatusFilter('')
    setApprovalFilter('')
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
            Manage all products, categories, and inventory
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddOutlinedIcon />}
          onClick={handleAdd}
          sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b00d52' } }}
        >
          Add Product
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2.5 }}>
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
              placeholder="Search products…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              sx={{ minWidth: DROP_MIN_W, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
            />

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={e => setCategoryFilter(e.target.value)} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Categories</em></MenuItem>
                {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Vendor</InputLabel>
              <Select value={vendorFilter} label="Vendor" onChange={e => setVendorFilter(e.target.value)} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Vendors</em></MenuItem>
                {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.businessName || v.username}</MenuItem>)}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)} sx={{ borderRadius: 0 }}>
                <MenuItem value=""><em>All Status</em></MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Approval</InputLabel>
              <Select value={approvalFilter} label="Approval" onChange={e => setApprovalFilter(e.target.value)} sx={{ borderRadius: 0 }}>
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
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography variant="body2" color="text.secondary">No products found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : products.map((product) => (
                    <TableRow key={product.id} hover>
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
                            <Typography variant="caption" color="text.secondary">SKU: {product.sku || 'N/A'}</Typography>
                          </Box>
                        </Box>
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
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton size="small" onClick={() => handleEdit(product)} sx={{ color: 'primary.main' }}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(product.id)} sx={{ color: 'error.main' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
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
            {editingProduct ? 'Edit Product' : 'Add New Product'}
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
    specifications: product?.specifications || {},
    features:       product?.features       || [],
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
        <TextField size="small" label="Product Name *" required value={formData.proName}
          onChange={e => set('proName', e.target.value)} {...tf} />
        <TextField size="small" label="SKU" value={formData.sku}
          onChange={e => set('sku', e.target.value)} {...tf} />
        <TextField size="small" label="Price *" type="number" inputProps={{ step: '0.01' }} required
          value={formData.price} onChange={e => set('price', e.target.value)} {...tf} />
        <TextField size="small" label="Sale Price" type="number" inputProps={{ step: '0.01' }}
          value={formData.salePrice} onChange={e => set('salePrice', e.target.value)} {...tf} />

        <FormControl size="small" required sx={{ minWidth: DROP_MIN_W }}>
          <InputLabel>Category *</InputLabel>
          <Select value={formData.catId} label="Category *" onChange={e => set('catId', e.target.value)} sx={{ borderRadius: 0 }}>
            <MenuItem value=""><em>Select Category</em></MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" required sx={{ minWidth: DROP_MIN_W }}>
          <InputLabel>Vendor *</InputLabel>
          <Select value={formData.vendorId} label="Vendor *" onChange={e => set('vendorId', e.target.value)} sx={{ borderRadius: 0 }}>
            <MenuItem value=""><em>Select Vendor</em></MenuItem>
            {vendors.map(v => <MenuItem key={v.id} value={v.id}>{v.businessName || v.username}</MenuItem>)}
          </Select>
        </FormControl>

        <TextField size="small" label="Stock" type="number" value={formData.stock}
          onChange={e => set('stock', e.target.value)} {...tf} />
        <TextField size="small" label="Barcode" value={formData.barcode}
          onChange={e => set('barcode', e.target.value)} {...tf} />
      </Box>

      <TextField size="small" label="Description" multiline rows={4} value={formData.description}
        onChange={e => set('description', e.target.value)} {...tf} fullWidth />

      {/* Images */}
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
          Product Images
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Button
            component="label"
            variant="outlined"
            size="small"
            sx={{ borderRadius: 0, textTransform: 'none', borderColor: 'divider', color: 'text.secondary' }}
          >
            Upload Images
            <input type="file" multiple accept="image/*" hidden onChange={handleImageChange} />
          </Button>
        </Box>
        {formData.proImages.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
            {formData.proImages.map((img, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <img src={img} alt={`Product ${i + 1}`} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 4 }} />
                <IconButton
                  size="small"
                  onClick={() => removeImage(i)}
                  sx={{ position: 'absolute', top: -6, right: -6, bgcolor: 'error.main', color: 'white', width: 18, height: 18, '&:hover': { bgcolor: 'error.dark' } }}
                >
                  <CloseOutlinedIcon sx={{ fontSize: 11 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
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
          {product ? 'Update Product' : 'Create Product'}
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
