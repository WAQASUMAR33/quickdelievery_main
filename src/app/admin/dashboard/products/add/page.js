'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserVerification } from '@/lib/authHelpers'
import { authFetch } from '@/lib/apiClient'
import { uploadMultipleImages } from '@/lib/imageUpload'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { isRestaurantVendor } from '@/lib/vendorHelpers'
import { getSampleUnifiedProducts } from '@/lib/unifiedProductSchema'
import toast from 'react-hot-toast'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Menu from '@mui/material/Menu'

import AddIcon from '@mui/icons-material/Add'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CloseIcon from '@mui/icons-material/Close'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import UploadOutlinedIcon from '@mui/icons-material/UploadOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined'
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined'
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined'
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined'
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined'

const BRAND = '#39772A'
const BRAND_DARK = '#2E5F22'

const tfStyle = {
  borderRadius: 0,
  '& .MuiOutlinedInput-root': { borderRadius: '0px !important' },
  '& .MuiOutlinedInput-notchedOutline': { borderRadius: '0px !important' },
  '& fieldset': { borderRadius: '0px !important' },
  '& .MuiInputBase-root': { borderRadius: '0px !important' },
  '& .MuiSelect-select': { borderRadius: '0px !important' },
}

export default function AddProductPage() {
  const router = useRouter()
  const { userData, user, loading } = useAuth()
  const fileInputRef = useRef(null)

  const [categories, setCategories] = useState([])
  const [productCategories, setProductCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [vendorBusiness, setVendorBusiness] = useState(userData?.business || null)

  const [activePhase, setActivePhase] = useState('all')
  const [sampleMenuAnchor, setSampleMenuAnchor] = useState(null)
  const [showSizePopup, setShowSizePopup] = useState(false)
  const [showColorPopup, setShowColorPopup] = useState(false)
  const [customSizeInput, setCustomSizeInput] = useState('')
  const [customColorInput, setCustomColorInput] = useState('')

  const predefinedColors = [
    { name: 'Black', hex: '#000000' }, { name: 'White', hex: '#FFFFFF' },
    { name: 'Red', hex: '#EF4444' }, { name: 'Blue', hex: '#3B82F6' },
    { name: 'Green', hex: '#10B981' }, { name: 'Yellow', hex: '#F59E0B' },
    { name: 'Purple', hex: '#8B5CF6' }, { name: 'Pink', hex: '#EC4899' },
    { name: 'Orange', hex: '#F97316' }, { name: 'Gray', hex: '#6B7280' },
  ]

  useEffect(() => {
    if (userData?.email) {
      fetch(`/api/vendor/profile?email=${encodeURIComponent(userData.email)}`)
        .then(r => r.json())
        .then(d => { if (d.success && d.data) setVendorBusiness(d.data) })
        .catch(() => {})
    }
  }, [userData?.email])

  const isRestaurant = isRestaurantVendor(userData, vendorBusiness)

  // ── Unified 7-Phase Form State ──────────────────────────────────────────────
  const [form, setForm] = useState({
    // Phase 1: Core Identifiers & Taxonomy
    sku: '',
    name: '',
    brandName: '',
    manufacturer: '',
    barcode: '',
    productIdType: 'NONE',
    productType: isRestaurant ? 'Grocery & Gourmet Food / Restaurant Items' : 'Physical Retail Product',
    menuSectionName: isRestaurant ? 'Chef Signature Entrees' : '',
    catId: '',
    productCategoryId: '',
    subCatId: '',

    // Phase 2: Pricing, Availability & Offer Data
    price: '',
    cost: '',
    discount: '0',
    currency: 'PKR',
    stock: '50',
    status: true,
    conditionType: isRestaurant ? 'Prepared Fresh' : 'New',
    fulfillmentChannel: 'DEFAULT',
    salePrice: '',
    saleStartDate: '',
    saleEndDate: '',
    maxOrderQuantity: '10',
    taxCode: isRestaurant ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD',

    // Phase 3: Discoverability, Content & Descriptions
    bulletPoint1: '',
    bulletPoint2: '',
    bulletPoint3: '',
    bulletPoint4: '',
    bulletPoint5: '',
    description: '',
    genericKeywords: '',
    targetAudience: isRestaurant ? 'Unisex-Adult, Foodies, Gourmet Diners' : 'Unisex-Adult',

    // Phase 4: Food, Dietary & Safety Compliance
    ingredients: '',
    allergenInformation: isRestaurant ? 'Contains: Milk, Wheat, Eggs' : 'Not Applicable',
    dietType: isRestaurant ? 'Halal Certified' : 'Not Applicable',
    isExpirationDatedProduct: isRestaurant,
    unitCount: '1',
    unitCountType: isRestaurant ? 'serving' : 'item',
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
    variationTheme: isRestaurant ? 'Portion / Add-ons' : '',
    modifierGroupName: 'Add-ons & Options',
    minSelections: '0',
    maxSelections: '4',
    addons: isRestaurant ? [
      { name: 'Extra Melted Cheddar Cheese', price: '150' },
      { name: 'Upgrade to Hot Crispy Fries', price: '220' },
      { name: 'Garlic Mayo Truffle Dip', price: '80' },
    ] : [],
    size: '',
    color: '',

    // Phase 6: Image Media Assets
    images: [],

    // Phase 7: Dimensions, Weight & Shipping
    itemWeight: isRestaurant ? '450' : '500',
    itemWeightUnit: 'grams',
    shippingWeight: isRestaurant ? '550' : '650',
    shippingWeightUnit: 'grams',
    itemLength: '18',
    itemWidth: '18',
    itemHeight: '12',
    dimensionalUnit: 'cm',
    warrantyType: isRestaurant ? 'Freshness & Quality Guarantee' : '1 Year Official Brand Warranty',
    returnPolicy: isRestaurant ? 'Immediate Replacement on Delivery' : '7 Days Free Return / Refund',
    isAuthenticGuaranteed: true,
  })

  const [newAddon, setNewAddon] = useState({ name: '', price: '' })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!loading) {
      const v = checkUserVerification(user, userData)
      if (!v.isVerified) { router.push('/login'); return }
      if (!['ADMIN', 'SUPER_ADMIN', 'VENDOR'].includes(userData?.role)) {
        router.push('/admin/dashboard'); return
      }
    }
  }, [user, userData, loading, router])

  useEffect(() => {
    if (!userData?.uid) return
    Promise.all([
      fetch('/api/products?type=categories').then(r => r.json()),
      fetch('/api/products?type=productcategories').then(r => r.json()),
      fetch('/api/products?type=subcategories').then(r => r.json()),
    ]).then(([catsData, pcData, subsData]) => {
      const fetchedCats = catsData.success ? (catsData.data || []) : []
      if (catsData.success) setCategories(fetchedCats)
      if (pcData.success)   setProductCategories(pcData.data || [])
      if (subsData.success) setSubcategories(subsData.data || [])

      // Auto-initialize form.catId if not already set
      const restaurantCat = fetchedCats.find(c => {
        const n = (c.name || '').toLowerCase()
        const code = (c.code || '').toLowerCase()
        return n === 'restaurant' || code === 'restaurant' || n.includes('restaurant') || code.includes('restaurant') || c.vertical === 'FOOD'
      })
      const defaultCatId = (isRestaurant && restaurantCat) ? String(restaurantCat.id) : (restaurantCat ? String(restaurantCat.id) : (fetchedCats[0] ? String(fetchedCats[0].id) : ''))
      if (defaultCatId) {
        setForm(p => ({
          ...p,
          catId: p.catId || defaultCatId,
          productType: (isRestaurant || restaurantCat) ? 'Grocery & Gourmet Food / Restaurant Items' : p.productType,
          conditionType: (isRestaurant || restaurantCat) ? 'Prepared Fresh' : p.conditionType,
        }))
      }
    }).catch(e => console.error('Categories fetch error:', e))
  }, [userData?.uid, isRestaurant])

  // Resolve the current selected category and check if it is Restaurant
  const selectedCategory = categories.find(c => String(c.id) === String(form.catId))
  const isRestaurantCategory = selectedCategory
    ? ((selectedCategory.name || '').toLowerCase().includes('restaurant') ||
       (selectedCategory.code || '').toLowerCase().includes('restaurant') ||
       selectedCategory.vertical === 'FOOD')
    : isRestaurant

  // Filter Product Categories strictly by the selected Main Category (Root)
  const availableProductCategories = productCategories.filter(pc => {
    if (!form.catId) return true
    return String(pc.categoryId) === String(form.catId)
  })

  // Filter Subcategories strictly by the selected Product Category
  const filteredSubs = (() => {
    if (form.productCategoryId) {
      const matched = subcategories.filter(s => String(s.productCategoryId) === String(form.productCategoryId))
      if (matched.length > 0) return matched
    }
    if (form.catId) {
      return subcategories.filter(s => String(s.catId) === String(form.catId))
    }
    return []
  })()

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  const handleMainCategoryChange = (e) => {
    const selectedCatId = e.target.value
    const selCat = categories.find(c => String(c.id) === String(selectedCatId))
    const isFoodCat = selCat
      ? ((selCat.name || '').toLowerCase().includes('restaurant') ||
         (selCat.code || '').toLowerCase().includes('restaurant') ||
         selCat.vertical === 'FOOD')
      : false

    setForm(p => ({
      ...p,
      catId: selectedCatId,
      productCategoryId: '',
      subCatId: '',
      productType: isFoodCat ? 'Grocery & Gourmet Food / Restaurant Items' : 'Physical Retail Product',
      menuSectionName: isFoodCat ? (p.menuSectionName || 'Chef Signature Entrees') : '',
      conditionType: isFoodCat ? 'Prepared Fresh' : 'New',
      taxCode: isFoodCat ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD',
      unitCountType: isFoodCat ? 'serving' : 'item',
    }))
    if (errors.catId) setErrors(p => ({ ...p, catId: '' }))
  }

  const handleCategoryChange = (e) => {
    const selectedPCId = e.target.value
    setForm(p => ({
      ...p,
      productCategoryId: selectedPCId,
      subCatId: '',
    }))
    if (errors.productCategoryId) {
      setErrors(p => ({ ...p, productCategoryId: '' }))
    }
  }

  const generateAutoSku = () => {
    const prefix = form.name ? form.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase() : (isRestaurant ? 'FOOD' : 'PROD')
    const random = Math.floor(1000 + Math.random() * 9000)
    const newSku = `QD-${prefix}-${random}`
    setField('sku', newSku)
    if (!form.barcode) setField('barcode', newSku)
    toast.success(`Generated SKU: ${newSku}`)
  }

  const loadSampleData = (sampleType) => {
    const samples = getSampleUnifiedProducts()
    const target = sampleType === 'burger' ? samples[0] : samples[1]
    if (!target) return

    setForm({
      sku: target.item_sku,
      name: target.product_name,
      brandName: target.brand_name,
      manufacturer: target.manufacturer,
      barcode: target.product_id,
      productIdType: target.product_id_type || 'UPC',
      productType: target.product_type,
      menuSectionName: target.menu_section_name || 'Chef Specials',
      catId: String(activeCategoryId),
      productCategoryId: availableProductCategories[0]?.productCategoryId ? String(availableProductCategories[0].productCategoryId) : '',
      subCatId: subcategories[0]?.subCatId ? String(subcategories[0].subCatId) : '',

      price: target.price.toString(),
      cost: (target.price * 0.7).toFixed(0),
      discount: '10',
      currency: target.currency,
      stock: target.quantity.toString(),
      status: true,
      conditionType: target.condition_type,
      fulfillmentChannel: target.fulfillment_channel,
      salePrice: target.sale_price ? target.sale_price.toString() : '',
      saleStartDate: target.sale_from_date || '',
      saleEndDate: target.sale_end_date || '',
      maxOrderQuantity: target.max_order_quantity ? target.max_order_quantity.toString() : '10',
      taxCode: target.tax_code,

      bulletPoint1: target.bullet_point1,
      bulletPoint2: target.bullet_point2,
      bulletPoint3: target.bullet_point3,
      bulletPoint4: target.bullet_point4,
      bulletPoint5: target.bullet_point5,
      description: target.product_description,
      genericKeywords: target.generic_keywords,
      targetAudience: target.target_audience,

      ingredients: target.ingredients,
      allergenInformation: target.allergen_information,
      dietType: target.diet_type,
      isExpirationDatedProduct: target.is_expiration_dated_product,
      unitCount: target.unit_count.toString(),
      unitCountType: target.unit_count_type,
      hazmatType: target.hazmat_type,
      isHalal: target.diet_type?.includes('Halal'),
      isVeg: target.diet_type?.includes('Vegetarian'),
      prepTime: '25',
      calories: '550',
      servings: '1-2 Persons',
      spiceLevel: 'Medium',

      parentChild: target.parent_child,
      parentSku: target.parent_sku,
      variationTheme: target.variation_theme,
      modifierGroupName: target.modifier_group_name,
      minSelections: target.min_selections.toString(),
      maxSelections: target.max_selections.toString(),
      addons: [
        { name: 'Extra Cheddar Cheese Melt', price: '150' },
        { name: 'Double Patty Upgrade', price: '450' },
        { name: 'Special Garlic Truffle Sauce', price: '90' },
      ],
      size: '',
      color: '',

      images: [target.main_image_url, target.other_image_url1, target.other_image_url2].filter(Boolean),

      itemWeight: target.item_weight.toString(),
      itemWeightUnit: target.item_weight_unit,
      shippingWeight: target.shipping_weight.toString(),
      shippingWeightUnit: target.shipping_weight_unit,
      itemLength: target.item_length.toString(),
      itemWidth: target.item_width.toString(),
      itemHeight: target.item_height.toString(),
      dimensionalUnit: target.dimensional_unit,
      warrantyType: sampleType === 'burger' ? 'Freshness & Hygiene Guarantee' : '1 Year Official Brand Warranty',
      returnPolicy: sampleType === 'burger' ? 'Immediate Replacement on Delivery' : '7 Days Free Return / Refund',
      isAuthenticGuaranteed: true,
    })

    setSampleMenuAnchor(null)
    toast.success(`Loaded 7-Phase ${sampleType === 'burger' ? 'Gourmet Burger' : 'Sony Headphones'} sample data`)
  }

  // ── Image Upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (files) => {
    if (!files?.length) return
    setUploadingImages(true)
    try {
      const result = await uploadMultipleImages(files, 'product_images')
      if (result.success) {
        setField('images', [...form.images, ...result.urls])
        toast.success(`Uploaded ${result.urls.length} image(s)`)
      } else {
        toast.error(result.error || 'Upload failed')
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (idx) => setField('images', form.images.filter((_, i) => i !== idx))

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Item name is required'
    if (!form.sku.trim()) e.sku = 'SKU is required'
    if (!form.catId) e.catId = 'Main Category is required'
    if (!form.productCategoryId) e.productCategoryId = 'Product category is required'
    if (!form.subCatId) e.subCatId = 'Sub-category is required'
    if (!form.price || parseFloat(form.price) <= 0) e.price = 'Valid price is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please resolve missing required fields before saving')
      return
    }
    setIsSubmitting(true)
    try {
      const bulletPointsList = [
        form.bulletPoint1,
        form.bulletPoint2,
        form.bulletPoint3,
        form.bulletPoint4,
        form.bulletPoint5,
      ].filter(Boolean)

      const formattedDimensions = `${form.itemLength || 15}x${form.itemWidth || 15}x${form.itemHeight || 12} ${form.dimensionalUnit || 'cm'}`
      const formattedWeight = `${form.itemWeight || 450} ${form.itemWeightUnit || 'grams'}`

      const validAddons = Array.isArray(form.addons)
        ? form.addons.filter(a => a && a.name && a.name.trim() && a.price !== '')
        : []

      const res = await authFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          proName: form.name,
          description: form.description,
          catId: parseInt(form.catId) || 2,
          subCatId: parseInt(form.subCatId),
          productCategoryId: form.productCategoryId ? parseInt(form.productCategoryId) : null,
          price: parseFloat(form.price),
          cost: parseFloat(form.cost || form.price),
          discount: parseFloat(form.discount || 0),
          sku: form.sku,
          barcode: form.barcode || form.sku,
          stock: parseInt(form.stock) || 50,
          qnty: parseInt(form.stock) || 50,
          proImages: form.images,
          vendorId: userData.uid,
          createdById: userData.uid,
          status: Boolean(form.status),
          brandName: form.brandName || null,
          manufacturer: form.manufacturer || null,
          productType: form.productType || null,
          modelNumber: form.parentSku || null,
          sizeName: form.sizeName || null,
          size: form.size || null,
          color: form.color || null,
          conditionType: form.conditionType || (isRestaurant ? 'Prepared Fresh' : 'New'),
          productDimensions: formattedDimensions,
          packageWeight: formattedWeight,
          warranty: form.warrantyType || null,
          ingredients: form.ingredients || null,
          keyFeatures: bulletPointsList,
          variations: validAddons.length > 0 ? validAddons : null,
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          saleStartDate: form.saleStartDate || null,
          saleEndDate: form.saleEndDate || null,
          currency: form.currency || 'PKR',
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(isRestaurant ? 'Food item created with 7-phase schema!' : 'Product created with 7-phase schema!')
        router.push(userData?.role === 'VENDOR' ? '/vendor/dashboard/products' : '/admin/dashboard/products')
      } else {
        toast.error(data.error || 'Failed to create item')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading catalog schema engine…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          px: { xs: 2, md: 4 },
          py: 3,
          bgcolor: '#f8fafc',
          '&, & *': {
            borderRadius: '0px !important',
          },
          '& .MuiOutlinedInput-root': { borderRadius: '0px !important' },
          '& .MuiOutlinedInput-notchedOutline': { borderRadius: '0px !important' },
          '& fieldset': { borderRadius: '0px !important' },
          '& .MuiInputBase-root': { borderRadius: '0px !important' },
          '& .MuiButton-root': { borderRadius: '0px !important' },
          '& .MuiIconButton-root': { borderRadius: '0px !important' },
          '& .MuiCard-root': { borderRadius: '0px !important' },
          '& .MuiPaper-root': { borderRadius: '0px !important' },
          '& .MuiChip-root': { borderRadius: '0px !important' },
          '& .MuiSelect-select': { borderRadius: '0px !important' },
          '& .MuiMenu-paper': { borderRadius: '0px !important' },
          '& .MuiDialog-paper': { borderRadius: '0px !important' },
        }}
      >

        {/* ── Top Bar Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => router.back()} sx={{ border: '1px solid', borderColor: '#cbd5e1', borderRadius: 0, bgcolor: '#ffffff' }}>
              <ArrowBackOutlinedIcon fontSize="small" />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight={800} color="#0f172a">
                  {isRestaurant ? 'Add Restaurant Menu Item' : 'Add Catalog Product'}
                </Typography>
                <Chip label="7-PHASE UNIFIED SCHEMA" size="small" sx={{ bgcolor: `${BRAND}15`, color: BRAND, fontWeight: 900, borderRadius: 0 }} />
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Consolidated data definition combining vital info, pricing, discoverability, food compliance, modifiers, media, and dimensions (Amazon & Daraz compatible)
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button
              variant="outlined"
              size="small"
              startIcon={<AutoFixHighOutlinedIcon />}
              onClick={e => setSampleMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', bgcolor: '#ffffff' }}
            >
              Load Sample 7-Phase Data
            </Button>
            <Menu anchorEl={sampleMenuAnchor} open={Boolean(sampleMenuAnchor)} onClose={() => setSampleMenuAnchor(null)}>
              <MenuItem onClick={() => loadSampleData('burger')}>🍔 Load Gourmet Burger Sample (Food/Restaurant)</MenuItem>
              <MenuItem onClick={() => loadSampleData('headphones')}>🎧 Load Sony WH-1000XM5 Sample (Retail Goods)</MenuItem>
            </Menu>

            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadOutlinedIcon />}
              component="a"
              href="/api/products/feed?type=template&format=csv"
              download="unified_product_template.csv"
              sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 700, borderColor: '#cbd5e1', bgcolor: '#ffffff' }}
            >
              Feed Template (CSV)
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 800, px: 3, py: 1 }}
            >
              {isSubmitting ? 'Publishing…' : 'Publish Listing'}
            </Button>
          </Stack>
        </Box>

        {/* ── Phase Filter Navigation Pills ── */}
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, mb: 3, borderBottom: '1px solid', borderColor: '#e2e8f0' }}>
          {[
            { id: 'all', label: 'All Phases' },
            { id: 'phase_1', label: 'Phase 1: Vital Info' },
            { id: 'phase_2', label: 'Phase 2: Pricing & Offer' },
            { id: 'phase_3', label: 'Phase 3: Discoverability' },
            ...(isRestaurantCategory ? [{ id: 'phase_4', label: 'Phase 4: Food & Kitchen' }] : []),
            { id: 'phase_5', label: isRestaurantCategory ? 'Phase 5: Food Modifiers' : 'Phase 5: Options & Variations' },
            { id: 'phase_6', label: 'Phase 6: Image Assets' },
            { id: 'phase_7', label: isRestaurantCategory ? 'Phase 7: Packaging & Delivery' : 'Phase 7: Dimensions & Shipping' },
          ].map(tab => (
            <Button
              key={tab.id}
              size="small"
              variant={activePhase === tab.id ? 'contained' : 'outlined'}
              onClick={() => setActivePhase(tab.id)}
              sx={{
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: activePhase === tab.id ? 800 : 600,
                fontSize: 12,
                whiteSpace: 'nowrap',
                bgcolor: activePhase === tab.id ? BRAND : '#ffffff',
                borderColor: activePhase === tab.id ? BRAND : '#cbd5e1',
                color: activePhase === tab.id ? '#ffffff' : '#334155',
                boxShadow: 'none',
                '&:hover': {
                  bgcolor: activePhase === tab.id ? BRAND_DARK : '#f1f5f9',
                  borderColor: activePhase === tab.id ? BRAND_DARK : '#94a3b8',
                }
              }}
            >
              {tab.label}
            </Button>
          ))}
        </Box>

        <Stack spacing={3}>

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 1: Core Identifiers & Taxonomy (Vital Info)
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_1') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 1" size="small" sx={{ bgcolor: `${BRAND}15`, color: BRAND, fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Core Identifiers & Taxonomy (Vital Info)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Unique stock-keeping unit (SKU), barcode identification, brand ownership, and category hierarchy.
                  </Typography>
                </Box>
                <Button size="small" variant="outlined" onClick={generateAutoSku} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>
                  Auto-Generate SKU
                </Button>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                <TextField
                  {...tfStyle} size="small" fullWidth required label="Item SKU *"
                  value={form.sku} onChange={e => setField('sku', e.target.value)}
                  error={!!errors.sku} helperText={errors.sku}
                  placeholder="e.g. QD-ANGUS-001"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth required label={isRestaurant ? "Product Name / Dish Title *" : "Product Name *"}
                  value={form.name} onChange={e => setField('name', e.target.value)}
                  error={!!errors.name} helperText={errors.name}
                  placeholder="e.g. Truffle Angus Gourmet Burger"
                  sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Brand Name"
                  value={form.brandName} onChange={e => setField('brandName', e.target.value)}
                  placeholder="Registered brand or restaurant kitchen"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Manufacturer / Producer"
                  value={form.manufacturer} onChange={e => setField('manufacturer', e.target.value)}
                  placeholder="Maker or culinary producer"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Product ID (Barcode)"
                  value={form.barcode} onChange={e => setField('barcode', e.target.value)}
                  placeholder="UPC, EAN, ISBN or blank for menu"
                />

                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>Product ID Type</InputLabel>
                  <Select
                    value={form.productIdType || 'NONE'}
                    label="Product ID Type"
                    onChange={e => setField('productIdType', e.target.value)}
                  >
                    {['UPC', 'EAN', 'GTIN', 'ASIN', 'ISBN', 'JAN', 'NONE'].map(t => (
                      <MenuItem key={t} value={t}>{t}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Root-Level Main Category */}
                <FormControl size="small" fullWidth required error={!!errors.catId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                  <InputLabel id="main-category-label">Main Category (Root) *</InputLabel>
                  <Select
                    labelId="main-category-label"
                    value={form.catId || ''}
                    label="Main Category (Root) *"
                    onChange={handleMainCategoryChange}
                  >
                    <MenuItem value=""><em>Select Main Category…</em></MenuItem>
                    {categories.map(c => (
                      <MenuItem key={c.id} value={String(c.id)}>
                        {c.name.toLowerCase() === 'restaurant' ? '🍽️ Restaurant' : c.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.catId && <Typography variant="caption" color="error">{errors.catId}</Typography>}
                </FormControl>

                {/* Scoped Product Category */}
                <FormControl size="small" fullWidth required disabled={!form.catId} error={!!errors.productCategoryId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                  <InputLabel id="product-category-label">Product Category *</InputLabel>
                  <Select
                    labelId="product-category-label"
                    value={form.productCategoryId || ''}
                    label="Product Category *"
                    onChange={handleCategoryChange}
                  >
                    <MenuItem value=""><em>{form.catId ? 'Select category…' : 'Select Main Category first'}</em></MenuItem>
                    {availableProductCategories.map(c => (
                      <MenuItem key={c.productCategoryId} value={String(c.productCategoryId)}>
                        {c.productCategoryName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.productCategoryId && <Typography variant="caption" color="error">{errors.productCategoryId}</Typography>}
                </FormControl>

                {/* Scoped Sub-category */}
                <FormControl size="small" fullWidth required disabled={!form.productCategoryId} error={!!errors.subCatId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                  <InputLabel id="subcategory-label">Sub-category *</InputLabel>
                  <Select
                    labelId="subcategory-label"
                    value={form.subCatId || ''}
                    label="Sub-category *"
                    onChange={e => setField('subCatId', e.target.value)}
                  >
                    <MenuItem value=""><em>{form.productCategoryId ? 'Select sub-category…' : 'Select Product Category first'}</em></MenuItem>
                    {filteredSubs.map(s => (
                      <MenuItem key={s.subCatId} value={String(s.subCatId)}>
                        {s.subCatName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subCatId && <Typography variant="caption" color="error">{errors.subCatId}</Typography>}
                </FormControl>

                {/* Restaurant-specific Menu Section */}
                {isRestaurantCategory ? (
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Menu Section Name (Food)"
                    value={form.menuSectionName} onChange={e => setField('menuSectionName', e.target.value)}
                    placeholder="e.g. Appetizers, Chef Specials, Main Course, Desserts"
                    sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}
                  />
                ) : (
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Product Type / Subtype"
                    value={form.productType} onChange={e => setField('productType', e.target.value)}
                    placeholder="e.g. Consumer Electronics, Retail Pack"
                    sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}
                  />
                )}

                {/* Restaurant Mode Status Banner */}
                {isRestaurantCategory && (
                  <Box sx={{ gridColumn: '1 / -1', p: 1.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Chip label="RESTAURANT ACTIVE" size="small" sx={{ bgcolor: '#166534', color: '#ffffff', fontWeight: 900, borderRadius: 0 }} />
                    <Typography variant="caption" fontWeight={700} color="#166534">
                      Restaurant root category active — Showing only restaurant categories, dishes, kitchen attributes &amp; modifiers.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 2: Pricing, Availability & Offer Data
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_2') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 2" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Pricing, Availability & Offer Data
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Baseline selling price, currency, active stock levels, promotional schedules, order constraints, and tax classifications.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                <TextField
                  {...tfStyle} size="small" fullWidth required label="Standard Price *" type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={form.price} onChange={e => setField('price', e.target.value)}
                  error={!!errors.price} helperText={errors.price}
                  InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                />

                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>Currency</InputLabel>
                  <Select
                    value={form.currency || 'PKR'}
                    label="Currency"
                    onChange={e => setField('currency', e.target.value)}
                  >
                    {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>

                <TextField
                  {...tfStyle} size="small" fullWidth label="Stock Quantity / Inventory *" type="number" inputProps={{ min: 0 }}
                  value={form.stock} onChange={e => setField('stock', e.target.value)}
                />

                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>Condition Type</InputLabel>
                  <Select
                    value={form.conditionType || (isRestaurant ? 'Prepared Fresh' : 'New')}
                    label="Condition Type"
                    onChange={e => setField('conditionType', e.target.value)}
                  >
                    {['New', 'Prepared Fresh', 'Refurbished', 'Used'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>

                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>Fulfillment Channel</InputLabel>
                  <Select
                    value={form.fulfillmentChannel || 'DEFAULT'}
                    label="Fulfillment Channel"
                    onChange={e => setField('fulfillmentChannel', e.target.value)}
                  >
                    <MenuItem value="DEFAULT">DEFAULT (Merchant / Restaurant Delivery)</MenuItem>
                    <MenuItem value="MERCHANT_DELIVERY">MERCHANT_DELIVERY (Direct Fleet)</MenuItem>
                    <MenuItem value="EXPRESS_COURIER">EXPRESS_COURIER (QuickDelivery On-Demand)</MenuItem>
                    <MenuItem value="AMAZON_NA">AMAZON_NA (FBA / Platform Fulfillment)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  {...tfStyle} size="small" fullWidth label="Special Sale Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                  value={form.salePrice} onChange={e => setField('salePrice', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Sale From Date" type="date"
                  value={form.saleStartDate ? form.saleStartDate.slice(0, 10) : ''}
                  onChange={e => setField('saleStartDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Sale End Date" type="date"
                  value={form.saleEndDate ? form.saleEndDate.slice(0, 10) : ''}
                  onChange={e => setField('saleEndDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Max Order Quantity" type="number" inputProps={{ min: 1 }}
                  value={form.maxOrderQuantity || '10'} onChange={e => setField('maxOrderQuantity', e.target.value)}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Tax Code"
                  value={form.taxCode || (isRestaurant ? 'FOOD_PREP_STD' : 'RETAIL_GOODS_STD')}
                  onChange={e => setField('taxCode', e.target.value)}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                  value={form.cost} onChange={e => setField('cost', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Discount %" type="number" inputProps={{ min: 0, max: 100 }}
                  value={form.discount} onChange={e => setField('discount', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Box>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 3: Discoverability, Content & Descriptions
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_3') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 3" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Discoverability, Content & Descriptions
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Five scannable bullet points, comprehensive narrative copy, search metadata keywords, and demographic targets.
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
                    <TextField {...tfStyle} size="small" fullWidth label="Bullet Point 1 *"
                      value={form.bulletPoint1} onChange={e => setField('bulletPoint1', e.target.value)}
                      placeholder="Feature highlight 1 or primary culinary ingredient..." />
                    <TextField {...tfStyle} size="small" fullWidth label="Bullet Point 2"
                      value={form.bulletPoint2} onChange={e => setField('bulletPoint2', e.target.value)}
                      placeholder="Feature highlight 2..." />
                    <TextField {...tfStyle} size="small" fullWidth label="Bullet Point 3"
                      value={form.bulletPoint3} onChange={e => setField('bulletPoint3', e.target.value)}
                      placeholder="Feature highlight 3..." />
                    <TextField {...tfStyle} size="small" fullWidth label="Bullet Point 4"
                      value={form.bulletPoint4} onChange={e => setField('bulletPoint4', e.target.value)}
                      placeholder="Feature highlight 4..." />
                    <TextField {...tfStyle} size="small" fullWidth label="Bullet Point 5"
                      value={form.bulletPoint5} onChange={e => setField('bulletPoint5', e.target.value)}
                      placeholder="Feature highlight 5..." />
                  </Stack>
                </Box>

                <TextField
                  {...tfStyle} size="small" fullWidth multiline rows={4} label="Product Description (Narrative Story) *"
                  value={form.description} onChange={e => setField('description', e.target.value)}
                  placeholder="Narrative detailing product features, use cases, or preparation style..."
                  sx={{ gridColumn: '1 / -1' }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Generic Keywords (Search Terms)"
                  value={form.genericKeywords} onChange={e => setField('genericKeywords', e.target.value)}
                  placeholder="Backend metadata search tokens (up to 200 bytes, comma-separated)"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Target Audience"
                  value={form.targetAudience} onChange={e => setField('targetAudience', e.target.value)}
                  placeholder="e.g. Unisex-Adult, Gourmet Diners, Kids"
                />
              </Box>
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 4: Food, Dietary & Safety Compliance
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_4') && isRestaurantCategory && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 4" size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Food, Dietary & Safety Compliance
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Component listing ordered by weight, major allergen warnings, diet types, and shelf life expiration.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                <TextField
                  {...tfStyle} size="small" fullWidth multiline rows={3} label="Ingredients (Ordered by weight)"
                  value={form.ingredients} onChange={e => setField('ingredients', e.target.value)}
                  placeholder="e.g. Angus Beef (65%), Brioche Flour (Wheat, Butter, Eggs), Cheddar Cheese (Milk, Salt), Black Truffle Oil..."
                  sx={{ gridColumn: '1 / -1' }}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Allergen Information"
                  value={form.allergenInformation} onChange={e => setField('allergenInformation', e.target.value)}
                  placeholder="e.g. Contains: Milk, Wheat, Soy, Eggs. May contain traces of Sesame."
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Diet Type"
                  value={form.dietType} onChange={e => setField('dietType', e.target.value)}
                  placeholder="e.g. Halal Certified, Gluten-Free, Vegan, High Protein"
                />

                <Box sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" fontWeight={700}>Expiration Dated Product</Typography>
                    <Typography variant="caption" color="text.secondary">Indicates items with short shelf life or fresh consumption window</Typography>
                  </Box>
                  <Switch
                    checked={Boolean(form.isExpirationDatedProduct)}
                    onChange={e => setField('isExpirationDatedProduct', e.target.checked)}
                    color="success"
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 1.5 }}>
                  <TextField
                    {...tfStyle} size="small" label="Unit Count" type="number" inputProps={{ min: 1 }}
                    value={form.unitCount || '1'} onChange={e => setField('unitCount', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                  <FormControl size="small" sx={{ ...tfStyle, flex: 1.5 }}>
                    <InputLabel>Unit Count Type</InputLabel>
                    <Select
                      value={form.unitCountType || 'serving'}
                      label="Unit Count Type"
                      onChange={e => setField('unitCountType', e.target.value)}
                    >
                      {['serving', 'gram', 'kg', 'oz', 'ml', 'piece', 'item', 'pack'].map(u => (
                        <MenuItem key={u} value={u}>{u}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

                <TextField
                  {...tfStyle} size="small" fullWidth label="Hazmat Type / Safety Info"
                  value={form.hazmatType || 'Not Applicable - Perishable Food'}
                  onChange={e => setField('hazmatType', e.target.value)}
                  placeholder="e.g. Not Applicable, Lithium Battery, Cold Storage Required"
                  sx={{ gridColumn: '1 / -1' }}
                />

                {/* Food Vendor Quick Badges */}
                <Box sx={{ gridColumn: '1 / -1', p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography variant="subtitle2" fontWeight={800} color="#166534" mb={1.5}>
                    Food Kitchen Badges & Preparation Attributes
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                    <FormControlLabel
                      control={<Switch checked={Boolean(form.isHalal)} onChange={e => setField('isHalal', e.target.checked)} color="success" />}
                      label={<Typography variant="body2" fontWeight={700} color="#166534">🥩 100% Halal Certified</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch checked={Boolean(form.isVeg)} onChange={e => setField('isVeg', e.target.checked)} color="success" />}
                      label={<Typography variant="body2" fontWeight={700} color="#166534">🌱 Pure Vegetarian</Typography>}
                    />
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
                    <TextField {...tfStyle} size="small" label="Prep Time (mins)" value={form.prepTime || '20'}
                      onChange={e => setField('prepTime', e.target.value)} sx={{ bgcolor: '#ffffff' }} />
                    <TextField {...tfStyle} size="small" label="Calories (kcal)" value={form.calories || ''}
                      onChange={e => setField('calories', e.target.value)} sx={{ bgcolor: '#ffffff' }} />
                    <TextField {...tfStyle} size="small" label="Portion / Servings" value={form.servings || '1-2 Persons'}
                      onChange={e => setField('servings', e.target.value)} sx={{ bgcolor: '#ffffff' }} />
                    <FormControl size="small" sx={{ ...tfStyle, bgcolor: '#ffffff' }}>
                      <InputLabel>Spice Level</InputLabel>
                      <Select value={form.spiceLevel || 'Medium'} label="Spice Level"
                        onChange={e => setField('spiceLevel', e.target.value)}>
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

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 5: Modifiers, Options & Variations (Customizations)
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_5') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 5" size="small" sx={{ bgcolor: '#f3e8ff', color: '#7e22ce', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Modifiers, Options & Variations (Customizations)
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Variant split hierarchy (Parent/Child), variation themes, and customizable restaurant add-on groups.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>Parent / Child</InputLabel>
                  <Select
                    value={form.parentChild || 'Standalone'}
                    label="Parent / Child"
                    onChange={e => setField('parentChild', e.target.value)}
                  >
                    <MenuItem value="Standalone">Standalone</MenuItem>
                    <MenuItem value="Parent">Parent (Display Master)</MenuItem>
                    <MenuItem value="Child">Child (Variant SKU)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  {...tfStyle} size="small" fullWidth label="Parent SKU"
                  value={form.parentSku} onChange={e => setField('parentSku', e.target.value)}
                  placeholder="Link to Parent SKU"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Variation Theme"
                  value={form.variationTheme} onChange={e => setField('variationTheme', e.target.value)}
                  placeholder="e.g. Size, Color, Flavor, Portion"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Modifier Group Name"
                  value={form.modifierGroupName || 'Add-ons & Options'}
                  onChange={e => setField('modifierGroupName', e.target.value)}
                  placeholder="e.g. Choose Protein, Add-ons"
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Min Selections" type="number" inputProps={{ min: 0 }}
                  value={form.minSelections || '0'} onChange={e => setField('minSelections', e.target.value)}
                />

                <TextField
                  {...tfStyle} size="small" fullWidth label="Max Selections" type="number" inputProps={{ min: 1 }}
                  value={form.maxSelections || '4'} onChange={e => setField('maxSelections', e.target.value)}
                />
              </Box>

              {/* Interactive Modifiers / Add-ons List */}
              <Box sx={{ p: 2.5, bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0', mb: 3 }}>
                <Typography variant="subtitle2" fontWeight={800} color="#0f172a" mb={1.5}>
                  Active Modifiers & Add-on Items ({form.addons?.length || 0})
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {(form.addons || []).map((addon, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: '#ffffff', border: '1px solid', borderColor: '#e2e8f0' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight={700} color="#111827">{addon.name}</Typography>
                        <Chip label={`+ Rs. ${parseFloat(addon.price || 0).toLocaleString()}`} size="small"
                          sx={{ height: 22, fontWeight: 700, bgcolor: '#dbeafe', color: '#1e40af', borderRadius: 0 }} />
                      </Box>
                      <IconButton size="small" color="error" onClick={() => setField('addons', form.addons.filter((_, i) => i !== index))}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {(!form.addons || form.addons.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No modifiers configured yet. Add options like Extra Cheese, Dips, or Drinks below.</Typography>
                  )}
                </Stack>

                {/* Add New Modifier Input Row */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'center' }}>
                  <TextField {...tfStyle} size="small" label="Modifier Item Name" placeholder="e.g. Extra Cheddar Cheese, Grilled Chicken"
                    value={newAddon.name} onChange={e => setNewAddon({ ...newAddon, name: e.target.value })}
                    sx={{ flex: 2, minWidth: 200, bgcolor: '#ffffff' }} />
                  <TextField {...tfStyle} size="small" label="Price Delta (Rs.)" type="number" placeholder="e.g. 150"
                    value={newAddon.price} onChange={e => setNewAddon({ ...newAddon, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }}
                    sx={{ flex: 1, minWidth: 120, bgcolor: '#ffffff' }} />
                  <Button variant="contained" startIcon={<AddIcon />}
                    onClick={() => {
                      if (!newAddon.name.trim() || !newAddon.price) { toast.error('Please enter modifier name and price'); return }
                      setField('addons', [...(form.addons || []), { name: newAddon.name.trim(), price: newAddon.price }])
                      setNewAddon({ name: '', price: '' })
                      toast.success('Modifier added')
                    }}
                    sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Add Modifier
                  </Button>
                </Box>
              </Box>

              {/* Retail Size & Color Variant Pickers - Only for retail items */}
              {!isRestaurantCategory && (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5 }}>
                  <Box sx={{ p: 2, border: '1px solid', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>Standard Size Attribute</Typography>
                      <Button size="small" variant="outlined" onClick={() => setShowSizePopup(true)} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>+ Custom Size</Button>
                    </Box>
                    <FormControl fullWidth size="small" sx={tfStyle}>
                      <InputLabel>Select Size</InputLabel>
                      <Select value={form.size || ''} label="Select Size" onChange={e => setField('size', e.target.value)} sx={{ bgcolor: '#ffffff' }}>
                        <MenuItem value=""><em>None / Standard</em></MenuItem>
                        {['Small', 'Medium', 'Large', 'XL', 'XXL'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>

                  <Box sx={{ p: 2, border: '1px solid', borderColor: '#e2e8f0', bgcolor: '#f8fafc' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700}>Color Attribute</Typography>
                      <Button size="small" variant="outlined" onClick={() => setShowColorPopup(true)} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>+ Custom Color</Button>
                    </Box>
                    <FormControl fullWidth size="small" sx={tfStyle}>
                      <InputLabel>Select Color</InputLabel>
                      <Select value={form.color || ''} label="Select Color" onChange={e => setField('color', e.target.value)} sx={{ bgcolor: '#ffffff' }}>
                        <MenuItem value=""><em>None / Default</em></MenuItem>
                        {predefinedColors.map(c => <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
              )}
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 6: Image Media Assets
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_6') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 6" size="small" sx={{ bgcolor: '#ffe4e6', color: '#be123c', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Image Media Assets
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Slot 1 is the primary showcase image (pure white background for retail, styled culinary for food). Slots 2–9 for secondary angles.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setDragOver(false)
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
                  if (files.length) handleImageUpload(files)
                }}
                sx={{
                  border: '2px dashed', borderColor: dragOver ? BRAND : '#cbd5e1',
                  borderRadius: 0, p: 4, textAlign: 'center', bgcolor: dragOver ? `${BRAND}08` : '#f8fafc',
                  cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': { borderColor: BRAND, bgcolor: `${BRAND}08` }
                }}
              >
                {uploadingImages ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={32} sx={{ color: BRAND }} />
                    <Typography variant="body2" color="text.secondary">Uploading high-resolution images...</Typography>
                  </Box>
                ) : (
                  <>
                    <UploadOutlinedIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="body1" fontWeight={700} color="#0f172a" mb={0.5}>
                      Drag and drop images here, or browse files
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      PNG, JPG, WebP up to 10MB each. Up to 9 images supported.
                    </Typography>
                    <Button variant="contained" size="small" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}>
                      Choose Files
                    </Button>
                  </>
                )}
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleImageUpload(Array.from(e.target.files)) }} />
              </Box>

              {form.images.length > 0 && (
                <Box mt={3}>
                  <Typography variant="body2" fontWeight={800} color="text.secondary" mb={1.5}>
                    Active Gallery Showcase ({form.images.length}/9 Assets):
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
                    {form.images.map((img, i) => (
                      <Box key={i} sx={{ position: 'relative', border: '1px solid', borderColor: i === 0 ? BRAND : '#cbd5e1', height: 110, bgcolor: '#ffffff', overflow: 'hidden' }}>
                        <NextImage src={img} alt={`Asset ${i + 1}`} width={110} height={110} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: i === 0 ? BRAND : 'rgba(0,0,0,0.65)', color: '#ffffff', fontSize: 10, py: 0.25, textAlign: 'center', fontWeight: 800 }}>
                          {i === 0 ? 'MAIN IMAGE' : `OTHER #${i}`}
                        </Box>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                          sx={{ position: 'absolute', top: 3, right: 3, bgcolor: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', width: 22, height: 22, p: 0, '&:hover': { bgcolor: 'error.dark' } }}>
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Card>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              PHASE 7: Dimensions, Weight & Shipping
          ══════════════════════════════════════════════════════════════════════ */}
          {(activePhase === 'all' || activePhase === 'phase_7') && (
            <Card elevation={0} sx={{ border: '1px solid', borderColor: '#e2e8f0', borderRadius: 0, p: 3, bgcolor: '#ffffff' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PHASE 7" size="small" sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="#111827">
                    Dimensions, Weight & Shipping
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Net item physical metrics, packed tare shipping weight, dimensional volume, and buyer resolution policies.
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              {isRestaurantCategory ? (
                <Box sx={{ mb: 2.5 }}>
                  <Box sx={{ p: 2.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', mb: 2.5 }}>
                    <Typography variant="subtitle2" fontWeight={800} color="#166534" mb={1}>
                      🍽️ Takeaway &amp; Delivery Food Packaging Standards
                    </Typography>
                    <Typography variant="body2" color="#166534" mb={2}>
                      Prepared fresh to order and dispatched in thermal food packaging. Freight physical dimensions (L × W × H) are waived for restaurant items.
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <TextField
                        {...tfStyle} size="small" fullWidth label="Approx. Food Portion Weight"
                        value={form.itemWeight || '450'} onChange={e => setField('itemWeight', e.target.value)}
                        InputProps={{ endAdornment: <InputAdornment position="end">grams</InputAdornment> }}
                      />
                      <TextField
                        {...tfStyle} size="small" fullWidth label="Kitchen Quality Assurance"
                        value={form.warrantyType || 'Freshness & Hygiene Guarantee Upon Handover'}
                        onChange={e => setField('warrantyType', e.target.value)}
                      />
                    </Box>
                  </Box>
                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Return &amp; Resolution Policy</InputLabel>
                    <Select
                      value={form.returnPolicy || 'Immediate Replacement on Delivery'}
                      label="Return &amp; Resolution Policy"
                      onChange={e => setField('returnPolicy', e.target.value)}
                    >
                      {[
                        'Immediate Replacement on Delivery',
                        'Quality Assurance Guarantee — Instant Redelivery',
                        'Refund on Damaged Packaging',
                      ].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Net Item Weight" type="number" inputProps={{ min: 0 }}
                    value={form.itemWeight} onChange={e => setField('itemWeight', e.target.value)}
                  />

                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Item Weight Unit</InputLabel>
                    <Select
                      value={form.itemWeightUnit || 'grams'}
                      label="Item Weight Unit"
                      onChange={e => setField('itemWeightUnit', e.target.value)}
                    >
                      {['grams', 'kg', 'oz', 'lbs'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField
                    {...tfStyle} size="small" fullWidth label="Shipping Weight" type="number" inputProps={{ min: 0 }}
                    value={form.shippingWeight} onChange={e => setField('shippingWeight', e.target.value)}
                  />

                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Shipping Weight Unit</InputLabel>
                    <Select
                      value={form.shippingWeightUnit || 'grams'}
                      label="Shipping Weight Unit"
                      onChange={e => setField('shippingWeightUnit', e.target.value)}
                    >
                      {['grams', 'kg', 'oz', 'lbs'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <TextField
                    {...tfStyle} size="small" fullWidth label="Item Length" type="number" inputProps={{ min: 0 }}
                    value={form.itemLength} onChange={e => setField('itemLength', e.target.value)}
                  />

                  <TextField
                    {...tfStyle} size="small" fullWidth label="Item Width" type="number" inputProps={{ min: 0 }}
                    value={form.itemWidth} onChange={e => setField('itemWidth', e.target.value)}
                  />

                  <TextField
                    {...tfStyle} size="small" fullWidth label="Item Height" type="number" inputProps={{ min: 0 }}
                    value={form.itemHeight} onChange={e => setField('itemHeight', e.target.value)}
                  />

                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Dimensional Unit</InputLabel>
                    <Select
                      value={form.dimensionalUnit || 'cm'}
                      label="Dimensional Unit"
                      onChange={e => setField('dimensionalUnit', e.target.value)}
                    >
                      {['cm', 'inches', 'mm'].map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Amazon / Daraz Warranty & Return Policy */}
                  <FormControl size="small" fullWidth sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Warranty Coverage (Amazon / Daraz Standard)</InputLabel>
                    <Select
                      value={form.warrantyType || '1 Year Official Brand Warranty'}
                      label="Warranty Coverage (Amazon / Daraz Standard)"
                      onChange={e => setField('warrantyType', e.target.value)}
                    >
                      {[
                        '1 Year Official Brand Warranty',
                        '2 Years Official Brand Warranty',
                        '6 Months Brand Warranty',
                        '3 Months Seller Warranty',
                        'Freshness & Quality Guarantee',
                        '7 Days Replacement Warranty',
                        '7 Days Checking Warranty',
                        'No Warranty',
                      ].map(w => <MenuItem key={w} value={w}>{w}</MenuItem>)}
                    </Select>
                  </FormControl>

                  <FormControl size="small" fullWidth sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Return & Resolution Policy</InputLabel>
                    <Select
                      value={form.returnPolicy || '7 Days Free Return / Refund'}
                      label="Return & Resolution Policy"
                      onChange={e => setField('returnPolicy', e.target.value)}
                    >
                      {[
                        '7 Days Free Return / Refund',
                        '14 Days Replacement Guarantee',
                        '30 Days Buyer Protection',
                        'Immediate Replacement on Delivery',
                        'Non-Returnable (Hygiene / Perishable Food)',
                      ].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              )}
            </Card>
          )}

          {/* ── Bottom Floating Action Bar ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, pb: 4 }}>
            <Button
              variant="outlined"
              onClick={() => router.back()}
              sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#475569' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 800, px: 4, py: 1.2 }}
            >
              {isSubmitting ? 'Publishing…' : 'Publish Unified Listing'}
            </Button>
          </Box>

        </Stack>
      </Box>

      {/* ── Custom Size Dialog ── */}
      <Dialog open={showSizePopup} onClose={() => setShowSizePopup(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Custom Size</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Size Label" autoFocus value={customSizeInput}
            onChange={e => setCustomSizeInput(e.target.value)}
            placeholder="e.g. XXL, 2XL, Family Feast" sx={{ mt: 1, ...tfStyle }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowSizePopup(false)} variant="outlined" sx={{ borderRadius: 0 }}>Cancel</Button>
          <Button onClick={() => {
            if (customSizeInput.trim()) {
              setField('size', customSizeInput.trim())
              setCustomSizeInput('')
              setShowSizePopup(false)
            }
          }} variant="contained" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0 }}>
            Set Size
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Custom Color Dialog ── */}
      <Dialog open={showColorPopup} onClose={() => setShowColorPopup(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Custom Color</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Color Name" autoFocus value={customColorInput}
            onChange={e => setCustomColorInput(e.target.value)}
            placeholder="e.g. Midnight Navy, Rose Gold" sx={{ mt: 1, ...tfStyle }} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setShowColorPopup(false)} variant="outlined" sx={{ borderRadius: 0 }}>Cancel</Button>
          <Button onClick={() => {
            if (customColorInput.trim()) {
              setField('color', customColorInput.trim())
              setCustomColorInput('')
              setShowColorPopup(false)
            }
          }} variant="contained" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0 }}>
            Set Color
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  )
}
