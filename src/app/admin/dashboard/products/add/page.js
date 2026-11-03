'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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

import { useTheme } from '@mui/material/styles'
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
import RestaurantMenuOutlinedIcon from '@mui/icons-material/RestaurantMenuOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import FastfoodOutlinedIcon from '@mui/icons-material/FastfoodOutlined'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined'
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'

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
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const brandText = isDark ? '#4ade80' : BRAND
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

  // Explicit Business Category Selector: 'Restaurant' vs 'Retail'
  const [businessCategory, setBusinessCategory] = useState('Restaurant')

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

  const vendorIsRestaurant = isRestaurantVendor(userData, vendorBusiness)

  // Auto-detect business category
  useEffect(() => {
    if (vendorBusiness) {
      const bizCatTitle = (
        vendorBusiness?.businessCategory?.categoryTitle ||
        vendorBusiness?.category?.name ||
        vendorBusiness?.categoryTitle ||
        ''
      ).toLowerCase()

      if (bizCatTitle.includes('restaurant') || vendorIsRestaurant) {
        setBusinessCategory('Restaurant')
      } else if (bizCatTitle.includes('grocery') || bizCatTitle.includes('shop') || bizCatTitle.includes('electronics')) {
        setBusinessCategory('Retail')
      }
    } else if (vendorIsRestaurant) {
      setBusinessCategory('Restaurant')
    }
  }, [vendorBusiness, vendorIsRestaurant])

  // Generator for Product SKU
  const generateDishSku = (name = '') => {
    const clean = (name || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4).toUpperCase()
    const prefix = clean ? `DISH-${clean}` : 'DISH'
    const rand = Math.floor(100000 + Math.random() * 900000)
    return `QD-${prefix}-${rand}`
  }

  // ── Unified Form State ────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    // Restaurant / Food Attributes
    sku: generateDishSku(),
    name: '',
    brandName: '',
    manufacturer: '',
    barcode: '',
    productIdType: 'NONE',
    productType: 'Restaurant Menu Item / Prepared Food',
    menuSectionName: 'Chef Specials',
    catId: '',
    productCategoryId: '',
    subCatId: '',

    // Pricing & Availability
    price: '',
    cost: '',
    discount: '0',
    currency: 'PKR',
    stock: '100',
    status: true,
    conditionType: 'Prepared Fresh',
    fulfillmentChannel: 'IN_HOUSE_KITCHEN',
    salePrice: '',
    saleStartDate: '',
    saleEndDate: '',
    maxOrderQuantity: '10',
    taxCode: 'FOOD_PREP_STD',

    // Discoverability & Descriptions
    bulletPoint1: '',
    bulletPoint2: '',
    bulletPoint3: '',
    bulletPoint4: '',
    bulletPoint5: '',
    description: '',
    genericKeywords: '',
    targetAudience: 'Food Lovers, Diners & Families',

    // Notes / Comments
    notes: '',

    // Food, Dietary & Safety Compliance
    ingredients: '',
    allergenInformation: 'Contains fresh ingredients. Inquire for specific dietary alerts.',
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

    // Modifiers & Add-ons
    parentChild: 'Standalone',
    parentSku: '',
    variationTheme: 'Portion / Add-ons',
    modifierGroupName: 'Add-ons & Options',
    minSelections: '0',
    maxSelections: '4',
    addons: [
      { name: 'Extra Melted Cheddar Cheese', price: '150' },
      { name: 'Upgrade to Crispy Seasoned Fries', price: '220' },
      { name: 'Special Garlic Truffle Mayo Dip', price: '80' },
    ],
    size: '',
    color: '',

    // Images
    images: [],

    // Packaging
    itemWeight: '450',
    itemWeightUnit: 'grams',
    shippingWeight: '550',
    shippingWeightUnit: 'grams',
    itemLength: '18',
    itemWidth: '18',
    itemHeight: '12',
    dimensionalUnit: 'cm',
    warrantyType: 'Freshness & Hygiene Guarantee Upon Handover',
    returnPolicy: 'Immediate Replacement on Delivery',
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

  // Fetch categories, productCategories, subcategories
  useEffect(() => {
    if (!userData?.uid) return
    Promise.all([
      fetch('/api/products?type=categories').then(r => r.json()),
      fetch('/api/products?type=productcategories').then(r => r.json()),
      fetch('/api/products?type=subcategories').then(r => r.json()),
    ]).then(([catsData, pcData, subsData]) => {
      const fetchedCats = catsData.success ? (catsData.data || []) : []
      const fetchedPcs = pcData.success ? (pcData.data || []) : []
      const fetchedSubs = subsData.success ? (subsData.data || []) : []

      setCategories(fetchedCats)
      setProductCategories(fetchedPcs)
      setSubcategories(fetchedSubs)

      // Find the Restaurant category
      const restaurantCat = fetchedCats.find(c => {
        const n = (c.name || '').toLowerCase()
        const code = (c.code || '').toLowerCase()
        return n === 'restaurant' || code === 'restaurant' || n.includes('restaurant') || code.includes('restaurant') || c.vertical === 'FOOD'
      })

      if (restaurantCat) {
        setForm(p => {
          const catId = p.catId || String(restaurantCat.id)
          const matchingPcs = fetchedPcs.filter(pc => String(pc.categoryId) === String(catId))
          const firstPcId = p.productCategoryId || (matchingPcs[0] ? String(matchingPcs[0].productCategoryId) : '')
          const matchingSubs = fetchedSubs.filter(s => String(s.productCategoryId) === String(firstPcId))
          const firstSubId = p.subCatId || (matchingSubs[0] ? String(matchingSubs[0].subCatId) : '')

          return {
            ...p,
            catId,
            productCategoryId: firstPcId,
            subCatId: firstSubId,
          }
        })
      }
    }).catch(e => console.error('Categories fetch error:', e))
  }, [userData?.uid])

  const isRestaurantMode = businessCategory === 'Restaurant'

  // Filter Product Categories strictly by the selected Main Category
  const restaurantMainCategory = useMemo(() => {
    return categories.find(c => {
      const n = (c.name || '').toLowerCase()
      const code = (c.code || '').toLowerCase()
      return n === 'restaurant' || code === 'restaurant' || n.includes('restaurant') || code.includes('restaurant') || c.vertical === 'FOOD'
    }) || categories[0]
  }, [categories])

  const activeCategoryId = isRestaurantMode ? (restaurantMainCategory ? String(restaurantMainCategory.id) : form.catId) : form.catId

  const availableProductCategories = useMemo(() => {
    if (!activeCategoryId) return productCategories
    return productCategories.filter(pc => String(pc.categoryId) === String(activeCategoryId))
  }, [productCategories, activeCategoryId])

  const filteredSubs = useMemo(() => {
    if (form.productCategoryId) {
      const matched = subcategories.filter(s => String(s.productCategoryId) === String(form.productCategoryId))
      if (matched.length > 0) return matched
    }
    if (activeCategoryId) {
      return subcategories.filter(s => String(s.catId) === String(activeCategoryId))
    }
    return subcategories
  }, [subcategories, form.productCategoryId, activeCategoryId])

  const setField = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  // Live Auto-Calculation for Chargeable Price
  const handlePriceChange = (val) => {
    const numPrice = parseFloat(val) || 0
    const numDiscount = parseFloat(form.discount) || 0
    const computedSalePrice = numDiscount > 0 ? (numPrice - (numPrice * numDiscount / 100)).toFixed(0) : ''
    setForm(p => ({
      ...p,
      price: val,
      salePrice: computedSalePrice,
    }))
    if (errors.price) setErrors(p => ({ ...p, price: '' }))
  }

  const handleDiscountChange = (val) => {
    const numDiscount = parseFloat(val) || 0
    const numPrice = parseFloat(form.price) || 0
    const computedSalePrice = (numDiscount > 0 && numPrice > 0) ? (numPrice - (numPrice * numDiscount / 100)).toFixed(0) : ''
    setForm(p => ({
      ...p,
      discount: val,
      salePrice: computedSalePrice,
    }))
  }

  const handleChargeablePriceChange = (val) => {
    const numSale = parseFloat(val) || 0
    const numPrice = parseFloat(form.price) || 0
    let computedDiscount = form.discount
    if (numPrice > 0 && numSale > 0 && numSale < numPrice) {
      computedDiscount = (((numPrice - numSale) / numPrice) * 100).toFixed(0)
    } else if (numSale >= numPrice) {
      computedDiscount = '0'
    }
    setForm(p => ({
      ...p,
      salePrice: val,
      discount: computedDiscount,
    }))
  }

  // Handle Dish Name input with auto SKU generator
  const handleDishNameChange = (e) => {
    const newName = e.target.value
    setForm(p => {
      // Auto-update SKU if it looks like an auto SKU or is empty
      const isAutoSku = !p.sku || p.sku.startsWith('QD-DISH-')
      const newSku = isAutoSku ? generateDishSku(newName) : p.sku
      return {
        ...p,
        name: newName,
        sku: newSku,
        barcode: newSku,
      }
    })
    if (errors.name) setErrors(p => ({ ...p, name: '' }))
  }

  const handleAutoSkuRegenerate = () => {
    const newSku = generateDishSku(form.name)
    setField('sku', newSku)
    setField('barcode', newSku)
    toast.success(`Generated Product SKU: ${newSku}`)
  }

  // ── Image Upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (files) => {
    if (!files?.length) return
    setUploadingImages(true)
    try {
      const result = await uploadMultipleImages(files, 'product_images')
      if (result.success) {
        setField('images', [...form.images, ...result.urls])
        toast.success(`Uploaded ${result.urls.length} dish image(s)`)
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
    if (!form.name.trim()) e.name = isRestaurantMode ? 'Dish name is required' : 'Product name is required'
    if (!form.sku.trim()) e.sku = 'Product SKU / Code is required'
    if (!isRestaurantMode && !form.catId) e.catId = 'Main category is required'
    if (!form.productCategoryId) e.productCategoryId = 'Category is required'
    if (!form.subCatId) e.subCatId = 'Sub-category is required'
    if (!form.price || parseFloat(form.price) <= 0) e.price = 'Standard price is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      toast.error('Please complete all required fields')
      return
    }
    setIsSubmitting(true)
    try {
      const validAddons = Array.isArray(form.addons)
        ? form.addons.filter(a => a && a.name && a.name.trim() && a.price !== '')
        : []

      const targetCatId = isRestaurantMode
        ? (restaurantMainCategory ? restaurantMainCategory.id : (parseInt(form.catId) || 2))
        : (parseInt(form.catId) || 2)

      const narrativeNotes = form.notes || form.description || ''

      const res = await authFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'product',
          proName: form.name,
          description: narrativeNotes || form.description,
          catId: targetCatId,
          subCatId: parseInt(form.subCatId),
          productCategoryId: form.productCategoryId ? parseInt(form.productCategoryId) : null,
          price: parseFloat(form.price),
          cost: parseFloat(form.cost || form.price),
          discount: parseFloat(form.discount || 0),
          sku: form.sku,
          barcode: form.barcode || form.sku,
          stock: parseInt(form.stock) || 100,
          qnty: parseInt(form.stock) || 100,
          proImages: form.images,
          vendorId: userData.uid,
          createdById: userData.uid,
          status: Boolean(form.status),
          brandName: form.brandName || vendorBusiness?.businessName || 'Restaurant Kitchen',
          manufacturer: form.manufacturer || vendorBusiness?.businessName || 'Fresh Food Preparation',
          productType: isRestaurantMode ? 'Restaurant Menu Item / Prepared Food' : form.productType,
          modelNumber: form.parentSku || null,
          sizeName: form.sizeName || null,
          size: form.size || null,
          color: form.color || null,
          conditionType: isRestaurantMode ? 'Prepared Fresh' : form.conditionType,
          productDimensions: isRestaurantMode ? 'Fresh Food Box Standard' : `${form.itemLength || 15}x${form.itemWidth || 15}x${form.itemHeight || 12} ${form.dimensionalUnit || 'cm'}`,
          packageWeight: `${form.itemWeight || 450} ${form.itemWeightUnit || 'grams'}`,
          warranty: form.warrantyType || (isRestaurantMode ? 'Freshness & Hygiene Guarantee Upon Handover' : null),
          ingredients: form.ingredients || narrativeNotes || null,
          keyFeatures: [
            isRestaurantMode ? '🍽️ Prepared Fresh to Order' : null,
            form.isHalal ? '🥩 100% Halal Certified' : null,
            form.isVeg ? '🌱 Pure Vegetarian' : null,
            form.prepTime ? `⏱️ Prep Time: ${form.prepTime} mins` : null,
            form.servings ? `👥 Servings: ${form.servings}` : null,
            form.spiceLevel ? `🌶️ Spice Level: ${form.spiceLevel}` : null,
            form.fulfillmentChannel ? `🚚 Fulfillment: ${form.fulfillmentChannel}` : null,
          ].filter(Boolean),
          variations: validAddons.length > 0 ? validAddons : null,
          salePrice: form.salePrice ? parseFloat(form.salePrice) : null,
          saleStartDate: form.saleStartDate || null,
          saleEndDate: form.saleEndDate || null,
          currency: form.currency || 'PKR',
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast.success(isRestaurantMode ? 'Dish published successfully to restaurant menu!' : 'Product listing published successfully!')
        router.push(userData?.role === 'VENDOR' ? '/vendor/dashboard/products' : '/admin/dashboard/products')
      } else {
        toast.error(data.error || 'Failed to save product')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Estimated profit calculations for display
  const effectiveSale = parseFloat(form.salePrice || form.price) || 0
  const costPrice = parseFloat(form.cost) || 0
  const estimatedProfit = effectiveSale > costPrice ? (effectiveSale - costPrice).toFixed(0) : '0'
  const marginPct = effectiveSale > 0 && costPrice > 0 ? (((effectiveSale - costPrice) / effectiveSale) * 100).toFixed(1) : 0

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading product catalog engine…</Typography>
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
          bgcolor: 'background.default',
          '&, & *': { borderRadius: '0px !important' },
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
            <IconButton size="small" onClick={() => router.back()} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, bgcolor: 'background.paper' }}>
              <ArrowBackOutlinedIcon fontSize="small" />
            </IconButton>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight={800} color="text.primary">
                  {isRestaurantMode ? 'Add Restaurant Menu Item' : 'Add Catalog Product'}
                </Typography>
                <Chip
                  label={isRestaurantMode ? 'RESTAURANT DISH CREATOR' : 'RETAIL PRODUCT'}
                  size="small"
                  sx={{ bgcolor: isDark ? 'rgba(74,222,128,0.16)' : `${BRAND}15`, color: brandText, fontWeight: 900, borderRadius: 0 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {isRestaurantMode
                  ? 'Streamlined data attributes designed specifically for restaurant food dishes, chef pricing, and kitchen fulfillment.'
                  : 'Multi-attribute product catalog form for retail shops, supermarkets, and consumer goods.'}
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 800, px: 3, py: 1 }}
            >
              {isSubmitting ? 'Publishing…' : (isRestaurantMode ? 'Publish Dish to Menu' : 'Publish Listing')}
            </Button>
          </Stack>
        </Box>

        {/* ── Business Category Selector Switcher ── */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 2, mb: 3, bgcolor: 'background.paper' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={800} color="text.primary">
                Select Business Category:
              </Typography>
              <Typography variant="caption" color="text.secondary">
                (Adapts product attributes between kitchen dishes and physical store items)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant={businessCategory === 'Restaurant' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<RestaurantMenuOutlinedIcon />}
                onClick={() => {
                  setBusinessCategory('Restaurant')
                  if (restaurantMainCategory) {
                    setField('catId', String(restaurantMainCategory.id))
                  }
                }}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: businessCategory === 'Restaurant' ? BRAND : 'background.paper',
                  borderColor: businessCategory === 'Restaurant' ? BRAND : 'divider',
                  color: businessCategory === 'Restaurant' ? '#ffffff' : 'text.primary',
                  '&:hover': { bgcolor: businessCategory === 'Restaurant' ? BRAND_DARK : 'action.hover' }
                }}
              >
                🍽️ Restaurant (Food &amp; Dining)
              </Button>
              <Button
                variant={businessCategory === 'Retail' ? 'contained' : 'outlined'}
                size="small"
                startIcon={<StorefrontOutlinedIcon />}
                onClick={() => setBusinessCategory('Retail')}
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontWeight: 800,
                  bgcolor: businessCategory === 'Retail' ? BRAND : 'background.paper',
                  borderColor: businessCategory === 'Retail' ? BRAND : 'divider',
                  color: businessCategory === 'Retail' ? '#ffffff' : 'text.primary',
                  '&:hover': { bgcolor: businessCategory === 'Retail' ? BRAND_DARK : 'action.hover' }
                }}
              >
                🛍️ Retail Store / Shop
              </Button>
            </Stack>
          </Box>
        </Card>

        {/* ════════════════════════════════════════════════════════════════════════
            RESTAURANT DEDICATED VIEW (Exactly as requested by Taniaa Asghar)
            Attributes:
            1. Dish name
            2. Product (Auto Generated)
            3. Business Category (Restaurant)
            4. Category
            5. Sub category
            6. Standard Price
            7. Currency
            8. Discount
            9. Fulfillment channel
            10. Chargeable price
            11. Cost price
            12. Notes (comments)
            13. Images
            14. Others (Prep time, Dietary flags, Servings, Spice level, Modifiers)
        ════════════════════════════════════════════════════════════════════════ */}
        {isRestaurantMode ? (
          <Stack spacing={3}>

            {/* ── CARD 1: Dish Identity & Classification ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="DISH IDENTIFIERS & TAXONOMY" size="small" sx={{ bgcolor: isDark ? 'rgba(74,222,128,0.16)' : `${BRAND}15`, color: brandText, fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    Dish Information &amp; Menu Classification
                  </Typography>
                </Box>
                <Chip label="🍽️ Restaurant Mode" size="small" sx={{ bgcolor: '#166534', color: '#ffffff', fontWeight: 800, borderRadius: 0 }} />
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>

                {/* 1. Dish name */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  required
                  label="1. Dish name *"
                  value={form.name}
                  onChange={handleDishNameChange}
                  error={!!errors.name}
                  helperText={errors.name || 'e.g. Special Chicken Karahi Desi Ghee, Truffle Smash Burger'}
                  placeholder="e.g. Special Chicken Karahi Desi Ghee"
                  sx={{ gridColumn: { xs: '1 / -1', md: 'span 2' } }}
                />

                {/* 2. Product (Auto Generated) */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  required
                  label="2. Product (Auto Generated) *"
                  value={form.sku}
                  onChange={e => setField('sku', e.target.value)}
                  error={!!errors.sku}
                  helperText={errors.sku || 'Unique system identifier auto-created for this dish'}
                  placeholder="e.g. QD-DISH-84920"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title="Regenerate auto product code">
                          <IconButton size="small" onClick={handleAutoSkuRegenerate} sx={{ color: BRAND }}>
                            <RefreshOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    )
                  }}
                />

                {/* 3. Business Category (Restaurant) */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary">
                    3. Business Category (Restaurant)
                  </Typography>
                  <Box sx={{ p: 1, border: '1px solid', borderColor: isDark ? 'rgba(74,222,128,0.35)' : '#bbf7d0', bgcolor: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" fontWeight={800} color={isDark ? '#4ade80' : '#166534'}>
                      🍽️ Restaurant (Food &amp; Dining)
                    </Typography>
                    <Chip label="ACTIVE" size="small" sx={{ bgcolor: '#166534', color: '#ffffff', fontWeight: 900, height: 20, fontSize: 10, borderRadius: 0 }} />
                  </Box>
                </Box>

                {/* 4. Category */}
                <FormControl size="small" fullWidth required error={!!errors.productCategoryId} sx={tfStyle}>
                  <InputLabel id="rest-category-label">4. Category *</InputLabel>
                  <Select
                    labelId="rest-category-label"
                    value={form.productCategoryId || ''}
                    label="4. Category *"
                    onChange={e => {
                      const newPcId = e.target.value
                      setForm(p => ({
                        ...p,
                        productCategoryId: newPcId,
                        subCatId: '',
                      }))
                      if (errors.productCategoryId) setErrors(p => ({ ...p, productCategoryId: '' }))
                    }}
                  >
                    <MenuItem value=""><em>Select Food Category…</em></MenuItem>
                    {availableProductCategories.map(pc => (
                      <MenuItem key={pc.productCategoryId} value={String(pc.productCategoryId)}>
                        {pc.productCategoryName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.productCategoryId && <Typography variant="caption" color="error">{errors.productCategoryId}</Typography>}
                </FormControl>

                {/* 5. Sub category */}
                <FormControl size="small" fullWidth required error={!!errors.subCatId} sx={tfStyle}>
                  <InputLabel id="rest-subcategory-label">5. Sub category *</InputLabel>
                  <Select
                    labelId="rest-subcategory-label"
                    value={form.subCatId || ''}
                    label="5. Sub category *"
                    onChange={e => setField('subCatId', e.target.value)}
                  >
                    <MenuItem value=""><em>Select Sub category…</em></MenuItem>
                    {filteredSubs.map(s => (
                      <MenuItem key={s.subCatId} value={String(s.subCatId)}>
                        {s.subCatName}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.subCatId && <Typography variant="caption" color="error">{errors.subCatId}</Typography>}
                </FormControl>

              </Box>
            </Card>

            {/* ── CARD 2: Pricing, Currency, Discount & Fulfillment ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="PRICING & DISPATCH" size="small" sx={{ bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#dbeafe', color: isDark ? '#60a5fa' : '#1e40af', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    Pricing, Currency, Discount &amp; Fulfillment Channel
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>

                {/* 6. Standard Price */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  required
                  label="6. Standard Price *"
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={form.price}
                  onChange={e => handlePriceChange(e.target.value)}
                  error={!!errors.price}
                  helperText={errors.price || 'Regular menu price before any discount'}
                  placeholder="e.g. 1200"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment>
                  }}
                />

                {/* 7. Currency */}
                <FormControl size="small" fullWidth sx={tfStyle}>
                  <InputLabel>7. Currency</InputLabel>
                  <Select
                    value={form.currency || 'PKR'}
                    label="7. Currency"
                    onChange={e => setField('currency', e.target.value)}
                  >
                    {['PKR', 'USD', 'AED', 'SAR', 'EUR', 'GBP'].map(c => (
                      <MenuItem key={c} value={c}>{c}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* 8. Discount */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  label="8. Discount (%)"
                  type="number"
                  inputProps={{ min: 0, max: 100 }}
                  value={form.discount}
                  onChange={e => handleDiscountChange(e.target.value)}
                  helperText="Promotional percentage deduction"
                  placeholder="0"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>
                  }}
                />

                {/* 9. Fulfillment channel */}
                <FormControl size="small" fullWidth sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                  <InputLabel>9. Fulfillment channel</InputLabel>
                  <Select
                    value={form.fulfillmentChannel || 'IN_HOUSE_KITCHEN'}
                    label="9. Fulfillment channel"
                    onChange={e => setField('fulfillmentChannel', e.target.value)}
                  >
                    <MenuItem value="IN_HOUSE_KITCHEN">🍳 In-House Kitchen (Freshly Prepared to Order)</MenuItem>
                    <MenuItem value="EXPRESS_DELIVERY">⚡ Express Delivery (MartZona Rapid Fleet Hot Delivery)</MenuItem>
                    <MenuItem value="TAKEAWAY_PICKUP">🛍️ Takeaway / Counter Pickup</MenuItem>
                    <MenuItem value="DINE_IN">🍽️ Dine-in Only</MenuItem>
                  </Select>
                </FormControl>

                {/* 10. Chargeable price (Auto-calculated) */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  label="10. Chargeable price (Customer Pays)"
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={form.salePrice || (form.price ? form.price : '')}
                  onChange={e => handleChargeablePriceChange(e.target.value)}
                  helperText="Effective final selling price (Auto calculated from Standard Price - Discount)"
                  placeholder="e.g. 1080"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment>
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: isDark ? 'rgba(74,222,128,0.06)' : '#f0fdf4',
                    }
                  }}
                />

                {/* 11. Cost price */}
                <TextField
                  {...tfStyle}
                  size="small"
                  fullWidth
                  label="11. Cost price (Kitchen Cost)"
                  type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={form.cost}
                  onChange={e => setField('cost', e.target.value)}
                  helperText="Raw materials & cooking cost for kitchen margin tracking"
                  placeholder="e.g. 600"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment>
                  }}
                />

                {/* Live Profit & Margin Indicator */}
                <Box sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' }, p: 1.5, bgcolor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: '1px solid', borderColor: isDark ? 'rgba(96,165,250,0.3)' : '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      ESTIMATED KITCHEN MARGIN
                    </Typography>
                    <Typography variant="body2" fontWeight={800} color={isDark ? '#60a5fa' : '#1e40af'}>
                      Profit: {form.currency || 'PKR'} {parseFloat(estimatedProfit).toLocaleString()} ({marginPct}% Gross Margin)
                    </Typography>
                  </Box>
                  <Chip
                    label={`Chargeable: ${form.currency || 'PKR'} ${parseFloat(effectiveSale || 0).toLocaleString()}`}
                    size="small"
                    sx={{ bgcolor: BRAND, color: '#ffffff', fontWeight: 800, borderRadius: 0 }}
                  />
                </Box>

              </Box>
            </Card>

            {/* ── CARD 3: Notes (comments) ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="CHEF NOTES & RECIPE" size="small" sx={{ bgcolor: isDark ? 'rgba(245,158,11,0.18)' : '#fef3c7', color: isDark ? '#fbbf24' : '#b45309', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    12. Notes (comments)
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <TextField
                {...tfStyle}
                size="small"
                fullWidth
                multiline
                rows={4}
                label="12. Notes (comments) / Recipe & Serving Details"
                value={form.description}
                onChange={e => {
                  setField('description', e.target.value)
                  setField('notes', e.target.value)
                  setField('ingredients', e.target.value)
                }}
                placeholder="Enter chef cooking instructions, ingredients, garnishing details, side portions (e.g. Cooked in pure desi ghee with green chilies, served hot with naan & fresh raita)..."
                helperText="Comments will be visible to diners and kitchen staff upon order placement."
              />
            </Card>

            {/* ── CARD 4: Images ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="MEDIA ASSETS" size="small" sx={{ bgcolor: isDark ? 'rgba(244,63,94,0.18)' : '#ffe4e6', color: isDark ? '#fb7185' : '#be123c', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    13. Images
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary">
                  High-resolution food photos boost order conversions by 300%
                </Typography>
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
                  border: '2px dashed', borderColor: dragOver ? brandText : 'divider',
                  borderRadius: 0, p: 4, textAlign: 'center', bgcolor: dragOver ? (isDark ? 'rgba(74,222,128,0.08)' : `${BRAND}08`) : 'grey.50',
                  cursor: 'pointer', transition: 'all 0.2s',
                  '&:hover': { borderColor: BRAND, bgcolor: `${BRAND}08` }
                }}
              >
                {uploadingImages ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={32} sx={{ color: BRAND }} />
                    <Typography variant="body2" color="text.secondary">Uploading high-resolution dish photos...</Typography>
                  </Box>
                ) : (
                  <>
                    <UploadOutlinedIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                    <Typography variant="body1" fontWeight={700} color="text.primary" mb={0.5}>
                      Drag and drop dish pictures here, or browse files
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                      PNG, JPG, WebP up to 10MB each. Primary photo will be used on the menu card.
                    </Typography>
                    <Button variant="contained" size="small" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}>
                      Choose Dish Photos
                    </Button>
                  </>
                )}
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleImageUpload(Array.from(e.target.files)) }} />
              </Box>

              {form.images.length > 0 && (
                <Box mt={3}>
                  <Typography variant="body2" fontWeight={800} color="text.secondary" mb={1.5}>
                    Active Dish Gallery ({form.images.length} Photos):
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 1.5 }}>
                    {form.images.map((img, i) => (
                      <Box key={i} sx={{ position: 'relative', border: '1px solid', borderColor: i === 0 ? brandText : 'divider', height: 110, bgcolor: 'background.paper', overflow: 'hidden' }}>
                        <NextImage src={img} alt={`Dish Photo ${i + 1}`} width={120} height={110} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, bgcolor: i === 0 ? BRAND : 'rgba(0,0,0,0.65)', color: '#ffffff', fontSize: 10, py: 0.25, textAlign: 'center', fontWeight: 800 }}>
                          {i === 0 ? 'MAIN DISH' : `PHOTO #${i + 1}`}
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

            {/* ── CARD 5: Others (Preparation, Dietary, Portions & Modifiers) ── */}
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box>
                  <Chip label="KITCHEN ATTRIBUTES" size="small" sx={{ bgcolor: isDark ? 'rgba(168,85,247,0.18)' : '#f3e8ff', color: isDark ? '#c084fc' : '#7e22ce', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                  <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                    14. Others (Preparation, Dietary &amp; Modifiers)
                  </Typography>
                </Box>
              </Box>
              <Divider sx={{ mb: 2.5 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>

                {/* Prep time */}
                <TextField
                  {...tfStyle}
                  size="small"
                  label="Preparation Time (mins)"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.prepTime || '20'}
                  onChange={e => setField('prepTime', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">mins</InputAdornment> }}
                />

                {/* Servings */}
                <TextField
                  {...tfStyle}
                  size="small"
                  label="Portion / Servings"
                  value={form.servings || '1-2 Persons'}
                  onChange={e => setField('servings', e.target.value)}
                  placeholder="e.g. 1 Person, 1-2 Persons, Family Pack"
                />

                {/* Spice Level */}
                <FormControl size="small" sx={tfStyle}>
                  <InputLabel>Spice Level</InputLabel>
                  <Select
                    value={form.spiceLevel || 'Medium'}
                    label="Spice Level"
                    onChange={e => setField('spiceLevel', e.target.value)}
                  >
                    <MenuItem value="Mild">Mild 🟢</MenuItem>
                    <MenuItem value="Medium">Medium 🟡</MenuItem>
                    <MenuItem value="Hot">Hot 🔴</MenuItem>
                    <MenuItem value="Extra Hot">Extra Hot 🔥</MenuItem>
                  </Select>
                </FormControl>

                {/* Stock Quantity */}
                <TextField
                  {...tfStyle}
                  size="small"
                  label="Daily Portions Available"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={form.stock}
                  onChange={e => setField('stock', e.target.value)}
                  helperText="Kitchen batch availability"
                />

                {/* Dietary Switches */}
                <Box sx={{ gridColumn: '1 / -1', p: 1.5, bgcolor: isDark ? 'rgba(34,197,94,0.1)' : '#f0fdf4', border: '1px solid', borderColor: isDark ? 'rgba(74,222,128,0.35)' : '#bbf7d0', display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={<Switch checked={Boolean(form.isHalal)} onChange={e => setField('isHalal', e.target.checked)} color="success" />}
                    label={<Typography variant="body2" fontWeight={800} color={isDark ? '#4ade80' : '#166534'}>🥩 100% Halal Certified</Typography>}
                  />
                  <FormControlLabel
                    control={<Switch checked={Boolean(form.isVeg)} onChange={e => setField('isVeg', e.target.checked)} color="success" />}
                    label={<Typography variant="body2" fontWeight={800} color={isDark ? '#4ade80' : '#166534'}>🌱 Pure Vegetarian</Typography>}
                  />
                </Box>

              </Box>

              {/* Addons / Modifiers Section */}
              <Box sx={{ p: 2.5, bgcolor: 'grey.50', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="subtitle2" fontWeight={800} color="text.primary" mb={1.5}>
                  Dish Modifiers &amp; Add-on Options ({form.addons?.length || 0})
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 2 }}>
                  {(form.addons || []).map((addon, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="body2" fontWeight={700} color="text.primary">{addon.name}</Typography>
                        <Chip
                          label={`+ ${form.currency || 'PKR'} ${parseFloat(addon.price || 0).toLocaleString()}`}
                          size="small"
                          sx={{ height: 22, fontWeight: 700, bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#dbeafe', color: isDark ? '#60a5fa' : '#1e40af', borderRadius: 0 }}
                        />
                      </Box>
                      <IconButton size="small" color="error" onClick={() => setField('addons', form.addons.filter((_, i) => i !== index))}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  {(!form.addons || form.addons.length === 0) && (
                    <Typography variant="body2" color="text.secondary">No add-ons configured yet. Add optional sides, extra cheese, or drinks below.</Typography>
                  )}
                </Stack>

                {/* Add New Modifier Input Row */}
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: { xs: 'wrap', sm: 'nowrap' }, alignItems: 'center' }}>
                  <TextField
                    {...tfStyle}
                    size="small"
                    label="Modifier / Add-on Name"
                    placeholder="e.g. Extra Cheddar Cheese, Raita Dip, Drink Can"
                    value={newAddon.name}
                    onChange={e => setNewAddon({ ...newAddon, name: e.target.value })}
                    sx={{ flex: 2, minWidth: 200, bgcolor: 'background.paper' }}
                  />
                  <TextField
                    {...tfStyle}
                    size="small"
                    label="Price (Rs.)"
                    type="number"
                    placeholder="e.g. 150"
                    value={newAddon.price}
                    onChange={e => setNewAddon({ ...newAddon, price: e.target.value })}
                    InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'Rs.'}</InputAdornment> }}
                    sx={{ flex: 1, minWidth: 120, bgcolor: 'background.paper' }}
                  />
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      if (!newAddon.name.trim() || !newAddon.price) {
                        toast.error('Please enter modifier name and price')
                        return
                      }
                      setField('addons', [...(form.addons || []), { name: newAddon.name.trim(), price: newAddon.price }])
                      setNewAddon({ name: '', price: '' })
                      toast.success('Modifier added to dish')
                    }}
                    sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, whiteSpace: 'nowrap' }}
                  >
                    Add Option
                  </Button>
                </Box>
              </Box>

            </Card>

            {/* ── Bottom Submit Bar ── */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, pb: 4 }}>
              <Button
                variant="outlined"
                onClick={() => router.back()}
                sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
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
                {isSubmitting ? 'Publishing…' : 'Publish Dish to Restaurant Menu'}
              </Button>
            </Box>

          </Stack>
        ) : (
          /* ══════════════════════════════════════════════════════════════════════
              RETAIL PRODUCT VIEW (Multi-Phase Standard Form for Shops & Supermarkets)
          ══════════════════════════════════════════════════════════════════════ */
          <Stack spacing={3}>
            {/* Phase filter navigation */}
            <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1.5, mb: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              {[
                { id: 'all', label: 'All Phases' },
                { id: 'phase_1', label: 'Phase 1: Vital Info' },
                { id: 'phase_2', label: 'Phase 2: Pricing & Offer' },
                { id: 'phase_3', label: 'Phase 3: Discoverability' },
                { id: 'phase_5', label: 'Phase 5: Options & Variations' },
                { id: 'phase_6', label: 'Phase 6: Image Assets' },
                { id: 'phase_7', label: 'Phase 7: Dimensions & Shipping' },
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
                    bgcolor: activePhase === tab.id ? BRAND : 'background.paper',
                    borderColor: activePhase === tab.id ? BRAND : 'divider',
                    color: activePhase === tab.id ? '#ffffff' : 'text.primary',
                    '&:hover': {
                      bgcolor: activePhase === tab.id ? BRAND_DARK : 'action.hover',
                    }
                  }}
                >
                  {tab.label}
                </Button>
              ))}
            </Box>

            {/* PHASE 1: Vital Info */}
            {(activePhase === 'all' || activePhase === 'phase_1') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 1" size="small" sx={{ bgcolor: isDark ? 'rgba(74,222,128,0.16)' : `${BRAND}15`, color: brandText, fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                      Core Identifiers &amp; Taxonomy (Vital Info)
                    </Typography>
                  </Box>
                  <Button size="small" variant="outlined" onClick={handleAutoSkuRegenerate} sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11 }}>
                    Auto-Generate SKU
                  </Button>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    {...tfStyle} size="small" fullWidth required label="Item SKU *"
                    value={form.sku} onChange={e => setField('sku', e.target.value)}
                    error={!!errors.sku} helperText={errors.sku} placeholder="e.g. QD-PROD-001"
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth required label="Product Name *"
                    value={form.name} onChange={e => setField('name', e.target.value)}
                    error={!!errors.name} helperText={errors.name} placeholder="e.g. Wireless Noise-Cancelling Headphones"
                    sx={{ gridColumn: { xs: '1 / -1', md: 'span 3' } }}
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Brand Name"
                    value={form.brandName} onChange={e => setField('brandName', e.target.value)} placeholder="e.g. Sony, Apple, Samsung"
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Manufacturer / Producer"
                    value={form.manufacturer} onChange={e => setField('manufacturer', e.target.value)} placeholder="Official manufacturer"
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Product ID (Barcode)"
                    value={form.barcode} onChange={e => setField('barcode', e.target.value)} placeholder="UPC, EAN or ISBN"
                  />
                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Product ID Type</InputLabel>
                    <Select value={form.productIdType || 'NONE'} label="Product ID Type" onChange={e => setField('productIdType', e.target.value)}>
                      {['UPC', 'EAN', 'GTIN', 'ASIN', 'ISBN', 'JAN', 'NONE'].map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                    </Select>
                  </FormControl>

                  {/* Main Category */}
                  <FormControl size="small" fullWidth required error={!!errors.catId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel id="main-cat-label">Main Category (Root) *</InputLabel>
                    <Select
                      labelId="main-cat-label"
                      value={form.catId || ''}
                      label="Main Category (Root) *"
                      onChange={e => {
                        const val = e.target.value
                        setForm(p => ({ ...p, catId: val, productCategoryId: '', subCatId: '' }))
                        if (errors.catId) setErrors(p => ({ ...p, catId: '' }))
                      }}
                    >
                      <MenuItem value=""><em>Select Main Category…</em></MenuItem>
                      {categories.map(c => (
                        <MenuItem key={c.id} value={String(c.id)}>{c.name}</MenuItem>
                      ))}
                    </Select>
                    {errors.catId && <Typography variant="caption" color="error">{errors.catId}</Typography>}
                  </FormControl>

                  {/* Product Category */}
                  <FormControl size="small" fullWidth required error={!!errors.productCategoryId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel id="pc-cat-label">Product Category *</InputLabel>
                    <Select
                      labelId="pc-cat-label"
                      value={form.productCategoryId || ''}
                      label="Product Category *"
                      onChange={e => {
                        setForm(p => ({ ...p, productCategoryId: e.target.value, subCatId: '' }))
                        if (errors.productCategoryId) setErrors(p => ({ ...p, productCategoryId: '' }))
                      }}
                    >
                      <MenuItem value=""><em>Select Category…</em></MenuItem>
                      {availableProductCategories.map(c => (
                        <MenuItem key={c.productCategoryId} value={String(c.productCategoryId)}>{c.productCategoryName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Sub category */}
                  <FormControl size="small" fullWidth required error={!!errors.subCatId} sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel id="sub-cat-label">Sub-category *</InputLabel>
                    <Select
                      labelId="sub-cat-label"
                      value={form.subCatId || ''}
                      label="Sub-category *"
                      onChange={e => setField('subCatId', e.target.value)}
                    >
                      <MenuItem value=""><em>Select Sub-category…</em></MenuItem>
                      {filteredSubs.map(s => (
                        <MenuItem key={s.subCatId} value={String(s.subCatId)}>{s.subCatName}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <TextField
                    {...tfStyle} size="small" fullWidth label="Product Type / Subtype"
                    value={form.productType} onChange={e => setField('productType', e.target.value)}
                    placeholder="e.g. Consumer Electronics, Retail Pack"
                    sx={{ gridColumn: { xs: '1 / -1', sm: 'span 2' } }}
                  />
                </Box>
              </Card>
            )}

            {/* PHASE 2: Pricing & Offer */}
            {(activePhase === 'all' || activePhase === 'phase_2') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 2" size="small" sx={{ bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#dbeafe', color: isDark ? '#60a5fa' : '#1e40af', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                      Pricing, Availability &amp; Offer Data
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField
                    {...tfStyle} size="small" fullWidth required label="Standard Price *" type="number"
                    inputProps={{ step: '0.01', min: 0 }} value={form.price} onChange={e => handlePriceChange(e.target.value)}
                    error={!!errors.price} helperText={errors.price}
                    InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                  />
                  <FormControl size="small" fullWidth sx={tfStyle}>
                    <InputLabel>Currency</InputLabel>
                    <Select value={form.currency || 'PKR'} label="Currency" onChange={e => setField('currency', e.target.value)}>
                      {['PKR', 'USD', 'EUR', 'GBP', 'AED', 'SAR'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Stock Quantity *" type="number" inputProps={{ min: 0 }}
                    value={form.stock} onChange={e => setField('stock', e.target.value)}
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Discount %" type="number" inputProps={{ min: 0, max: 100 }}
                    value={form.discount} onChange={e => handleDiscountChange(e.target.value)}
                    InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Chargeable Sale Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                    value={form.salePrice} onChange={e => handleChargeablePriceChange(e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                  />
                  <TextField
                    {...tfStyle} size="small" fullWidth label="Cost Price" type="number" inputProps={{ step: '0.01', min: 0 }}
                    value={form.cost} onChange={e => setField('cost', e.target.value)}
                    InputProps={{ startAdornment: <InputAdornment position="start">{form.currency || 'PKR'}</InputAdornment> }}
                  />
                  <FormControl size="small" fullWidth sx={{ ...tfStyle, gridColumn: { xs: '1 / -1', sm: 'span 2' } }}>
                    <InputLabel>Fulfillment Channel</InputLabel>
                    <Select value={form.fulfillmentChannel || 'DEFAULT'} label="Fulfillment Channel" onChange={e => setField('fulfillmentChannel', e.target.value)}>
                      <MenuItem value="DEFAULT">DEFAULT (Merchant Standard Shipping)</MenuItem>
                      <MenuItem value="MERCHANT_DELIVERY">MERCHANT_DELIVERY (Direct Fleet)</MenuItem>
                      <MenuItem value="EXPRESS_COURIER">EXPRESS_COURIER (QuickDelivery On-Demand)</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Card>
            )}

            {/* PHASE 3: Descriptions */}
            {(activePhase === 'all' || activePhase === 'phase_3') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 3" size="small" sx={{ bgcolor: isDark ? 'rgba(245,158,11,0.18)' : '#fef3c7', color: isDark ? '#fbbf24' : '#b45309', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                      Discoverability, Notes &amp; Descriptions
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <TextField
                  {...tfStyle} size="small" fullWidth multiline rows={4} label="Product Description & Notes *"
                  value={form.description} onChange={e => setField('description', e.target.value)}
                  placeholder="Detailed product descriptions, features, specifications, and buyer notes..."
                  sx={{ mb: 2 }}
                />
              </Card>
            )}

            {/* PHASE 6: Images */}
            {(activePhase === 'all' || activePhase === 'phase_6') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 6" size="small" sx={{ bgcolor: isDark ? 'rgba(244,63,94,0.18)' : '#ffe4e6', color: isDark ? '#fb7185' : '#be123c', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                      Product Images Gallery
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
                    border: '2px dashed', borderColor: dragOver ? brandText : 'divider',
                    borderRadius: 0, p: 4, textAlign: 'center', bgcolor: dragOver ? (isDark ? 'rgba(74,222,128,0.08)' : `${BRAND}08`) : 'grey.50',
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { borderColor: BRAND, bgcolor: `${BRAND}08` }
                  }}
                >
                  <UploadOutlinedIcon sx={{ fontSize: 44, color: '#94a3b8', mb: 1 }} />
                  <Typography variant="body1" fontWeight={700} color="text.primary" mb={0.5}>
                    Drag and drop product photos here
                  </Typography>
                  <Button variant="contained" size="small" sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 700, mt: 1 }}>
                    Choose Images
                  </Button>
                  <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.length) handleImageUpload(Array.from(e.target.files)) }} />
                </Box>

                {form.images.length > 0 && (
                  <Box mt={3} sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 1.5 }}>
                    {form.images.map((img, i) => (
                      <Box key={i} sx={{ position: 'relative', border: '1px solid', borderColor: i === 0 ? brandText : 'divider', height: 110, bgcolor: 'background.paper', overflow: 'hidden' }}>
                        <NextImage src={img} alt={`Asset ${i + 1}`} width={110} height={110} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeImage(i) }}
                          sx={{ position: 'absolute', top: 3, right: 3, bgcolor: 'rgba(239, 68, 68, 0.9)', color: '#ffffff', width: 22, height: 22, p: 0 }}>
                          <CloseIcon sx={{ fontSize: 13 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Card>
            )}

            {/* PHASE 7: Dimensions & Shipping */}
            {(activePhase === 'all' || activePhase === 'phase_7') && (
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box>
                    <Chip label="PHASE 7" size="small" sx={{ bgcolor: isDark ? 'rgba(99,102,241,0.18)' : '#e0e7ff', color: isDark ? '#818cf8' : '#4338ca', fontWeight: 900, borderRadius: 0, mb: 0.5 }} />
                    <Typography variant="subtitle1" fontWeight={800} color="text.primary">
                      Dimensions, Weight &amp; Shipping
                    </Typography>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2.5 }} />

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
                  <TextField {...tfStyle} size="small" fullWidth label="Net Item Weight" value={form.itemWeight} onChange={e => setField('itemWeight', e.target.value)} />
                  <TextField {...tfStyle} size="small" fullWidth label="Shipping Weight" value={form.shippingWeight} onChange={e => setField('shippingWeight', e.target.value)} />
                  <TextField {...tfStyle} size="small" fullWidth label="Warranty Coverage" value={form.warrantyType} onChange={e => setField('warrantyType', e.target.value)} />
                  <TextField {...tfStyle} size="small" fullWidth label="Return Policy" value={form.returnPolicy} onChange={e => setField('returnPolicy', e.target.value)} />
                </Box>
              </Card>
            )}

            {/* Bottom Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2, pb: 4 }}>
              <Button variant="outlined" onClick={() => router.back()} sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting} sx={{ bgcolor: BRAND, '&:hover': { bgcolor: BRAND_DARK }, borderRadius: 0, textTransform: 'none', fontWeight: 800, px: 4, py: 1.2 }}>
                {isSubmitting ? 'Publishing…' : 'Publish Listing'}
              </Button>
            </Box>
          </Stack>
        )}

      </Box>
    </DashboardLayout>
  )
}
