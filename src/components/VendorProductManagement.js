'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { authFetch } from '@/lib/apiClient'
import { uploadMultipleImages } from '@/lib/imageUpload'
import { getFirstProductImage, hasProductImages } from '@/lib/imageUtils'
import NextImage from 'next/image'

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
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Paper            from '@mui/material/Paper'
import Select           from '@mui/material/Select'
import Stack            from '@mui/material/Stack'
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
import toast            from 'react-hot-toast'

import AddIcon                  from '@mui/icons-material/Add'
import AttachMoneyIcon          from '@mui/icons-material/AttachMoney'
import CancelOutlinedIcon       from '@mui/icons-material/CancelOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon                from '@mui/icons-material/Close'
import DeleteOutlinedIcon       from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import GridViewOutlinedIcon     from '@mui/icons-material/GridViewOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import PaletteOutlinedIcon      from '@mui/icons-material/PaletteOutlined'
import PendingOutlinedIcon      from '@mui/icons-material/PendingOutlined'
import SearchIcon               from '@mui/icons-material/Search'
import StraightenOutlinedIcon   from '@mui/icons-material/StraightenOutlined'
import TableRowsOutlinedIcon    from '@mui/icons-material/TableRowsOutlined'
import UploadOutlinedIcon       from '@mui/icons-material/UploadOutlined'
import ViewListOutlinedIcon     from '@mui/icons-material/ViewListOutlined'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'

const BRAND      = '#39772A'
const BRAND_DARK = '#2E5F22'
const DROP_MIN_W = 300

