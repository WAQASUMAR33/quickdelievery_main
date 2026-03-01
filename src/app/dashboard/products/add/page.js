'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserVerification } from '@/lib/authHelpers'
import { uploadMultipleImages } from '@/lib/imageUpload'
import NextImage from 'next/image'
import DashboardLayout from '@/components/layout/DashboardLayout'
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
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AddOutlinedIcon          from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon    from '@mui/icons-material/ArrowBackOutlined'
import AttachMoneyOutlinedIcon  from '@mui/icons-material/AttachMoneyOutlined'
import AutorenewOutlinedIcon    from '@mui/icons-material/AutorenewOutlined'
import CameraAltOutlinedIcon    from '@mui/icons-material/CameraAltOutlined'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CloseOutlinedIcon        from '@mui/icons-material/CloseOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import PaletteOutlinedIcon      from '@mui/icons-material/PaletteOutlined'
import SaveOutlinedIcon         from '@mui/icons-material/SaveOutlined'
import StraightenOutlinedIcon   from '@mui/icons-material/StraightenOutlined'
import StarBorderOutlinedIcon   from '@mui/icons-material/StarBorderOutlined'
import UploadOutlinedIcon       from '@mui/icons-material/UploadOutlined'

const BRAND      = '#D70F64'
const DROP_MIN_W = 300
const tf         = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } }, size: 'small' }

const predefinedColors = [
  { name: 'Black',  hex: '#000000' },
  { name: 'White',  hex: '#FFFFFF' },
  { name: 'Red',    hex: '#EF4444' },
  { name: 'Blue',   hex: '#3B82F6' },
  { name: 'Green',  hex: '#10B981' },
  { name: 'Yellow', hex: '#F59E0B' },
  { name: 'Purple', hex: '#8B5CF6' },
  { name: 'Pink',   hex: '#EC4899' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Gray',   hex: '#6B7280' },
  { name: 'Brown',  hex: '#92400E' },
  { name: 'Navy',   hex: '#1E3A8A' },
]

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 1, bgcolor: '#fce7f3', color: BRAND, borderRadius: 1, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  )
}

