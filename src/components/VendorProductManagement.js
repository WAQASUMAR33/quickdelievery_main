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
import Switch           from '@mui/material/Switch'
import FormControlLabel from '@mui/material/FormControlLabel'
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
import DownloadOutlinedIcon     from '@mui/icons-material/DownloadOutlined'
import UploadFileOutlinedIcon   from '@mui/icons-material/UploadFileOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'
import LayersOutlinedIcon       from '@mui/icons-material/LayersOutlined'
import LocalOfferOutlinedIcon   from '@mui/icons-material/LocalOfferOutlined'
import RestaurantOutlinedIcon   from '@mui/icons-material/RestaurantOutlined'
import FastfoodOutlinedIcon     from '@mui/icons-material/FastfoodOutlined'
import AspectRatioOutlinedIcon  from '@mui/icons-material/AspectRatioOutlined'
import { isRestaurantVendor }    from '@/lib/vendorHelpers'
import { UNIFIED_PRODUCT_PHASES, UNIFIED_CSV_COLUMNS, normalizeProductToUnified } from '@/lib/unifiedProductSchema'

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
  const [showFeedDialog, setShowFeedDialog] = useState(false)
  const [activeEditPhase, setActiveEditPhase] = useState('all')
  const [feedCsvText, setFeedCsvText] = useState('')
  const [feedUploading, setFeedUploading] = useState(false)
  const [feedImportResult, setFeedImportResult] = useState(null)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterApproval, setFilterApproval] = useState('all')
  const [viewMode, setViewMode] = useState('table')
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null, name: '' })
  const [vendorBusiness, setVendorBusiness] = useState(userData?.business || null)

  useEffect(() => {
    if (userData?.email) {
      fetch(`/api/vendor/profile?email=${encodeURIComponent(userData.email)}`)
        .then(r => r.json())
        .then(d => { if (d.success && d.data) setVendorBusiness(d.data) })
        .catch(() => {})
    }
  }, [userData?.email])

  const isRestaurant = isRestaurantVendor(userData, vendorBusiness)

  const [formData, setFormData] = useState({
    // Phase 1: Core Identifiers & Taxonomy
    sku: '',
    proName: '',
    brandName: '',
    manufacturer: '',
    barcode: '',
    productIdType: 'NONE',
    productType: '',
    menuSectionName: '',
    catId: '',
    subCatId: '',

    // Phase 2: Pricing, Availability & Offer Data
    price: '',
    cost: '',
    discount: '0',
    currency: 'PKR',
    qnty: '50',
    stock: '50',
    status: true,
    conditionType: 'Prepared Fresh',
    fulfillmentChannel: 'DEFAULT',
    salePrice: '',
    saleStartDate: '',
    saleEndDate: '',
    maxOrderQuantity: '10',
    taxCode: 'FOOD_PREP_STD',

    // Phase 3: Discoverability, Content & Descriptions
    bulletPoint1: '',
    bulletPoint2: '',
    bulletPoint3: '',
    bulletPoint4: '',
    bulletPoint5: '',
    keyFeatures: [],
    description: '',
    genericKeywords: '',
    targetAudience: '',

    // Phase 4: Food, Dietary & Safety Compliance
    ingredients: '',
    allergenInformation: '',
    dietType: 'Halal Certified',
    isExpirationDatedProduct: true,
    unitCount: '1',
    unitCountType: 'serving',
    hazmatType: 'Not Applicable - Perishable Food',
    isHalal: true,
    isVeg: false,
    prepTime: '20',
    calories: '',
    servings: '1-2 Persons',
    spiceLevel: 'Medium',

    // Phase 5: Modifiers, Options & Variations
    parentChild: 'Standalone',
    parentSku: '',
    variationTheme: '',
    modifierGroupName: 'Add-ons & Options',
    modifierItemName: '',
    modifierPriceDelta: '150',
    minSelections: '0',
    maxSelections: '4',
    addons: [],
    variations: {},
    sizeName: '',
    modelNumber: '',
    size: '',
    customSize: '',
    color: '',
    customColor: '',
    warrantyType: '1 Year Brand Warranty',
    warranty: '',
    returnPolicy: '7 Days Replacement',
    isAuthenticGuaranteed: true,

    // Phase 6: Image Media Assets
    images: [],

    // Phase 7: Dimensions, Weight & Shipping
    itemWeight: '450',
    itemWeightUnit: 'grams',
    shippingWeight: '550',
    shippingWeightUnit: 'grams',
    itemLength: '15',
    itemWidth: '15',
    itemHeight: '12',
    dimensionalUnit: 'cm',
    productDimensions: '',
    packageWeight: '',
    reviews: [],
  })

  const [newAddon, setNewAddon] = useState({ name: '', price: '' })

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

      // Build structured variations payload from valid add-ons / modifiers
      const validAddons = Array.isArray(formData.addons)
        ? formData.addons.filter(a => a && a.name && a.name.trim() && a.price !== '')
        : []

      const variationsPayload = validAddons.length > 0 ? validAddons : null

      // Build keyFeatures from 5 bullet points or keyFeatures array
      const bulletPointsList = [
        formData.bulletPoint1,
        formData.bulletPoint2,
        formData.bulletPoint3,
        formData.bulletPoint4,
        formData.bulletPoint5,
      ].filter(Boolean)
      const finalKeyFeatures = bulletPointsList.length > 0 ? bulletPointsList : (formData.keyFeatures?.filter(Boolean) || [])

      // Formatted dimensional & weight strings
      const formattedDimensions = `${formData.itemLength || 15}x${formData.itemWidth || 15}x${formData.itemHeight || 12} ${formData.dimensionalUnit || 'cm'}`
      const formattedWeight = `${formData.itemWeight || 450} ${formData.itemWeightUnit || 'grams'}`

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
          brandName:         formData.brandName || null,
          manufacturer:      formData.manufacturer || null,
          productType:       formData.productType || null,
          modelNumber:       formData.modelNumber || null,
          sizeName:          formData.sizeName || null,
          conditionType:     formData.conditionType || null,
          productDimensions: formattedDimensions,
          packageWeight:     formattedWeight,
          warranty:          formData.warrantyType || formData.warranty || null,
          size:              formData.size || null,
          color:             formData.color || null,
          keyFeatures:       finalKeyFeatures,
          ingredients:       formData.ingredients || null,
          salePrice:         formData.salePrice ? parseFloat(formData.salePrice) : null,
          saleStartDate:     formData.saleStartDate || null,
          saleEndDate:       formData.saleEndDate || null,
          currency:          formData.currency || 'PKR',
          variations:        variationsPayload,
        }),
      })
      const r = await res.json()
      if (r.success) {
        setShowEditModal(false)
        setSelectedProduct(null)
        fetchProducts()
        toast.success(isRestaurant ? 'Food item updated successfully!' : 'Product updated successfully!')
      } else {
        toast.error(`Failed to update: ${r.error}`)
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

    // Parse existing variations / add-ons
    let parsedAddons = []
    if (product.variations) {
      try {
        const v = typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations
        if (Array.isArray(v)) {
          parsedAddons = v.map(item => ({
            name: item.name || item.title || '',
            price: item.price != null ? item.price.toString() : '0',
          }))
        }
      } catch {}
    }

    const isFood = isRestaurant || ['burger', 'pizza', 'sandwich', 'biryani', 'pasta', 'bbq', 'deal', 'meal', 'platter'].some(k => (product.proName || '').toLowerCase().includes(k))
    const isVeggie = (product.proName || '').toLowerCase().includes('veg') || (product.ingredients || '').toLowerCase().includes('vegetarian')

    // Parse bullet points
    let rawBullets = []
    if (Array.isArray(product.keyFeatures)) {
      rawBullets = product.keyFeatures
    } else if (typeof product.keyFeatures === 'string') {
      try { rawBullets = JSON.parse(product.keyFeatures || '[]') } catch { rawBullets = product.keyFeatures.split(/\n+/).filter(Boolean) }
    }

    // Dimensions parser
    let parsedLength = '15', parsedWidth = '15', parsedHeight = '12', parsedDimUnit = 'cm'
    if (product.productDimensions) {
      const parts = product.productDimensions.match(/[\d.]+/g)
      if (parts && parts.length >= 3) {
        parsedLength = parts[0]
        parsedWidth = parts[1]
        parsedHeight = parts[2]
      }
      if (product.productDimensions.includes('inch')) parsedDimUnit = 'inches'
    }

    // Weight parser
    let parsedWeight = '450', parsedWeightUnit = 'grams'
    if (product.packageWeight) {
      const num = parseFloat(product.packageWeight)
      if (!isNaN(num)) parsedWeight = num.toString()
      if (product.packageWeight.toLowerCase().includes('kg')) parsedWeightUnit = 'kg'
      else if (product.packageWeight.toLowerCase().includes('oz')) parsedWeightUnit = 'oz'
      else if (product.packageWeight.toLowerCase().includes('lb')) parsedWeightUnit = 'lbs'
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
      productIdType: product.barcode ? 'UPC' : 'NONE',
      productType: product.productType || '',
      menuSectionName: product.category?.name || '',
      qnty: product.qnty != null ? product.qnty.toString() : '',
      stock: product.stock != null ? product.stock.toString() : '',
      status: product.status !== undefined ? Boolean(product.status) : true,
      conditionType: product.conditionType || (isFood ? 'Prepared Fresh' : 'New'),
      fulfillmentChannel: 'DEFAULT',
      maxOrderQuantity: '10',
      taxCode: isFood ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD',
      bulletPoint1: rawBullets[0] || '',
      bulletPoint2: rawBullets[1] || '',
      bulletPoint3: rawBullets[2] || '',
      bulletPoint4: rawBullets[3] || '',
      bulletPoint5: rawBullets[4] || '',
      keyFeatures: rawBullets,
      genericKeywords: `${product.proName} ${product.brandName || ''}`.trim(),
      targetAudience: isFood ? 'Gourmet Diners, Food Lovers' : 'Unisex-Adult',
      ingredients: product.ingredients || '',
      allergenInformation: isFood ? 'Contains: Milk, Wheat, Eggs' : 'Not Applicable',
      dietType: isFood ? 'Halal Certified' : 'Not Applicable',
      isExpirationDatedProduct: isFood,
      unitCount: '1',
      unitCountType: isFood ? 'serving' : 'item',
      hazmatType: 'Not Applicable',
      parentChild: 'Standalone',
      parentSku: '',
      variationTheme: product.size ? 'Size' : (product.color ? 'Color' : ''),
      modifierGroupName: 'Add-ons & Options',
      modifierItemName: parsedAddons.map(a => a.name).join('; '),
      modifierPriceDelta: parsedAddons[0]?.price || '150',
      minSelections: '0',
      maxSelections: '4',
      itemWeight: parsedWeight,
      itemWeightUnit: parsedWeightUnit,
      shippingWeight: (parseFloat(parsedWeight) * 1.15).toFixed(0),
      shippingWeightUnit: parsedWeightUnit,
      itemLength: parsedLength,
      itemWidth: parsedWidth,
      itemHeight: parsedHeight,
      dimensionalUnit: parsedDimUnit,
      images: Array.isArray(product.proImages) ? product.proImages : (typeof product.proImages === 'string' ? (JSON.parse(product.proImages || '[]') || []) : []),
      brandName: product.brandName || '',
      manufacturer: product.manufacturer || '',
      variations: product.variations || {},
      sizeName: product.sizeName || '',
      modelNumber: product.modelNumber || '',
      productDimensions: product.productDimensions || '',
      packageWeight: product.packageWeight || '',
      salePrice: product.salePrice != null ? product.salePrice.toString() : '',
      saleStartDate: product.saleStartDate || '',
      saleEndDate: product.saleEndDate || '',
      currency: product.currency || 'PKR',
      warranty: product.warranty || '',
      warrantyType: product.warranty || '1 Year Brand Warranty',
      returnPolicy: '7 Days Replacement',
      isAuthenticGuaranteed: true,
      reviews: product.reviews || [],
      size: product.size || '',
      customSize: '',
      color: product.color || '',
      customColor: '',
      // Food & Dining specific
      isHalal: product.isHalal !== undefined ? Boolean(product.isHalal) : true,
      isVeg: product.isVeg !== undefined ? Boolean(product.isVeg) : isVeggie,
      prepTime: product.prepTime || '20',
      calories: product.calories || '',
      servings: product.servings || '1-2 Persons',
      spiceLevel: product.spiceLevel || 'Medium',
      addons: parsedAddons.length > 0 ? parsedAddons : (isFood ? [
        { name: 'Extra Melted Cheddar Cheese', price: '150' },
        { name: 'Upgrade to Hot Crispy Fries', price: '220' },
        { name: 'Artisan Garlic Truffle Dip', price: '80' },
        { name: 'Chilled Soft Drink Can (330ml)', price: '120' },
      ] : []),
    })
    setActiveEditPhase('all')
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

  const handleFeedUpload = async () => {
    if (!feedCsvText || !feedCsvText.trim()) {
      toast.error('Please provide CSV data or select a file to upload')
      return
    }
    setFeedUploading(true)
    setFeedImportResult(null)
    try {
      const res = await authFetch('/api/products/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'text/csv' },
        body: feedCsvText,
      })
      const data = await res.json()
      if (data.success) {
        setFeedImportResult(data.data)
        toast.success(`Catalog Ingestion Completed: ${data.data.created} created, ${data.data.updated} updated`)
        fetchProducts()
      } else {
        toast.error(`Ingestion failed: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      toast.error(`Error uploading feed: ${err.message}`)
    } finally {
      setFeedUploading(false)
    }
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
          <Typography variant="h5" fontWeight={700}>
            {isRestaurant ? 'My Food Items' : 'My Products'}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {isRestaurant ? 'Manage your restaurant menu items and track approval status' : 'Manage your product listings and track approval status'}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<UploadFileOutlinedIcon />}
            onClick={() => setShowFeedDialog(true)}
            sx={{
              borderColor: '#cbd5e1',
              color: '#334155',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 13,
              px: 2,
              py: 1,
              '&:hover': { borderColor: BRAND, color: BRAND, bgcolor: `${BRAND}08` },
            }}
          >
            Unified Feed Tools (CSV / XML)
          </Button>
          <Button
            variant="contained" startIcon={<AddIcon />}
            onClick={() => router.push('/admin/dashboard/products/add')}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: '10px', px: 3, py: 1, fontWeight: 800, textTransform: 'none' }}
          >
            Add New Item
          </Button>
        </Stack>
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
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {isRestaurant ? (
                        <>
                          <Chip label="🥩 100% Halal" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, borderRadius: 0 }} />
                          <Chip label="⏱️ 20m Prep" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, borderRadius: 0 }} />
                        </>
                      ) : (
                        <>
                          {product.brandName && (
                            <Chip label={product.brandName} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, borderRadius: 0 }} />
                          )}
                          <Chip label={product.warranty ? `🛡️ ${product.warranty}` : '🛡️ 1 Year Brand Warranty'} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f8fafc', color: '#475569', fontWeight: 700, borderRadius: 0 }} />
                        </>
                      )}
                    </Box>
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

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                    {isRestaurant ? (
                      <>
                        <Chip label="🥩 100% Halal" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, borderRadius: 0 }} />
                        <Chip label="⏱️ 20m Prep" size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, borderRadius: 0 }} />
                      </>
                    ) : (
                      <>
                        {product.brandName && (
                          <Chip label={product.brandName} size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, borderRadius: 0 }} />
                        )}
                        <Chip label={product.warranty ? `🛡️ ${product.warranty}` : '🛡️ 1 Year Brand Warranty'} size="small" sx={{ height: 20, fontSize: 10, bgcolor: '#f8fafc', color: '#475569', fontWeight: 700, borderRadius: 0 }} />
                      </>
                    )}
                  </Box>

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
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                      {isRestaurant ? (
                        <>
                          <Chip label="🥩 100% Halal" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f0fdf4', color: '#166534', fontWeight: 800, borderRadius: 0 }} />
                          <Chip label="⏱️ 20m Prep" size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#fffbeb', color: '#b45309', fontWeight: 700, borderRadius: 0 }} />
                        </>
                      ) : (
                        <>
                          {product.brandName && (
                            <Chip label={product.brandName} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#eff6ff', color: '#1e40af', fontWeight: 700, borderRadius: 0 }} />
                          )}
                          <Chip label={product.warranty ? `🛡️ ${product.warranty}` : '🛡️ 1 Year Brand Warranty'} size="small" sx={{ height: 18, fontSize: 10, bgcolor: '#f8fafc', color: '#475569', fontWeight: 700, borderRadius: 0 }} />
                        </>
                      )}
                    </Box>
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

              {/* Additional Info (Only for Shop / Retail Vendors) */}
              {!isRestaurant && [selectedProduct.brandName, selectedProduct.manufacturer, selectedProduct.productType, selectedProduct.modelNumber, selectedProduct.sizeName, selectedProduct.conditionType, selectedProduct.productDimensions, selectedProduct.packageWeight, selectedProduct.warranty].some(Boolean) && (
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
            <Typography variant="h6" fontWeight={800} color="#111827">
              {isRestaurant ? 'Edit Food Item' : 'Edit Product'}
            </Typography>
            <Typography variant="caption" color="text.secondary">SKU: {formData.sku || 'N/A'}</Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowEditModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ flex: '1 1 auto', overflow: 'auto', minHeight: 0, p: { xs: 2, md: 3 }, bgcolor: 'grey.50' }}>
          {/* Phase Filter Navigation Pills */}
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, mb: 2.5, borderBottom: '1px solid', borderColor: 'divider' }}>
            {[
              { id: 'all', label: 'All 7 Phases' },
              { id: 'phase_1', label: 'Phase 1: Vital Info' },
              { id: 'phase_2', label: 'Phase 2: Pricing & Offer' },
              { id: 'phase_3', label: 'Phase 3: Discoverability' },
              { id: 'phase_4', label: 'Phase 4: Food & Safety' },
              { id: 'phase_5', label: 'Phase 5: Modifiers & Variations' },
              { id: 'phase_6', label: 'Phase 6: Image Media Assets' },
              { id: 'phase_7', label: 'Phase 7: Dimensions & Shipping' },
            ].map(tab => (
              <Button
                key={tab.id}
                size="small"
                variant={activeEditPhase === tab.id ? 'contained' : 'outlined'}
                onClick={() => setActiveEditPhase(tab.id)}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: activeEditPhase === tab.id ? 800 : 600,
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  bgcolor: activeEditPhase === tab.id ? BRAND : '#ffffff',
                  borderColor: activeEditPhase === tab.id ? BRAND : '#cbd5e1',
                  color: activeEditPhase === tab.id ? '#ffffff' : '#334155',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: activeEditPhase === tab.id ? BRAND_DARK : '#f8fafc',
                    borderColor: activeEditPhase === tab.id ? BRAND_DARK : '#94a3b8',
                  }
                }}
              >
                {tab.label}
              </Button>
            ))}
          </Box>

          <Stack spacing={3}>
            {/* ── PHASE 1: Core Identifiers & Taxonomy (Vital Info) ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_1') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 1" size="small" sx={{ bgcolor: `${BRAND}15`, color: BRAND, fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Core Identifiers & Taxonomy (Vital Info)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Fundamental catalog identification, barcode values, and taxonomy classification.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    size="small" fullWidth label="Item SKU *"
                    value={formData.sku}
                    onChange={e => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. QD-ANGUS-001"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label={isRestaurant ? 'Product Name / Dish Title *' : 'Product Name *'}
                    value={formData.proName}
                    onChange={e => setFormData({ ...formData, proName: e.target.value })}
                    placeholder="e.g. Truffle Angus Gourmet Burger"
                    sx={{ width: '100%', gridColumn: { xs: '1 / -1', md: 'span 3' }, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Brand Name"
                    value={formData.brandName}
                    onChange={e => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Registered brand or restaurant kitchen"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Manufacturer / Producer"
                    value={formData.manufacturer}
                    onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Maker or culinary producer"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Product ID (Barcode)"
                    value={formData.barcode}
                    onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="UPC, EAN, ISBN or blank for menu"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Product ID Type</InputLabel>
                    <Select
                      value={formData.productIdType || 'NONE'}
                      label="Product ID Type"
                      onChange={e => setFormData({ ...formData, productIdType: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['UPC', 'EAN', 'GTIN', 'ASIN', 'ISBN', 'JAN', 'NONE'].map(t => (
                        <MenuItem key={t} value={t}>{t}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Product Type / Subtype"
                    value={formData.productType}
                    onChange={e => setFormData({ ...formData, productType: e.target.value })}
                    placeholder="e.g. Grocery & Gourmet Food, Restaurant Items"
                    sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Menu Section Name (Food)"
                    value={formData.menuSectionName}
                    onChange={e => setFormData({ ...formData, menuSectionName: e.target.value })}
                    placeholder="e.g. Appetizers, Entrees, Chef Specials"
                    sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' }, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  {/* Category */}
                  <FormControl size="small" fullWidth sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Product Category *</InputLabel>
                    <Select
                      value={formData.catId ? String(formData.catId) : ''}
                      label="Product Category *"
                      onChange={e => setFormData({ ...formData, catId: e.target.value, subCatId: '' })}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value=""><em>Select Category</em></MenuItem>
                      {categories.map(c => <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Subcategory */}
                  <FormControl size="small" fullWidth disabled={!formData.catId} sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Subcategory *</InputLabel>
                    <Select
                      value={formData.subCatId ? String(formData.subCatId) : ''}
                      label="Subcategory *"
                      onChange={e => setFormData({ ...formData, subCatId: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value=""><em>Select Subcategory</em></MenuItem>
                      {(() => {
                        const selCat = categories.find(c => String(c.id) === String(formData.catId))
                        const targetCatId = selCat?.catId || formData.catId
                        const filtered = subcategories.filter(s => String(s.catId) === String(targetCatId))
                        return filtered.map(s => (
                          <MenuItem key={s.subCatId} value={String(s.subCatId)}>{s.subCatName}</MenuItem>
                        ))
                      })()}
                    </Select>
                  </FormControl>
                </Box>
              </Card>
            )}

            {/* ── PHASE 2: Pricing, Availability & Offer Data ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_2') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 2" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Pricing, Availability & Offer Data
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Commercial regular baseline prices, stock thresholds, promotions, and tax classifications.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    size="small" fullWidth label="Standard Price *" type="number" inputProps={{ step: '0.01', min: 0 }}
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">{formData.currency || 'PKR'}</InputAdornment> }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Currency</InputLabel>
                    <Select
                      value={formData.currency || 'PKR'}
                      label="Currency"
                      onChange={e => setFormData({ ...formData, currency: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Stock Quantity / Inventory *" type="number" inputProps={{ min: 0 }}
                    value={formData.stock}
                    onChange={e => setFormData({ ...formData, stock: e.target.value, qnty: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Condition Type</InputLabel>
                    <Select
                      value={formData.conditionType || (isRestaurant ? 'Prepared Fresh' : 'New')}
                      label="Condition Type"
                      onChange={e => setFormData({ ...formData, conditionType: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['New', 'Prepared Fresh', 'Refurbished', 'Used'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Fulfillment Channel</InputLabel>
                    <Select
                      value={formData.fulfillmentChannel || 'DEFAULT'}
                      label="Fulfillment Channel"
                      onChange={e => setFormData({ ...formData, fulfillmentChannel: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value="DEFAULT">DEFAULT (Merchant / Restaurant Delivery)</MenuItem>
                      <MenuItem value="MERCHANT_DELIVERY">MERCHANT_DELIVERY (Direct Fleet)</MenuItem>
                      <MenuItem value="EXPRESS_COURIER">EXPRESS_COURIER (QuickDelivery On-Demand)</MenuItem>
                      <MenuItem value="AMAZON_NA">AMAZON_NA (FBA / Platform Fulfillment)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Special Sale Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                    value={formData.salePrice}
                    onChange={e => setFormData({ ...formData, salePrice: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">{formData.currency || 'PKR'}</InputAdornment> }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Sale From Date" type="date"
                    value={formData.saleStartDate ? formData.saleStartDate.slice(0, 10) : ''}
                    onChange={e => setFormData({ ...formData, saleStartDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Sale End Date" type="date"
                    value={formData.saleEndDate ? formData.saleEndDate.slice(0, 10) : ''}
                    onChange={e => setFormData({ ...formData, saleEndDate: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Max Order Quantity" type="number" inputProps={{ min: 1 }}
                    value={formData.maxOrderQuantity || '10'}
                    onChange={e => setFormData({ ...formData, maxOrderQuantity: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Tax Code"
                    value={formData.taxCode || (isRestaurant ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD')}
                    onChange={e => setFormData({ ...formData, taxCode: e.target.value })}
                    placeholder="FOOD_PREP_STD / RETAIL_STD"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                    value={formData.cost}
                    onChange={e => setFormData({ ...formData, cost: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">{formData.currency || 'PKR'}</InputAdornment> }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Standard Discount %" type="number" inputProps={{ min: 0, max: 100 }}
                    value={formData.discount}
                    onChange={e => setFormData({ ...formData, discount: e.target.value })}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Box>
              </Card>
            )}

            {/* ── PHASE 3: Discoverability, Content & Descriptions ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_3') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 3" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Discoverability, Content & Descriptions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      5 scannable feature highlights, narrative marketing copy, search tokens, and demographic targets.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                  <Box sx={{ gridColumn: '1 / -1' }}>
                    <Typography variant="subtitle2" fontWeight={700} mb={1}>
                      Bullet Point 1 through Bullet Point 5 (Scannable Features / Core Ingredients)
                    </Typography>
                    <Stack spacing={1.5}>
                      <TextField
                        size="small" fullWidth label="Bullet Point 1 *"
                        value={formData.bulletPoint1}
                        onChange={e => setFormData({ ...formData, bulletPoint1: e.target.value })}
                        placeholder="Feature highlight 1 or core culinary ingredient..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <TextField
                        size="small" fullWidth label="Bullet Point 2"
                        value={formData.bulletPoint2}
                        onChange={e => setFormData({ ...formData, bulletPoint2: e.target.value })}
                        placeholder="Feature highlight 2..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <TextField
                        size="small" fullWidth label="Bullet Point 3"
                        value={formData.bulletPoint3}
                        onChange={e => setFormData({ ...formData, bulletPoint3: e.target.value })}
                        placeholder="Feature highlight 3..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <TextField
                        size="small" fullWidth label="Bullet Point 4"
                        value={formData.bulletPoint4}
                        onChange={e => setFormData({ ...formData, bulletPoint4: e.target.value })}
                        placeholder="Feature highlight 4..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <TextField
                        size="small" fullWidth label="Bullet Point 5"
                        value={formData.bulletPoint5}
                        onChange={e => setFormData({ ...formData, bulletPoint5: e.target.value })}
                        placeholder="Feature highlight 5..."
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    </Stack>
                  </Box>

                  <TextField
                    size="small" fullWidth multiline rows={4} label="Product Description (Narrative Story) *"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Narrative detailing product features, use cases, or preparation style..."
                    sx={{ width: '100%', gridColumn: '1 / -1', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Generic Keywords (Search Terms)"
                    value={formData.genericKeywords}
                    onChange={e => setFormData({ ...formData, genericKeywords: e.target.value })}
                    placeholder="Backend metadata search tokens (up to 200 bytes, comma-separated)"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Target Audience"
                    value={formData.targetAudience}
                    onChange={e => setFormData({ ...formData, targetAudience: e.target.value })}
                    placeholder="e.g. Unisex-Adult, Gourmet Diners, Kids"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Box>
              </Card>
            )}

            {/* ── PHASE 4: Food, Dietary & Safety Compliance ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_4') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 4" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Food, Dietary & Safety Compliance
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Ingredient declarations ordered by weight, major allergen warnings, diet types, and shelf life.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                  <TextField
                    size="small" fullWidth multiline rows={3} label="Ingredients (Ordered by weight)"
                    value={formData.ingredients}
                    onChange={e => setFormData({ ...formData, ingredients: e.target.value })}
                    placeholder="e.g. Angus Beef (65%), Brioche Flour (Wheat, Butter, Eggs), Cheddar Cheese (Milk, Salt), Black Truffle Oil..."
                    sx={{ width: '100%', gridColumn: '1 / -1', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Allergen Information"
                    value={formData.allergenInformation}
                    onChange={e => setFormData({ ...formData, allergenInformation: e.target.value })}
                    placeholder="e.g. Contains: Milk, Wheat, Soy, Eggs. May contain traces of Sesame."
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Diet Type"
                    value={formData.dietType}
                    onChange={e => setFormData({ ...formData, dietType: e.target.value })}
                    placeholder="e.g. Halal Certified, Gluten-Free, Vegan, High Protein"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>Expiration Dated Product</Typography>
                      <Typography variant="caption" color="text.secondary">Indicates items with short shelf life or prepared fresh consumption window</Typography>
                    </Box>
                    <Switch
                      checked={Boolean(formData.isExpirationDatedProduct)}
                      onChange={e => setFormData({ ...formData, isExpirationDatedProduct: e.target.checked })}
                      color="success"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField
                      size="small" label="Unit Count" type="number" inputProps={{ min: 1 }}
                      value={formData.unitCount || '1'}
                      onChange={e => setFormData({ ...formData, unitCount: e.target.value })}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                    />
                    <FormControl size="small" sx={{ flex: 1.5 }}>
                      <InputLabel>Unit Count Type</InputLabel>
                      <Select
                        value={formData.unitCountType || 'serving'}
                        label="Unit Count Type"
                        onChange={e => setFormData({ ...formData, unitCountType: e.target.value })}
                        sx={{ borderRadius: 0 }}
                      >
                        {['serving', 'gram', 'kg', 'oz', 'ml', 'piece', 'item', 'pack'].map(u => (
                          <MenuItem key={u} value={u}>{u}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>

                  <TextField
                    size="small" fullWidth label="Hazmat Type / Safety Info"
                    value={formData.hazmatType || 'Not Applicable - Perishable Food'}
                    onChange={e => setFormData({ ...formData, hazmatType: e.target.value })}
                    placeholder="e.g. Not Applicable, Lithium Battery, Cold Storage Required"
                    sx={{ width: '100%', gridColumn: '1 / -1', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  {/* Food Vendor Quick Badges */}
                  <Box sx={{ gridColumn: '1 / -1', p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#166534" mb={1.5}>
                      Food Kitchen Badges & Preparation Attributes
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                      <FormControlLabel
                        control={<Switch checked={Boolean(formData.isHalal)} onChange={e => setFormData({ ...formData, isHalal: e.target.checked })} color="success" />}
                        label={<Typography variant="body2" fontWeight={700} color="#166534">🥩 100% Halal Certified</Typography>}
                      />
                      <FormControlLabel
                        control={<Switch checked={Boolean(formData.isVeg)} onChange={e => setFormData({ ...formData, isVeg: e.target.checked })} color="success" />}
                        label={<Typography variant="body2" fontWeight={700} color="#166534">🌱 Pure Vegetarian</Typography>}
                      />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                      <TextField size="small" label="Prep Time (mins)" value={formData.prepTime || '20'}
                        onChange={e => setFormData({ ...formData, prepTime: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#ffffff' } }} />
                      <TextField size="small" label="Calories (kcal)" value={formData.calories || ''}
                        onChange={e => setFormData({ ...formData, calories: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#ffffff' } }} />
                      <TextField size="small" label="Portion / Servings" value={formData.servings || '1-2 Persons'}
                        onChange={e => setFormData({ ...formData, servings: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#ffffff' } }} />
                      <FormControl size="small">
                        <InputLabel>Spice Level</InputLabel>
                        <Select value={formData.spiceLevel || 'Medium'} label="Spice Level"
                          onChange={e => setFormData({ ...formData, spiceLevel: e.target.value })}
                          sx={{ borderRadius: 0, bgcolor: '#ffffff' }}>
                          <MenuItem value="Mild">Mild 🟢</MenuItem>
                          <MenuItem value="Medium">Medium 🟡</MenuItem>
                          <MenuItem value="Hot">Hot 🔴</MenuItem>
                          <MenuItem value="Extra Hot">Extra Hot 🔥</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Box>
              </Card>
            )}

            {/* ── PHASE 5: Modifiers, Options & Variations (Customizations) ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_5') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 5" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Modifiers, Options & Variations (Customizations)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Variant split hierarchies (Parent/Child), variation themes, and restaurant modifier add-on groups.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Parent / Child</InputLabel>
                    <Select
                      value={formData.parentChild || 'Standalone'}
                      label="Parent / Child"
                      onChange={e => setFormData({ ...formData, parentChild: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value="Standalone">Standalone</MenuItem>
                      <MenuItem value="Parent">Parent (Display Master)</MenuItem>
                      <MenuItem value="Child">Child (Variant SKU)</MenuItem>
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Parent SKU"
                    value={formData.parentSku}
                    onChange={e => setFormData({ ...formData, parentSku: e.target.value })}
                    placeholder="Link to Parent SKU"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Variation Theme"
                    value={formData.variationTheme}
                    onChange={e => setFormData({ ...formData, variationTheme: e.target.value })}
                    placeholder="e.g. Size, Color, Flavor, Portion"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Modifier Group Name"
                    value={formData.modifierGroupName || 'Add-ons & Options'}
                    onChange={e => setFormData({ ...formData, modifierGroupName: e.target.value })}
                    placeholder="e.g. Choose Protein, Add-ons"
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Min Selections" type="number" inputProps={{ min: 0 }}
                    value={formData.minSelections || '0'}
                    onChange={e => setFormData({ ...formData, minSelections: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Max Selections" type="number" inputProps={{ min: 1 }}
                    value={formData.maxSelections || '4'}
                    onChange={e => setFormData({ ...formData, maxSelections: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                </Box>

                {/* Interactive Modifiers / Add-ons List */}
                <Box sx={{ p: 2.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#111827" mb={1.5}>
                    Active Modifiers & Add-on Items ({formData.addons?.length || 0})
                  </Typography>

                  <Stack spacing={1.5} sx={{ mb: 2 }}>
                    {(formData.addons || []).map((addon, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#ffffff', border: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="body2" fontWeight={700} color="#111827">{addon.name}</Typography>
                          <Chip label={`+ Rs. ${parseFloat(addon.price || 0).toLocaleString()}`} size="small"
                            sx={{ height: 22, fontWeight: 700, bgcolor: '#dbeafe', color: '#1e40af', borderRadius: 0 }} />
                        </Box>
                        <IconButton size="small" color="error" onClick={() => setFormData({ ...formData, addons: formData.addons.filter((_, i) => i !== index) })}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    {(!formData.addons || formData.addons.length === 0) && (
                      <Typography variant="body2" color="text.secondary">No modifiers configured. Add options like Extra Cheese, Dips, or Slices below.</Typography>
                    )}
                  </Stack>

                  {/* Add New Modifier Input */}
                  <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'center' }}>
                    <TextField size="small" label="Modifier Item Name" placeholder="e.g. Extra Cheddar Cheese, Grilled Chicken"
                      value={newAddon.name} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })}
                      sx={{ flex: 2, minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#ffffff' } }} />
                    <TextField size="small" label="Price Delta (Rs.)" type="number" placeholder="e.g. 150"
                      value={newAddon.price} onChange={e => setNewAddon({ ...newAddon, price: e.target.value })}
                      InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                      sx={{ flex: 1, minWidth: 120, '& .MuiOutlinedInput-root': { borderRadius: 0, bgcolor: '#ffffff' } }} />
                    <Button variant="contained" startIcon={<AddIcon />}
                      onClick={() => {
                        if (!newAddon.name.trim() || !newAddon.price) { toast.error('Please enter modifier name and price'); return }
                        setFormData({ ...formData, addons: [...(formData.addons || []), { name: newAddon.name.trim(), price: newAddon.price }] })
                        setNewAddon({ name: '', price: '' })
                        toast.success('Modifier added')
                      }}
                      sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Add Modifier
                    </Button>
                  </Box>
                </Box>

                {/* Retail Size & Color Variant Pickers */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>Standard Size Attribute</Typography>
                      <Button size="small" variant="outlined" onClick={() => setShowSizePopup(true)} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>+ Custom Size</Button>
                    </Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Size</InputLabel>
                      <Select value={formData.size || ''} label="Select Size" onChange={e => setFormData({ ...formData, size: e.target.value })} sx={{ borderRadius: 0, bgcolor: '#ffffff' }}>
                        <MenuItem value=""><em>None / Standard</em></MenuItem>
                        {['Small', 'Medium', 'Large', 'XL', 'XXL'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>Color Attribute</Typography>
                      <Button size="small" variant="outlined" onClick={() => setShowColorPopup(true)} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>+ Custom Color</Button>
                    </Box>
                    <FormControl fullWidth size="small">
                      <InputLabel>Select Color</InputLabel>
                      <Select value={formData.color || ''} label="Select Color" onChange={e => setFormData({ ...formData, color: e.target.value })} sx={{ borderRadius: 0, bgcolor: '#ffffff' }}>
                        <MenuItem value=""><em>None / Default</em></MenuItem>
                        {predefinedColors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              </Card>
            )}

            {/* ── PHASE 6: Image Media Assets ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_6') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 6" size="small" sx={{ bgcolor: '#ffe4e6', color: '#be123c', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Image Media Assets
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Main high-resolution showcase image and secondary angle / packaging shots (up to 8).
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ border: '2px dashed', borderColor: uploadingImages ? 'grey.300' : 'divider', borderRadius: 0, p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
                  {uploadingImages ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={28} sx={{ color: BRAND }} />
                      <Typography variant="body2" color="text.secondary">Uploading high-resolution images...</Typography>
                    </Box>
                  ) : (
                    <>
                      <UploadOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                      <Typography variant="body2" color="text.secondary" mb={2}>
                        Upload main product photo and secondary angle shots (JPG, PNG, WebP)
                      </Typography>
                      <input type="file" multiple accept="image/*" onChange={e => handleImageUpload(e.target.files)}
                        style={{ display: 'none' }} id="unified-edit-image-upload" disabled={uploadingImages} />
                      <label htmlFor="unified-edit-image-upload">
                        <Button component="span" variant="contained" startIcon={<UploadOutlinedIcon />} disabled={uploadingImages}
                          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}>
                          Upload Gallery Images
                        </Button>
                      </label>
                    </>
                  )}

                  {formData.images?.length > 0 && (
                    <Box mt={3}>
                      <Typography variant="body2" fontWeight={700} color="text.secondary" mb={1.5} textAlign="left">
                        Active Gallery Assets ({formData.images.length}): Primary is Slot #1
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1.5 }}>
                        {formData.images.map((url, i) => (
                          <Box key={i} sx={{ position: 'relative', border: '1px solid', borderColor: i === 0 ? BRAND : 'divider', height: 100, bgcolor: '#ffffff', overflow: 'hidden' }}>
                            <NextImage src={url} alt={`Upload ${i + 1}`} width={100} height={100} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: i === 0 ? BRAND : 'rgba(0,0,0,0.6)', color: '#ffffff', fontSize: 10, py: 0.25, textAlign: 'center', fontWeight: 800 }}>
                              {i === 0 ? 'MAIN IMAGE' : `OTHER #${i}`}
                            </Box>
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
            )}

            {/* ── PHASE 7: Dimensions, Weight & Shipping ── */}
            {(activeEditPhase === 'all' || activeEditPhase === 'phase_7') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 7" size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="#111827">
                      Dimensions, Weight & Shipping
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Net item metrics, shipping tare weight, package size dimensions, warranty, and return policies.
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    size="small" fullWidth label="Net Item Weight" type="number" inputProps={{ min: 0 }}
                    value={formData.itemWeight}
                    onChange={e => setFormData({ ...formData, itemWeight: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Item Weight Unit</InputLabel>
                    <Select
                      value={formData.itemWeightUnit || 'grams'}
                      label="Item Weight Unit"
                      onChange={e => setFormData({ ...formData, itemWeightUnit: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['grams', 'kg', 'oz', 'lbs'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Shipping Weight" type="number" inputProps={{ min: 0 }}
                    value={formData.shippingWeight}
                    onChange={e => setFormData({ ...formData, shippingWeight: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Shipping Weight Unit</InputLabel>
                    <Select
                      value={formData.shippingWeightUnit || 'grams'}
                      label="Shipping Weight Unit"
                      onChange={e => setFormData({ ...formData, shippingWeightUnit: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['grams', 'kg', 'oz', 'lbs'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField
                    size="small" fullWidth label="Item Length" type="number" inputProps={{ min: 0 }}
                    value={formData.itemLength}
                    onChange={e => setFormData({ ...formData, itemLength: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Item Width" type="number" inputProps={{ min: 0 }}
                    value={formData.itemWidth}
                    onChange={e => setFormData({ ...formData, itemWidth: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <TextField
                    size="small" fullWidth label="Item Height" type="number" inputProps={{ min: 0 }}
                    value={formData.itemHeight}
                    onChange={e => setFormData({ ...formData, itemHeight: e.target.value })}
                    sx={{ width: '100%', '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />

                  <FormControl size="small" fullWidth sx={{ width: '100%' }}>
                    <InputLabel>Dimensional Unit</InputLabel>
                    <Select
                      value={formData.dimensionalUnit || 'cm'}
                      label="Dimensional Unit"
                      onChange={e => setFormData({ ...formData, dimensionalUnit: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {['cm', 'inches', 'mm'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Amazon / Daraz Warranty & Return Policy */}
                  <FormControl size="small" fullWidth sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Warranty Coverage (Amazon / Daraz)</InputLabel>
                    <Select
                      value={formData.warrantyType || formData.warranty || '1 Year Brand Warranty'}
                      label="Warranty Coverage (Amazon / Daraz)"
                      onChange={e => setFormData({ ...formData, warrantyType: e.target.value, warranty: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {[
                        '1 Year Official Brand Warranty',
                        '2 Years Official Brand Warranty',
                        '6 Months Brand Warranty',
                        '3 Months Seller Warranty',
                        '7 Days Replacement Warranty',
                        '7 Days Checking Warranty',
                        'No Warranty',
                      ].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth sx={{ width: '100%', gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Return & Resolution Policy</InputLabel>
                    <Select
                      value={formData.returnPolicy || '7 Days Replacement'}
                      label="Return & Resolution Policy"
                      onChange={e => setFormData({ ...formData, returnPolicy: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      {[
                        '7 Days Free Return / Refund',
                        '14 Days Replacement Guarantee',
                        '30 Days Buyer Protection',
                        'Non-Returnable (Hygiene / Perishable)',
                      ].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Card>
            )}

          </Stack>
        </DialogContent>

        <Divider />
        <DialogActions sx={{ flexShrink: 0, px: 3, py: 2, gap: 1.5, bgcolor: '#ffffff' }}>
          <Button onClick={() => setShowEditModal(false)} variant="outlined" sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleEditProduct} variant="contained"
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 3 }}>
            Update Product (7-Phase Sync)
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Unified Catalog Feed Tools Dialog (CSV / XML / JSON) ── */}
      <Dialog
        open={showFeedDialog}
        onClose={() => setShowFeedDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 0 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#111827">
              Unified Catalog Feed & Ingestion Engine
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Single-product data interchange template combining retail & food catalogs (Amazon & Daraz compatible)
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowFeedDialog(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Stack spacing={3}>
            {/* Step 1: Download Official Template */}
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: '#cbd5e1', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
                1. Download Official 7-Phase Schema Template
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Pre-formatted flat file templates containing sample records for both restaurant dishes and retail products.
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  component="a"
                  href="/api/products/feed?type=template&format=csv"
                  download="unified_product_template.csv"
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
                >
                  Download Flat CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  component="a"
                  href="/api/products/feed?type=template&format=xml"
                  download="unified_product_feed.xml"
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
                >
                  Download XML Feed
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  component="a"
                  href="/api/products/feed?type=template&format=json"
                  download="unified_product_schema.json"
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
                >
                  Download JSON Schema
                </Button>
              </Stack>
            </Paper>

            {/* Step 2: Export Current Catalog */}
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: '#cbd5e1', bgcolor: '#f8fafc' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
                2. Export Store Inventory in Unified 7-Phase Format
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Export your live listings including bullets, ingredients, allergens, modifiers, and dimensional weights.
              </Typography>
              <Stack direction="row" spacing={1.5} flexWrap="wrap">
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  component="a"
                  href={`/api/products/feed?type=export&format=csv&vendorId=${userData?.uid || ''}`}
                  download="my_store_catalog.csv"
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
                >
                  Export Store CSV
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<DownloadOutlinedIcon />}
                  component="a"
                  href={`/api/products/feed?type=export&format=xml&vendorId=${userData?.uid || ''}`}
                  download="my_store_catalog.xml"
                  sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, bgcolor: '#ffffff' }}
                >
                  Export Store XML
                </Button>
              </Stack>
            </Paper>

            {/* Step 3: Bulk Upload / Ingest */}
            <Paper elevation={0} sx={{ p: 2.5, border: '1px solid', borderColor: '#cbd5e1', bgcolor: '#ffffff' }}>
              <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={0.5}>
                3. Bulk Ingest / Upload Products (CSV File or Raw Text)
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                Upload or paste CSV rows matching the 7-phase schema to create or update listings in one batch.
              </Typography>

              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  id="feed-file-upload-input"
                  style={{ display: 'none' }}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      const text = await file.text()
                      setFeedCsvText(text)
                      toast.success(`Loaded "${file.name}" into editor`)
                    }
                  }}
                />
                <label htmlFor="feed-file-upload-input">
                  <Button
                    variant="outlined"
                    component="span"
                    size="small"
                    startIcon={<UploadFileOutlinedIcon />}
                    sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, mb: 1.5 }}
                  >
                    Select CSV File from Computer
                  </Button>
                </label>
              </Box>

              <TextField
                fullWidth
                multiline
                rows={6}
                value={feedCsvText}
                onChange={e => setFeedCsvText(e.target.value)}
                placeholder="Paste CSV data here or select a file above...
item_sku,product_name,brand_name,manufacturer,product_id,product_id_type,product_type,menu_section_name,price,currency,quantity,condition_type..."
                sx={{
                  fontFamily: 'monospace',
                  fontSize: 12,
                  '& .MuiOutlinedInput-root': { borderRadius: 0 }
                }}
              />

              {feedImportResult && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#f0fdf4', border: '1px solid #86efac' }}>
                  <Typography variant="body2" fontWeight={800} color="#166534">
                    Batch Results: {feedImportResult.created} Created, {feedImportResult.updated} Updated, {feedImportResult.failed} Failed (Total Processed: {feedImportResult.total})
                  </Typography>
                  {feedImportResult.errors?.length > 0 && (
                    <Box sx={{ mt: 1, maxHeight: 80, overflowY: 'auto' }}>
                      {feedImportResult.errors.map((err, idx) => (
                        <Typography key={idx} variant="caption" color="error.main" display="block">
                          Row {err.row}: {err.error}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              )}

              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => { setFeedCsvText(''); setFeedImportResult(null) }}
                  sx={{ borderRadius: 0, textTransform: 'none' }}
                >
                  Clear
                </Button>
                <Button
                  variant="contained"
                  disabled={feedUploading || !feedCsvText.trim()}
                  onClick={handleFeedUpload}
                  startIcon={feedUploading ? <CircularProgress size={16} color="inherit" /> : <UploadOutlinedIcon />}
                  sx={{
                    bgcolor: BRAND,
                    '&:hover': { bgcolor: BRAND_DARK },
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 800,
                    px: 3,
                  }}
                >
                  {feedUploading ? 'Processing Ingestion...' : 'Run Bulk Ingestion'}
                </Button>
              </Box>
            </Paper>
          </Stack>
        </DialogContent>
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