const VendorProductManagement = () => {
  const { userData } = useAuth()
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [showSizePopup, setShowSizePopup] = useState(false)
  const [showColorPopup, setShowColorPopup] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterApproval, setFilterApproval] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })

  const [formData, setFormData] = useState({
    proName: '', description: '', catId: '', subCatId: '',
    price: '', cost: '', discount: '', sku: '', barcode: '',
    qnty: '', stock: '', status: true, images: [],
    brandName: '', manufacturer: '', keyFeatures: [], productType: '',
    variations: {}, sizeName: '', modelNumber: '', productDimensions: '',
    packageWeight: '', salePrice: '', saleStartDate: '', saleEndDate: '',
    currency: 'USD', conditionType: '', warranty: '', ingredients: '',
    reviews: [], size: '', customSize: '', color: '', customColor: ''
  })

  const predefinedColors = [
    { name: 'Black',  hex: '#000000' }, { name: 'White',  hex: '#FFFFFF' },
    { name: 'Red',    hex: '#EF4444' }, { name: 'Blue',   hex: '#3B82F6' },
    { name: 'Green',  hex: '#10B981' }, { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Purple', hex: '#8B5CF6' }, { name: 'Pink',   hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' }, { name: 'Gray',   hex: '#6B7280' },
    { name: 'Brown',  hex: '#92400E' }, { name: 'Navy',   hex: '#1E3A8A' },
  ]

  const fetchCategories = async () => {
    try {
      const [pcRes, catRes] = await Promise.all([
        fetch('/api/products?type=productcategories').then(r => r.json()),
        fetch('/api/products?type=categories').then(r => r.json()),
      ])
      if (pcRes.success && pcRes.data?.length > 0) {
        setCategories(pcRes.data.map(c => ({
          id: c.productCategoryId,
          name: c.productCategoryName,
          catId: c.categoryId,
        })))
      } else if (catRes.success) {
        setCategories(catRes.data || [])
      }
    } catch { setCategories([]) }
  }

  const fetchSubcategories = async () => {
    try {
      const res = await fetch('/api/products?type=subcategories')
      const r = await res.json()
      setSubcategories(r.success ? (r.data || []) : [])
    } catch { setSubcategories([]) }
  }

  const fetchProducts = useCallback(async () => {
    if (!userData?.uid) return
    try {
      setLoading(true)
      const res = await authFetch(`/api/products?type=products&vendorId=${userData.uid}`)
      const r = await res.json()
      setProducts(r.success ? (r.data || []) : [])
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }, [userData?.uid])

  useEffect(() => {
    if (userData?.uid) {
      fetchCategories()
      fetchSubcategories()
      fetchProducts()
    }
  }, [userData?.uid, fetchProducts])

  const handleEditProduct = async () => {
    if (!selectedProduct) return
    try {
      const selectedCat = categories.find(c => String(c.id) === String(formData.catId))
      const res = await authFetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          id: selectedProduct.proId,
          proName: formData.proName,
          description: formData.description,
          productCategoryId: selectedCat?.id ? parseInt(selectedCat.id) : null,
          catId: selectedCat?.catId || parseInt(formData.catId),
          subCatId: parseInt(formData.subCatId),
          price: parseFloat(formData.price),
          cost: parseFloat(formData.cost || 0),
          discount: parseFloat(formData.discount || 0),
          sku: formData.sku,
          barcode: formData.barcode || formData.sku,
          qnty: parseInt(formData.qnty) || parseInt(formData.stock),
          stock: parseInt(formData.stock || 0),
          status: formData.status,
          proImages: formData.images,
          brandName: formData.brandName || null,
          manufacturer: formData.manufacturer || null,
          productType: formData.productType || null,
          modelNumber: formData.modelNumber || null,
          sizeName: formData.sizeName || null,
          conditionType: formData.conditionType || null,
          productDimensions: formData.productDimensions || null,
          packageWeight: formData.packageWeight || null,
          warranty: formData.warranty || null,
          size: formData.size || null,
          color: formData.color || null,
          keyFeatures: formData.keyFeatures?.filter(Boolean) || [],
          ingredients: formData.ingredients || null,
          salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
          saleStartDate: formData.saleStartDate || null,
          saleEndDate: formData.saleEndDate || null,
          currency: formData.currency || 'PKR',
        }),
      })
      const r = await res.json()
      if (r.success) {
        setShowEditModal(false)
        setSelectedProduct(null)
        fetchProducts()
        toast.success('Product updated successfully!')
      } else {
        toast.error(`Failed to update product: ${r.error}`)
      }
    } catch { toast.error('Error updating product. Please try again.') }
  }

  const promptDeleteProduct = (product) => {
    setDeleteConfirm({ open: true, id: product.proId, name: product.proName })
  }

  const handleDeleteProduct = async (productId) => {
    try {
      const res = await authFetch(`/api/products?type=product&id=${productId}`, { method: 'DELETE' })
      const r = await res.json()
      if (r.success) { fetchProducts(); toast.success('Product deleted successfully!') }
      else toast.error(`Failed to delete product: ${r.error}`)
    } catch { toast.error('Error deleting product. Please try again.') }
  }

  const handleEditClick = (product) => {
    setSelectedProduct(product)

    // Match product category or root category
    let initialCatId = ''
    if (product.productCategoryId) {
      const match = categories.find(c => String(c.id) === String(product.productCategoryId))
      initialCatId = match ? String(match.id) : String(product.productCategoryId)
    } else if (product.catId) {
      const match = categories.find(c => String(c.id) === String(product.catId) || String(c.catId) === String(product.catId))
      initialCatId = match ? String(match.id) : String(product.catId)
    }

    setFormData({
      proName: product.proName || '',
      description: product.description || '',
      catId: initialCatId,
      subCatId: product.subCatId != null ? String(product.subCatId) : '',
      price: product.price != null ? product.price.toString() : '',
      cost: product.cost != null ? product.cost.toString() : '',
      discount: product.discount != null ? product.discount.toString() : '0',
      sku: product.sku || '',
      barcode: product.barcode || '',
      qnty: product.qnty != null ? product.qnty.toString() : '',
      stock: product.stock != null ? product.stock.toString() : '',
      status: product.status !== undefined ? Boolean(product.status) : true,
      images: Array.isArray(product.proImages) ? product.proImages : (typeof product.proImages === 'string' ? (JSON.parse(product.proImages || '[]') || []) : []),
      brandName: product.brandName || '',
      manufacturer: product.manufacturer || '',
      keyFeatures: Array.isArray(product.keyFeatures) ? product.keyFeatures : (typeof product.keyFeatures === 'string' ? (JSON.parse(product.keyFeatures || '[]') || []) : []),
      productType: product.productType || '',
      variations: product.variations || {},
      sizeName: product.sizeName || '',
      modelNumber: product.modelNumber || '',
      productDimensions: product.productDimensions || '',
      packageWeight: product.packageWeight || '',
      salePrice: product.salePrice != null ? product.salePrice.toString() : '',
      saleStartDate: product.saleStartDate || '',
      saleEndDate: product.saleEndDate || '',
      currency: product.currency || 'PKR',
      conditionType: product.conditionType || '',
      warranty: product.warranty || '',
      ingredients: product.ingredients || '',
      reviews: product.reviews || [],
      size: product.size || '',
      customSize: '',
      color: product.color || '',
      customColor: '',
    })
    setShowEditModal(true)
  }

  const handleViewClick = (product) => { setSelectedProduct(product); setShowViewModal(true) }

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const result = await uploadMultipleImages(files, 'product_images')
      if (result.success) {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...result.urls] }))
        if (window.addNotification) window.addNotification(`Uploaded ${result.urls.length} image(s)`, 'success')
        if (result.errors?.length && window.addNotification)
          window.addNotification(`${result.errors.length} image(s) failed to upload`, 'warning')
      } else {
        if (window.addNotification) window.addNotification(`Failed to upload: ${result.error}`, 'error')
      }
    } catch (e) {
      if (window.addNotification) window.addNotification(`Error: ${e.message}`, 'error')
    } finally { setUploadingImages(false) }
  }

  const handleRemoveImage = (index) => {
    setFormData(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== index) }))
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.proName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && p.status) || (filterStatus === 'inactive' && !p.status)
    const matchCat = filterCategory === 'all' || p.catId === filterCategory
    const matchApproval = filterApproval === 'all' || p.approvalStatus === filterApproval
    return matchSearch && matchStatus && matchCat && matchApproval
  })

  const ApprovalChip = ({ status }) => {
    if (status === 'Approved') return <Chip label="Approved" size="small" icon={<CheckCircleOutlinedIcon />} color="success" variant="outlined" sx={{ borderRadius: 0 }} />
    if (status === 'Pending')  return <Chip label="Pending"  size="small" icon={<PendingOutlinedIcon />}      color="warning" variant="outlined" sx={{ borderRadius: 0 }} />
    if (status === 'Rejected') return <Chip label="Rejected" size="small" icon={<CancelOutlinedIcon />}       color="error"   variant="outlined" sx={{ borderRadius: 0 }} />
    return <Chip label={status} size="small" variant="outlined" sx={{ borderRadius: 0 }} />
  }

  const field = (sx = {}) => ({ sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 }, ...sx } })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading products...</Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Products</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Manage your product listings and track approval status
          </Typography>
        </Box>
        <Button
          variant="contained" startIcon={<AddIcon />}
          onClick={() => router.push('/admin/dashboard/products/add')}
          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, px: 3, py: 1.5 }}
        >
          Add Product
        </Button>
      </Box>

      {/* ── Stats Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3 }}>
        {[
          { label: 'Total Products', value: products.length,                                                                           icon: <Inventory2OutlinedIcon />, color: '#3b82f6', bg: '#eff6ff' },
          { label: 'Approved',       value: products.filter(p => p.approvalStatus === 'Approved').length,                             icon: <CheckCircleOutlinedIcon />, color: '#10b981', bg: '#f0fdf4' },
          { label: 'Pending',        value: products.filter(p => p.approvalStatus === 'Pending').length,                              icon: <PendingOutlinedIcon />,     color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Total Value',    value: `Rs. ${products.reduce((s, p) => s + (parseFloat(p.price || 0) * (p.stock || 0)), 0).toLocaleString()}`, icon: <AttachMoneyIcon />, color: '#8b5cf6', bg: '#f5f3ff' },
        ].map((stat, i) => (
          <Card key={i} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
                  <Typography variant="h4" fontWeight={700} color={stat.color}>{stat.value}</Typography>
                </Box>
                <Box sx={{ p: 1.5, bgcolor: stat.bg, borderRadius: 1, color: stat.color, display: 'flex' }}>
                  {stat.icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between', p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, flex: 1 }}>
          <TextField size="small" placeholder="Search products…"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 260, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Approval</InputLabel>
            <Select value={filterApproval} label="Approval" onChange={e => setFilterApproval(e.target.value)} sx={{ borderRadius: 0 }}>
              <MenuItem value="all">All Approval</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select value={filterStatus} label="Status" onChange={e => setFilterStatus(e.target.value)} sx={{ borderRadius: 0 }}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Category</InputLabel>
            <Select value={filterCategory} label="Category" onChange={e => setFilterCategory(e.target.value)} sx={{ borderRadius: 0 }}>
              <MenuItem value="all">All Categories</MenuItem>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip label={`${filteredProducts.length} products`} size="small" sx={{ bgcolor: '#D8E9D6', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
          <ToggleButtonGroup value={viewMode} exclusive size="small" onChange={(_, v) => v && setViewMode(v)} sx={{ '& .MuiToggleButton-root': { borderRadius: 0 } }}>
            <ToggleButton value="table"><Tooltip title="Table"><TableRowsOutlinedIcon fontSize="small" /></Tooltip></ToggleButton>
            <ToggleButton value="grid"><Tooltip title="Grid"><GridViewOutlinedIcon fontSize="small" /></Tooltip></ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* ── Products Display ── */}
      {filteredProducts.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <Inventory2OutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">No products found</Typography>
          <Typography variant="body2" color="text.disabled">Try adjusting your search or filters</Typography>
        </Box>

      ) : viewMode === 'table' ? (
        /* ── Table View ── */
        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Image', 'Product', 'Category', 'Price', 'Stock', 'Status', 'Approval', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.map(product => (
                <TableRow key={product.proId} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ width: 48, height: 48, bgcolor: 'grey.100', borderRadius: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {hasProductImages(product.proImages)
                        ? <NextImage src={getFirstProductImage(product.proImages)} alt={product.proName} width={48} height={48} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                        : <Inventory2OutlinedIcon sx={{ color: 'text.disabled' }} />
                      }
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{product.proName}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">{product.category?.name} — {product.subCategory?.subCatName}</Typography>
                    <Typography variant="caption" color="text.disabled">SKU: {product.sku}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.category?.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{product.subCategory?.subCatName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>Rs. {product.price}</Typography>
                    <Typography variant="caption" color="text.secondary">Cost: Rs. {product.cost}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{product.stock}</Typography>
                    <Typography variant="caption" color="text.secondary">Qty: {product.qnty}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={product.status ? 'Active' : 'Inactive'} size="small" color={product.status ? 'success' : 'error'} variant="outlined" sx={{ borderRadius: 0 }} />
                  </TableCell>
                  <TableCell>
                    <ApprovalChip status={product.approvalStatus} />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => handleViewClick(product)} sx={{ color: 'primary.main' }}>
                          <VisibilityOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEditClick(product)} sx={{ color: 'info.main' }}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDeleteProduct(product.proId)} sx={{ color: 'error.main' }}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

      ) : (
        /* ── Grid / List View ── */
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
          gap: 2,
        }}>
          {filteredProducts.map(product => (
            <Card key={product.proId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              {viewMode === 'grid' ? (
                <CardContent>
                  <Box sx={{ aspectRatio: '1', bgcolor: 'grey.100', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', borderRadius: 1 }}>
                    {hasProductImages(product.proImages)
                      ? <NextImage src={getFirstProductImage(product.proImages)} alt={product.proName} width={200} height={200} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      : <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                    }
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>{product.proName}</Typography>
                  <Typography variant="caption" color="text.secondary">{product.category?.name} — {product.subCategory?.subCatName}</Typography>
                  <Typography variant="caption" color="text.disabled" display="block">SKU: {product.sku}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                    <Typography variant="h6" fontWeight={700}>Rs. {product.price}</Typography>
                    <ApprovalChip status={product.approvalStatus} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                    <IconButton size="small" onClick={() => handleViewClick(product)} sx={{ color: 'primary.main' }}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleEditClick(product)} sx={{ color: 'info.main' }}><EditOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteProduct(product.proId)} sx={{ color: 'error.main' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              ) : (
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 64, height: 64, bgcolor: 'grey.100', flexShrink: 0, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {hasProductImages(product.proImages)
                      ? <NextImage src={getFirstProductImage(product.proImages)} alt={product.proName} width={64} height={64} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      : <Inventory2OutlinedIcon sx={{ color: 'text.disabled' }} />
                    }
                  </Box>
                  <Box flex={1} minWidth={0}>
                    <Typography variant="body1" fontWeight={600}>{product.proName}</Typography>
                    <Typography variant="caption" color="text.secondary">{product.category?.name} — {product.subCategory?.subCatName}</Typography>
                    <Typography variant="caption" color="text.disabled" display="block">SKU: {product.sku}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                    <Typography variant="h6" fontWeight={700}>Rs. {product.price}</Typography>
                    <Typography variant="caption" color="text.secondary" display="block">Stock: {product.stock}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={product.status ? 'Active' : 'Inactive'} size="small" color={product.status ? 'success' : 'error'} variant="outlined" sx={{ borderRadius: 0 }} />
                      <ApprovalChip status={product.approvalStatus} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                    <IconButton size="small" onClick={() => handleViewClick(product)} sx={{ color: 'primary.main' }}><VisibilityOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleEditClick(product)} sx={{ color: 'info.main' }}><EditOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" onClick={() => handleDeleteProduct(product.proId)} sx={{ color: 'error.main' }}><DeleteOutlinedIcon fontSize="small" /></IconButton>
                  </Box>
                </CardContent>
              )}
            </Card>
          ))}
        </Box>
      )}

      {/* ── View Product Dialog ── */}
      <Dialog
        open={showViewModal} onClose={() => setShowViewModal(false)}
        scroll="paper" maxWidth="md" fullWidth
        sx={{ '& .MuiDialog-paper': { height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 0 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <Typography variant="h6" fontWeight={700}>Product Details</Typography>
          <IconButton onClick={() => setShowViewModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0, p: 3 }}>
          {selectedProduct && (
            <Grid container spacing={3}>
              {/* Images */}
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Product Images</Typography>
                {selectedProduct.proImages?.length > 0 ? (
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {selectedProduct.proImages.map((img, i) => (
                      <Box key={i} sx={{ height: 128, bgcolor: 'grey.100', overflow: 'hidden', borderRadius: 1 }}>
                        <NextImage src={img} alt={`Product ${i + 1}`} width={200} height={128} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ height: 128, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>
                    <Inventory2OutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  </Box>
                )}
              </Grid>

              {/* Details */}
              <Grid item xs={12} md={7}>
                <Typography variant="h6" fontWeight={700}>{selectedProduct.proName}</Typography>
                <Typography variant="caption" color="text.secondary">SKU: {selectedProduct.sku}</Typography>
                {selectedProduct.barcode && <Typography variant="caption" color="text.secondary" display="block">Barcode: {selectedProduct.barcode}</Typography>}

                <Box mt={2} mb={2}>
                  <Typography variant="subtitle2" fontWeight={600} mb={0.5}>Description</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedProduct.description || 'No description provided'}</Typography>
                </Box>

                <Grid container spacing={1.5}>
                  {[
                    { label: 'Category',    value: selectedProduct.category?.name },
                    { label: 'Subcategory', value: selectedProduct.subCategory?.subCatName },
                    { label: 'Price',       value: `$${selectedProduct.price}`, bold: true, color: 'success.main' },
                    { label: 'Cost',        value: `$${selectedProduct.cost}` },
                    { label: 'Stock',       value: `${selectedProduct.stock} units` },
                    { label: 'Quantity',    value: `${selectedProduct.qnty} units` },
                  ].map(item => (
                    <Grid item xs={6} key={item.label}>
                      <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                      <Typography variant="body2" fontWeight={item.bold ? 700 : 500} color={item.color || 'text.primary'}>{item.value}</Typography>
                    </Grid>
                  ))}
                </Grid>

                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                  <Chip label={selectedProduct.status ? 'Active' : 'Inactive'} size="small" color={selectedProduct.status ? 'success' : 'error'} variant="outlined" sx={{ borderRadius: 0 }} />
                  <ApprovalChip status={selectedProduct.approvalStatus} />
                </Box>
              </Grid>

              {/* Additional Info */}
              {[selectedProduct.brandName, selectedProduct.manufacturer, selectedProduct.productType, selectedProduct.modelNumber, selectedProduct.sizeName, selectedProduct.conditionType, selectedProduct.productDimensions, selectedProduct.packageWeight, selectedProduct.warranty].some(Boolean) && (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={2}>Additional Information</Typography>
                  <Grid container spacing={2}>
                    {[
                      { label: 'Brand Name',        value: selectedProduct.brandName },
                      { label: 'Manufacturer',      value: selectedProduct.manufacturer },
                      { label: 'Product Type',      value: selectedProduct.productType },
                      { label: 'Model Number',      value: selectedProduct.modelNumber },
                      { label: 'Size Name',         value: selectedProduct.sizeName },
                      { label: 'Condition',         value: selectedProduct.conditionType },
                      { label: 'Dimensions',        value: selectedProduct.productDimensions },
                      { label: 'Package Weight',    value: selectedProduct.packageWeight },
                      { label: 'Warranty',          value: selectedProduct.warranty },
                      { label: 'Currency',          value: selectedProduct.currency },
                      { label: 'Sale Price',        value: selectedProduct.salePrice ? `$${selectedProduct.salePrice}` : null },
                      { label: 'Color',             value: selectedProduct.color },
                      { label: 'Size',              value: selectedProduct.size },
                    ].filter(i => i.value).map(item => (
                      <Grid item xs={6} md={4} key={item.label}>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={500}>{item.value}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
              )}

              {/* Key Features */}
              {selectedProduct.keyFeatures?.length > 0 && (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>Key Features</Typography>
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {selectedProduct.keyFeatures.map((f, i) => (
                      <Box component="li" key={i} sx={{ mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">{f}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Grid>
              )}

              {/* Ingredients */}
              {selectedProduct.ingredients && (
                <Grid item xs={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} mb={1}>Ingredients</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedProduct.ingredients}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <Divider />
        <DialogActions sx={{ flexShrink: 0, px: 3, py: 2 }}>
          <Button onClick={() => setShowViewModal(false)} variant="outlined" sx={{ borderRadius: 0 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Edit Product Dialog ── */}
      <Dialog
        open={showEditModal} onClose={() => setShowEditModal(false)}
        scroll="paper" maxWidth="lg" fullWidth
        sx={{ '& .MuiDialog-paper': { height: '90vh', maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderRadius: 0 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, px: 3, py: 2, bgcolor: '#ffffff', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#111827">Edit Product</Typography>
            <Typography variant="caption" color="text.secondary">SKU: {formData.sku || 'N/A'}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowEditModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0, p: { xs: 2, md: 3.5 }, bgcolor: 'grey.50' }}>
          <Stack spacing={3}>

            {/* ── SECTION 1: Basic & Category Info ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Basic Information & Category
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                <TextField
                  size="small" fullWidth label="Product Name *" value={formData.proName}
                  onChange={e => setFormData({ ...formData, proName: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, gridColumn: { xs: '1 / -1', md: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                {/* Category (Product Category) */}
                <FormControl size="small" fullWidth sx={{ width: '100%', minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'span 1' } }}>
                  <InputLabel>Product Category *</InputLabel>
                  <Select
                    value={formData.catId ? String(formData.catId) : ''}
                    label="Product Category *"
                    onChange={e => setFormData({ ...formData, catId: e.target.value, subCatId: '' })}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value=""><em>Select Category</em></MenuItem>
                    {categories.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                    {formData.catId && !categories.some(c => String(c.id) === String(formData.catId)) && (
                      <MenuItem value={String(formData.catId)}>{selectedProduct?.category?.name || `Category #${formData.catId}`}</MenuItem>
                    )}
                  </Select>
                </FormControl>

                {/* Subcategory */}
                <FormControl size="small" fullWidth disabled={!formData.catId} sx={{ width: '100%', minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'span 1' } }}>
                  <InputLabel>Sub-category *</InputLabel>
                  <Select
                    value={formData.subCatId ? String(formData.subCatId) : ''}
                    label="Sub-category *"
                    onChange={e => setFormData({ ...formData, subCatId: e.target.value })}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value=""><em>Select Sub-category</em></MenuItem>
                    {(() => {
                      const selCat = categories.find(c => String(c.id) === String(formData.catId))
                      const targetCatId = selCat?.catId || formData.catId
                      const filtered = subcategories.filter(s => String(s.catId) === String(targetCatId))
                      const hasCurrent = filtered.some(s => String(s.subCatId) === String(formData.subCatId))
                      return (
                        <>
                          {filtered.map(s => (
                            <MenuItem key={s.subCatId} value={String(s.subCatId)}>{s.subCatName}</MenuItem>
                          ))}
                          {!hasCurrent && formData.subCatId && (
                            <MenuItem value={String(formData.subCatId)}>
                              {selectedProduct?.subCategory?.subCatName || `Subcategory #${formData.subCatId}`}
                            </MenuItem>
                          )}
                        </>
                      )
                    })()}
                  </Select>
                </FormControl>

                {/* Pricing & Inventory: 4 Equal Columns */}
                <TextField
                  size="small" fullWidth label="Base Price *" type="number" inputProps={{ step: '0.01', min: 0 }} value={formData.price}
                  onChange={e => setFormData({ ...formData, price: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small" fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: 0 }} value={formData.cost}
                  onChange={e => setFormData({ ...formData, cost: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small" fullWidth label="Discount %" type="number" inputProps={{ min: 0, max: 100 }} value={formData.discount}
                  onChange={e => setFormData({ ...formData, discount: e.target.value })}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small" fullWidth label="Stock Quantity *" type="number" inputProps={{ min: 0 }} value={formData.stock}
                  onChange={e => setFormData({ ...formData, stock: e.target.value, qnty: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                {/* Full Width Description */}
                <TextField
                  size="small" fullWidth multiline rows={3} label="Product Description" placeholder="Describe the item, ingredients, key highlights…" value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, gridColumn: '1 / -1', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
              </Box>
            </Card>

            {/* ── SECTION 2: Specifications & Attributes ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Specifications & Attributes
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                <TextField
                  size="small" fullWidth label="Brand Name" placeholder="e.g. Nike, Samsung" value={formData.brandName}
                  onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small" fullWidth label="Manufacturer" placeholder="e.g. Company Ltd" value={formData.manufacturer}
                  onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <FormControl size="small" fullWidth sx={{ width: '100%', minWidth: 0 }}>
                  <InputLabel>Product Type</InputLabel>
                  <Select
                    value={formData.productType || ''}
                    label="Product Type"
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value=""><em>Select Product Type</em></MenuItem>
                    {['Physical', 'Digital', 'Service', 'Subscription'].map(t => (
                      <MenuItem key={t} value={t}>{t} Product</MenuItem>
                    ))}
                    {formData.productType && !['Physical', 'Digital', 'Service', 'Subscription'].some(t => t.toLowerCase() === formData.productType.toLowerCase()) && (
                      <MenuItem value={formData.productType}>{formData.productType}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  size="small" fullWidth label="Model Number" placeholder="e.g. MOD-2024" value={formData.modelNumber}
                  onChange={e => setFormData({ ...formData, modelNumber: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                <TextField
                  size="small" fullWidth label="Size Label / Name" placeholder="e.g. Standard, Family Pack" value={formData.sizeName}
                  onChange={e => setFormData({ ...formData, sizeName: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <FormControl size="small" fullWidth sx={{ width: '100%', minWidth: 0 }}>
                  <InputLabel>Condition</InputLabel>
                  <Select
                    value={formData.conditionType || ''}
                    label="Condition"
                    onChange={e => setFormData({ ...formData, conditionType: e.target.value })}
                    sx={{ borderRadius: 0 }}
                  >
                    <MenuItem value=""><em>Select Condition</em></MenuItem>
                    {['New', 'Used', 'Refurbished', 'Open Box'].map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                    {formData.conditionType && !['New', 'Used', 'Refurbished', 'Open Box'].some(c => c.toLowerCase() === formData.conditionType.toLowerCase()) && (
                      <MenuItem value={formData.conditionType}>{formData.conditionType}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <TextField
                  size="small" fullWidth label="Dimensions" placeholder="e.g. 10 x 5 x 3 cm" value={formData.productDimensions}
                  onChange={e => setFormData({ ...formData, productDimensions: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small" fullWidth label="Package Weight" placeholder="e.g. 500g, 1.2kg" value={formData.packageWeight}
                  onChange={e => setFormData({ ...formData, packageWeight: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                <TextField
                  size="small" fullWidth label="Warranty" placeholder="e.g. 1 Year Official Warranty" value={formData.warranty}
                  onChange={e => setFormData({ ...formData, warranty: e.target.value })}
                  sx={{ width: '100%', minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <FormControl size="small" fullWidth sx={{ width: '100%', minWidth: 0, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={formData.currency || 'PKR'}
                    label="Currency"
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    sx={{ borderRadius: 0 }}
                  >
                    {[
                      { v: 'PKR', l: 'PKR — Pakistani Rupee' },
                      { v: 'USD', l: 'USD — US Dollar' },
                      { v: 'AED', l: 'AED — UAE Dirham' },
                      { v: 'SAR', l: 'SAR — Saudi Riyal' },
                      { v: 'GBP', l: 'GBP — British Pound' },
                      { v: 'EUR', l: 'EUR — Euro' },
                    ].map(c => <MenuItem key={c.v} value={c.v}>{c.l}</MenuItem>)}
                    {formData.currency && !['PKR', 'USD', 'AED', 'SAR', 'GBP', 'EUR'].includes(formData.currency) && (
                      <MenuItem value={formData.currency}>{formData.currency}</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Box>
            </Card>

            {/* ── SECTION 3: Size & Color Variants (2 Equal Balanced Columns) ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Product Variations (Size & Color)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                {/* Left: Size */}
                <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Size Variant</Typography>
                    <Button size="small" variant="outlined" startIcon={<AddIcon />} onClick={() => setShowSizePopup(true)}
                      sx={{ borderRadius: 0, borderColor: BRAND, color: BRAND, '&:hover': { bgcolor: `${BRAND}10`, borderColor: BRAND }, textTransform: 'none', fontWeight: 600 }}>
                      + Add Custom Size
                    </Button>
                  </Box>
                  <FormControl fullWidth size="small" sx={{ width: '100%', minWidth: 0 }}>
                    <InputLabel>Select Size</InputLabel>
                    <Select
                      value={formData.size || ''}
                      label="Select Size"
                      onChange={e => setFormData({ ...formData, size: e.target.value })}
                      sx={{ borderRadius: 0, bgcolor: '#ffffff' }}
                    >
                      <MenuItem value=""><em>None / Standard</em></MenuItem>
                      {['Small', 'Medium', 'Large', 'XL', 'XXL'].map(s => (
                        <MenuItem key={s} value={s}>{s}</MenuItem>
                      ))}
                      {formData.size && !['Small', 'Medium', 'Large', 'XL', 'XXL'].includes(formData.size) && (
                        <MenuItem value={formData.size}>{formData.size}</MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  {formData.size && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, p: 1.25, bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StraightenOutlinedIcon fontSize="small" sx={{ color: '#059669' }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#059669' }}>Selected: {formData.size}</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setFormData({ ...formData, size: '' })}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Right: Color */}
                <Box sx={{ p: 2.5, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Color Variant</Typography>
                    <Button size="small" variant="outlined" startIcon={<PaletteOutlinedIcon />} onClick={() => setShowColorPopup(true)}
                      sx={{ borderRadius: 0, borderColor: '#7c3aed', color: '#7c3aed', '&:hover': { bgcolor: '#f5f3ff', borderColor: '#7c3aed' }, textTransform: 'none', fontWeight: 600 }}>
                      + Add Custom Color
                    </Button>
                  </Box>
                  <FormControl fullWidth size="small" sx={{ width: '100%', minWidth: 0 }}>
                    <InputLabel>Select Color</InputLabel>
                    <Select
                      value={formData.color || ''}
                      label="Select Color"
                      onChange={e => setFormData({ ...formData, color: e.target.value })}
                      sx={{ borderRadius: 0, bgcolor: '#ffffff' }}
                    >
                      <MenuItem value=""><em>None / Default</em></MenuItem>
                      {predefinedColors.map(c => (
                        <MenuItem key={c.name} value={c.name}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #ccc', bgcolor: c.hex }} />
                            {c.name}
                          </Box>
                        </MenuItem>
                      ))}
                      {formData.color && !predefinedColors.some(c => c.name === formData.color) && (
                        <MenuItem value={formData.color}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', border: '1px solid #ccc', bgcolor: predefinedColors.find(c => c.name.toLowerCase() === formData.color.toLowerCase())?.hex || '#6B7280' }} />
                            {formData.color}
                          </Box>
                        </MenuItem>
                      )}
                    </Select>
                  </FormControl>
                  {formData.color && (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, p: 1.25, bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 16, height: 16, borderRadius: '50%', border: '1px solid #ccc', bgcolor: predefinedColors.find(c => c.name.toLowerCase() === formData.color.toLowerCase())?.hex || '#6B7280' }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: '#7c3aed' }}>Selected: {formData.color}</Typography>
                      </Box>
                      <IconButton size="small" onClick={() => setFormData({ ...formData, color: '' })}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              </Box>
            </Card>

            {/* ── SECTION 4: Features & Ingredients ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Key Highlights & Ingredients
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Key Bullet Features</Typography>
                  <Stack spacing={1}>
                    {formData.keyFeatures.map((feat, i) => (
                      <Box key={i} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField size="small" fullWidth value={feat} placeholder="e.g. 100% Cotton, Organic, Waterproof"
                          onChange={e => {
                            const f = [...formData.keyFeatures]; f[i] = e.target.value
                            setFormData({ ...formData, keyFeatures: f })
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                        />
                        <IconButton size="small" color="error"
                          onClick={() => setFormData({ ...formData, keyFeatures: formData.keyFeatures.filter((_, j) => j !== i) })}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    <Button size="small" variant="outlined" onClick={() => setFormData({ ...formData, keyFeatures: [...formData.keyFeatures, ''] })}
                      sx={{ alignSelf: 'flex-start', borderRadius: 0, borderColor: BRAND, color: BRAND, textTransform: 'none', fontWeight: 600 }}>
                      + Add Feature Bullet
                    </Button>
                  </Stack>
                </Box>
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} mb={1}>Ingredients / Dietary Info</Typography>
                  <TextField size="small" fullWidth multiline rows={4} label="Ingredients List" placeholder="e.g. Flour, Sugar, Milk, Spices, Cocoa Powder…" value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Box>
              </Box>
            </Card>

            {/* ── SECTION 5: Sale Information ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Promotional & Sale Pricing
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5 }}>
                <TextField size="small" fullWidth label="Special Sale Price" type="number" inputProps={{ step: '0.01', min: 0 }} value={formData.salePrice}
                  onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField size="small" fullWidth label="Sale Start Date" type="date" value={formData.saleStartDate ? formData.saleStartDate.slice(0, 10) : ''}
                  onChange={e => setFormData({ ...formData, saleStartDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField size="small" fullWidth label="Sale End Date" type="date" value={formData.saleEndDate ? formData.saleEndDate.slice(0, 10) : ''}
                  onChange={e => setFormData({ ...formData, saleEndDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
              </Box>
            </Card>

            {/* ── SECTION 6: Product Images ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#111827" mb={2.5} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5 }}>
                Product Gallery Images
              </Typography>
              <Box sx={{ border: '2px dashed', borderColor: uploadingImages ? 'grey.300' : 'divider', borderRadius: 0, p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                {uploadingImages ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={28} sx={{ color: BRAND }} />
                    <Typography variant="body2" color="text.secondary">Uploading images...</Typography>
                  </Box>
                ) : (
                  <>
                    <UploadOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary" mb={2}>Select JPG, PNG or WebP images to update your product gallery</Typography>
                    <input type="file" multiple accept="image/*" onChange={e => handleImageUpload(e.target.files)}
                      style={{ display: 'none' }} id="edit-image-upload" disabled={uploadingImages} />
                    <label htmlFor="edit-image-upload">
                      <Button component="span" variant="contained" startIcon={<UploadOutlinedIcon />} disabled={uploadingImages}
                        sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}>
                        Choose Images
                      </Button>
                    </label>
                  </>
                )}
                {formData.images?.length > 0 && (
                  <Box mt={2.5}>
                    <Typography variant="body2" fontWeight={600} color="text.secondary" mb={1.5} textAlign="left">Gallery Images ({formData.images.length}):</Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 1.5 }}>
                      {formData.images.map((url, i) => (
                        <Box key={i} sx={{ position: 'relative', border: '1px solid', borderColor: 'divider', height: 90, bgcolor: '#ffffff', overflow: 'hidden' }}>
                          <NextImage src={url} alt={`Upload ${i + 1}`} width={90} height={90} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          <IconButton size="small" onClick={() => handleRemoveImage(i)}
                            sx={{ position: 'absolute', top: 2, right: 2, bgcolor: 'rgba(239, 68, 68, 0.9)', color: 'white', width: 22, height: 22, p: 0, '&:hover': { bgcolor: 'error.dark' } }}>
                            <CloseIcon sx={{ fontSize: 13 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Card>

          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ flexShrink: 0, px: 3, py: 2, gap: 1.5, bgcolor: '#ffffff' }}>
          <Button onClick={() => setShowEditModal(false)} variant="outlined" sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleEditProduct} variant="contained"
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 3 }}>
            Update Product
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Size Dialog ── */}
      <Dialog open={showSizePopup} onClose={() => setShowSizePopup(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StraightenOutlinedIcon color="primary" />
            <Typography fontWeight={700}>Add Custom Size</Typography>
          </Box>
          <IconButton onClick={() => setShowSizePopup(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Size Name" autoFocus value={formData.customSize}
            onChange={e => setFormData({ ...formData, customSize: e.target.value })}
            placeholder="e.g., XXL, 2XL, Extra Small"
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setShowSizePopup(false)} variant="outlined" sx={{ borderRadius: 0 }}>Cancel</Button>
          <Button
            onClick={() => {
              if (formData.customSize.trim()) {
                setFormData({ ...formData, size: formData.customSize.trim(), customSize: '' })
                setShowSizePopup(false)
              }
            }}
            disabled={!formData.customSize.trim()}
            variant="contained" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
            Add Size
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Color Dialog ── */}
      <Dialog open={showColorPopup} onClose={() => setShowColorPopup(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaletteOutlinedIcon color="secondary" />
            <Typography fontWeight={700}>Choose Color</Typography>
          </Box>
          <IconButton onClick={() => setShowColorPopup(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {/* Predefined color grid */}
          <Typography variant="body2" fontWeight={500} mb={1.5}>Predefined Colors</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5, mb: 3 }}>
            {predefinedColors.map(c => (
              <Tooltip title={c.name} key={c.name}>
                <Box
                  onClick={() => { setFormData({ ...formData, color: c.name }); setShowColorPopup(false) }}
                  sx={{
                    bgcolor: c.hex, height: 40, borderRadius: 1, cursor: 'pointer',
                    border: '2px solid', borderColor: formData.color === c.name ? 'primary.main' : 'grey.300',
                    transition: 'transform 0.15s', '&:hover': { transform: 'scale(1.1)' },
                  }}
                />
              </Tooltip>
            ))}
          </Box>
          <Divider sx={{ mb: 2 }} />
          {/* Custom name */}
          <Typography variant="body2" fontWeight={500} mb={1}>Custom Color</Typography>
          <TextField fullWidth label="Color name" value={formData.customColor}
            onChange={e => setFormData({ ...formData, customColor: e.target.value })}
            placeholder="e.g., Midnight Blue, Forest Green"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setShowColorPopup(false)} variant="outlined" sx={{ borderRadius: 0 }}>Cancel</Button>
          <Button
            onClick={() => {
              if (formData.customColor.trim()) {
                setFormData({ ...formData, color: formData.customColor.trim(), customColor: '' })
                setShowColorPopup(false)
              }
            }}
            disabled={!formData.customColor.trim()}
            variant="contained" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
            Add Color
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null, name: '' })} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Delete Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete &quot;{deleteConfirm.name || 'this product'}&quot;? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1, gap: 1 }}>
          <Button variant="outlined" size="small" onClick={() => setDeleteConfirm({ open: false, id: null, name: '' })} sx={{ borderRadius: 0, color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button variant="contained" color="error" size="small" onClick={() => {
            const id = deleteConfirm.id
            setDeleteConfirm({ open: false, id: null, name: '' })
            if (id) handleDeleteProduct(id)
          }} sx={{ borderRadius: 0, fontWeight: 700 }}>
            Delete Product
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default VendorProductManagement