const AddProductPage = () => {
  const router = useRouter()
  const { userData, user, loading } = useAuth()
  const [categories, setCategories]       = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isSubmitting, setIsSubmitting]   = useState(false)
  const [showSizeDialog, setShowSizeDialog]   = useState(false)
  const [showColorDialog, setShowColorDialog] = useState(false)
  const [dragOver, setDragOver]           = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState('')
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    proName: '', description: '', catId: '', subCatId: '',
    price: '', cost: '', discount: '', sku: '', barcode: '',
    qnty: '', stock: '', status: true, images: [],
    brandName: '', manufacturer: '', keyFeatures: [], productType: '',
    variations: {}, sizeName: '', modelNumber: '', productDimensions: '',
    packageWeight: '', salePrice: '', saleStartDate: '', saleEndDate: '',
    currency: 'USD', conditionType: '', warranty: '', ingredients: '',
    reviews: [], size: '', customSize: '', color: '', customColor: '',
  })

  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (!loading) {
      const verification = checkUserVerification(user, userData)
      if (!verification.isVerified) { router.push('/login'); return }
      const role = userData?.role || 'CUSTOMER'
      if (!['ADMIN', 'SUPER_ADMIN', 'VENDOR'].includes(role)) { router.push('/dashboard'); return }
    }
  }, [user, userData, loading, router])

  useEffect(() => {
    if (!userData?.uid) return
    const fetchData = async () => {
      try {
        const [catRes, subRes] = await Promise.all([
          fetch('/api/products?type=categories'),
          fetch('/api/products?type=subcategories'),
        ])
        const [catData, subData] = await Promise.all([catRes.json(), subRes.json()])
        if (catData.success) setCategories(catData.data || [])
        if (subData.success) setSubcategories(subData.data || [])
      } catch (e) { console.error(e) }
    }
    fetchData()
  }, [userData?.uid])

  useEffect(() => {
    if (!userData?.uid) return
    const key = `product_draft_${userData.uid}`
    const saved = localStorage.getItem(key)
    if (saved) {
      try { setFormData(prev => ({ ...prev, ...JSON.parse(saved) })) } catch (e) { console.error(e) }
    }
  }, [userData?.uid])

  useEffect(() => {
    if (!userData?.uid) return
    const interval = setInterval(() => {
      const draftData = {
        proName: formData.proName, description: formData.description,
        catId: formData.catId, subCatId: formData.subCatId,
        price: formData.price, cost: formData.cost, discount: formData.discount,
        sku: formData.sku, barcode: formData.barcode, qnty: formData.qnty,
        stock: formData.stock, brandName: formData.brandName,
        manufacturer: formData.manufacturer, keyFeatures: formData.keyFeatures,
        productType: formData.productType, sizeName: formData.sizeName,
        modelNumber: formData.modelNumber, productDimensions: formData.productDimensions,
        packageWeight: formData.packageWeight, conditionType: formData.conditionType,
        warranty: formData.warranty, ingredients: formData.ingredients,
        size: formData.size, color: formData.color, currency: formData.currency,
      }
      const hasData = Object.values(draftData).some(v => v && (typeof v === 'string' ? v.trim() : true))
      if (hasData) {
        setAutoSaveStatus('saving')
        localStorage.setItem(`product_draft_${userData.uid}`, JSON.stringify(draftData))
        setTimeout(() => setAutoSaveStatus('saved'), 500)
      }
    }, 30000)
    return () => clearInterval(interval)
  }, [formData, userData?.uid])

  const clearDraft = () => {
    if (userData?.uid) localStorage.removeItem(`product_draft_${userData.uid}`)
  }

  const set = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const validateForm = () => {
    const e = {}
    if (!formData.proName.trim())                    e.proName  = 'Product name is required'
    if (!formData.catId)                             e.catId    = 'Category is required'
    if (formData.catId && !formData.subCatId)        e.subCatId = 'Subcategory is required'
    if (!formData.sku.trim())                        e.sku      = 'SKU is required'
    if (!formData.price || parseFloat(formData.price) <= 0) e.price = 'Valid price is required'
    if (!formData.cost  || parseFloat(formData.cost)  <= 0) e.cost  = 'Valid cost is required'
    if (!formData.stock || parseInt(formData.stock)   < 0)  e.stock = 'Valid stock quantity is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) { toast.error('Please fix the errors before submitting'); return }
    setIsSubmitting(true)
    try {
      const body = {
        type: 'product',
        proName: formData.proName, description: formData.description,
        catId: formData.catId, subCatId: parseInt(formData.subCatId),
        price: parseFloat(formData.price), cost: parseFloat(formData.cost),
        discount: parseFloat(formData.discount) || 0,
        sku: formData.sku, barcode: formData.barcode || formData.sku,
        qnty: parseInt(formData.qnty) || parseInt(formData.stock),
        stock: parseInt(formData.stock), proImages: formData.images,
        vendorId: userData?.uid, createdById: userData?.uid,
        brandName: formData.brandName || null, manufacturer: formData.manufacturer || null,
        keyFeatures: formData.keyFeatures.length > 0 ? formData.keyFeatures : null,
        productType: formData.productType || null,
        variations: Object.keys(formData.variations).length > 0 ? formData.variations : null,
        sizeName: formData.sizeName || null, modelNumber: formData.modelNumber || null,
        productDimensions: formData.productDimensions || null,
        packageWeight: formData.packageWeight || null,
        salePrice: formData.salePrice ? parseFloat(formData.salePrice) : null,
        saleStartDate: formData.saleStartDate || null, saleEndDate: formData.saleEndDate || null,
        currency: formData.currency || 'USD', conditionType: formData.conditionType || null,
        warranty: formData.warranty || null, ingredients: formData.ingredients || null,
        reviews: formData.reviews.length > 0 ? formData.reviews : null,
        size:  formData.size  === 'custom' ? formData.customSize  : formData.size  || null,
        color: formData.color === 'custom' ? formData.customColor : formData.color || null,
      }
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await res.json()
      if (result.success) {
        toast.success('Product added successfully!')
        clearDraft()
        router.push('/dashboard/products')
      } else {
        toast.error(`Failed to add product: ${result.error}`)
      }
    } catch (error) {
      console.error(error)
      toast.error('Error adding product. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUpload = async (files) => {
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const result = await uploadMultipleImages(files, 'product_images')
      if (result.success) {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...result.urls] }))
        toast.success(`Uploaded ${result.urls.length} image(s)`)
        if (result.errors?.length > 0) toast.error(`${result.errors.length} image(s) failed`)
      } else {
        toast.error(`Failed to upload: ${result.error}`)
      }
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setUploadingImages(false)
    }
  }

  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true)  }
  const handleDragLeave = (e) => { e.preventDefault(); setDragOver(false) }
  const handleDrop      = (e) => {
    e.preventDefault(); setDragOver(false)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length > 0) handleImageUpload(files)
  }
  const handleRemoveImage = (i) => set('images', formData.images.filter((_, idx) => idx !== i))

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  if (!user || !userData) return null
  const verification = checkUserVerification(user, userData)
  if (!verification.isVerified) return null
  if (!['ADMIN', 'SUPER_ADMIN', 'VENDOR'].includes(userData?.role)) return null

  return (
    <DashboardLayout>
      <Box sx={{ maxWidth: 1100, mx: 'auto', px: 3, py: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => router.back()} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <ArrowBackOutlinedIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>Add New Product</Typography>
              <Typography variant="body2" color="text.secondary">Create a new product listing for your store</Typography>
            </Box>
          </Box>

          {autoSaveStatus && (
            <Chip
              size="small"
              icon={autoSaveStatus === 'saving'
                ? <AutorenewOutlinedIcon fontSize="small" />
                : <CheckCircleOutlinedIcon fontSize="small" />}
              label={autoSaveStatus === 'saving' ? 'Saving draft…' : 'Draft saved'}
              sx={{ borderRadius: 0, bgcolor: autoSaveStatus === 'saving' ? '#eff6ff' : '#f0fdf4',
                color: autoSaveStatus === 'saving' ? '#3b82f6' : '#16a34a' }}
            />
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* ── Basic Information ── */}
          <SectionCard icon={<Inventory2OutlinedIcon />} title="Basic Information" subtitle="Essential product details">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Product Name *" fullWidth value={formData.proName}
                onChange={e => set('proName', e.target.value)}
                error={!!errors.proName} helperText={errors.proName}
                {...tf}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField
                  label="SKU *" value={formData.sku}
                  onChange={e => set('sku', e.target.value)}
                  error={!!errors.sku} helperText={errors.sku}
                  {...tf}
                />
                <TextField
                  label="Barcode" value={formData.barcode}
                  onChange={e => set('barcode', e.target.value)}
                  {...tf}
                />

                <FormControl size="small" error={!!errors.catId} sx={{ minWidth: DROP_MIN_W }}>
                  <InputLabel>Category *</InputLabel>
                  <Select value={formData.catId} label="Category *"
                    onChange={e => { set('catId', parseInt(e.target.value) || ''); set('subCatId', '') }}
                    sx={{ borderRadius: 0 }}>
                    <MenuItem value=""><em>Select Category</em></MenuItem>
                    {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                  </Select>
                  {errors.catId && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{errors.catId}</Typography>}
                </FormControl>

                <FormControl size="small" error={!!errors.subCatId} sx={{ minWidth: DROP_MIN_W }} disabled={!formData.catId}>
                  <InputLabel>Subcategory *</InputLabel>
                  <Select value={formData.subCatId} label="Subcategory *"
                    onChange={e => set('subCatId', e.target.value)}
                    sx={{ borderRadius: 0 }}>
                    <MenuItem value=""><em>Select Subcategory</em></MenuItem>
                    {subcategories.filter(s => s.catId === formData.catId).map(s => (
                      <MenuItem key={s.subCatId} value={s.subCatId}>{s.subCatName}</MenuItem>
                    ))}
                  </Select>
                  {errors.subCatId && <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>{errors.subCatId}</Typography>}
                </FormControl>
              </Box>

              <TextField
                label="Description" fullWidth multiline rows={4} value={formData.description}
                onChange={e => set('description', e.target.value)}
                {...tf}
              />
            </Box>
          </SectionCard>

          {/* ── Additional Information ── */}
          <SectionCard icon={<StarBorderOutlinedIcon />} title="Additional Product Information">
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                <TextField label="Brand Name" value={formData.brandName}
                  onChange={e => set('brandName', e.target.value)} placeholder="Enter brand name" {...tf} />
                <TextField label="Manufacturer" value={formData.manufacturer}
                  onChange={e => set('manufacturer', e.target.value)} placeholder="Enter manufacturer" {...tf} />

                <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
                  <InputLabel>Product Type</InputLabel>
                  <Select value={formData.productType} label="Product Type"
                    onChange={e => set('productType', e.target.value)} sx={{ borderRadius: 0 }}>
                    <MenuItem value=""><em>Select Product Type</em></MenuItem>
                    <MenuItem value="Physical">Physical Product</MenuItem>
                    <MenuItem value="Digital">Digital Product</MenuItem>
                    <MenuItem value="Service">Service</MenuItem>
                    <MenuItem value="Subscription">Subscription</MenuItem>
                  </Select>
                </FormControl>

                <TextField label="Model Number" value={formData.modelNumber}
                  onChange={e => set('modelNumber', e.target.value)} placeholder="Enter model number" {...tf} />

                {/* Size */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Size</Typography>
                    <Button size="small" startIcon={<AddOutlinedIcon />} variant="outlined"
                      onClick={() => setShowSizeDialog(true)}
                      sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11, py: 0.25 }}>
                      Add Custom
                    </Button>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Size</InputLabel>
                    <Select value={formData.size} label="Size"
                      onChange={e => set('size', e.target.value)} sx={{ borderRadius: 0 }}>
                      <MenuItem value=""><em>Select Size</em></MenuItem>
                      <MenuItem value="Small">Small</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="Large">Large</MenuItem>
                      <MenuItem value="XL">XL</MenuItem>
                    </Select>
                  </FormControl>
                  {formData.size && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 1, bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                      <StraightenOutlinedIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                      <Typography variant="body2" fontWeight={600} color="#1d4ed8" sx={{ flex: 1 }}>{formData.size}</Typography>
                      <IconButton size="small" onClick={() => set('size', '')} sx={{ p: 0.25 }}>
                        <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                {/* Color */}
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>Color</Typography>
                    <Button size="small" startIcon={<PaletteOutlinedIcon />} variant="outlined"
                      onClick={() => setShowColorDialog(true)}
                      sx={{ borderRadius: 0, textTransform: 'none', fontSize: 11, py: 0.25 }}>
                      Add Custom
                    </Button>
                  </Box>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Color</InputLabel>
                    <Select value={formData.color} label="Color"
                      onChange={e => set('color', e.target.value)} sx={{ borderRadius: 0 }}>
                      <MenuItem value=""><em>Select Color</em></MenuItem>
                      {predefinedColors.slice(0, 4).map(c => (
                        <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {formData.color && (
                    <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
                      <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: predefinedColors.find(c => c.name === formData.color)?.hex || '#6B7280', border: '1px solid', borderColor: 'divider', flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={600} color="#6d28d9" sx={{ flex: 1 }}>{formData.color}</Typography>
                      <IconButton size="small" onClick={() => set('color', '')} sx={{ p: 0.25 }}>
                        <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  )}
                </Box>

                <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
                  <InputLabel>Condition Type</InputLabel>
                  <Select value={formData.conditionType} label="Condition Type"
                    onChange={e => set('conditionType', e.target.value)} sx={{ borderRadius: 0 }}>
                    <MenuItem value=""><em>Select Condition</em></MenuItem>
                    <MenuItem value="New">New</MenuItem>
                    <MenuItem value="Used">Used</MenuItem>
                    <MenuItem value="Refurbished">Refurbished</MenuItem>
                    <MenuItem value="Open Box">Open Box</MenuItem>
                  </Select>
                </FormControl>

                <TextField label="Product Dimensions" value={formData.productDimensions}
                  onChange={e => set('productDimensions', e.target.value)} placeholder="e.g., 10 x 5 x 3 inches" {...tf} />
                <TextField label="Package Weight" value={formData.packageWeight}
                  onChange={e => set('packageWeight', e.target.value)} placeholder="e.g., 2.5 lbs" {...tf} />
                <TextField label="Warranty" value={formData.warranty}
                  onChange={e => set('warranty', e.target.value)} placeholder="e.g., 1 year manufacturer warranty" {...tf} />
              </Box>

              {/* Key Features */}
              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Key Product Features</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {formData.keyFeatures.map((feat, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        size="small" fullWidth value={feat} placeholder="Enter feature"
                        onChange={e => {
                          const arr = [...formData.keyFeatures]; arr[i] = e.target.value
                          set('keyFeatures', arr)
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <IconButton size="small" color="error"
                        onClick={() => set('keyFeatures', formData.keyFeatures.filter((_, idx) => idx !== i))}>
                        <CloseOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button size="small" startIcon={<AddOutlinedIcon />} variant="outlined"
                    onClick={() => set('keyFeatures', [...formData.keyFeatures, ''])}
                    sx={{ borderRadius: 0, textTransform: 'none', alignSelf: 'flex-start', borderColor: 'divider', color: 'text.secondary' }}>
                    Add Feature
                  </Button>
                </Box>
              </Box>

              {/* Ingredients */}
              <TextField
                label="Ingredients" multiline rows={3} fullWidth value={formData.ingredients}
                onChange={e => set('ingredients', e.target.value)}
                placeholder="Enter ingredients (for food/cosmetics products)"
                {...tf}
              />
            </Box>
          </SectionCard>

          {/* ── Sale Information ── */}
          <SectionCard icon={<AttachMoneyOutlinedIcon />} title="Sale Information">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                label="Sale Price" type="number" inputProps={{ step: '0.01' }}
                value={formData.salePrice} onChange={e => set('salePrice', e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                placeholder="0.00" {...tf}
              />
              <TextField
                label="Sale Start Date" type="datetime-local"
                value={formData.saleStartDate} onChange={e => set('saleStartDate', e.target.value)}
                InputLabelProps={{ shrink: true }} {...tf}
              />
              <TextField
                label="Sale End Date" type="datetime-local"
                value={formData.saleEndDate} onChange={e => set('saleEndDate', e.target.value)}
                InputLabelProps={{ shrink: true }} {...tf}
              />

              <FormControl size="small" sx={{ minWidth: DROP_MIN_W }}>
                <InputLabel>Currency</InputLabel>
                <Select value={formData.currency} label="Currency"
                  onChange={e => set('currency', e.target.value)} sx={{ borderRadius: 0 }}>
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                  <MenuItem value="CAD">CAD - Canadian Dollar</MenuItem>
                  <MenuItem value="AUD">AUD - Australian Dollar</MenuItem>
                  <MenuItem value="JPY">JPY - Japanese Yen</MenuItem>
                  <MenuItem value="PKR">PKR - Pakistani Rupee</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </SectionCard>

          {/* ── Pricing & Inventory ── */}
          <SectionCard icon={<AttachMoneyOutlinedIcon />} title="Pricing & Inventory">
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
              <TextField
                label="Price *" type="number" inputProps={{ step: '0.01' }}
                value={formData.price} onChange={e => set('price', e.target.value)}
                error={!!errors.price} helperText={errors.price}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                placeholder="0.00" {...tf}
              />
              <TextField
                label="Cost *" type="number" inputProps={{ step: '0.01' }}
                value={formData.cost} onChange={e => set('cost', e.target.value)}
                error={!!errors.cost} helperText={errors.cost}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                placeholder="0.00" {...tf}
              />
              <TextField
                label="Discount (%)" type="number" inputProps={{ step: '0.01' }}
                value={formData.discount} onChange={e => set('discount', e.target.value)}
                placeholder="0.00" {...tf}
              />
              <TextField
                label="Stock Quantity *" type="number"
                value={formData.stock} onChange={e => set('stock', e.target.value)}
                error={!!errors.stock} helperText={errors.stock}
                placeholder="0" {...tf}
              />
            </Box>
          </SectionCard>

          {/* ── Product Images ── */}
          <SectionCard icon={<CameraAltOutlinedIcon />} title="Product Images">
            <Box
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              sx={{
                border: '2px dashed',
                borderColor: dragOver ? BRAND : 'divider',
                bgcolor: dragOver ? '#fce7f3' : uploadingImages ? 'grey.50' : 'background.paper',
                p: 5, textAlign: 'center', transition: 'all 0.2s',
                cursor: uploadingImages ? 'not-allowed' : 'pointer',
              }}
            >
              {uploadingImages ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <CircularProgress size={32} sx={{ color: BRAND }} />
                  <Typography fontWeight={600}>Uploading images…</Typography>
                  <Typography variant="body2" color="text.secondary">Please wait</Typography>
                </Box>
              ) : dragOver ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <UploadOutlinedIcon sx={{ fontSize: 48, color: BRAND }} />
                  <Typography fontWeight={700} color={BRAND}>Drop images here!</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                  <UploadOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
                  <Typography fontWeight={600}>Upload product images</Typography>
                  <Typography variant="body2" color="text.secondary">Drag and drop images here or click to browse</Typography>
                  <Button
                    variant="contained"
                    component="label"
                    startIcon={<UploadOutlinedIcon />}
                    disabled={uploadingImages}
                    sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, mt: 1, '&:hover': { bgcolor: '#b00d52' } }}
                  >
                    Choose Images
                    <input ref={fileInputRef} type="file" multiple accept="image/*" hidden
                      onChange={e => handleImageUpload(e.target.files)} />
                  </Button>
                </Box>
              )}

              {formData.images?.length > 0 && (
                <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Uploaded Images</Typography>
                    <Typography variant="caption" color="text.secondary">{formData.images.length} image(s)</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1.5 }}>
                    {formData.images.map((url, i) => (
                      <Box key={i} sx={{ position: 'relative', '&:hover .remove-btn': { opacity: 1 } }}>
                        <NextImage
                          src={url} alt={`Upload ${i + 1}`}
                          width={80} height={80}
                          style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 4, display: 'block' }}
                        />
                        <IconButton
                          className="remove-btn"
                          size="small"
                          onClick={() => handleRemoveImage(i)}
                          sx={{
                            position: 'absolute', top: -6, right: -6,
                            bgcolor: 'error.main', color: 'white',
                            width: 18, height: 18, opacity: 0,
                            transition: 'opacity 0.2s',
                            '&:hover': { bgcolor: 'error.dark' },
                          }}
                        >
                          <CloseOutlinedIcon sx={{ fontSize: 11 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </SectionCard>

          {/* ── Submit ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5 }}>
            <Button
              variant="outlined" onClick={() => router.back()}
              sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              type="submit" variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, px: 4, '&:hover': { bgcolor: '#b00d52' } }}
            >
              {isSubmitting ? 'Adding Product…' : 'Add Product'}
            </Button>
          </Box>

        </Box>

        {/* ── Custom Size Dialog ── */}
        <Dialog open={showSizeDialog} onClose={() => setShowSizeDialog(false)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <StraightenOutlinedIcon fontSize="small" sx={{ color: BRAND }} />
              <Typography variant="subtitle1" fontWeight={700}>Add Custom Size</Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowSizeDialog(false)}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <TextField
                size="small" label="Size Name" autoFocus
                value={formData.customSize}
                onChange={e => set('customSize', e.target.value)}
                placeholder="e.g., XXL, 2XL, Extra Small"
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <Button fullWidth variant="outlined"
                  onClick={() => setShowSizeDialog(false)}
                  sx={{ borderRadius: 0, textTransform: 'none', borderColor: 'divider', color: 'text.secondary' }}>
                  Cancel
                </Button>
                <Button fullWidth variant="contained"
                  disabled={!formData.customSize.trim()}
                  onClick={() => {
                    set('size', formData.customSize.trim())
                    set('customSize', '')
                    setShowSizeDialog(false)
                  }}
                  sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b00d52' } }}>
                  Add Size
                </Button>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

        {/* ── Custom Color Dialog ── */}
        <Dialog open={showColorDialog} onClose={() => setShowColorDialog(false)} maxWidth="sm" fullWidth
          PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PaletteOutlinedIcon fontSize="small" sx={{ color: BRAND }} />
              <Typography variant="subtitle1" fontWeight={700}>Choose Color</Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowColorDialog(false)}>
              <CloseOutlinedIcon fontSize="small" />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1.5}>Predefined Colors</Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1.5 }}>
                  {predefinedColors.map(c => (
                    <Tooltip key={c.name} title={c.name} placement="top">
                      <Box
                        onClick={() => { set('color', c.name); setShowColorDialog(false) }}
                        sx={{
                          width: '100%', aspectRatio: '1', bgcolor: c.hex,
                          border: '2px solid', borderColor: formData.color === c.name ? BRAND : 'divider',
                          cursor: 'pointer', borderRadius: 0.5,
                          transition: 'transform 0.1s, border-color 0.1s',
                          '&:hover': { transform: 'scale(1.1)', borderColor: BRAND },
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>

              <Divider />

              <Box>
                <Typography variant="body2" fontWeight={600} mb={1}>Custom Color</Typography>
                <TextField
                  size="small" fullWidth value={formData.customColor}
                  onChange={e => set('customColor', e.target.value)}
                  placeholder="Enter color name (e.g., Midnight Blue)"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5 }}>
                  <Button fullWidth variant="outlined"
                    onClick={() => setShowColorDialog(false)}
                    sx={{ borderRadius: 0, textTransform: 'none', borderColor: 'divider', color: 'text.secondary' }}>
                    Cancel
                  </Button>
                  <Button fullWidth variant="contained"
                    disabled={!formData.customColor.trim()}
                    onClick={() => {
                      set('color', formData.customColor.trim())
                      set('customColor', '')
                      setShowColorDialog(false)
                    }}
                    sx={{ bgcolor: BRAND, borderRadius: 0, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#b00d52' } }}>
                    Add Color
                  </Button>
                </Box>
              </Box>
            </Box>
          </DialogContent>
        </Dialog>

      </Box>
    </DashboardLayout>
  )
}

export default AddProductPage
